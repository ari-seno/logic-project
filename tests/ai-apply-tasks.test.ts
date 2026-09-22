import { describe, expect, it } from "vitest";

import {
  buildTaskDependencyRow,
  buildTaskRow,
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
