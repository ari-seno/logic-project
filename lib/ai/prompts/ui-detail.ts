import type { AiContextEntry } from "@/lib/ai/context";
import { bulletList, truncate } from "@/lib/ai/prompts/context-format";

const SYSTEM_PROMPT = `You are a senior product designer who fleshes out the detail of the screens of a software project: their forms, their states, their interactions, and the navigation that ties them together.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "screens": [
    {
      "screen_name": string,      // exact name of a screen that already exists in the project
      "forms": [
        {
          "name": string,          // 1..200 characters, e.g. "Loan application form"
          "description": string,   // 0..5000 characters, what the form collects
          "submit_label": string,  // 0..100 characters, e.g. "Apply for loan", or ""
          "success_behavior": string, // 0..2000 characters, what happens after a successful submit, or ""
          "fields": [
            {
              "name": string,        // 1..200 characters, machine name, e.g. "amount"
              "label": string,       // 1..200 characters, visible label, e.g. "Loan amount"
              "field_type": string,  // one of: text, textarea, email, password, number, date, datetime, select, checkbox, radio, file, hidden, other
              "required": boolean,
              "placeholder": string, // 0..500 characters, or ""
              "help_text": string,   // 0..2000 characters, or ""
              "default_value": string // 0..2000 characters, or ""
            }
          ]
        }
      ],
      "states": [
        {
          "name": string,          // 1..200 characters, e.g. "Loading loans"
          "state_type": string,    // one of: default, loading, empty, success, error, disabled, unauthorized, forbidden, not_found, validation_error, offline, custom
          "description": string,   // 0..3000 characters, what the user sees in this state
          "behavior": string       // 0..5000 characters, how the screen behaves in this state, or ""
        }
      ],
      "interactions": [
        {
          "name": string,          // 1..200 characters, e.g. "Apply filters"
          "trigger": string,       // 1..500 characters, the user action that starts it, e.g. "Filters form submitted"
          "action": string,        // 1..2000 characters, what the screen does in response
          "description": string,   // 0..5000 characters, or ""
          "endpoint_labels": [string] // exact "METHOD /path" labels of existing API endpoints this interaction calls
        }
      ]
    }
  ],
  "navigation": [
    {
      "name": string,          // 1..200 characters, machine name, e.g. "loans-section"
      "label": string,         // 1..200 characters, visible label, e.g. "Loans"
      "route": string,         // 0..500 characters, e.g. "/loans", or ""
      "description": string,   // 0..5000 characters, or ""
      "parent_label": string,  // exact label of another navigation item in this output that contains this one, or ""
      "screen_names": [string] // exact names of existing screens this item opens
    }
  ]
}

Rules:
- Output 0..25 screen detail entries and 0..25 navigation items; at least one entry in total.
- "field_type", "state_type" values must come from the allowed lists above; anything else is rejected.
- "screen_name" must be the exact name of a screen that already exists in the project. Never reference an unknown screen; omit that entry instead.
- "endpoint_labels" must exactly match an "METHOD /path" label from the supplied API endpoints. Never invent endpoints; omit them instead.
- "parent_label" must be the exact label of another navigation item listed in this same output and must not create a cycle. Use "" for top-level items. List an item only after the item that contains it.
- "screen_names" on a navigation item must exactly match supplied screen names.
- Give a screen a form only when it actually collects input, and add states that matter for that screen (loading, empty, error at minimum for data screens).
- Do not repeat forms, states, interactions, or navigation items that already exist in the project.
- Ground the detail in the supplied requirements, decisions, API contract, and existing screens. Do NOT invent screens.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type UiDetailPromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirements: AiContextEntry[];
  decisions: AiContextEntry[];
  apiEndpoints: AiContextEntry[];
  existingScreens: AiContextEntry[];
  existingNavigation: AiContextEntry[];
  userPrompt: string;
};

export function buildUiDetailUserPrompt(ctx: UiDetailPromptContext): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (context only, do NOT invent new ones):
${bulletList(ctx.requirements)}

Decisions already captured (context only, do NOT invent new ones):
${bulletList(ctx.decisions)}

API endpoints that interactions may call (use these exact "METHOD /path" labels or omit the link):
${bulletList(ctx.apiEndpoints)}

Screens that already exist (attach detail to these exact names; do NOT invent new screens):
${bulletList(ctx.existingScreens)}

Existing navigation items to AVOID duplicating:
${bulletList(ctx.existingNavigation)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildUiDetailSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
