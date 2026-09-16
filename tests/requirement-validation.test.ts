import { describe, expect, it } from "vitest";

import { requirementInputSchema } from "@/lib/validation/requirements";

const valid = {
  title: "User can log in",
  description: "Email + password authentication",
  type: "functional" as const,
  status: "draft" as const,
  priority: "medium" as const,
};

describe("requirementInputSchema", () => {
  it("accepts a valid functional requirement", () => {
    const result = requirementInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts a valid non_functional requirement", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      type: "non_functional",
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from title and description", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      title: "  trim me  ",
      description: "  trim me too  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("trim me");
      expect(result.data.description).toBe("trim me too");
    }
  });

  it("accepts an empty description", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = requirementInputSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it("rejects a whitespace-only title", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a title longer than 200 characters", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid type", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      type: "bogus",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.type).toBeDefined();
    }
  });

  it("rejects an invalid status", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      status: "bogus",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeDefined();
    }
  });

  it("rejects an invalid priority", () => {
    const result = requirementInputSchema.safeParse({
      ...valid,
      priority: "bogus",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.priority).toBeDefined();
    }
  });

  it("accepts all valid status values", () => {
    for (const status of [
      "draft",
      "approved",
      "rejected",
      "implemented",
    ] as const) {
      const result = requirementInputSchema.safeParse({ ...valid, status });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid priority values", () => {
    for (const priority of ["low", "medium", "high", "critical"] as const) {
      const result = requirementInputSchema.safeParse({ ...valid, priority });
      expect(result.success).toBe(true);
    }
  });
});
