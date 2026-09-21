import { describe, expect, it } from "vitest";

import { buildDecisionInsert } from "@/lib/ai/apply";

describe("ai/apply buildDecisionInsert", () => {
  it("maps a valid AI item to a proposed decision row", () => {
    const result = buildDecisionInsert(
      {
        title: "Use PostgreSQL",
        context: "We need relational integrity for loans.",
        decision: "Adopt PostgreSQL as the primary datastore.",
        rationale: "Strong constraints and mature tooling beat document stores here.",
      },
      "project-1",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.project_id).toBe("project-1");
    expect(result.row.title).toBe("Use PostgreSQL");
    expect(result.row.status).toBe("proposed");
    expect(result.row.context).toBe("We need relational integrity for loans.");
    expect(result.row.decision).toBe("Adopt PostgreSQL as the primary datastore.");
    expect(result.row.rationale).toContain("document stores");
  });

  it("turns empty optional fields into null", () => {
    const result = buildDecisionInsert(
      {
        title: "Adopt REST",
        context: "",
        decision: "Expose REST endpoints.",
        rationale: "",
      },
      "project-1",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.context).toBeNull();
    expect(result.row.rationale).toBeNull();
  });

  it("rejects an empty decision body", () => {
    const result = buildDecisionInsert(
      { title: "Bad item", context: "", decision: "", rationale: "" },
      "project-1",
    );
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an empty title", () => {
    const result = buildDecisionInsert(
      { title: "", context: "", decision: "Do it.", rationale: "" },
      "project-1",
    );
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a decision body that exceeds the column bound", () => {
    const result = buildDecisionInsert(
      {
        title: "Too long",
        context: "",
        decision: "y".repeat(2001),
        rationale: "",
      },
      "project-1",
    );
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });
});
