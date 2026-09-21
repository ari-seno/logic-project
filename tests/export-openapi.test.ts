import { describe, expect, it } from "vitest";

import {
  apiContractToOpenApi,
  serializeOpenApi,
} from "@/lib/export/openapi";
import type { ProjectApiContract } from "@/lib/api/endpoints/queries";
import { makeBundle } from "./fixtures/project-bundle";

const GENERATED_AT = "2026-02-02T00:00:00.000Z";

function contract(overrides: Partial<ProjectApiContract> = {}): ProjectApiContract {
  return { ...makeBundle().api, ...overrides };
}

const project = {
  name: "Library Management System",
  description: "Books and loans.",
};

describe("apiContractToOpenApi", () => {
  it("produces an OpenAPI 3.1 document with info and paths", () => {
    const doc = apiContractToOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    }) as Record<string, unknown>;
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info).toMatchObject({
      title: "Library Management System",
      version: "1.0.0",
      description: "Books and loans.",
    });
    const paths = doc.paths as Record<string, Record<string, unknown>>;
    expect(Object.keys(paths)).toContain("/api/catalog/books");
    expect(Object.keys(paths["/api/catalog/books"])).toContain("get");
  });

  it("maps parameters with location, required, and typed schema", () => {
    const doc = apiContractToOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    }) as { paths: Record<string, { get: { parameters: unknown[] } }> };
    const params = doc.paths["/api/catalog/books"].get.parameters as Array<
      Record<string, unknown>
    >;
    expect(params).toHaveLength(1);
    expect(params[0]).toMatchObject({
      name: "q",
      in: "query",
      required: false,
      schema: { type: "string" },
      example: "dune",
    });
  });

  it("forces path parameters to be required", () => {
    const bundle = makeBundle();
    const param = { ...bundle.api.parameters[0], location: "path" as const, required: false };
    const doc = apiContractToOpenApi(
      contract({ parameters: [param] }),
      project,
    ) as { paths: Record<string, { get: { parameters: Array<{ required: boolean }> } }> };
    expect(doc.paths["/api/catalog/books"].get.parameters[0].required).toBe(true);
  });

  it("maps responses by status code and merges errors", () => {
    const doc = apiContractToOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    }) as {
      paths: Record<
        string,
        { get: { responses: Record<string, { description: string }> } }
      >;
    };
    const responses = doc.paths["/api/catalog/books"].get.responses;
    expect(responses["200"]).toMatchObject({ description: "Matching books" });
    expect(responses["400"].description).toContain("[INVALID_QUERY]");
  });

  it("adds security only for authenticated endpoints and declares the scheme", () => {
    const doc = apiContractToOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    }) as {
      components: { securitySchemes: Record<string, unknown> };
      paths: Record<string, Record<string, { security: unknown[] }>>;
    };
    expect(doc.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(doc.paths["/api/catalog/books"].get.security).toEqual([]);
    expect(doc.paths["/api/catalog/loans"].post.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it("omits components when no endpoint requires auth", () => {
    const doc = apiContractToOpenApi(
      contract({
        endpoints: [makeBundle().api.endpoints[0]],
      }),
      project,
    ) as Record<string, unknown>;
    expect(doc.components).toBeUndefined();
  });

  it("embeds traceability extensions per operation", () => {
    const doc = apiContractToOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    }) as {
      paths: Record<
        string,
        {
          get: {
            "x-logic-traceability": {
              entities: Array<{ entity_name: string }>;
              requirements: Array<{ title: string }>;
            };
            "x-logic-endpoint-id": string;
          };
        }
      >;
    };
    const op = doc.paths["/api/catalog/books"].get;
    expect(op["x-logic-endpoint-id"]).toBe("ep1");
    expect(op["x-logic-traceability"].entities[0].entity_name).toBe("Book");
    expect(op["x-logic-traceability"].requirements[0].title).toBe(
      "Book catalog search",
    );
  });

  it("normalizes paths that lack a leading slash", () => {
    const bundle = makeBundle();
    const endpoint = { ...bundle.api.endpoints[0], path: "books" };
    const doc = apiContractToOpenApi(
      contract({ endpoints: [endpoint] }),
      project,
    ) as { paths: Record<string, unknown> };
    expect(Object.keys(doc.paths)).toContain("/books");
  });

  it("merges multiple methods on the same path into one path item", () => {
    const bundle = makeBundle();
    const list = { ...bundle.api.endpoints[0], path: "/api/books" };
    const create = {
      ...bundle.api.endpoints[1],
      id: "ep-x",
      method: "POST" as const,
      path: "/api/books",
    };
    const doc = apiContractToOpenApi(
      contract({ endpoints: [list, create] }),
      project,
    ) as { paths: Record<string, Record<string, unknown>> };
    expect(Object.keys(doc.paths["/api/books"]).sort()).toEqual([
      "get",
      "post",
    ]);
  });

  it("serializes to valid JSON", () => {
    const json = serializeOpenApi(contract(), project, {
      generatedAt: GENERATED_AT,
    });
    expect(json).toContain('"openapi": "3.1.0"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
