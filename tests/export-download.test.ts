import { describe, expect, it } from "vitest";

import {
  buildExportFile,
  EXPORT_FORMATS,
  isExportFormat,
} from "@/lib/export/download";
import { makeBundle, makeEmptyBundle } from "@/tests/fixtures/project-bundle";

const GENERATED_AT = "2026-01-01T00:00:00.000Z";
const SLUG = "library-management-system";

describe("isExportFormat", () => {
  it("accepts every supported format", () => {
    for (const format of EXPORT_FORMATS) {
      expect(isExportFormat(format)).toBe(true);
    }
  });

  it("rejects unknown, empty, and non-string values", () => {
    expect(isExportFormat("pdf")).toBe(false);
    expect(isExportFormat("")).toBe(false);
    expect(isExportFormat(null)).toBe(false);
    expect(isExportFormat(undefined)).toBe(false);
    expect(isExportFormat(3)).toBe(false);
  });

  it("exposes the five documented formats", () => {
    expect([...EXPORT_FORMATS]).toEqual([
      "md",
      "json",
      "openapi",
      "sql",
      "mermaid",
    ]);
  });
});

describe("buildExportFile", () => {
  it("builds the markdown download", () => {
    const file = buildExportFile(makeBundle(), "md", {
      generatedAt: GENERATED_AT,
    });
    expect(file.format).toBe("md");
    expect(file.filename).toBe(`${SLUG}.md`);
    expect(file.contentType).toBe("text/markdown; charset=utf-8");
    expect(file.content).toContain("# Library Management System");
    expect(file.content).toContain(`_Generated ${GENERATED_AT} by Logic Project._`);
  });

  it("builds the project json download", () => {
    const file = buildExportFile(makeBundle(), "json", {
      generatedAt: GENERATED_AT,
    });
    expect(file.filename).toBe(`${SLUG}.json`);
    expect(file.contentType).toBe("application/json; charset=utf-8");
    const parsed = JSON.parse(file.content);
    expect(parsed.generator).toBe("logic-project");
    expect(parsed.schema_version).toBe(1);
    expect(parsed.generated_at).toBe(GENERATED_AT);
    expect(parsed.project.name).toBe("Library Management System");
  });

  it("builds the openapi download from the api contract", () => {
    const file = buildExportFile(makeBundle(), "openapi", {
      generatedAt: GENERATED_AT,
    });
    expect(file.filename).toBe(`${SLUG}.openapi.json`);
    expect(file.contentType).toBe("application/json; charset=utf-8");
    const parsed = JSON.parse(file.content);
    expect(parsed.openapi).toBe("3.1.0");
    expect(parsed.info.title).toBe("Library Management System");
    expect(Object.keys(parsed.paths)).toContain("/api/catalog/books");
  });

  it("builds the sql download from the domain model", () => {
    const file = buildExportFile(makeBundle(), "sql", {
      generatedAt: GENERATED_AT,
    });
    expect(file.filename).toBe(`${SLUG}.sql`);
    expect(file.contentType).toBe("application/sql; charset=utf-8");
    expect(file.content).toContain("CREATE TABLE");
  });

  it("prefers the architecture flowchart for mermaid", () => {
    const file = buildExportFile(makeBundle(), "mermaid", {
      generatedAt: GENERATED_AT,
    });
    expect(file.filename).toBe(`${SLUG}.mmd`);
    expect(file.contentType).toBe("text/plain; charset=utf-8");
    expect(file.content).toContain("flowchart LR");
    expect(file.content).not.toContain("erDiagram");
  });

  it("falls back to the entity diagram when there are no components", () => {
    const bundle = makeBundle({
      architecture: {
        components: [],
        technologies: [],
        decisions: [],
        dependencies: [],
      },
    });
    const file = buildExportFile(bundle, "mermaid", { generatedAt: GENERATED_AT });
    expect(file.content).toContain("erDiagram");
  });

  it("emits a placeholder when nothing can be diagrammed", () => {
    const file = buildExportFile(makeEmptyBundle(), "mermaid", {
      generatedAt: GENERATED_AT,
    });
    expect(file.content).toBe(
      "%% No diagrams available for this project yet.",
    );
  });

  it("slugifies the project name into the filename", () => {
    const bundle = makeBundle({
      project: { ...makeBundle().project, name: "Café & Bar!!" },
    });
    expect(buildExportFile(bundle, "md").filename).toBe("caf-bar.md");
  });

  it("falls back to the project slug for an unslugable name", () => {
    const bundle = makeBundle({
      project: { ...makeBundle().project, name: "***" },
    });
    expect(buildExportFile(bundle, "md").filename).toBe("project.md");
  });
});
