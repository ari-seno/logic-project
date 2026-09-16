import { describe, expect, it } from "vitest";

import { entityInputSchema } from "@/lib/validation/entities";

const valid = {
  name: "Product",
  description: "A purchasable item",
};

describe("entityInputSchema", () => {
  it("accepts a valid entity", () => {
    const result = entityInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = entityInputSchema.safeParse({
      name: "  Product  ",
      description: "  trim me  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Product");
      expect(result.data.description).toBe("trim me");
    }
  });

  it("accepts an empty description", () => {
    const result = entityInputSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = entityInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 200 characters", () => {
    const result = entityInputSchema.safeParse({
      ...valid,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = entityInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
