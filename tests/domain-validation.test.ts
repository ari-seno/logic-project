import { describe, expect, it } from "vitest";

import { domainInputSchema } from "@/lib/validation/domains";

const valid = {
  name: "Catalog",
  description: "Product catalog domain",
};

describe("domainInputSchema", () => {
  it("accepts a valid domain", () => {
    const result = domainInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = domainInputSchema.safeParse({
      name: "  Catalog  ",
      description: "  trim me  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Catalog");
      expect(result.data.description).toBe("trim me");
    }
  });

  it("accepts an empty description", () => {
    const result = domainInputSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = domainInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects a whitespace-only name", () => {
    const result = domainInputSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 200 characters", () => {
    const result = domainInputSchema.safeParse({
      ...valid,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = domainInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
