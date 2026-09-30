import { describe, expect, it } from "vitest";

import {
  buildTaskDependencyRow,
  buildTaskRow,
  buildTasksBundle,
  taskDependencyDedupeKey,
} from "@/lib/ai/apply";

const TASK_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

describe("ai/apply task row builders", () => {
  it("maps a task item and nulls empty long text", () => {
    const row = buildTaskRow({
      title: "  Add loan endpoint  ",
      task_type: "backend",
      priority: "high",
      estimated_effort: "m",
      description: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_title: "",
      depends_on: [],
      links: [],
    });

    expect(row).not.toBeNull();
    expect(row?.title).toBe("Add loan endpoint");
    expect(row?.task_type).toBe("backend");
    expect(row?.priority).toBe("high");
    expect(row?.estimated_effort).toBe("m");
    expect(row?.description).toBeNull();
    expect(row?.acceptance_criteria).toBeNull();
    expect(row?.implementation_notes).toBeNull();
  });

  it("keeps a null estimated effort", () => {
    const row = buildTaskRow({
      title: "Investigate latency",
      task_type: "other",
      priority: "low",
      estimated_effort: null,
      description: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_title: "",
      depends_on: [],
      links: [],
    });

    expect(row).not.toBeNull();
    expect(row?.estimated_effort).toBeNull();
  });

  it("rejects a task item with a blank title", () => {
    const row = buildTaskRow({
      title: "   ",
      task_type: "feature",
      priority: "medium",
      estimated_effort: null,
      description: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_title: "",
      depends_on: [],
      links: [],
    });

    expect(row).toBeNull();
  });

  it("rejects an unsupported task type or effort", () => {
    const badType = buildTaskRow({
      title: "Something",
      task_type: "chore" as never,
      priority: "medium",
      estimated_effort: null,
      description: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_title: "",
      depends_on: [],
      links: [],
    });
    expect(badType).toBeNull();

    const badEffort = buildTaskRow({
      title: "Something",
      task_type: "feature",
      priority: "medium",
      estimated_effort: "huge" as never,
      description: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_title: "",
      depends_on: [],
      links: [],
    });
    expect(badEffort).toBeNull();
  });

  it("maps a dependency row and rejects a self dependency", () => {
    const row = buildTaskDependencyRow(TASK_ID, OTHER_ID, "");

    expect(row).not.toBeNull();
    expect(row?.task_id).toBe(TASK_ID);
    expect(row?.depends_on_task_id).toBe(OTHER_ID);
    expect(row?.dependency_type).toBe("blocks");
    expect(row?.description).toBeNull();

    expect(buildTaskDependencyRow(TASK_ID, TASK_ID, "")).toBeNull();
  });

  it("rejects a dependency whose target is not a uuid", () => {
    expect(buildTaskDependencyRow(TASK_ID, "not-a-uuid", "")).toBeNull();
  });

  it("builds a direction-sensitive de-duplication key", () => {
    expect(taskDependencyDedupeKey(TASK_ID, OTHER_ID)).toBe(
      `${TASK_ID}|${OTHER_ID}`,
    );
    expect(taskDependencyDedupeKey(TASK_ID, OTHER_ID)).not.toBe(
      taskDependencyDedupeKey(OTHER_ID, TASK_ID),
    );
  });
});

describe("ai/apply tasks bundle builder", () => {
  const item = {
    title: "Build login",
    task_type: "feature" as const,
    priority: "high" as const,
    estimated_effort: "m" as const,
    description: "A login form",
    acceptance_criteria: "- works",
    implementation_notes: "",
    parent_title: "Auth work",
    depends_on: ["Schema", "  "],
    links: [{ kind: "requirement" as const, name: "Borrowers can apply" }],
  };

  it("shapes selected items into the SQL payload and keeps their indices", () => {
    const { tasks, skipped } = buildTasksBundle([item], [0]);

    expect(skipped).toEqual([]);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.index).toBe(0);
    expect(tasks[0]?.title).toBe("Build login");
    expect(tasks[0]?.estimated_effort).toBe("m");
    expect(tasks[0]?.parent_title).toBe("Auth work");
    expect(tasks[0]?.depends_on).toEqual(["Schema"]);
    expect(tasks[0]?.links[0]?.kind).toBe("requirement");
  });

  it("ignores out-of-range, negative, and non-integer indices", () => {
    const { tasks, skipped } = buildTasksBundle([item], [0, 9, -1, 2.5]);
    expect(tasks).toHaveLength(1);
    expect(skipped).toEqual([]);
  });

  it("reports an invalid task as skipped rather than including it", () => {
    const { tasks, skipped } = buildTasksBundle(
      [{ ...item, title: "" }],
      [0],
    );

    expect(tasks).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.kind).toBe("skipped");
    expect(
      skipped[0]?.kind === "skipped" ? skipped[0].reason : null,
    ).toBe("invalid");
  });

  it("de-duplicates repeated indices", () => {
    const { tasks } = buildTasksBundle([item], [0, 0, 0]);
    expect(tasks).toHaveLength(1);
  });
});
