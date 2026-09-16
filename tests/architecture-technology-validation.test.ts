import { describe, expect, it } from "vitest";

import { architectureTechnologyInputSchema } from "@/lib/validation/architecture/technologies";

const valid = {
  name: "PostgreSQL",
  description: "Primary relational database",
  category: "database" as const,
};

describe("architectureTechnologyInputSchema", () => {
  it("accepts a valid technology", () => {
    const result = architectureTechnologyInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = architectureTechnologyInputSchema.safeParse({
      name: "  PostgreSQL  ",
      description: "  trim me  ",
      category: "database",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("PostgreSQL");
      expect(result.data.description).toBe("trim me");
    }
  });

  it("accepts an empty description", () => {
    const result = architectureTechnologyInputSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = architectureTechnologyInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 200 characters", () => {
    const result = architectureTechnologyInputSchema.safeParse({
      ...valid,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts every documented category", () => {
    const categories = [
      "language",
      "framework",
      "database",
      "authentication",
      "hosting",
      "infrastructure",
      "testing",
      "package",
      "external_service",
      "other",
    ] as const;
    for (const category of categories) {
      const result = architectureTechnologyInputSchema.safeParse({ ...valid, category });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown category", () => {
    const result = architectureTechnologyInputSchema.safeParse({
      ...valid,
      category: "magic" as never,
    });
    expect(result.success).toBe(false);
  });
});
