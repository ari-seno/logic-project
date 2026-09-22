export const AI_STAGES = [
  "requirements",
  "decisions",
  "domains",
  "architecture",
  "api",
  "ui",
  "tasks",
] as const;

export type AiStage = (typeof AI_STAGES)[number];

const STAGE_ROUTES: Record<AiStage, (projectId: string) => string> = {
  requirements: (projectId) => `/projects/${projectId}/requirements`,
  decisions: (projectId) => `/projects/${projectId}/decisions`,
  domains: (projectId) => `/projects/${projectId}/domains/erd`,
  architecture: (projectId) => `/projects/${projectId}/architecture`,
  api: (projectId) => `/projects/${projectId}/api`,
  ui: (projectId) => `/projects/${projectId}/ui`,
  tasks: (projectId) => `/projects/${projectId}/tasks`,
};

export function isAiStage(value: unknown): value is AiStage {
  return (
    typeof value === "string" && (AI_STAGES as readonly string[]).includes(value)
  );
}

export function stageRevalidatePath(stage: AiStage, projectId: string): string {
  return STAGE_ROUTES[stage](projectId);
}
