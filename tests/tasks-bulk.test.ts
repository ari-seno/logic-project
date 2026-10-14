import { describe, expect, it } from "vitest";

import {
  MAX_BULK_TASKS,
  TASK_BULK_PRIORITIES,
  TASK_BULK_STATUSES,
  isBulkPriority,
  isBulkStatus,
  normalizeBulkIds,
} from "@/lib/tasks/bulk";

const ID = "11111111-1111-4111-8111-111111111111";

describe("tasks/bulk", () => {
  it("keeps only unique, uuid-shaped ids", () => {
    expect(normalizeBulkIds([ID, ID, "nope", 42, null])).toEqual([ID]);
  });

  it("returns an empty list for non-arrays", () => {
    expect(normalizeBulkIds(undefined)).toEqual([]);
    expect(normalizeBulkIds("x")).toEqual([]);
  });

  it("caps the number of ids", () => {
    const many = Array.from({ length: MAX_BULK_TASKS + 25 }, (_, index) =>
      `${String(index).padStart(8, "0")}-1111-4111-8111-111111111111`,
    );
    expect(normalizeBulkIds(many)).toHaveLength(MAX_BULK_TASKS);
  });

  it("validates statuses and priorities", () => {
    expect(isBulkStatus("in_progress")).toBe(true);
    expect(isBulkStatus("nope")).toBe(false);
    expect(isBulkPriority("critical")).toBe(true);
    expect(isBulkPriority("urgent")).toBe(false);
    expect(TASK_BULK_STATUSES).toHaveLength(7);
    expect(TASK_BULK_PRIORITIES).toHaveLength(4);
  });
});
