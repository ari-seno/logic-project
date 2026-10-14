import { describe, expect, it } from "vitest";

import { serializeBundleJson } from "@/lib/export/bundle-json";
import { parseImportBundle } from "@/lib/import/bundle";
import { makeBundle, makeEmptyBundle } from "./fixtures/project-bundle";

describe("import/bundle parsing", () => {
  it("round-trips a serialized bundle without losing rows", () => {
    const bundle = makeBundle();
    const json = serializeBundleJson(bundle);
    const parsed = parseImportBundle(JSON.parse(json));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.bundle.project.name).toBe(bundle.project.name);
    expect(parsed.bundle.requirements).toHaveLength(bundle.requirements.length);
    expect(parsed.bundle.decisions).toHaveLength(bundle.decisions.length);
    expect(parsed.bundle.entities).toHaveLength(bundle.entities.length);
    expect(parsed.bundle.api.endpoints).toHaveLength(bundle.api.endpoints.length);
    expect(parsed.bundle.ui.screens).toHaveLength(bundle.ui.screens.length);
    expect(parsed.bundle.tasks).toHaveLength(bundle.tasks.length);
  });

  it("fills in empty sections for an empty bundle", () => {
    const parsed = parseImportBundle(makeEmptyBundle());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.bundle.requirements).toEqual([]);
    expect(parsed.bundle.architecture.components).toEqual([]);
    expect(parsed.bundle.taskLinks.uiScreens).toEqual([]);
  });

  it("rejects input that is not a bundle", () => {
    expect(parseImportBundle(null).ok).toBe(false);
    expect(parseImportBundle([1, 2, 3]).ok).toBe(false);
    expect(parseImportBundle({ project: {} }).ok).toBe(false);
    expect(parseImportBundle({ project: { name: "   " } }).ok).toBe(false);
    expect(parseImportBundle({ format: "openapi", project: { name: "x" } }).ok).toBe(
      false,
    );
  });

  it("ignores unknown envelope fields", () => {
    const parsed = parseImportBundle({
      format: "logic-project/bundle",
      version: 99,
      extra: { nested: true },
      bundle: { project: { name: "Imported" }, requirements: [{ id: "r1", title: "A" }] },
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.bundle.project.name).toBe("Imported");
    expect(parsed.bundle.requirements).toHaveLength(1);
  });
});
