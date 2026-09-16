import { describe, expect, it } from "vitest";

import {
  apiGroupInputSchema,
  apiEndpointInputSchema,
  apiParameterInputSchema,
  apiRequestBodyInputSchema,
  apiResponseInputSchema,
  apiErrorInputSchema,
} from "@/lib/validation/api";

describe("api group validation", () => {
  it("accepts a valid group", () => {
    const r = apiGroupInputSchema.safeParse({
      name: "Authentication",
      description: "Login and register flows",
      prefix: "/api/auth",
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty name", () => {
    const r = apiGroupInputSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
  });
  it("rejects name longer than 200 chars", () => {
    const r = apiGroupInputSchema.safeParse({ name: "a".repeat(201) });
    expect(r.success).toBe(false);
  });
  it("accepts missing optional fields", () => {
    const r = apiGroupInputSchema.safeParse({ name: "Billing" });
    expect(r.success).toBe(true);
  });
});

describe("api endpoint validation", () => {
  it("accepts a valid endpoint", () => {
    const r = apiEndpointInputSchema.safeParse({
      name: "Create project",
      method: "POST",
      path: "/api/projects",
      summary: "Create a new project",
      description: "Requires authentication.",
      authentication_required: true,
    });
    expect(r.success).toBe(true);
  });
  it("rejects unsupported HTTP method", () => {
    const r = apiEndpointInputSchema.safeParse({
      name: "Create project",
      method: "FOO",
      path: "/api/projects",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects path that does not start with /", () => {
    const r = apiEndpointInputSchema.safeParse({
      name: "List",
      method: "GET",
      path: "api/projects",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects empty path", () => {
    const r = apiEndpointInputSchema.safeParse({
      name: "List",
      method: "GET",
      path: "",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects path longer than 500 chars", () => {
    const r = apiEndpointInputSchema.safeParse({
      name: "List",
      method: "GET",
      path: "/" + "a".repeat(500),
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("accepts all five HTTP methods", () => {
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      const r = apiEndpointInputSchema.safeParse({
        name: "Test",
        method: m,
        path: "/api/x",
        authentication_required: true,
      });
      expect(r.success).toBe(true);
    }
  });
});

describe("api parameter validation", () => {
  it("accepts a valid parameter", () => {
    const r = apiParameterInputSchema.safeParse({
      name: "id",
      location: "path",
      data_type: "uuid",
      required: "on",
      description: "Project id",
      example: "abcd-1234",
    });
    expect(r.success).toBe(true);
  });
  it("rejects unsupported location", () => {
    const r = apiParameterInputSchema.safeParse({
      name: "id",
      location: "body",
      data_type: "string",
      required: "",
      description: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects unsupported data type", () => {
    const r = apiParameterInputSchema.safeParse({
      name: "id",
      location: "query",
      data_type: "object",
      required: "",
      description: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects empty name", () => {
    const r = apiParameterInputSchema.safeParse({
      name: "",
      location: "query",
      data_type: "string",
      required: "",
      description: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("api request body validation", () => {
  it("accepts a valid body", () => {
    const r = apiRequestBodyInputSchema.safeParse({
      content_type: "application/json",
      description: "JSON body",
      schema_definition: '{"fields":[]}',
      example: '{"name":"x"}',
    });
    expect(r.success).toBe(true);
  });
  it("requires content type", () => {
    const r = apiRequestBodyInputSchema.safeParse({
      content_type: "",
      description: "",
      schema_definition: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("api response validation", () => {
  it("accepts a valid response", () => {
    const r = apiResponseInputSchema.safeParse({
      status_code: 200,
      description: "OK",
      content_type: "application/json",
      schema_definition: "",
      example: '{"ok":true}',
    });
    expect(r.success).toBe(true);
  });
  it("rejects status code below 100", () => {
    const r = apiResponseInputSchema.safeParse({
      status_code: 99,
      description: "",
      content_type: "",
      schema_definition: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects status code above 599", () => {
    const r = apiResponseInputSchema.safeParse({
      status_code: 600,
      description: "",
      content_type: "",
      schema_definition: "",
      example: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("api error validation", () => {
  it("accepts a valid error", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "VALIDATION_ERROR",
      message: "Some fields are invalid",
      description: "Returned when input is malformed",
      http_status: 422,
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty code", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "",
      message: "x",
      description: "",
      http_status: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects code longer than 100 chars", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "a".repeat(101),
      message: "x",
      description: "",
      http_status: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects empty message", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "X",
      message: "",
      description: "",
      http_status: "",
    });
    expect(r.success).toBe(false);
  });
  it("accepts missing optional http_status", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "X",
      message: "y",
      description: "",
      http_status: "",
    });
    expect(r.success).toBe(true);
  });
  it("rejects http_status out of range", () => {
    const r = apiErrorInputSchema.safeParse({
      code: "X",
      message: "y",
      description: "",
      http_status: 99,
    });
    expect(r.success).toBe(false);
  });
});
