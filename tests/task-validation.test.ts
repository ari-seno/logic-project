import { describe, expect, it } from "vitest";

import {
  taskInputSchema,
  taskDependencyInputSchema,
} from "@/lib/validation/tasks";
import {
  TASK_DEPENDENCY_TYPES,
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/supabase/types";

describe("task validation", () => {
  it("accepts a valid task", () => {
    const r = taskInputSchema.safeParse({
      title: "Implement POST /api/projects",
      description: "Accepts project body, returns 201",
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "m",
      acceptance_criteria: "- happy path\n- validation errors",
      implementation_notes: "Use zod",
      parent_task_id: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty title", () => {
    const r = taskInputSchema.safeParse({
      title: "",
      description: "",
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects title longer than 200 chars", () => {
    const r = taskInputSchema.safeParse({
      title: "a".repeat(201),
      description: "",
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid task type", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "",
      task_type: "Bogus",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "",
      task_type: "feature",
      status: "bogus",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "",
      task_type: "feature",
      status: "todo",
      priority: "extreme",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid effort", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "",
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "xxl",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts description up to 5000 chars", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "x".repeat(5000),
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects description longer than 5000 chars", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "x".repeat(5001),
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "",
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects acceptance_criteria longer than 10000 chars", () => {
    const r = taskInputSchema.safeParse({
      title: "X",
      description: "",
      task_type: "feature",
      status: "todo",
      priority: "medium",
      estimated_effort: "",
      acceptance_criteria: "y".repeat(10001),
      implementation_notes: "",
      parent_task_id: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts all 11 task types", () => {
    const types = [
      "feature",
      "bug",
      "refactor",
      "database",
      "backend",
      "frontend",
      "infrastructure",
      "testing",
      "documentation",
      "security",
      "other",
    ];
    expect(TASK_TYPES).toEqual(types);
  });

  it("accepts all 7 statuses and 4 priorities and 5 efforts", () => {
    expect(TASK_STATUSES.length).toBe(7);
    expect(TASK_PRIORITIES.length).toBe(4);
    expect(TASK_EFFORTS.length).toBe(5);
    expect(TASK_DEPENDENCY_TYPES).toEqual(["blocks", "related"]);
  });
});

describe("task dependency validation", () => {
  it("accepts a valid dependency", () => {
    const r = taskDependencyInputSchema.safeParse({
      depends_on_task_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      dependency_type: "blocks",
      description: "Need schema first",
    });
    expect(r.success).toBe(true);
  });
  it("rejects missing depends_on_task_id", () => {
    const r = taskDependencyInputSchema.safeParse({
      depends_on_task_id: "not-a-uuid",
      dependency_type: "blocks",
      description: "",
    });
    expect(r.success).toBe(false);
  });
  it("accepts related dependency type", () => {
    const r = taskDependencyInputSchema.safeParse({
      depends_on_task_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      dependency_type: "related",
      description: "info only",
    });
    expect(r.success).toBe(true);
  });
  it("rejects unknown dependency type", () => {
    const r = taskDependencyInputSchema.safeParse({
      depends_on_task_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      dependency_type: "blocks-related",
      description: "",
    });
    expect(r.success).toBe(false);
  });
});
