import { describe, expect, it } from "vitest";

import { architectureDecisionInputSchema } from "@/lib/validation/architecture/decisions";

const valid = {
  title: "Use Postgres",
  context: "Need relational data",
  decision: "Postgres",
  rationale: "Best fit",
  status: "accepted" as const,
};

describe("architectureDecisionInputSchema", () => {
  it("accepts a valid decision", () => {
    const result = architectureDecisionInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from all fields", () => {
    const result = architectureDecisionInputSchema.safeParse({
      title: "  Use Postgres  ",
      context: "  trim me  ",
      decision: "  Postgres  ",
      rationale:  "  trim me too  ",
      status: "accepted",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Use Postgres");
      expect(result.data.context).toBe("trim me");
      expect(result.data.decision).toBe("Postgres");
      expect(result.data.rationale).toBe("trim me too");
    }
  });

  it("accepts an empty context and rationale", () => {
    const result = architectureDecisionInputSchema.safeParse({
      ...valid,
      context: "",
      rationale: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = architectureDecisionInputSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty decision", () => {
    const result = architectureDecisionInputSchema.safeParse({ ...valid, decision: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = architectureDecisionInputSchema.safeParse({
      ...valid,
      status: "maybe" as never,
    });
    expect(result.success).toBe(false);
  });

  it("accepts every documented status", () => {
    const statuses = ["proposed", "accepted", "superseded"] as const;
    for (const status of statuses) {
      const result = architectureDecisionInputSchema.safeParse({ ...valid, status });
      expect(result.success).toBe(true);
    }
  });
});
