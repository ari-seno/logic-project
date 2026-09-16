import { describe, expect, it } from "vitest";

import { architectureComponentDependencyInputSchema } from "@/lib/validation/architecture/dependencies";

const valid = {
  source_component_id: "11111111-1111-4111-8111-111111111111",
  target_component_id: "22222222-2222-4222-8222-222222222222",
  description: "",
};

describe("architectureComponentDependencyInputSchema", () => {
  it("accepts a valid dependency", () => {
    const result = architectureComponentDependencyInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts a dependency with description", () => {
    const result = architectureComponentDependencyInputSchema.safeParse({
      ...valid,
      description: "API gateway proxies to backend",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid source_component_id uuid", () => {
    const result = architectureComponentDependencyInputSchema.safeParse({
      ...valid,
      source_component_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.source_component_id,
      ).toBeDefined();
    }
  });

  it("rejects an invalid target_component_id uuid", () => {
    const result = architectureComponentDependencyInputSchema.safeParse({
      ...valid,
      target_component_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = architectureComponentDependencyInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
