import { describe, expect, it } from "vitest";

import {
  uiComponentDedupeKey,
  uiScreenComponentDedupeKey,
  uiScreenDedupeKey,
  uiScreenEntityLinkDedupeKey,
  uiScreenRequirementLinkDedupeKey,
  buildUiComponentRow,
  buildUiPlacementRow,
  buildUiScreenRow,
} from "@/lib/ai/apply";

const SCREEN_ID = "11111111-1111-4111-8111-111111111111";
const COMPONENT_ID = "22222222-2222-4222-8222-222222222222";
const PARENT_ID = "33333333-3333-4333-8333-333333333333";
const ENTITY_ID = "44444444-4444-4444-8444-444444444444";
const REQUIREMENT_ID = "55555555-5555-4555-8555-555555555555";

describe("ai/apply ui row builders", () => {
  it("maps a screen item and turns empty text into null", () => {
    const row = buildUiScreenRow({
      name: "  Loan detail  ",
      route: "",
      screen_type: "detail",
      description: "",
      purpose: "",
      authentication_required: true,
      placements: [],
      entities: [],
      requirement_titles: [],
    });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Loan detail");
    expect(row?.route).toBeNull();
    expect(row?.screen_type).toBe("detail");
    expect(row?.description).toBeNull();
    expect(row?.purpose).toBeNull();
    expect(row?.authentication_required).toBe(true);
  });

  it("rejects a screen item with a blank name", () => {
    const row = buildUiScreenRow({
      name: "   ",
      route: "",
      screen_type: "page",
      description: "",
      purpose: "",
      authentication_required: false,
      placements: [],
      entities: [],
      requirement_titles: [],
    });

    expect(row).toBeNull();
  });

  it("maps a component item onto the column shape", () => {
    const row = buildUiComponentRow({
      name: "Loan table",
      component_type: "table",
      description: "Lists loans.",
      purpose: "",
      technology: "",
    });

    expect(row).not.toBeNull();
    expect(row?.component_type).toBe("table");
    expect(row?.description).toBe("Lists loans.");
    expect(row?.purpose).toBeNull();
    expect(row?.technology).toBeNull();
  });

  it("rejects a component item with an unsupported type", () => {
    const row = buildUiComponentRow({
      name: "Fancy",
      component_type: "hologram" as never,
      description: "",
      purpose: "",
      technology: "",
    });

    expect(row).toBeNull();
  });

  it("maps a placement item and rejects an empty one", () => {
    const row = buildUiPlacementRow(
      {
        component_name: "Loan table",
        label: " Recent loans ",
        description: "",
        required: true,
        parent_label: "",
      },
      SCREEN_ID,
      COMPONENT_ID,
      PARENT_ID,
    );

    expect(row).not.toBeNull();
    expect(row?.screen_id).toBe(SCREEN_ID);
    expect(row?.component_id).toBe(COMPONENT_ID);
    expect(row?.parent_id).toBe(PARENT_ID);
    expect(row?.label).toBe("Recent loans");
    expect(row?.description).toBeNull();
    expect(row?.required).toBe(true);

    const empty = buildUiPlacementRow(
      {
        component_name: "Loan table",
        label: "",
        description: "",
        required: false,
        parent_label: "",
      },
      SCREEN_ID,
      COMPONENT_ID,
      null,
    );

    expect(empty).toBeNull();
  });

  it("builds stable de-duplication keys", () => {
    expect(uiScreenDedupeKey("  Loan Detail ")).toBe("loan detail");
    expect(uiComponentDedupeKey("Loan table")).toBe("loan table");
    expect(
      uiScreenComponentDedupeKey(SCREEN_ID, COMPONENT_ID, " Recent Loans "),
    ).toBe(`${SCREEN_ID}|${COMPONENT_ID}|recent loans`);
    expect(uiScreenEntityLinkDedupeKey(SCREEN_ID, ENTITY_ID, "displayed")).toBe(
      `${SCREEN_ID}|${ENTITY_ID}|displayed`,
    );
    expect(
      uiScreenRequirementLinkDedupeKey(SCREEN_ID, REQUIREMENT_ID),
    ).toBe(`${SCREEN_ID}|${REQUIREMENT_ID}`);
  });
});
