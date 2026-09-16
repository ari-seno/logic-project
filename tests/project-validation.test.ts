import { describe, expect, it } from "vitest";

import { projectInputSchema } from "@/lib/validation/projects";

describe("projectInputSchema", () => {
  it("accepts a valid project", () => {
    const result = projectInputSchema.safeParse({
      name: "My project",
      description: "Some description",
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from the name", () => {
    const result = projectInputSchema.safeParse({
      name: "   Trim me   ",
      description: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trim me");
    }
  });

  it("rejects an empty name", () => {
    const result = projectInputSchema.safeParse({
      name: "",
      description: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects a whitespace-only name", () => {
    const result = projectInputSchema.safeParse({
      name: "   ",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 120 characters", () => {
    const result = projectInputSchema.safeParse({
      name: "a".repeat(121),
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty optional description", () => {
    const result = projectInputSchema.safeParse({
      name: "ok",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a description longer than 2000 characters", () => {
    const result = projectInputSchema.safeParse({
      name: "ok",
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
