import { describe, expect, it } from "vitest";

import {
  architectureDependencyDedupeKey,
  buildArchitectureComponentRow,
  buildArchitectureDecisionRow,
  buildArchitectureDependencyRow,
  buildArchitectureTechnologyRow,
} from "@/lib/ai/apply";

const SOURCE_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";

describe("ai/apply architecture row builders", () => {
  it("maps a component item and turns an empty description into null", () => {
    const row = buildArchitectureComponentRow({
      name: "  Payments API  ",
      type: "backend",
      description: "",
      depends_on: [],
    });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Payments API");
    expect(row?.type).toBe("backend");
    expect(row?.description).toBeNull();
  });

  it("rejects a component item with a blank name", () => {
    const row = buildArchitectureComponentRow({
      name: "   ",
      type: "backend",
      description: "x",
      depends_on: [],
    });

    expect(row).toBeNull();
  });

  it("rejects a component item with an unsupported type", () => {
    const row = buildArchitectureComponentRow({
      name: "Mobile App",
      type: "mobile" as never,
      description: "",
      depends_on: [],
    });

    expect(row).toBeNull();
  });

  it("maps a technology item onto the column shape", () => {
    const row = buildArchitectureTechnologyRow({
      name: "PostgreSQL",
      category: "database",
      description: "Primary datastore.",
    });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("PostgreSQL");
    expect(row?.category).toBe("database");
    expect(row?.description).toBe("Primary datastore.");
  });

  it("rejects a technology item with an unsupported category", () => {
    const row = buildArchitectureTechnologyRow({
      name: "Something",
      category: "magic" as never,
      description: "",
    });

    expect(row).toBeNull();
  });

  it("maps a decision item and always proposes it", () => {
    const row = buildArchitectureDecisionRow({
      title: "Use PostgreSQL",
      context: "",
      decision: "Adopt a relational store.",
      rationale: "",
    });

    expect(row).not.toBeNull();
    expect(row?.title).toBe("Use PostgreSQL");
    expect(row?.status).toBe("proposed");
    expect(row?.context).toBeNull();
    expect(row?.rationale).toBeNull();
  });

  it("rejects a decision item without a decision body", () => {
    const row = buildArchitectureDecisionRow({
      title: "Use PostgreSQL",
      context: "",
      decision: "",
      rationale: "",
    });

    expect(row).toBeNull();
  });

  it("maps a dependency item onto the column shape", () => {
    const row = buildArchitectureDependencyRow(
      { target_component: "Ledger DB", description: "" },
      SOURCE_ID,
      TARGET_ID,
    );

    expect(row).not.toBeNull();
    expect(row?.source_component_id).toBe(SOURCE_ID);
    expect(row?.target_component_id).toBe(TARGET_ID);
    expect(row?.description).toBeNull();
  });

  it("rejects a dependency item whose endpoints are not uuids", () => {
    const row = buildArchitectureDependencyRow(
      { target_component: "Ledger DB", description: "" },
      "not-a-uuid",
      TARGET_ID,
    );

    expect(row).toBeNull();
  });

  it("builds a stable de-duplication key per endpoint pair", () => {
    expect(architectureDependencyDedupeKey(SOURCE_ID, TARGET_ID)).toBe(
      `${SOURCE_ID}|${TARGET_ID}`,
    );
    expect(architectureDependencyDedupeKey(SOURCE_ID, TARGET_ID)).not.toBe(
      architectureDependencyDedupeKey(TARGET_ID, SOURCE_ID),
    );
  });
});
