import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildExportFile, EXPORT_FORMATS } from "@/lib/export/download";
import { buildExportArchive } from "@/lib/export/zip";
import { makeBundle } from "./fixtures/project-bundle";

describe("export/zip archive", () => {
  it("packs every export format plus a readme", () => {
    const bundle = makeBundle();
    const archive = buildExportArchive(bundle, {
      generatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(archive.contentType).toBe("application/zip");
    expect(archive.filename.endsWith("-export.zip")).toBe(true);
    expect(archive.content.byteLength).toBeGreaterThan(0);

    const entries = unzipSync(archive.content);
    const names = Object.keys(entries);

    for (const format of EXPORT_FORMATS) {
      const expected = buildExportFile(bundle, format).filename;
      expect(names, `missing entry ${expected}`).toContain(expected);
      expect(entries[expected].byteLength).toBeGreaterThan(0);
    }

    expect(names).toContain("README.md");
  });

  it("uses a slugified archive name", () => {
    const bundle = makeBundle();
    const archive = buildExportArchive(bundle);

    expect(archive.filename).toMatch(/^[a-z0-9-]+-export\.zip$/);
  });
});

