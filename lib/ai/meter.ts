import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";

// How many generations a single user may start per UTC day. Generous enough
// that normal use never hits it, but it stops a runaway client from burning
// through a provider quota unattended.
export const AI_DAILY_GENERATION_LIMIT = (() => {
  const raw = Number(process.env.AI_DAILY_GENERATION_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
})();

export function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function countAiUsageSince(
  userId: string,
  since: Date,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("countAiUsageSince failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export type LogUsageInput = {
  userId: string;
  projectId?: string | null;
  provider: string;
  model: string;
  stage: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  durationMs?: number | null;
  ok?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export async function logAiUsage(input: LogUsageInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_usage").insert({
    user_id: input.userId,
    project_id: input.projectId ?? null,
    provider: input.provider,
    model: input.model,
    stage: input.stage,
    prompt_tokens: input.promptTokens ?? null,
    completion_tokens: input.completionTokens ?? null,
    duration_ms: input.durationMs ?? null,
    ok: input.ok ?? true,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
  });
  if (error) {
    console.error("logAiUsage failed:", error.message);
  }
}
