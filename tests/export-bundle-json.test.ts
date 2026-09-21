import { describe, expect, it } from "vitest";

import {
  projectJsonFilename,
  projectToJson,
  serializeProjectJson,
} from "@/lib/export/bundle-json";
import { makeBundle, makeEmptyBundle } from "./fixtures/project-bundle";

const GENERATED_AT = "2026-02-02T00:00:00.000Z";

describe("projectToJson", () => {
  it("includes generator metadata and a summary of counts", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT });
    expect(json.generator).toBe("logic-project");
    expect(json.schema_version).toBe(1);
    expect(json.generated_at).toBe(GENERATED_AT);
    expect(json.summary).toMatchObject({
      requirements: 2,
      decisions: 1,
      domains: 1,
      entities: 2,
      attributes: 5,
      relationships: 1,
      api_groups: 1,
      api_endpoints: 2,
      ui_screens: 1,
      tasks: 2,
    });
  });

  it("nests entities and attributes under their domain", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      domain: {
        domains: Array<{
          name: string;
          entities: Array<{ name: string; attributes: unknown[] }>;
        }>;
      };
    };
    const catalog = json.domain.domains.find((d) => d.name === "Catalog")!;
    const book = catalog.entities.find((e) => e.name === "Book")!;
    expect(book.attributes).toHaveLength(3);
  });

  it("resolves relationship endpoint names", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      domain: {
        relationships: Array<{
          source: { name: string };
          target: { name: string };
        }>;
      };
    };
    expect(json.domain.relationships[0]).toMatchObject({
      source: { name: "Member" },
      target: { name: "Book" },
    });
  });

  it("surfaces an orphan domain bucket when entities lack a domain", () => {
    const bundle = makeBundle();
    bundle.domains = [];
    const json = projectToJson(bundle, { generatedAt: GENERATED_AT }) as {
      domain: { domains: Array<{ id: string | null; entities: unknown[] }> };
    };
    expect(json.domain.domains).toHaveLength(1);
    expect(json.domain.domains[0].id).toBeNull();
    expect(json.domain.domains[0].entities).toHaveLength(2);
  });

  it("includes API endpoints with their group and traceability", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      api: {
        endpoints: Array<{
          name: string;
          group: { name: string } | null;
          parameters: unknown[];
          responses: Array<{ status_code: number }>;
          errors: Array<{ code: string }>;
          traceability: {
            entities: Array<{ name: string }>;
            requirements: Array<{ title: string }>;
          };
        }>;
      };
    };
    const search = json.api.endpoints.find((e) => e.name === "Search books")!;
    expect(search.group).toMatchObject({ name: "Catalog" });
    expect(search.parameters).toHaveLength(1);
    expect(search.responses[0].status_code).toBe(200);
    expect(search.errors[0].code).toBe("INVALID_QUERY");
    expect(search.traceability.entities[0].name).toBe("Book");
    expect(search.traceability.requirements[0].title).toBe(
      "Book catalog search",
    );
  });

  it("nests UI screens with components, forms, states and interactions", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      ui: {
        screens: Array<{
          name: string;
          components: Array<{ name: string }>;
          forms: Array<{ name: string; fields: unknown[] }>;
          states: Array<{ name: string }>;
          interactions: Array<{ endpoints: Array<{ method: string }> }>;
        }>;
      };
    };
    const screen = json.ui.screens[0];
    expect(screen.name).toBe("Book list");
    expect(screen.components[0].name).toBe("BookCard");
    expect(screen.forms[0].fields).toHaveLength(1);
    expect(screen.states[0].name).toBe("Empty");
    expect(screen.interactions[0].endpoints[0].method).toBe("GET");
  });

  it("resolves task traceability links to titles", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      tasks: Array<{
        title: string;
        parent: { title: string } | null;
        traceability: {
          requirements: Array<{ title: string }>;
          decisions: Array<{ title: string }>;
          entities: Array<{ name: string }>;
          architecture_components: Array<{ name: string }>;
          api_endpoints: Array<{ path: string }>;
          ui_screens: Array<{ name: string }>;
        };
      }>;
    };
    const task = json.tasks.find((t) => t.title === "Build catalog search")!;
    expect(task.traceability.requirements[0].title).toBe("Book catalog search");
    expect(task.traceability.decisions[0].title).toBe("Use PostgreSQL");
    expect(task.traceability.entities[0].name).toBe("Book");
    expect(task.traceability.architecture_components[0].name).toBe("Web API");
    expect(task.traceability.api_endpoints[0].path).toBe("/api/catalog/books");
    expect(task.traceability.ui_screens[0].name).toBe("Book list");
  });

  it("nests child tasks under their parent reference", () => {
    const json = projectToJson(makeBundle(), { generatedAt: GENERATED_AT }) as {
      tasks: Array<{ title: string; parent: { title: string } | null }>;
    };
    const child = json.tasks.find((t) => t.title === "Add search index")!;
    expect(child.parent).toMatchObject({ title: "Build catalog search" });
  });

  it("handles an empty bundle", () => {
    const json = projectToJson(makeEmptyBundle(), { generatedAt: GENERATED_AT });
    expect(json.summary).toMatchObject({
      requirements: 0,
      entities: 0,
      tasks: 0,
    });
    expect(
      (json.domain as { domains: unknown[] }).domains,
    ).toHaveLength(0);
  });

  it("serializes to valid JSON", () => {
    const json = serializeProjectJson(makeBundle(), {
      generatedAt: GENERATED_AT,
    });
    expect(json).toContain('"generator": "logic-project"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("projectJsonFilename", () => {
  it("slugifies the project name", () => {
    expect(projectJsonFilename("Library Management System")).toBe(
      "library-management-system.json",
    );
    expect(projectJsonFilename("")).toBe("project.json");
  });
});
