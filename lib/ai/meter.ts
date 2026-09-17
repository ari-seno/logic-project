import { createClient } from "@/lib/supabase/server";

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
