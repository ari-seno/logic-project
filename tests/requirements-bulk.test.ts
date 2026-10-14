import { describe, expect, it } from "vitest";

import {
  isRequirementBulkPriority,
  isRequirementBulkStatus,
  MAX_BULK_REQUIREMENTS,
  normalizeBulkRequirementIds,
  REQUIREMENT_BULK_PRIORITIES,
  REQUIREMENT_BULK_STATUSES,
} from "@/lib/requirements/bulk";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

describe("requirements/bulk", () => {
  it("keeps only uuid-shaped ids and removes duplicates", () => {
    expect(normalizeBulkRequirementIds([ID_A, ID_A, ID_B, "nope", 7, null])).toEqual([
      ID_A,
      ID_B,
    ]);
  });

  it("returns an empty list for non-arrays", () => {
    expect(normalizeBulkRequirementIds("nope")).toEqual([]);
    expect(normalizeBulkRequirementIds(undefined)).toEqual([]);
  });

  it("caps the number of ids", () => {
    const many = Array.from({ length: MAX_BULK_REQUIREMENTS + 25 }, (_, index) =>
      `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    );
    expect(normalizeBulkRequirementIds(many)).toHaveLength(MAX_BULK_REQUIREMENTS);
  });

  it("validates status and priority values", () => {
    for (const status of REQUIREMENT_BULK_STATUSES) {
      expect(isRequirementBulkStatus(status)).toBe(true);
    }
    expect(isRequirementBulkStatus("pending")).toBe(false);
    for (const priority of REQUIREMENT_BULK_PRIORITIES) {
      expect(isRequirementBulkPriority(priority)).toBe(true);
    }
    expect(isRequirementBulkPriority("urgent")).toBe(false);
  });
});
