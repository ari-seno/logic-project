import { describe, expect, it } from "vitest";

import { relationshipInputSchema } from "@/lib/validation/relationships";

const valid = {
  source_entity_id: "11111111-1111-4111-8111-111111111111",
  target_entity_id: "22222222-2222-4222-8222-222222222222",
  relationship_type: "one_to_many" as const,
  name: "",
  description: "",
};

describe("relationshipInputSchema", () => {
  it("accepts a valid relationship", () => {
    const result = relationshipInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts a relationship with name and description", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      name: "has many",
      description: "Customer has many orders",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid source_entity_id uuid", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      source_entity_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.source_entity_id,
      ).toBeDefined();
    }
  });

  it("rejects an invalid target_entity_id uuid", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      target_entity_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown relationship_type", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      relationship_type: "circular" as never,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.relationship_type,
      ).toBeDefined();
    }
  });

  it("accepts every documented relationship_type", () => {
    const types = [
      "one_to_one",
      "one_to_many",
      "many_to_one",
      "many_to_many",
    ] as const;
    for (const relationship_type of types) {
      const result = relationshipInputSchema.safeParse({
        ...valid,
        relationship_type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a name longer than 200 characters", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      name: "n".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = relationshipInputSchema.safeParse({
      ...valid,
      description: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
