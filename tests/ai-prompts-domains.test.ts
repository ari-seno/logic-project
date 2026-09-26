import { describe, expect, it } from "vitest";

import {
  buildDomainsSystemPrompt,
  buildDomainsUserPrompt,
} from "@/lib/ai/prompts/domains";
import { aiErdResponseSchema } from "@/lib/ai/schema";
import {
  ENTITY_DATA_TYPES,
  RELATIONSHIP_TYPES,
} from "@/lib/supabase/types";

describe("ai/prompts/domains", () => {
  it("documents every allowed data type and relationship type", () => {
    const system = buildDomainsSystemPrompt();
    for (const dataType of ENTITY_DATA_TYPES) {
      expect(system).toContain(dataType);
    }
    for (const relationshipType of RELATIONSHIP_TYPES) {
      expect(system).toContain(relationshipType);
    }
    expect(system).toContain("is_primary_key");
    expect(system).toContain("target_entity");
  });

  it("includes the project context and the user focus", () => {
    const prompt = buildDomainsUserPrompt({
      projectName: "Library",
      projectDescription: "Lending and returns.",
      requirements: [{ name: "Track loans", description: null }],
      decisions: [{ name: "Use PostgreSQL", description: null }],
      existingDomains: [{ name: "Billing", description: null }],
      userPrompt: "Focus on overdue fines",
    });

    expect(prompt).toContain("Project: Library");
    expect(prompt).toContain("Lending and returns.");
    expect(prompt).toContain("Track loans");
    expect(prompt).toContain("Use PostgreSQL");
    expect(prompt).toContain("Billing");
    expect(prompt).toContain("Focus on overdue fines");
  });

  it("falls back to placeholders when the project has no context", () => {
    const prompt = buildDomainsUserPrompt({
      projectName: "Empty",
      projectDescription: null,
      requirements: [],
      decisions: [],
      existingDomains: [],
      userPrompt: "anything",
    });

    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

describe("aiErdResponseSchema", () => {
  it("accepts a nested payload", () => {
    const parsed = aiErdResponseSchema.safeParse({
      domains: [
        {
          name: "Billing",
          description: "Invoices and payments",
          entities: [
            {
              name: "Invoice",
              description: "A bill issued to a customer",
              attributes: [
                {
                  name: "id",
                  data_type: "uuid",
                  is_required: true,
                  is_primary_key: true,
                  description: "Primary key",
                },
              ],
              relationships: [
                {
                  target_entity: "Customer",
                  relationship_type: "many_to_one",
                  name: "billed to",
                  description: "",
                },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const entity = parsed.data.domains[0].entities[0];
    expect(entity.name).toBe("Invoice");
    expect(entity.relationships[0].relationship_type).toBe("many_to_one");
  });

  it("defaults omitted booleans, descriptions, and relationship arrays", () => {
    const parsed = aiErdResponseSchema.safeParse({
      domains: [
        {
          name: "Billing",
          entities: [
            { name: "Invoice", attributes: [{ name: "id", data_type: "uuid" }] },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const domain = parsed.data.domains[0];
    const entity = domain.entities[0];
    expect(domain.description).toBe("");
    expect(entity.description).toBe("");
    expect(entity.attributes[0].is_required).toBe(false);
    expect(entity.attributes[0].is_primary_key).toBe(false);
    expect(entity.attributes[0].description).toBe("");
    expect(entity.relationships).toEqual([]);
  });

  it("normalises an unsupported data type instead of dropping the domain", () => {
    const parsed = aiErdResponseSchema.safeParse({
      domains: [
        {
          name: "Billing",
          entities: [
            {
              name: "Invoice",
              attributes: [
                { name: "id", data_type: "money" },
                { name: "total", data_type: "float" },
                { name: "meta", data_type: "jsonb" },
                { name: "weird", data_type: "quantum" },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(
      parsed.data.domains[0]?.entities[0]?.attributes.map((a) => a.data_type),
    ).toEqual(["decimal", "decimal", "json", "string"]);
  });

  it("normalises an unsupported relationship type", () => {
    const parsed = aiErdResponseSchema.safeParse({
      domains: [
        {
          name: "Billing",
          entities: [
            {
              name: "Invoice",
              attributes: [{ name: "id", data_type: "uuid" }],
              relationships: [
                { target_entity: "Customer", relationship_type: "has_many" },
                { target_entity: "Ledger", relationship_type: "belongs_to" },
                { target_entity: "Tax", relationship_type: "nonsense" },
              ],
            },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(
      parsed.data.domains[0]?.entities[0]?.relationships.map(
        (r) => r.relationship_type,
      ),
    ).toEqual(["one_to_many", "many_to_one", "one_to_many"]);
  });

  it("rejects an entity with no attributes and a response with no domains", () => {
    expect(
      aiErdResponseSchema.safeParse({
        domains: [
          { name: "Billing", entities: [{ name: "Invoice", attributes: [] }] },
        ],
      }).success,
    ).toBe(false);

    expect(aiErdResponseSchema.safeParse({ domains: [] }).success).toBe(false);
  });
});
