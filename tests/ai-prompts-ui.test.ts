import { describe, expect, it } from "vitest";

import {
  UI_COMPONENT_TYPES,
  UI_SCREEN_ENTITY_ROLES,
  UI_SCREEN_TYPES,
} from "@/lib/supabase/types";
import { aiUiResponseSchema, flattenUiResponse } from "@/lib/ai/schema";
import {
  buildUiSystemPrompt,
  buildUiUserPrompt,
} from "@/lib/ai/prompts/ui";

const baseContext = {
  projectName: "Lending Platform",
  projectDescription: "A lending workflow for small teams.",
  requirements: [{ name: "Borrowers can apply for a loan", description: null }],
  decisions: [{ name: "Use Postgres as the primary datastore", description: null }],
  domains: [{ name: "Lending", description: null }],
  entities: [{ name: "Loan", description: null }, { name: "Borrower", description: null }],
  apiGroups: [{ name: "Users", description: null }],
  apiEndpoints: [{ name: "GET /loans", description: null }],
  existingScreens: [{ name: "Dashboard", description: null }],
  existingComponents: [{ name: "App shell", description: null }],
  userPrompt: "Cover loans and repayments.",
};

describe("ai/prompts ui", () => {
  it("lists every allowed screen type, component type, and role", () => {
    const prompt = buildUiSystemPrompt();

    for (const value of UI_SCREEN_TYPES) {
      expect(prompt).toContain(value);
    }
    for (const value of UI_COMPONENT_TYPES) {
      expect(prompt).toContain(value);
    }
    for (const value of UI_SCREEN_ENTITY_ROLES) {
      expect(prompt).toContain(value);
    }
    expect(prompt).toContain("placements");
    expect(prompt).toContain("parent_label");
    expect(prompt).toContain("raw JSON");
  });

  it("carries the project context into the user prompt", () => {
    const prompt = buildUiUserPrompt(baseContext);

    expect(prompt).toContain("Lending Platform");
    expect(prompt).toContain("A lending workflow for small teams.");
    expect(prompt).toContain("Borrowers can apply for a loan");
    expect(prompt).toContain("Use Postgres as the primary datastore");
    expect(prompt).toContain("Lending");
    expect(prompt).toContain("Loan");
    expect(prompt).toContain("Users");
    expect(prompt).toContain("GET /loans");
    expect(prompt).toContain("Dashboard");
    expect(prompt).toContain("App shell");
    expect(prompt).toContain("Cover loans and repayments.");
  });

  it("falls back when optional context is missing", () => {
    const prompt = buildUiUserPrompt({
      ...baseContext,
      projectDescription: null,
      requirements: [],
      decisions: [],
      domains: [],
      entities: [],
      apiGroups: [],
      apiEndpoints: [],
      existingScreens: [],
      existingComponents: [],
    });

    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

describe("ai/schema ui response", () => {
  it("accepts a nested payload", () => {
    const parsed = aiUiResponseSchema.safeParse({
      components: [
        {
          name: "Loan table",
          component_type: "table",
          description: "Lists loans.",
          purpose: "Scan a portfolio.",
          technology: "shadcn Table",
        },
      ],
      screens: [
        {
          name: "Loan list",
          route: "/loans",
          screen_type: "list",
          description: "Every loan in one table.",
          purpose: "Find a loan fast.",
          authentication_required: true,
          placements: [
            {
              component_name: "Loan table",
              label: "Recent loans",
              description: "Defaults to the last 30 days.",
              required: true,
              parent_label: "",
            },
          ],
          entities: [{ entity_name: "Loan", role: "displayed" }],
          requirement_titles: ["Borrowers can apply for a loan"],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.screens[0]?.placements[0]?.required).toBe(true);
    expect(parsed.data.screens[0]?.entities[0]?.role).toBe("displayed");
  });

  it("defaults omitted optional fields", () => {
    const parsed = aiUiResponseSchema.safeParse({
      screens: [{ name: "Dashboard", screen_type: "dashboard" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const screen = parsed.data.screens[0];
    expect(screen?.route).toBe("");
    expect(screen?.description).toBe("");
    expect(screen?.purpose).toBe("");
    expect(screen?.authentication_required).toBe(true);
    expect(screen?.placements).toEqual([]);
    expect(screen?.entities).toEqual([]);
    expect(screen?.requirement_titles).toEqual([]);
    expect(parsed.data.components).toEqual([]);
  });

  it("rejects unsupported enum values", () => {
    const badScreenType = aiUiResponseSchema.safeParse({
      screens: [{ name: "Canvas", screen_type: "canvas" }],
    });
    expect(badScreenType.success).toBe(false);

    const badComponentType = aiUiResponseSchema.safeParse({
      components: [{ name: "Widget", component_type: "widget" }],
    });
    expect(badComponentType.success).toBe(false);

    const badRole = aiUiResponseSchema.safeParse({
      screens: [
        {
          name: "Loan list",
          screen_type: "list",
          entities: [{ entity_name: "Loan", role: "owner" }],
        },
      ],
    });
    expect(badRole.success).toBe(false);
  });

  it("rejects a response with no components and no screens", () => {
    const parsed = aiUiResponseSchema.safeParse({
      components: [],
      screens: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("flattens components before screens", () => {
    const parsed = aiUiResponseSchema.safeParse({
      components: [{ name: "Loan table", component_type: "table" }],
      screens: [{ name: "Loan list", screen_type: "list" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const flat = flattenUiResponse(parsed.data);
    expect(flat.map((item) => item.kind)).toEqual(["component", "screen"]);
    expect(flat[0]?.name).toBe("Loan table");
  });
});
