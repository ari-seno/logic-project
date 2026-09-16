import { describe, expect, it } from "vitest";

import { architectureComponentInputSchema } from "@/lib/validation/architecture/components";

const valid = {
  name: "API gateway",
  description: "Routes traffic to backend services",
  type: "backend" as const,
};

describe("architectureComponentInputSchema", () => {
  it("accepts a valid component", () => {
    const result = architectureComponentInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = architectureComponentInputSchema.safeParse({
      name: "  API gateway  ",
      description: "  trim me  ",
      type: "backend",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("API gateway");
      expect(result.data.description).toBe("trim me");
    }
  });

  it("accepts an empty description", () => {
    const result = architectureComponentInputSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = architectureComponentInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 200 characters", () => {
    const result = architectureComponentInputSchema.safeParse({
      ...valid,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts every documented component type", () => {
    const types = [
      "frontend",
      "backend",
      "database",
      "authentication",
      "storage",
      "external_service",
      "infrastructure",
      "worker",
      "queue",
      "cache",
      "other",
    ] as const;
    for (const type of types) {
      const result = architectureComponentInputSchema.safeParse({ ...valid, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown type", () => {
    const result = architectureComponentInputSchema.safeParse({
      ...valid,
      type: "spaceship" as never,
    });
    expect(result.success).toBe(false);
  });
});
