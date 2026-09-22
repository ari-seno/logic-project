import { describe, expect, it } from "vitest";

import {
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_TYPES,
} from "@/lib/supabase/types";
import { aiTasksResponseSchema } from "@/lib/ai/schema";
import {
  buildTasksSystemPrompt,
  buildTasksUserPrompt,
} from "@/lib/ai/prompts/tasks";

const baseContext = {
  projectName: "Lending Platform",
  projectDescription: "A lending workflow for small teams.",
  requirements: [{ name: "Borrowers can apply for a loan", description: null }],
  decisions: [{ name: "Use Postgres as the primary datastore", description: null }],
  domains: [{ name: "Lending", description: null }],
  entities: [{ name: "Loan", description: null }, { name: "Borrower", description: null }],
  architectureComponents: [{ name: "Lending API", description: null }],
  apiEndpoints: [{ name: "POST /loans", description: null }],
  uiScreens: [{ name: "Loan List", description: null }],
  existingTasks: [{ name: "Set up the database", description: null }],
  userPrompt: "Cover the loan lifecycle end to end.",
};

describe("ai/prompts tasks", () => {
  it("lists every allowed type, priority, and effort", () => {
    const prompt = buildTasksSystemPrompt();

    for (const value of TASK_TYPES) {
      expect(prompt).toContain(value);
    }
    for (const value of TASK_PRIORITIES) {
      expect(prompt).toContain(value);
    }
    for (const value of TASK_EFFORTS) {
      expect(prompt).toContain(value);
    }
    expect(prompt).toContain("parent_title");
    expect(prompt).toContain("depends_on");
    expect(prompt).toContain("acceptance_criteria");
    expect(prompt).toContain("raw JSON");
  });

  it("carries every artifact list into the user prompt", () => {
    const prompt = buildTasksUserPrompt(baseContext);

    expect(prompt).toContain("Lending Platform");
    expect(prompt).toContain("A lending workflow for small teams.");
    expect(prompt).toContain("Borrowers can apply for a loan");
    expect(prompt).toContain("Use Postgres as the primary datastore");
    expect(prompt).toContain("Lending API");
    expect(prompt).toContain("POST /loans");
    expect(prompt).toContain("Loan List");
    expect(prompt).toContain("Set up the database");
    expect(prompt).toContain("Cover the loan lifecycle end to end.");
  });

  it("falls back when optional context is missing", () => {
    const prompt = buildTasksUserPrompt({
      ...baseContext,
      projectDescription: null,
      requirements: [],
      decisions: [],
      domains: [],
      entities: [],
      architectureComponents: [],
      apiEndpoints: [],
      uiScreens: [],
      existingTasks: [],
    });

    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

describe("ai/schema tasks response", () => {
  it("accepts a nested task payload", () => {
    const parsed = aiTasksResponseSchema.safeParse({
      tasks: [
        {
          title: "Create the loans table",
          task_type: "database",
          priority: "high",
          estimated_effort: "s",
          description: "Add the table and indexes.",
          acceptance_criteria: "Migrations apply cleanly.",
          implementation_notes: "Follow the domain model.",
          parent_title: "",
          depends_on: [],
          links: [{ kind: "entity", name: "Loan" }],
        },
        {
          title: "Add the loan endpoint",
          task_type: "backend",
          parent_title: "Create the loans table",
          depends_on: ["Create the loans table"],
          links: [
            { kind: "requirement", name: "Borrowers can apply for a loan" },
            { kind: "endpoint", name: "POST /loans" },
          ],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.tasks).toHaveLength(2);
    expect(parsed.data.tasks[0]?.links[0]?.kind).toBe("entity");
  });

  it("defaults omitted optional fields", () => {
    const parsed = aiTasksResponseSchema.safeParse({
      tasks: [{ title: "Write docs", task_type: "documentation" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const task = parsed.data.tasks[0];
    expect(task?.priority).toBe("medium");
    expect(task?.estimated_effort).toBeNull();
    expect(task?.description).toBe("");
    expect(task?.parent_title).toBe("");
    expect(task?.depends_on).toEqual([]);
    expect(task?.links).toEqual([]);
  });

  it("rejects unsupported enum values", () => {
    const badType = aiTasksResponseSchema.safeParse({
      tasks: [{ title: "Something", task_type: "chore" }],
    });
    expect(badType.success).toBe(false);

    const badPriority = aiTasksResponseSchema.safeParse({
      tasks: [{ title: "Something", task_type: "feature", priority: "urgent" }],
    });
    expect(badPriority.success).toBe(false);

    const badEffort = aiTasksResponseSchema.safeParse({
      tasks: [
        { title: "Something", task_type: "feature", estimated_effort: "huge" },
      ],
    });
    expect(badEffort.success).toBe(false);

    const badLinkKind = aiTasksResponseSchema.safeParse({
      tasks: [
        {
          title: "Something",
          task_type: "feature",
          links: [{ kind: "story", name: "x" }],
        },
      ],
    });
    expect(badLinkKind.success).toBe(false);
  });

  it("rejects an empty task list", () => {
    expect(aiTasksResponseSchema.safeParse({ tasks: [] }).success).toBe(false);
  });
});
