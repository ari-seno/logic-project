import { describe, expect, it } from "vitest";

import { attributeInputSchema } from "@/lib/validation/attributes";

const valid = {
  name: "price",
  data_type: "decimal" as const,
  is_required: false,
  is_primary_key: false,
  default_value: "",
  description: "",
};

describe("attributeInputSchema", () => {
  it("accepts a valid attribute", () => {
    const result = attributeInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = attributeInputSchema.safeParse({
      ...valid,
      name: "  price  ",
      description: "  amount in USD  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("price");
      expect(result.data.description).toBe("amount in USD");
    }
  });

  it("accepts an empty description", () => {
    const result = attributeInputSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty default value", () => {
    const result = attributeInputSchema.safeParse({ ...valid, default_value: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = attributeInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown data_type", () => {
    const result = attributeInputSchema.safeParse({
      ...valid,
      data_type: "blob" as never,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.data_type).toBeDefined();
    }
  });

  it("accepts every documented data type", () => {
    const types = [
      "uuid",
      "string",
      "text",
      "integer",
      "decimal",
      "boolean",
      "date",
      "datetime",
      "json",
    ] as const;
    for (const data_type of types) {
      const result = attributeInputSchema.safeParse({ ...valid, data_type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a default_value longer than 500 characters", () => {
    const result = attributeInputSchema.safeParse({
      ...valid,
      default_value: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = attributeInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts undefined description and default_value (FormData empty submit)", () => {
    const result = attributeInputSchema.safeParse({
      name: "isbn",
      data_type: "string" as const,
      is_required: false,
      is_primary_key: false,
      default_value: undefined,
      description: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects null for description and default_value (regression for emptyToNull helper)", () => {
    const result = attributeInputSchema.safeParse({
      ...valid,
      default_value: null as unknown as string,
      description: null as unknown as string,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.default_value).toBeDefined();
      expect(result.error.flatten().fieldErrors.description).toBeDefined();
    }
  });
});
