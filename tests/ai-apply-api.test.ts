import { describe, expect, it } from "vitest";

import {
  apiEndpointDedupeKey,
  apiEntityLinkDedupeKey,
  apiErrorDedupeKey,
  apiParameterDedupeKey,
  apiRequirementLinkDedupeKey,
  apiResponseDedupeKey,
  buildApiEndpointRow,
  buildApiErrorRow,
  buildApiGroupRow,
  buildApiParameterRow,
  buildApiRequestBodyRow,
  buildApiResponseRow,
} from "@/lib/ai/apply";

const ENDPOINT_ID = "11111111-1111-4111-8111-111111111111";
const ENTITY_ID = "22222222-2222-4222-8222-222222222222";
const REQUIREMENT_ID = "33333333-3333-4333-8333-333333333333";

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

  it("builds stable de-duplication keys", () => {
    expect(apiEndpointDedupeKey("GET", "/users")).toBe("GET|/users");
    expect(apiEndpointDedupeKey("POST", "/users")).not.toBe(
      apiEndpointDedupeKey("GET", "/users"),
    );
    expect(apiParameterDedupeKey(ENDPOINT_ID, "query", "  Limit ")).toBe(
      `${ENDPOINT_ID}|query|limit`,
    );
    expect(apiResponseDedupeKey(ENDPOINT_ID, 404)).toBe(`${ENDPOINT_ID}|404`);
    expect(apiErrorDedupeKey(ENDPOINT_ID, " Not_Found ")).toBe(
      `${ENDPOINT_ID}|not_found`,
    );
    expect(apiEntityLinkDedupeKey(ENDPOINT_ID, ENTITY_ID, "primary_resource")).toBe(
      `${ENDPOINT_ID}|${ENTITY_ID}|primary_resource`,
    );
    expect(apiRequirementLinkDedupeKey(ENDPOINT_ID, REQUIREMENT_ID)).toBe(
      `${ENDPOINT_ID}|${REQUIREMENT_ID}`,
    );
  });
});
