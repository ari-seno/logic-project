import { describe, expect, it } from "vitest";

import {
  normalizePriority,
  normalizeRequirementType,
} from "@/lib/ai/apply";

describe("ai/apply normalization", () => {
  it("maps AI type 'non_functional' to 'non_functional'", () => {
    expect(normalizeRequirementType("non_functional")).toBe("non_functional");
  });

  it("maps AI type 'functional' and 'business' to 'functional'", () => {
    expect(normalizeRequirementType("functional")).toBe("functional");
    expect(normalizeRequirementType("business")).toBe("functional");
  });

  it("maps AI MoSCoW priorities to canonical priority buckets", () => {
    expect(normalizePriority("must")).toBe("critical");
    expect(normalizePriority("should")).toBe("high");
    expect(normalizePriority("could")).toBe("medium");
    expect(normalizePriority("wont")).toBe("low");
  });
});
