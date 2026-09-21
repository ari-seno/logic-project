import type { AiStage } from "@/lib/ai/stages";

export type AiStageLabels = {
  id: AiStage;
  singular: string;
  plural: string;
  drawerTitle: string;
  subtitleFallback: string;
  setupCopy: string;
  promptPlaceholder: string;
  selectionNoun: string;
  suggestionsHeading: string;
};

export const AI_STAGE_LABELS: Record<AiStage, AiStageLabels> = {
  requirements: {
    id: "requirements",
    singular: "requirement",
    plural: "requirements",
    drawerTitle: "Generate requirements",
    subtitleFallback: "AI assist for first-draft requirements",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating requirements.",
    promptPlaceholder:
      "e.g. Focus on borrower auth, due-date reminders, and overdue fines.",
    selectionNoun: "requirement",
    suggestionsHeading: "Suggestions",
  },
  decisions: {
    id: "decisions",
    singular: "decision",
    plural: "decisions",
    drawerTitle: "Generate decisions",
    subtitleFallback: "AI assist for first-draft decisions",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating decisions.",
    promptPlaceholder:
      "e.g. Which datastore, auth strategy, and hosting model should we commit to?",
    selectionNoun: "decision",
    suggestionsHeading: "Suggestions",
  },
};
