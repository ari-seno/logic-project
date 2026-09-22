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
  domains: {
    id: "domains",
    singular: "domain",
    plural: "domains",
    drawerTitle: "Generate domain model",
    subtitleFallback: "AI assist for a first-draft domain model and ERD",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating a domain model.",
    promptPlaceholder:
      "e.g. Model a lending workflow: borrowers, loans, repayments, and overdue fines.",
    selectionNoun: "domain",
    suggestionsHeading: "Suggested domains",
  },
  architecture: {
    id: "architecture",
    singular: "architecture item",
    plural: "architecture",
    drawerTitle: "Generate architecture",
    subtitleFallback: "AI assist for a first-draft technical architecture",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating an architecture.",
    promptPlaceholder:
      "e.g. A Next.js frontend, a Bun API, Postgres, and a background worker for exports.",
    selectionNoun: "item",
    suggestionsHeading: "Suggested architecture",
  },
  api: {
    id: "api",
    singular: "API item",
    plural: "API",
    drawerTitle: "Generate API design",
    subtitleFallback: "AI assist for a first-draft API contract",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating an API design.",
    promptPlaceholder:
      "e.g. REST endpoints for users, projects, and auth with pagination and error codes.",
    selectionNoun: "item",
    suggestionsHeading: "Suggested API design",
  },
  ui: {
    id: "ui",
    singular: "UI item",
    plural: "UI",
    drawerTitle: "Generate UI design",
    subtitleFallback: "AI assist for a first-draft screen blueprint",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating a UI design.",
    promptPlaceholder:
      "e.g. Screens for signing in, listing loans, and reviewing one loan in detail.",
    selectionNoun: "item",
    suggestionsHeading: "Suggested UI design",
  },
  tasks: {
    id: "tasks",
    singular: "task",
    plural: "tasks",
    drawerTitle: "Generate tasks",
    subtitleFallback: "AI assist for a first-draft task backlog",
    setupCopy:
      "Add an Ollama credential in Settings, then choose it for this project before generating a task backlog.",
    promptPlaceholder:
      "e.g. Break the lending workflow into implementation tasks with priorities and dependencies.",
    selectionNoun: "task",
    suggestionsHeading: "Suggested tasks",
  },
};
