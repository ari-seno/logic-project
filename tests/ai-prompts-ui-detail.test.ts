import { describe, expect, it } from "vitest";

import {
  buildUiDetailSystemPrompt,
  buildUiDetailUserPrompt,
} from "@/lib/ai/prompts/ui-detail";
import { aiUiDetailResponseSchema, flattenUiDetailResponse } from "@/lib/ai/schema";
import { UI_FIELD_TYPES, UI_STATE_TYPES } from "@/lib/supabase/types";

describe("ai/prompts ui-detail", () => {
  it("lists every allowed field type and state type in the system prompt", () => {
    const prompt = buildUiDetailSystemPrompt();

    for (const value of UI_FIELD_TYPES) {
      expect(prompt).toContain(value);
    }
    for (const value of UI_STATE_TYPES) {
      expect(prompt).toContain(value);
    }
    expect(prompt).toContain("screen_name");
    expect(prompt).toContain("endpoint_labels");
    expect(prompt).toContain("raw JSON");
  });

  it("renders the context lists and the fallbacks in the user prompt", () => {
    const prompt = buildUiDetailUserPrompt({
      projectName: "Lending Platform",
      projectDescription: null,
      requirements: [
        { name: "Borrowers can apply", description: "A short summary." },
      ],
      decisions: [{ name: "Use Postgres", description: null }],
      apiEndpoints: [{ name: "POST /loans", description: "Create a loan." }],
      existingScreens: [{ name: "Loan List", description: null }],
      existingNavigation: [],
      userPrompt: "Detail the loan screens.",
    });

    expect(prompt).toContain("Lending Platform");
    expect(prompt).toContain("Borrowers can apply");
    expect(prompt).toContain("A short summary.");
    expect(prompt).toContain("POST /loans");
    expect(prompt).toContain("Loan List");
    expect(prompt).toContain("Detail the loan screens.");
    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

describe("ai/schema ui-detail response", () => {
  it("accepts a nested payload and defaults omitted optionals", () => {
    const parsed = aiUiDetailResponseSchema.safeParse({
      screens: [
        {
          screen_name: "Loan List",
          forms: [
            {
              name: "Filter form",
              fields: [{ name: "status", label: "Status", field_type: "select" }],
            },
          ],
        },
      ],
      navigation: [{ name: "loans", label: "Loans" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const field = parsed.data.screens[0]?.forms[0]?.fields[0];
    expect(field?.required).toBe(false);
    expect(field?.placeholder).toBe("");
    expect(parsed.data.navigation[0]?.route).toBe("");
    expect(parsed.data.navigation[0]?.screen_names).toEqual([]);
  });

  it("normalises an unsupported field type and state type", () => {
    const parsed = aiUiDetailResponseSchema.safeParse({
      screens: [
        {
          screen_name: "Loan List",
          forms: [
            {
              name: "Filter form",
              fields: [
                { name: "when", label: "When", field_type: "timestamp" },
                { name: "weird", label: "Weird", field_type: "quantum" },
              ],
            },
          ],
          states: [{ name: "Boom", state_type: "nonsense" }],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.screens[0]?.forms[0]?.fields[0]?.field_type).toBe(
      "datetime",
    );
    expect(parsed.data.screens[0]?.forms[0]?.fields[1]?.field_type).toBe("text");
    expect(parsed.data.screens[0]?.states[0]?.state_type).toBe("default");
  });

  it("rejects an empty response", () => {
    const parsed = aiUiDetailResponseSchema.safeParse({
      screens: [],
      navigation: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("flattens screens before navigation", () => {
    const parsed = aiUiDetailResponseSchema.safeParse({
      screens: [{ screen_name: "Loan List" }],
      navigation: [{ name: "loans", label: "Loans" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const flat = flattenUiDetailResponse(parsed.data);
    expect(flat.map((item) => item.kind)).toEqual(["screen", "navigation"]);
  });
});
