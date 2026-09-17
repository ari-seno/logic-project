import { describe, expect, it } from "vitest";

import {
  apiContractToJson,
  jsonFilename,
  MAX_JSON_CHARS,
  prepareJsonBlock,
  serializeApiContract,
  summarizeApiContract,
} from "@/lib/export/api";
import type { ProjectApiContract } from "@/lib/api/endpoints/queries";

function makeContract(
  partial: Partial<ProjectApiContract> = {},
): ProjectApiContract {
  return {
    groups: [],
    endpoints: [],
    parameters: [],
    requestBodies: [],
    responses: [],
    errors: [],
    endpointEntities: [],
    endpointRequirements: [],
    ...partial,
  };
}

describe("apiContractToJson", () => {
  it("returns valid JSON with openapi header for empty contract", () => {
    const json = apiContractToJson(makeContract());
    expect(json.openapi).toBe("3.0.3");
    expect(json.paths).toEqual([]);
  });

  it("groups endpoints under their group, even ungrouped ones", () => {
    const json = apiContractToJson(
      makeContract({
        groups: [
          {
            id: "g1",
            project_id: "p",
            name: "Auth",
            description: null,
            prefix: "/api/auth",
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        endpoints: [
          {
            id: "e1",
            project_id: "p",
            group_id: "g1",
            name: "Login",
            method: "POST",
            path: "/api/auth/login",
            summary: "Sign in",
            description: null,
            authentication_required: false,
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
          {
            id: "e2",
            project_id: "p",
            group_id: null,
            name: "Health",
            method: "GET",
            path: "/healthz",
            summary: null,
            description: null,
            authentication_required: false,
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
      }),
    );
    expect(json.paths).toHaveLength(2);
    const auth = json.paths.find((p) => p.endpoint_id === "e1")!;
    const health = json.paths.find((p) => p.endpoint_id === "e2")!;
    expect(auth.group).toBe("Auth");
    expect(auth.prefix).toBe("/api/auth");
    expect(auth.method).toBe("POST");
    expect(health.group).toBeNull();
  });

  it("inlines parameters, request body, responses, errors, and traceability", () => {
    const json = apiContractToJson(
      makeContract({
        groups: [],
        endpoints: [
          {
            id: "e1",
            project_id: "p",
            group_id: null,
            name: "Get book",
            method: "GET",
            path: "/books/{id}",
            summary: null,
            description: null,
            authentication_required: true,
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        parameters: [
          {
            id: "p1",
            endpoint_id: "e1",
            name: "id",
            location: "path",
            data_type: "uuid",
            required: true,
            description: "Book id",
            example: null,
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        requestBodies: [
          {
            id: "rb1",
            endpoint_id: "e1",
            content_type: "application/json",
            description: null,
            schema_definition: { fields: [] },
            example: { id: "x" },
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        responses: [
          {
            id: "r1",
            endpoint_id: "e1",
            status_code: 200,
            description: "ok",
            content_type: "application/json",
            schema_definition: null,
            example: null,
            position: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
          {
            id: "r2",
            endpoint_id: "e1",
            status_code: 404,
            description: "not found",
            content_type: null,
            schema_definition: null,
            example: null,
            position: 1,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        errors: [
          {
            id: "e_err1",
            endpoint_id: "e1",
            code: "INVALID_REQUEST",
            message: "bad input",
            description: null,
            http_status: 400,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ],
        endpointEntities: [
          {
            id: "l1",
            endpoint_id: "e1",
            entity_id: "ent1",
            role: "primary_resource",
            created_at: "2026-01-01",
            entity_name: "Book",
            domain_name: "Library Core",
            domain_id: "d1",
          },
        ],
        endpointRequirements: [
          {
            id: "l2",
            endpoint_id: "e1",
            requirement_id: "r1",
            created_at: "2026-01-01",
            requirement_title: "Search books",
            requirement_status: "approved",
          },
        ],
      }),
    );

    const ep = json.paths[0];
    expect(ep.method).toBe("GET");
    expect(ep.authentication_required).toBe(true);
    expect(ep.parameters).toHaveLength(1);
    expect(ep.parameters[0]).toMatchObject({
      name: "id",
      location: "path",
      required: true,
    });
    expect(ep.request_body).toMatchObject({ content_type: "application/json" });
    expect(ep.responses.map((r) => r.status_code)).toEqual([200, 404]);
    expect(ep.errors).toHaveLength(1);
    expect(ep.errors[0]).toMatchObject({
      code: "INVALID_REQUEST",
      http_status: 400,
    });
    expect(ep.traceability.entities[0]).toMatchObject({
      entity_name: "Book",
      role: "primary_resource",
    });
    expect(ep.traceability.requirements[0]).toMatchObject({
      requirement_title: "Search books",
    });
  });

  it("serializeApiContract produces pretty JSON", () => {
    const s = serializeApiContract(makeContract());
    expect(s).toMatch(/^{/);
    expect(s).toContain('"openapi": "3.0.3"');
    expect(s).toContain('"paths": []');
  });

  it("summarizeApiContract counts endpoints, groups, lines and chars", () => {
    const summary = summarizeApiContract(
      makeContract({
        groups: [
          {
            id: "g1",
            project_id: "p",
            name: "Auth",
            description: null,
            prefix: "/api/auth",
            position: 0,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-02-02T00:00:00Z",
          },
        ],
        endpoints: [
          {
            id: "e1",
            project_id: "p",
            group_id: "g1",
            name: "Login",
            method: "POST",
            path: "/login",
            summary: null,
            description: null,
            authentication_required: false,
            position: 0,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-03-03T00:00:00Z",
          },
        ],
      }),
    );
    expect(summary.endpoints).toBe(1);
    expect(summary.groups).toBe(1);
    expect(summary.chars).toBeGreaterThan(0);
    expect(summary.lines).toBeGreaterThan(0);
    expect(summary.updatedAt).toBe("2026-03-03T00:00:00Z");
  });

  it("prepareJsonBlock returns uncapped block when within limit", () => {
    const block = prepareJsonBlock(makeContract());
    expect(block.truncated).toBe(false);
    expect(block.json).toBe(serializeApiContract(makeContract()));
  });

  it("prepareJsonBlock truncates when output exceeds MAX_JSON_CHARS", async () => {
    const huge: ProjectApiContract["endpoints"] = Array.from({ length: 5000 }, (_, i) => ({
      id: `e${i}`,
      project_id: "p",
      group_id: null,
      name: `Endpoint ${i} ${"x".repeat(80)}`,
      method: "GET" as const,
      path: `/${"y".repeat(60)}`,
      summary: null,
      description: null,
      authentication_required: false,
      position: i,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    }));
    const block = prepareJsonBlock(makeContract({ endpoints: huge }));
    expect(block.json.length).toBeLessThanOrEqual(MAX_JSON_CHARS + 100);
    expect(block.json).toContain("output truncated");
    expect(block.truncated).toBe(true);
  });

  it("jsonFilename slugifies the project name", () => {
    expect(jsonFilename("Library Management System")).toBe(
      "library-management-system.api.json",
    );
    expect(jsonFilename("Book / ISBN 2025!")).toBe("book-isbn-2025.api.json");
    expect(jsonFilename("!!!")).toBe("api.api.json");
  });
});
