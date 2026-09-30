import { describe, expect, it } from "vitest";

import {
  buildApiBundle,
  buildApiEndpointRow,
  buildApiErrorRow,
  buildApiGroupRow,
  buildApiParameterRow,
  buildApiRequestBodyRow,
  buildApiResponseRow,
} from "@/lib/ai/apply";

describe("ai/apply api row builders", () => {
  it("maps a group item and turns empty text into null", () => {
    const row = buildApiGroupRow({
      name: "  Users  ",
      prefix: "",
      description: "",
    });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Users");
    expect(row?.prefix).toBeNull();
    expect(row?.description).toBeNull();
  });

  it("rejects a group item with a blank name", () => {
    const row = buildApiGroupRow({ name: "   ", prefix: "", description: "" });

    expect(row).toBeNull();
  });

  it("maps an endpoint item onto the column shape", () => {
    const row = buildApiEndpointRow({
      group_name: "Users",
      method: "GET",
      path: "  /users/{id}  ",
      name: "Get user",
      summary: "",
      description: "",
      authentication_required: true,
      parameters: [],
      request_body: null,
      responses: [],
      errors: [],
      entities: [],
      requirement_titles: [],
    });

    expect(row).not.toBeNull();
    expect(row?.method).toBe("GET");
    expect(row?.path).toBe("/users/{id}");
    expect(row?.group_name).toBe("Users");
    expect(row?.summary).toBeNull();
    expect(row?.authentication_required).toBe(true);
  });

  it("rejects an endpoint path that does not start with a slash", () => {
    const row = buildApiEndpointRow({
      group_name: "",
      method: "GET",
      path: "users",
      name: "List users",
      summary: "",
      description: "",
      authentication_required: false,
      parameters: [],
      request_body: null,
      responses: [],
      errors: [],
      entities: [],
      requirement_titles: [],
    });

    expect(row).toBeNull();
  });

  it("maps a parameter item onto the column shape", () => {
    const row = buildApiParameterRow({
      name: "id",
      location: "path",
      data_type: "uuid",
      required: true,
      description: "",
      example: "",
    });

    expect(row).not.toBeNull();
    expect(row?.location).toBe("path");
    expect(row?.data_type).toBe("uuid");
    expect(row?.required).toBe(true);
    expect(row?.description).toBeNull();
    expect(row?.example).toBeNull();
  });

  it("maps a request body item and keeps json payloads", () => {
    const row = buildApiRequestBodyRow({
      content_type: "application/json",
      description: "",
      schema: { type: "object" },
      example: null,
    });

    expect(row).not.toBeNull();
    expect(row?.content_type).toBe("application/json");
    expect(row?.schema_definition).toEqual({ type: "object" });
    expect(row?.example).toBeNull();
  });

  it("maps a response item and rejects an out-of-range status code", () => {
    const row = buildApiResponseRow({
      status_code: 201,
      content_type: "application/json",
      description: "",
      schema: null,
      example: null,
    });

    expect(row).not.toBeNull();
    expect(row?.status_code).toBe(201);

    const invalid = buildApiResponseRow({
      status_code: 700,
      content_type: "",
      description: "",
      schema: null,
      example: null,
    });

    expect(invalid).toBeNull();
  });

  it("maps an error item and rejects an empty message", () => {
    const row = buildApiErrorRow({
      code: "not_found",
      message: "User not found",
      http_status: 404,
      description: "",
    });

    expect(row).not.toBeNull();
    expect(row?.code).toBe("not_found");
    expect(row?.http_status).toBe(404);
    expect(row?.description).toBeNull();

    const invalid = buildApiErrorRow({
      code: "not_found",
      message: "   ",
      http_status: null,
      description: "",
    });

    expect(invalid).toBeNull();
  });

  it("builds a bundle that splits groups and endpoints by kind", () => {
    const items = [
      {
        kind: "group" as const,
        name: "Users",
        prefix: "/users",
        description: "",
      },
      {
        kind: "endpoint" as const,
        group_name: "Users",
        method: "GET" as const,
        path: "/users",
        name: "List users",
        summary: "",
        description: "",
        authentication_required: true,
        parameters: [
          {
            name: "limit",
            location: "query" as const,
            data_type: "integer" as const,
            required: false,
            description: "",
            example: "",
          },
        ],
        request_body: null,
        responses: [],
        errors: [],
        entities: [{ entity_name: "User", role: "primary_resource" as const }],
        requirement_titles: ["List users"],
      },
    ];

    const { groups, endpoints, skipped } = buildApiBundle(items, [0, 1]);

    expect(skipped).toEqual([]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.index).toBe(0);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0]?.index).toBe(1);
    expect(endpoints[0]?.parameters[0]?.name).toBe("limit");
    expect(endpoints[0]?.entities[0]?.role).toBe("primary_resource");
  });

  it("ignores out-of-range and duplicate indices", () => {
    const items = [
      { kind: "group" as const, name: "Users", prefix: "", description: "" },
    ];

    const { groups, skipped } = buildApiBundle(items, [0, 0, 7, -1, 1.5]);

    expect(groups).toHaveLength(1);
    expect(skipped).toEqual([]);
  });

  it("reports an invalid endpoint as skipped", () => {
    const items = [
      {
        kind: "endpoint" as const,
        group_name: "",
        method: "GET" as const,
        path: "users",
        name: "List users",
        summary: "",
        description: "",
        authentication_required: false,
        parameters: [],
        request_body: null,
        responses: [],
        errors: [],
        entities: [],
        requirement_titles: [],
      },
    ];

    const { endpoints, skipped } = buildApiBundle(items, [0]);

    expect(endpoints).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.kind).toBe("skipped");
    expect(skipped[0]?.kind === "skipped" ? skipped[0].reason : null).toBe(
      "invalid",
    );
  });
});
