import type { AiContextEntry } from "@/lib/ai/context";
import { bulletList, truncate } from "@/lib/ai/prompts/context-format";

const SYSTEM_PROMPT = `You are a senior data modeller who designs normalised domain models for software projects.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "domains": [
    {
      "name": string,            // 1..120 characters, the bounded context, e.g. "Billing"
      "description": string,     // 0..5000 characters, what this domain owns
      "entities": [
        {
          "name": string,        // 1..120 characters, singular noun, e.g. "Invoice"
          "description": string, // 0..5000 characters
          "attributes": [
            {
              "name": string,          // 1..120 characters, snake_case, e.g. "due_date"
              "data_type": string,     // one of: uuid, string, text, integer, decimal, boolean, date, datetime, json
              "is_required": boolean,  // true when a value must always be present
              "is_primary_key": boolean, // exactly one true per entity
              "description": string    // 0..5000 characters
            }
          ],
          "relationships": [
            {
              "target_entity": string,     // exact name of another entity in this output or an existing entity
              "relationship_type": string, // one of: one_to_one, one_to_many, many_to_one, many_to_many
              "name": string,              // 0..200 characters, optional label, e.g. "places"
              "description": string        // 0..5000 characters
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Output 1..8 domains, each with 1..15 entities; every entity has 1..30 attributes.
- "relationship_type" is written from the SOURCE entity's point of view: one_to_many means one row of this entity relates to many rows of "target_entity".
- "target_entity" must be the exact name of an entity defined in this same output, or of an entity that already exists in the project. Never reference anything else.
- Every entity needs exactly one attribute with "is_primary_key": true, normally "id" with data_type "uuid".
- Entity names are singular nouns in Title Case (e.g. "Invoice"). Attribute names are snake_case (e.g. "due_date").
- "data_type" and "relationship_type" values must come from the allowed lists above; anything else is rejected.
- Entity names must be unique inside a domain, and domain names must be unique across the output.
- Do not repeat or synonym domains, entities, or attributes that already exist in the project.
- Ground the model in the supplied requirements and decisions. Do NOT invent requirements that were not provided.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type DomainsPromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirements: AiContextEntry[];
  decisions: AiContextEntry[];
  existingDomains: AiContextEntry[];
  userPrompt: string;
};

export function buildDomainsUserPrompt(ctx: DomainsPromptContext): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (title + summary; context only, do NOT invent new ones):
${bulletList(ctx.requirements)}

Decisions already captured (title + summary; context only, do NOT invent new ones):
${bulletList(ctx.decisions)}

Existing domains to AVOID duplicating (name + summary):
${bulletList(ctx.existingDomains)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildDomainsSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
