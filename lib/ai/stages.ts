export const AI_STAGES = ["requirements", "decisions"] as const;

export type AiStage = (typeof AI_STAGES)[number];

export function isAiStage(value: unknown): value is AiStage {
  return (
    typeof value === "string" && (AI_STAGES as readonly string[]).includes(value)
  );
}

export function stageRevalidatePath(stage: AiStage, projectId: string): string {
  return `/projects/${projectId}/${stage}`;
}
