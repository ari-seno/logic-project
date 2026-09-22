const SYSTEM_PROMPT = `You are a senior backend engineer who drafts the HTTP API contract of a software project.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "groups": [
    {
      "name": string,         // 1..120 characters, e.g. "Users"
      "prefix": string,       // 0..200 characters, e.g. "/users", or "" when unknown
      "description": string   // 0..5000 characters, what this group covers
    }
  ],
  "endpoints": [
    {
      "group_name": string,   // exact name of a group in this output or an existing group, or "" when ungrouped
      "method": string,       // one of: GET, POST, PUT, PATCH, DELETE
      "path": string,         // 1..500 characters, must start with "/", e.g. "/users/{id}"
      "name": string,         // 1..120 characters, e.g. "Get user"
      "summary": string,      // 0..500 characters, one line
      "description": string,  // 0..5000 characters, behaviour and edge cases
      "authentication_required": boolean,
      "parameters": [
        {
          "name": string,       // 1..120 characters
          "location": string,   // one of: path, query, header, cookie
          "data_type": string,  // one of: string, integer, number, boolean, uuid, date, datetime
          "required": boolean,
          "description": string, // 0..2000 characters
          "example": string      // 0..1000 characters, plain text
        }
      ],
      "request_body": {         // or null when the method has no body
        "content_type": string, // 1..120 characters, e.g. "application/json"
        "description": string,  // 0..2000 characters
        "schema": object|null,  // small JSON schema sketch of the payload
        "example": object|null  // small example payload
      },
      "responses": [
        {
          "status_code": number,  // 100..599
          "content_type": string, // 0..200 characters
          "description": string,  // 0..2000 characters
          "schema": object|null,  // small JSON schema sketch of the payload
          "example": object|null  // small example payload
        }
      ],
      "errors": [
        {
          "code": string,        // 1..120 characters, e.g. "not_found"
          "message": string,     // 1..500 characters, human readable
          "http_status": number|null, // 100..599 or null
          "description": string  // 0..2000 characters, when this happens
        }
      ],
      "entities": [
        {
          "entity_name": string, // exact name of an existing entity from the project domain model
          "role": string         // one of: primary_resource, request_resource, response_resource, related_resource
        }
      ],
      "requirement_titles": [string] // exact titles of existing requirements this endpoint satisfies
    }
  ]
}

Rules:
- Output 0..20 groups and 0..25 endpoints; at least one group or endpoint in total.
- "method", "location", "data_type", and "role" values must come from the allowed lists above; anything else is rejected.
- "path" must start with "/". Use "{name}" for path variables and declare each one as a parameter with location "path".
- "group_name" must be the exact name of a group defined in this same output or of a group that already exists in the project. Use "" for endpoints that belong to no group.
- "entity_name" must exactly match an entity listed in the supplied domain model, and "requirement_titles" must exactly match supplied requirement titles. Never invent entity or requirement names — omit them instead.
- Give each endpoint the responses it realistically needs (usually at least one success status and one error status).
- Do not repeat endpoints, groups, or paths that already exist in the project.
- Ground the contract in the supplied requirements, decisions, domain model, and architecture. Do NOT invent requirements that were not provided.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type ApiPromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirementTitles: string[];
  decisionTitles: string[];
  domainNames: string[];
  entityNames: string[];
  existingGroupNames: string[];
  existingEndpointSummaries: string[];
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

export function buildApiUserPrompt(ctx: ApiPromptContext): string {
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

Entities that endpoints may link to (use these exact names or omit the link):
${bulletList(ctx.entityNames)}

Existing API group names to AVOID duplicating:
${bulletList(ctx.existingGroupNames)}

Existing endpoints to AVOID duplicating (method + path):
${bulletList(ctx.existingEndpointSummaries)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildApiSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
