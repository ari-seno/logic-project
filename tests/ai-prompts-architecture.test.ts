import { describe, expect, it } from "vitest";

import {
  buildArchitectureSystemPrompt,
  buildArchitectureUserPrompt,
} from "@/lib/ai/prompts/architecture";
import {
  aiArchitectureResponseSchema,
  flattenArchitectureResponse,
} from "@/lib/ai/schema";
import {
  ARCHITECTURE_COMPONENT_TYPES,
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
} from "@/lib/supabase/types";

describe("ai/prompts/architecture system prompt", () => {
  it("enumerates every allowed component type", () => {
    const prompt = buildArchitectureSystemPrompt();
    for (const type of ARCHITECTURE_COMPONENT_TYPES) {
      expect(prompt).toContain(type);
    }
  });

  it("enumerates every allowed technology category", () => {
    const prompt = buildArchitectureSystemPrompt();
    for (const category of ARCHITECTURE_TECHNOLOGY_CATEGORIES) {
      expect(prompt).toContain(category);
    }
  });

  it("describes the dependency shape and the raw JSON requirement", () => {
    const prompt = buildArchitectureSystemPrompt();
    expect(prompt).toContain("depends_on");
    expect(prompt).toContain("target_component");
    expect(prompt).toContain("raw JSON");
  });
});

describe("ai/prompts/architecture user prompt", () => {
  const ctx = {
    projectName: "Ledger",
    projectDescription: "Track invoices.",
    requirements: [{ name: "Invoice must be immutable", description: null }],
    decisions: [{ name: "Single tenant", description: null }],
    domains: [{ name: "Billing", description: null }],
    existingComponents: [{ name: "Existing API", description: null }],
    existingTechnologies: [{ name: "Existing DB", description: null }],
    existingDecisions: [{ name: "Existing decision", description: null }],
    userPrompt: "Focus on the payments path.",
  };

  it("carries project, upstream, and existing-item context", () => {
    const prompt = buildArchitectureUserPrompt(ctx);

    expect(prompt).toContain("Ledger");
    expect(prompt).toContain("Track invoices.");
    expect(prompt).toContain("Invoice must be immutable");
    expect(prompt).toContain("Single tenant");
    expect(prompt).toContain("Billing");
    expect(prompt).toContain("Existing API");
    expect(prompt).toContain("Existing DB");
    expect(prompt).toContain("Existing decision");
    expect(prompt).toContain("Focus on the payments path.");
  });

  it("falls back when description and upstream lists are empty", () => {
    const prompt = buildArchitectureUserPrompt({
      ...ctx,
      projectDescription: null,
      requirements: [],
      decisions: [],
      domains: [],
      existingComponents: [],
      existingTechnologies: [],
      existingDecisions: [],
    });

    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

const VALID_RESPONSE = {
  components: [
    {
      name: "Payments API",
      type: "backend",
      description: "Handles charges.",
      depends_on: [
        { target_component: "Ledger DB", description: "Persists charges." },
      ],
    },
  ],
  technologies: [
    { name: "Ledger DB", category: "database", description: "Primary store." },
  ],
  decisions: [
    {
      title: "Use a relational database",
      context: "Money needs transactions.",
      decision: "Adopt PostgreSQL.",
      rationale: "Strong consistency guarantees.",
    },
  ],
};

describe("aiArchitectureResponseSchema", () => {
  it("accepts a nested architecture payload", () => {
    const parsed = aiArchitectureResponseSchema.safeParse(VALID_RESPONSE);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.components).toHaveLength(1);
    expect(parsed.data.components[0]?.depends_on).toHaveLength(1);
    expect(parsed.data.technologies).toHaveLength(1);
    expect(parsed.data.decisions).toHaveLength(1);
  });

  it("defaults omitted descriptions, dependencies, and empty groups", () => {
    const parsed = aiArchitectureResponseSchema.safeParse({
      components: [{ name: "Web App", type: "frontend" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.components[0]?.description).toBe("");
    expect(parsed.data.components[0]?.depends_on).toEqual([]);
    expect(parsed.data.technologies).toEqual([]);
    expect(parsed.data.decisions).toEqual([]);
  });

  it("rejects an unsupported component type", () => {
    const parsed = aiArchitectureResponseSchema.safeParse({
      components: [{ name: "Web App", type: "mobile" }],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an unsupported technology category", () => {
    const parsed = aiArchitectureResponseSchema.safeParse({
      technologies: [{ name: "Something", category: "magic" }],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a response with no items at all", () => {
    const parsed = aiArchitectureResponseSchema.safeParse({
      components: [],
      technologies: [],
      decisions: [],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("flattenArchitectureResponse", () => {
  it("tags each item with its kind, components first", () => {
    const parsed = aiArchitectureResponseSchema.safeParse(VALID_RESPONSE);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const flat = flattenArchitectureResponse(parsed.data);

    expect(flat.map((item) => item.kind)).toEqual([
      "component",
      "technology",
      "decision",
    ]);
    expect(flat).toHaveLength(3);
  });
});
