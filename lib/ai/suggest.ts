import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getDecryptedCredential } from "@/lib/ai/credentials";
import { assembleAiContext, type AiAssembledContext } from "@/lib/ai/context";
import { AiError } from "@/lib/ai/errors";
import {
  AI_DAILY_GENERATION_LIMIT,
  countAiUsageSince,
  logAiUsage,
  startOfUtcDay,
} from "@/lib/ai/meter";
import { completeOllamaJson } from "@/lib/ai/provider";
import { isAiStage, stageRevalidatePath, type AiStage } from "@/lib/ai/stages";
import type { ApplySummary } from "@/lib/ai/apply";
import type {
  AiApplyCreated,
  AiApplyResult,
  AiApplySkipped,
  SuggestFailure,
  SuggestResult,
} from "@/lib/ai/schema";
import { getProject } from "@/lib/projects/queries";

export type SuggestAdapter<TItem> = {
  stage: AiStage;
  buildSystemPrompt: () => string;
  buildUserPrompt: (ctx: AiAssembledContext, userPrompt: string) => string;
  parse: (text: string) => TItem[] | null;
  parseErrorMessage: string;
};

export type ApplyAdapter<TItem> = {
  stage: AiStage;
  apply: (options: {
    projectId: string;
    userId: string;
    items: TItem[];
    indices: number[];
  }) => Promise<ApplySummary>;
};

type FailureCode = SuggestFailure["code"];

function fail(code: FailureCode, message: string): SuggestFailure {
  return { ok: false, code, message };
}

export function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function runAiSuggest<TItem>(
  input: { projectId: string; prompt: string },
  adapter: SuggestAdapter<TItem>,
): Promise<SuggestResult<TItem>> {
  const start = Date.now();

  const project = await getProject(input.projectId);
  if (!project) {
    return fail("unknown", "Project not found.");
  }

  const ctx = await assembleAiContext(input.projectId);
  if (!ctx) {
    return fail("ai_setup_required", "Sign in to use AI assist.");
  }

  const credential = await getDecryptedCredential(
    project.ai_credential_id ?? "",
    ctx.userId,
  );
  if (!project.ai_credential_id || !credential || !credential.enabled) {
    return fail(
      "ai_setup_required",
      "Pick an AI credential for this project before generating.",
    );
  }

  const usedToday = await countAiUsageSince(ctx.userId, startOfUtcDay());
  if (usedToday >= AI_DAILY_GENERATION_LIMIT) {
    return fail(
      "quota_exceeded",
      `You have reached the daily limit of ${AI_DAILY_GENERATION_LIMIT} generations. Try again tomorrow.`,
    );
  }

  const system = adapter.buildSystemPrompt();
  const user = adapter.buildUserPrompt(ctx, input.prompt);

  let result: Awaited<ReturnType<typeof completeOllamaJson<TItem[]>>>;
  try {
    result = await completeOllamaJson<TItem[]>({
      baseUrl: credential.base_url,
      apiKey: credential.apiKey,
      model: credential.model,
      system,
      user,
      parse: (text) => {
        const items = adapter.parse(text);
        return items
          ? ({ ok: true, value: items } as const)
          : ({ ok: false } as const);
      },
      parseErrorMessage: adapter.parseErrorMessage,
    });
  } catch (err) {
    await logAiUsage({
      userId: ctx.userId,
      projectId: project.id,
      provider: credential.provider,
      model: credential.model,
      stage: adapter.stage,
      durationMs: Date.now() - start,
      ok: false,
      errorCode: err instanceof AiError ? err.code : "unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    const code: FailureCode =
      err instanceof AiError ? (err.code as FailureCode) : "unknown";
    return fail(code, err instanceof Error ? err.message : String(err));
  }

  const items = result.value;
  const supabase = await createClient();
  const { data: inserted, error: insertErr } = await supabase
    .from("ai_suggestions")
    .insert({
      user_id: ctx.userId,
      project_id: project.id,
      stage: adapter.stage,
      provider: credential.provider,
      model: credential.model,
      prompt_user: input.prompt,
      payload: { [adapter.stage]: items } as never,
      status: "pending",
      applied_indices: [] as number[],
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return fail("unknown", insertErr?.message ?? "Could not save suggestion.");
  }

  const durationMs = Date.now() - start;
  await logAiUsage({
    userId: ctx.userId,
    projectId: project.id,
    provider: credential.provider,
    model: credential.model,
    stage: adapter.stage,
    promptTokens: result.usage.inputTokens,
    completionTokens: result.usage.outputTokens,
    durationMs,
    ok: true,
  });

  revalidatePath(stageRevalidatePath(adapter.stage, project.id));

  return {
    ok: true,
    suggestionId: inserted.id,
    items,
    model: credential.model,
    provider: credential.provider,
    usage: {
      promptTokens: result.usage.inputTokens,
      completionTokens: result.usage.outputTokens,
      durationMs,
    },
  };
}

export type AiRejectResult = { ok: true } | { ok: false; error: string };

// Marks a suggestion as rejected so it stops looking "pending" in the history
// page. Applied suggestions cannot be rejected.
export async function runAiRejectSuggestion(input: {
  suggestionId: string;
}): Promise<AiRejectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: suggestion, error: loadErr } = await supabase
    .from("ai_suggestions")
    .select("id, user_id, project_id, stage, status")
    .eq("id", input.suggestionId)
    .maybeSingle();

  if (loadErr || !suggestion || suggestion.user_id !== user.id) {
    return { ok: false, error: "Suggestion not found." };
  }
  if (suggestion.status === "applied") {
    return { ok: false, error: "Suggestion already applied." };
  }

  const { error: updateErr } = await supabase
    .from("ai_suggestions")
    .update({ status: "rejected" })
    .eq("id", input.suggestionId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  if (isAiStage(suggestion.stage)) {
    revalidatePath(stageRevalidatePath(suggestion.stage, suggestion.project_id));
  }
  return { ok: true };
}

// Top-level tables a stage's apply writes to. Deleting a created top-level row
// cascades to its children. Stages whose "created" rows are pre-existing (e.g.
// ui-detail attaches to screens the user already had) are NOT undoable.
const UNDO_TABLES: Record<AiStage, string[]> = {
  requirements: ["requirements"],
  decisions: ["decisions"],
  domains: ["domains"],
  architecture: [
    "architecture_components",
    "architecture_technologies",
    "architecture_decisions",
  ],
  api: ["api_groups", "api_endpoints"],
  ui: ["ui_screens", "ui_components"],
  "ui-detail": [],
  tasks: ["tasks"],
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LooseDelete = {
  delete: () => {
    in: (
      col: string,
      values: string[],
    ) => {
      eq: (
        col: string,
        value: string,
      ) => {
        select: (
          cols: string,
        ) => Promise<{
          data: Array<{ id: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export type AiUndoResult =
  | { ok: true; removed: number }
  | { ok: false; error: string };

// Removes the top-level rows an applied suggestion created and puts the
// suggestion back to "pending" so it can be applied again. Only ids in the
// caller's own project are touched.
export async function runAiUndoApply(input: {
  suggestionId: string;
  ids: string[];
}): Promise<AiUndoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: suggestion, error: loadErr } = await supabase
    .from("ai_suggestions")
    .select("id, user_id, project_id, stage, status")
    .eq("id", input.suggestionId)
    .maybeSingle();

  if (loadErr || !suggestion || suggestion.user_id !== user.id) {
    return { ok: false, error: "Suggestion not found." };
  }
  if (!isAiStage(suggestion.stage)) {
    return { ok: false, error: "Undo is not available for this stage." };
  }
  const tables = UNDO_TABLES[suggestion.stage];
  if (tables.length === 0) {
    return { ok: false, error: "Undo is not available for this stage." };
  }

  const ids = [...new Set(input.ids)]
    .filter((id) => UUID_RE.test(id))
    .slice(0, 200);
  if (ids.length === 0) {
    return { ok: false, error: "Nothing to undo." };
  }

  let removed = 0;
  for (const table of tables) {
    const loose = supabase.from(table as "domains") as unknown as LooseDelete;
    const { data, error } = await loose
      .delete()
      .in("id", ids)
      .eq("project_id", suggestion.project_id)
      .select("id");
    if (error) return { ok: false, error: error.message };
    removed += data?.length ?? 0;
  }

  await supabase
    .from("ai_suggestions")
    .update({ status: "pending", applied_indices: [], applied_at: null })
    .eq("id", input.suggestionId);

  revalidatePath(stageRevalidatePath(suggestion.stage, suggestion.project_id));
  return { ok: true, removed };
}

export async function runAiApply<TItem>(
  input: { suggestionId: string; indices: number[] },
  adapter: ApplyAdapter<TItem>,
): Promise<AiApplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: suggestion, error: loadErr } = await supabase
    .from("ai_suggestions")
    .select("id, user_id, project_id, stage, status, payload")
    .eq("id", input.suggestionId)
    .maybeSingle();

  if (loadErr || !suggestion || suggestion.user_id !== user.id) {
    return { ok: false, error: "Suggestion not found." };
  }
  if (suggestion.stage !== adapter.stage) {
    return { ok: false, error: "Wrong suggestion stage." };
  }
  if (suggestion.status === "applied") {
    return { ok: false, error: "Suggestion already applied." };
  }

  const payload = suggestion.payload as Record<string, TItem[] | undefined>;
  const items = payload[adapter.stage] ?? [];

  const summary = await adapter.apply({
    projectId: suggestion.project_id,
    userId: user.id,
    items,
    indices: input.indices,
  });

  const created: AiApplyCreated[] = [];
  for (const item of summary.created) {
    if (item.kind === "created") {
      created.push({ index: item.index, id: item.id, title: item.title });
    }
  }

  const skipped: AiApplySkipped[] = [];
  for (const item of summary.skipped) {
    if (item.kind === "skipped") {
      skipped.push({
        index: item.index,
        title: item.title,
        reason: item.reason,
      });
    }
  }

  if (summary.failed.length > 0) {
    const first = summary.failed[0];
    if (first.kind === "failed") {
      return { ok: false, error: first.error };
    }
  }

  await supabase
    .from("ai_suggestions")
    .update({
      status: "applied",
      applied_indices: created.map((item) => item.index),
      applied_at: new Date().toISOString(),
    })
    .eq("id", input.suggestionId);

  revalidatePath(stageRevalidatePath(adapter.stage, suggestion.project_id));
  return { ok: true, created, skipped };
}
