import { describe, expect, it } from "vitest";

import { decisionInputSchema } from "@/lib/validation/decisions";

const valid = {
  title: "Choose database",
  context: "We need relational data.",
  decision: "PostgreSQL",
  rationale: "It provides the relational model.",
  status: "accepted" as const,
};

describe("decisionInputSchema", () => {
  it("accepts a valid decision", () => {
    const result = decisionInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from all string fields", () => {
    const result = decisionInputSchema.safeParse({
      title: "  T  ",
      context: "  C  ",
      decision: "  D  ",
      rationale: "  R  ",
      status: "proposed",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("T");
      expect(result.data.context).toBe("C");
      expect(result.data.decision).toBe("D");
      expect(result.data.rationale).toBe("R");
    }
  });

  it("accepts empty optional context and rationale", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      context: "",
      rationale: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = decisionInputSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it("rejects a whitespace-only title", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty decision", () => {
    const result = decisionInputSchema.safeParse({ ...valid, decision: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.decision).toBeDefined();
    }
  });

  it("rejects a title longer than 200 characters", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a decision longer than 2000 characters", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      decision: "d".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a context longer than 5000 characters", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      context: "c".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a rationale longer than 5000 characters", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      rationale: "r".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = decisionInputSchema.safeParse({
      ...valid,
      status: "bogus",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeDefined();
    }
  });

  it("accepts all valid status values", () => {
    for (const status of ["proposed", "accepted", "superseded"] as const) {
      const result = decisionInputSchema.safeParse({ ...valid, status });
      expect(result.success).toBe(true);
    }
  });
});
