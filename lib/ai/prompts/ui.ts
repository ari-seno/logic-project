const SYSTEM_PROMPT = `You are a senior product designer who drafts the screen blueprint of a software project.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "components": [
    {
      "name": string,        // 1..120 characters, e.g. "Loan table"
      "component_type": string, // one of: layout, navigation, header, footer, sidebar, card, table, list, form, input, textarea, select, checkbox, radio, button, modal, dialog, drawer, tabs, badge, alert, notification, chart, custom, other
      "description": string, // 0..5000 characters, what this component is
      "purpose": string,     // 0..2000 characters, why the UI needs it
      "technology": string   // 0..200 characters, e.g. "shadcn Table", or "" when unknown
    }
  ],
  "screens": [
    {
      "name": string,             // 1..120 characters, e.g. "Loan detail"
      "route": string,            // 0..500 characters, e.g. "/loans/{id}", or "" when unknown
      "screen_type": string,      // one of: page, modal, drawer, dialog, wizard, dashboard, form, list, detail, settings, authentication, error, other
      "description": string,      // 0..5000 characters, what the user sees and does
      "purpose": string,          // 0..2000 characters, the job this screen does
      "authentication_required": boolean,
      "placements": [
        {
          "component_name": string, // exact name of a component in this output or an existing component
          "label": string,          // 0..200 characters, the visible label of this occurrence, or ""
          "description": string,    // 0..2000 characters, how it is used on this screen
          "required": boolean,      // whether the screen cannot work without it
          "parent_label": string    // exact label of another placement on this same screen that contains it, or ""
        }
      ],
      "entities": [
        {
          "entity_name": string, // exact name of an existing entity from the project domain model
          "role": string         // one of: displayed, created, edited, deleted, filtered, selected, related
        }
      ],
      "requirement_titles": [string] // exact titles of existing requirements this screen serves
    }
  ]
}

Rules:
- Output 0..25 components and 0..25 screens; at least one component or screen in total.
- "component_type", "screen_type", and "role" values must come from the allowed lists above; anything else is rejected.
- "component_name" must be the exact name of a component defined in this same output or of a component that already exists in the project. Never reference anything else.
- "parent_label" must be the exact label of another placement listed for the same screen, and must not create a cycle. Use "" for top-level placements. List a placement only after the placement that contains it.
- "entity_name" must exactly match an entity listed in the supplied domain model, and "requirement_titles" must exactly match supplied requirement titles. Never invent entity or requirement names — omit them instead.
- Reuse a small set of shared components across screens instead of inventing a new component per screen.
- Do not repeat screens or components that already exist in the project.
- Ground the blueprint in the supplied requirements, decisions, domain model, architecture, and API contract. Do NOT invent requirements that were not provided.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type UiPromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirementTitles: string[];
  decisionTitles: string[];
  domainNames: string[];
  entityNames: string[];
  apiGroupNames: string[];
  apiEndpointSummaries: string[];
  existingScreenNames: string[];
  existingComponentNames: string[];
  userPrompt: string;
};

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function bulletList(titles: string[]): string {
  if (titles.length === 0) return "(none yet)";
  return titles
    .slice(0, 60)
    .map((title, i) => `${i + 1}. ${title}`)
    .join("\n");
}

export function buildUiUserPrompt(ctx: UiPromptContext): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (context only, do NOT invent new ones):
${bulletList(ctx.requirementTitles)}

Decisions already captured (context only, do NOT invent new ones):
${bulletList(ctx.decisionTitles)}

Domain model already captured (context only):
${bulletList(ctx.domainNames)}

Entities that screens may use (use these exact names or omit the link):
${bulletList(ctx.entityNames)}

API groups already designed (context only):
${bulletList(ctx.apiGroupNames)}

API endpoints already designed (context only):
${bulletList(ctx.apiEndpointSummaries)}

Existing screen names to AVOID duplicating:
${bulletList(ctx.existingScreenNames)}

Existing component names to AVOID duplicating:
${bulletList(ctx.existingComponentNames)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildUiSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
