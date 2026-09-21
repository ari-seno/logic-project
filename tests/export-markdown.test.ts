import { describe, expect, it } from "vitest";

import { projectToMarkdown } from "@/lib/export/markdown";
import { makeBundle, makeEmptyBundle } from "./fixtures/project-bundle";

const GENERATED_AT = "2026-02-02T00:00:00.000Z";

describe("projectToMarkdown", () => {
  it("renders the project title and description", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("# Library Management System");
    expect(md).toContain("A system to manage books and loans.");
    expect(md).toContain(`_Generated ${GENERATED_AT} by Logic Project._`);
  });

  it("groups requirements into functional and non-functional", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## Requirements");
    expect(md).toContain("### Functional");
    expect(md).toContain("### Non-functional");
    expect(md).toContain("#### Book catalog search");
    expect(md).toContain("`high` · `approved` · `functional`");
    expect(md).toContain("#### Search p95 under 300ms");
  });

  it("renders decisions with context, decision, and rationale", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## Decisions");
    expect(md).toContain("### Use PostgreSQL");
    expect(md).toContain("**Context:** Need a relational store.");
    expect(md).toContain("**Decision:** Adopt PostgreSQL.");
    expect(md).toContain("**Rationale:** Strong relational guarantees.");
  });

  it("renders the domain model with entity attribute tables", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## Domain model");
    expect(md).toContain("### Catalog");
    expect(md).toContain("#### Book");
    expect(md).toContain(
      "| Attribute | Type | Required | PK | Default | Description |",
    );
    expect(md).toContain("| title | string | yes | no | — | Book title |");
    expect(md).toContain("### Relationships");
    expect(md).toContain("| loans | Member | Book | one_to_many |");
  });

  it("renders architecture components and resolved dependencies", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## Architecture");
    expect(md).toContain("### Components");
    expect(md).toContain("### Dependencies");
    expect(md).toContain("| Web API | PostgreSQL | Reads and writes through SQL. |");
    expect(md).toContain("### Technologies");
  });

  it("renders API endpoints with parameters, responses, errors and traceability", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("### `GET /api/catalog/books`");
    expect(md).toContain("group: Catalog");
    expect(md).toContain("auth: public");
    expect(md).toContain("**Parameters**");
    expect(md).toContain("| q | query | string | no | Search term |");
    expect(md).toContain("**Responses**");
    expect(md).toContain("**Errors**");
    expect(md).toContain("**Entities:** Book");
    expect(md).toContain("**Requirements:** Book catalog search");
  });

  it("renders UI screens with placements and form fields", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## UI");
    expect(md).toContain("### Book list");
    expect(md).toContain("**Components**");
    expect(md).toContain("**Forms**");
    expect(md).toContain("| Search | text | no |");
    expect(md).toContain("### Component library");
    expect(md).toContain("### Navigation");
  });

  it("renders tasks with checkboxes, nesting, and traceability", () => {
    const md = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(md).toContain("## Tasks");
    expect(md).toContain("- [ ] Build catalog search `in_progress`");
    expect(md).toContain("  - [ ] Add search index `todo`");
    expect(md).toContain("**Traceability:** req: Book catalog search");
    expect(md).toContain("### Task dependencies");
  });

  it("renders only the header for an empty bundle", () => {
    const md = projectToMarkdown(makeEmptyBundle(), {
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("# Library Management System");
    expect(md).not.toContain("## Requirements");
    expect(md).not.toContain("## Contents");
  });

  it("is deterministic for the same input", () => {
    const a = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    const b = projectToMarkdown(makeBundle(), { generatedAt: GENERATED_AT });
    expect(a).toBe(b);
  });

  it("escapes pipe characters inside table cells", () => {
    const bundle = makeBundle();
    bundle.attributes = bundle.attributes.map((a) =>
      a.id === "attr2" ? { ...a, description: "has | pipe" } : a,
    );
    const md = projectToMarkdown(bundle, { generatedAt: GENERATED_AT });
    expect(md).toContain("has \\| pipe");
  });
});
