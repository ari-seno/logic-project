import { describe, expect, it } from "vitest";

import {
  buildUiDetailBundle,
  buildUiDetailFieldRow,
  buildUiDetailNavigationRow,
} from "@/lib/ai/apply";

describe("ai/apply ui-detail row builders", () => {
  it("maps a field item and turns empty text into null", () => {
    const row = buildUiDetailFieldRow({
      name: "  Amount  ",
      label: "  Loan amount  ",
      field_type: "number",
      required: true,
      placeholder: "",
      help_text: "",
      default_value: "",
    });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Amount");
    expect(row?.label).toBe("Loan amount");
    expect(row?.field_type).toBe("number");
    expect(row?.required).toBe(true);
    expect(row?.placeholder).toBeNull();
    expect(row?.help_text).toBeNull();
    expect(row?.default_value).toBeNull();
  });

  it("rejects a field item with a blank name", () => {
    const row = buildUiDetailFieldRow({
      name: "   ",
      label: "Amount",
      field_type: "text",
      required: false,
      placeholder: "",
      help_text: "",
      default_value: "",
    });

    expect(row).toBeNull();
  });

  it("maps a navigation item and rejects a blank label", () => {
    const row = buildUiDetailNavigationRow({
      name: "loans",
      label: "  Loans  ",
      route: "/loans",
      description: "",
      parent_label: "",
      screen_names: ["Loan List"],
    });

    expect(row).not.toBeNull();
    expect(row?.label).toBe("Loans");
    expect(row?.description).toBeNull();

    const blank = buildUiDetailNavigationRow({
      name: "loans",
      label: "   ",
      route: "/loans",
      description: "",
      parent_label: "",
      screen_names: [],
    });

    expect(blank).toBeNull();
  });
});

describe("ai/apply ui-detail bundle builder", () => {
  const screen = {
    kind: "screen" as const,
    screen_name: "Loan List",
    forms: [
      {
        name: "Filter form",
        description: "Filter loans",
        submit_label: "Apply",
        success_behavior: "",
        fields: [
          {
            name: "status",
            label: "Status",
            field_type: "select" as const,
            required: false,
            placeholder: "",
            help_text: "",
            default_value: "",
          },
        ],
      },
    ],
    states: [
      {
        name: "Loading state",
        state_type: "loading" as const,
        description: "Spinner",
        behavior: "",
      },
    ],
    interactions: [
      {
        name: "Submit filter",
        trigger: "Filter submitted",
        action: "Reload the list",
        description: "",
        endpoint_labels: ["GET /loans"],
      },
    ],
  };
  const navigation = {
    kind: "navigation" as const,
    name: "loans",
    label: "Loans",
    route: "/loans",
    description: "",
    parent_label: "",
    screen_names: ["Loan List"],
  };

  it("splits items by kind and keeps their original indices", () => {
    const { screens, navigation: nav, skipped } = buildUiDetailBundle(
      [screen, navigation],
      [0, 1],
    );

    expect(skipped).toEqual([]);
    expect(screens[0]?.index).toBe(0);
    expect(screens[0]?.screen_name).toBe("Loan List");
    expect(screens[0]?.forms[0]?.name).toBe("Filter form");
    expect(screens[0]?.forms[0]?.fields[0]?.field_type).toBe("select");
    expect(screens[0]?.states[0]?.state_type).toBe("loading");
    expect(screens[0]?.interactions[0]?.endpoint_labels).toEqual([
      "GET /loans",
    ]);
    expect(nav[0]?.index).toBe(1);
    expect(nav[0]?.label).toBe("Loans");
    expect(nav[0]?.screen_names).toEqual(["Loan List"]);
  });

  it("ignores out-of-range, duplicate and non-integer indices", () => {
    const { screens, navigation: nav } = buildUiDetailBundle(
      [screen, navigation],
      [0, 5, -1, 1.5, 1, 1],
    );

    expect(screens).toHaveLength(1);
    expect(nav).toHaveLength(1);
  });

  it("reports an invalid screen item as skipped", () => {
    const { screens, skipped } = buildUiDetailBundle(
      [{ ...screen, screen_name: "   " }],
      [0],
    );

    expect(screens).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.kind).toBe("skipped");
    expect(skipped[0]?.kind === "skipped" ? skipped[0].reason : null).toBe(
      "invalid",
    );
  });
});
