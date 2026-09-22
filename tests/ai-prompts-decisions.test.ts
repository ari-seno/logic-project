import { describe, expect, it } from "vitest";

import {
  buildDecisionsSystemPrompt,
  buildDecisionsUserPrompt,
} from "@/lib/ai/prompts/decisions";

describe("ai/prompts/decisions", () => {
  it("system prompt demands JSON output with the expected shape", () => {
    const sys = buildDecisionsSystemPrompt();
    expect(sys).toContain('"decisions"');
    expect(sys).toContain('"context"');
    expect(sys).toContain('"decision"');
    expect(sys).toContain('"rationale"');
    expect(sys).toContain("1..15");
    expect(sys).toContain("markdown fences");
  });

  it("user prompt includes project, requirements, existing decisions, and user message", () => {
    const user = buildDecisionsUserPrompt({
      projectName: "Library Management System",
      projectDescription: "Helps librarians track books and loans.",
      existingDecisions: [{ name: "Use PostgreSQL", description: null }],
      requirements: [{ name: "Borrow book", description: null }, { name: "Return book", description: null }],
      userPrompt: "Which auth strategy should we commit to?",
    });
    expect(user).toContain("Library Management System");
    expect(user).toContain("Borrow book");
    expect(user).toContain("Use PostgreSQL");
    expect(user).toContain("Which auth strategy should we commit to?");
  });

  it("user prompt truncates description to a sane bound", () => {
    const description = "x".repeat(2000);
    const user = buildDecisionsUserPrompt({
      projectName: "Demo",
      projectDescription: description,
      existingDecisions: [],
      requirements: [],
      userPrompt: "short",
    });
    expect(user.length).toBeLessThan(description.length + 300);
  });

  it("user prompt falls back gracefully when nothing exists yet", () => {
    const user = buildDecisionsUserPrompt({
      projectName: "Demo",
      projectDescription: null,
      existingDecisions: [],
      requirements: [],
      userPrompt: "starter",
    });
    expect(user).toContain("(no description)");
    expect(user).toContain("(none yet)");
  });
});
