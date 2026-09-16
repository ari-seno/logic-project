import { describe, expect, it } from "vitest";

import {
  buildArchitectureMermaid,
  buildErdMermaid,
} from "@/lib/diagrams/mermaid";

describe("buildErdMermaid", () => {
  it("returns empty string when no entities", () => {
    const chart = buildErdMermaid([], [], []);
    expect(chart).toBe("");
  });

  it("emits erDiagram header and an entity block", () => {
    const chart = buildErdMermaid(
      [{ id: "e1", name: "Book", description: null }],
      [],
      [],
    );
    expect(chart).toContain("erDiagram");
    expect(chart).toContain("Book {");
    expect(chart).toContain("}");
  });

  it("includes attributes with PK marker", () => {
    const chart = buildErdMermaid(
      [{ id: "e1", name: "Book", description: null }],
      [
        {
          id: "a1",
          entity_id: "e1",
          name: "id",
          data_type: "uuid",
          is_primary_key: true,
          is_required: true,
        },
        {
          id: "a2",
          entity_id: "e1",
          name: "title",
          data_type: "string",
          is_primary_key: false,
          is_required: false,
        },
      ],
      [],
    );
    expect(chart).toContain("uuid id PK");
    expect(chart).toContain("string title");
  });

  it("emits relationship arrow with cardinality", () => {
    const chart = buildErdMermaid(
      [
        { id: "m", name: "Member", description: null },
        { id: "l", name: "Loan", description: null },
      ],
      [],
      [
        {
          id: "r1",
          name: "borrows",
          source_entity_id: "m",
          target_entity_id: "l",
          relationship_type: "one → to → many",
        },
      ],
    );
    expect(chart).toContain("Member ||--o{ Loan");
    expect(chart).toContain('"borrows"');
  });

  it("escapes quotes in descriptions", () => {
    const chart = buildErdMermaid(
      [{ id: "e1", name: "Book", description: 'has "edge" cases' }],
      [
        {
          id: "a1",
          entity_id: "e1",
          name: "title",
          data_type: "string",
          is_primary_key: false,
          is_required: false,
        },
      ],
      [],
    );
    expect(chart).toContain("Book");
    expect(chart).toContain("string title");
  });
});

describe("buildArchitectureMermaid", () => {
  it("returns empty string when no components", () => {
    expect(buildArchitectureMermaid([], [])).toBe("");
  });

  it("groups components by type into subgraphs", () => {
    const chart = buildArchitectureMermaid(
      [
        { id: "a", name: "Web", type: "frontend" },
        { id: "b", name: "DB", type: "database" },
      ],
      [],
    );
    expect(chart).toContain("flowchart LR");
    expect(chart).toContain("subgraph FRONTEND");
    expect(chart).toContain("subgraph DATABASE");
    expect(chart).toContain('a["Web"]');
  });

  it("emits dependency arrows", () => {
    const chart = buildArchitectureMermaid(
      [
        { id: "a", name: "Web", type: "frontend" },
        { id: "b", name: "API", type: "backend" },
      ],
      [{ id: "d1", source_component_id: "a", target_component_id: "b" }],
    );
    expect(chart).toContain("a --> b");
  });
});
