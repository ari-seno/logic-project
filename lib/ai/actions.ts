"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getDecryptedCredential } from "@/lib/ai/credentials";
import { assembleRequirementsContext } from "@/lib/ai/context";
import { applyRequirementsToProject } from "@/lib/ai/apply";
import { AiError } from "@/lib/ai/errors";
import { logAiUsage } from "@/lib/ai/meter";
import { completeOllamaJson } from "@/lib/ai/provider";
import {
  buildRequirementsSystemPrompt,
  buildRequirementsUserPrompt,
} from "@/lib/ai/prompts/requirements";
import {
  aiRequirementsResponseSchema,
  type AiRequirementItem,
  type SuggestResult,
} from "@/lib/ai/schema";
import { getProject } from "@/lib/projects/queries";

const REQUIREMENTS_STAGE = "requirements";

export type SuggestRequirementsInput = {
  projectId: string;
  prompt: string;
};

type FailureCode = Extract<SuggestResult, { ok: false }>["code"];

function fail(code: FailureCode, message: string): SuggestResult {
  return { ok: false, code, message };
}

export async function aiSuggestRequirements(
  input: SuggestRequirementsInput,
): Promise<SuggestResult> {
  const start = Date.now();
  const project = await getProject(input.projectId);
  if (!project) {
    return fail("unknown", "Project not found.");
  }

  const ctx = await assembleRequirementsContext(input.projectId);
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

  const system = buildRequirementsSystemPrompt();
  const user = buildRequirementsUserPrompt({
    projectName: ctx.projectName,
    projectDescription: ctx.projectDescription,
    existingTitles: ctx.existingTitles,
    userPrompt: input.prompt,
  });

  let result: Awaited<ReturnType<typeof completeOllamaJson<unknown>>>;
  try {
    result = await completeOllamaJson({
      baseUrl: credential.base_url,
      apiKey: credential.apiKey,
      model: credential.model,
      system,
      user,
      parse: (text) => {
        const parsed = aiRequirementsResponseSchema.safeParse(
          JSON.parse(text),
        );
        return parsed.success
          ? ({ ok: true, value: parsed.data as unknown } as const)
          : ({ ok: false } as const);
      },
      parseErrorMessage:
        "Schema: { requirements: [ { title, type, priority, description } ] }, 1..15 items.",
    });
  } catch (err) {
    const duration = Date.now() - start;
    await logAiUsage({
      userId: ctx.userId,
      projectId: project.id,
      provider: credential.provider,
      model: credential.model,
      stage: REQUIREMENTS_STAGE,
      durationMs: duration,
      ok: false,
      errorCode: err instanceof AiError ? err.code : "unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    const code: FailureCode =
      err instanceof AiError
        ? (err.code as FailureCode)
        : "unknown";
    return fail(code, err instanceof Error ? err.message : String(err));
  }

  const parsed = result.value as { requirements: AiRequirementItem[] };
  const supabase = await createClient();
  const { data: inserted, error: insertErr } = await supabase
    .from("ai_suggestions")
    .insert({
      user_id: ctx.userId,
      project_id: project.id,
      stage: REQUIREMENTS_STAGE,
      provider: credential.provider,
      model: credential.model,
      prompt_user: input.prompt,
      payload: { requirements: parsed.requirements } as never,
      status: "pending",
      applied_indices: [] as number[],
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return fail("unknown", insertErr?.message ?? "Could not save suggestion.");
  }

  await logAiUsage({
    userId: ctx.userId,
    projectId: project.id,
    provider: credential.provider,
    model: credential.model,
    stage: REQUIREMENTS_STAGE,
    promptTokens: result.usage.inputTokens,
    completionTokens: result.usage.outputTokens,
    durationMs: Date.now() - start,
    ok: true,
  });

  revalidatePath(`/projects/${project.id}/requirements`);
  return {
    ok: true,
    suggestionId: inserted.id,
    requirements: parsed.requirements,
    model: credential.model,
    provider: credential.provider,
    usage: {
      promptTokens: result.usage.inputTokens,
      completionTokens: result.usage.outputTokens,
      durationMs: Date.now() - start,
    },
  };
}

export type ApplyRequirementsInput = {
  suggestionId: string;
  indices: number[];
};

export type ApplyRequirementsResult =
  | {
      ok: true;
      created: Array<{ index: number; id: string; title: string }>;
      skipped: Array<{ index: number; title: string; reason: "duplicate" | "invalid" }>;
    }
  | { ok: false; error: string };

export async function aiApplyRequirements(
  input: ApplyRequirementsInput,
): Promise<ApplyRequirementsResult> {
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
  if (suggestion.stage !== "requirements") {
    return { ok: false, error: "Wrong suggestion stage." };
  }
  if (suggestion.status === "applied") {
    return { ok: false, error: "Suggestion already applied." };
  }

  const payload = suggestion.payload as {
    requirements?: AiRequirementItem[];
  };
  const requirements = payload.requirements ?? [];

  const summary = await applyRequirementsToProject({
    projectId: suggestion.project_id,
    userId: user.id,
    items: requirements,
    indices: input.indices,
  });

  const created: Array<{ index: number; id: string; title: string }> = [];
  for (const c of summary.created) {
    if (c.kind === "created") {
      created.push({ index: c.index, id: c.id, title: c.title });
    }
  }

  const skipped: Array<{
    index: number;
    title: string;
    reason: "duplicate" | "invalid";
  }> = [];
  for (const s of summary.skipped) {
    if (s.kind === "skipped") {
      skipped.push({ index: s.index, title: s.title, reason: s.reason });
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
      applied_indices: created.map((c) => c.index),
      applied_at: new Date().toISOString(),
    })
    .eq("id", input.suggestionId);

  revalidatePath(`/projects/${suggestion.project_id}/requirements`);
  return { ok: true, created, skipped };
}
