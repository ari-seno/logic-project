import { describe, expect, it } from "vitest";

import {
  buildRequirementsSystemPrompt,
  buildRequirementsUserPrompt,
} from "@/lib/ai/prompts/requirements";

describe("ai/prompts/requirements", () => {
  it("system prompt demands JSON output with the expected shape", () => {
    const sys = buildRequirementsSystemPrompt();
    expect(sys).toContain('"requirements"');
    expect(sys).toContain("MoSCoW");
    expect(sys).toContain("1..15");
  });

  it("user prompt includes project, existing titles, and user message", () => {
    const user = buildRequirementsUserPrompt({
      projectName: "Library Management System",
      projectDescription: "Helps librarians track books and loans.",
      existingTitles: ["Borrow book", "Return book"],
      userPrompt: "Focus on borrower auth and overdue fines.",
    });
    expect(user).toContain("Library Management System");
    expect(user).toContain("Borrow book");
    expect(user).toContain("Focus on borrower auth and overdue fines.");
  });

  it("user prompt truncates description to a sane bound", () => {
    const description = "x".repeat(2000);
    const user = buildRequirementsUserPrompt({
      projectName: "Demo",
      projectDescription: description,
      existingTitles: [],
      userPrompt: "short",
    });
    expect(user.length).toBeLessThan(description.length + 200);
  });

  it("user prompt falls back gracefully when no existing requirements", () => {
    const user = buildRequirementsUserPrompt({
      projectName: "Demo",
      projectDescription: null,
      existingTitles: [],
      userPrompt: "starter",
    });
    expect(user).toContain("(none yet)");
    expect(user).toContain("(no description)");
  });
});
