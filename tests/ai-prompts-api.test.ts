import { describe, expect, it } from "vitest";

import {
  API_ENDPOINT_ENTITY_ROLES,
  API_HTTP_METHODS,
  API_PARAMETER_DATA_TYPES,
  API_PARAMETER_LOCATIONS,
} from "@/lib/supabase/types";
import { aiApiResponseSchema, flattenApiResponse } from "@/lib/ai/schema";
import {
  buildApiSystemPrompt,
  buildApiUserPrompt,
} from "@/lib/ai/prompts/api";

const baseContext = {
  projectName: "Lending Platform",
  projectDescription: "A lending workflow for small teams.",
  requirements: [{ name: "Borrowers can apply for a loan", description: null }],
  decisions: [{ name: "Use Postgres as the primary datastore", description: null }],
  domains: [{ name: "Lending", description: null }],
  entities: [{ name: "Loan", description: null }, { name: "Borrower", description: null }],
  existingGroups: [{ name: "Internal", description: null }],
  existingEndpoints: [{ name: "GET /health", description: null }],
  userPrompt: "Cover loans and repayments.",
};

describe("ai/prompts api", () => {
  it("lists every allowed method, location, data type, and role", () => {
    const prompt = buildApiSystemPrompt();

    for (const value of API_HTTP_METHODS) {
      expect(prompt).toContain(value);
    }
    for (const value of API_PARAMETER_LOCATIONS) {
      expect(prompt).toContain(value);
    }
    for (const value of API_PARAMETER_DATA_TYPES) {
      expect(prompt).toContain(value);
    }
    for (const value of API_ENDPOINT_ENTITY_ROLES) {
      expect(prompt).toContain(value);
    }
    expect(prompt).toContain("request_body");
    expect(prompt).toContain("requirement_titles");
    expect(prompt).toContain("raw JSON");
  });

  it("carries the project context into the user prompt", () => {
    const prompt = buildApiUserPrompt(baseContext);

    expect(prompt).toContain("Lending Platform");
    expect(prompt).toContain("A lending workflow for small teams.");
    expect(prompt).toContain("Borrowers can apply for a loan");
    expect(prompt).toContain("Use Postgres as the primary datastore");
    expect(prompt).toContain("Lending");
    expect(prompt).toContain("Loan");
    expect(prompt).toContain("Internal");
    expect(prompt).toContain("GET /health");
    expect(prompt).toContain("Cover loans and repayments.");
  });

  it("falls back when optional context is missing", () => {
    const prompt = buildApiUserPrompt({
      ...baseContext,
      projectDescription: null,
      requirements: [],
      decisions: [],
      domains: [],
      entities: [],
      existingGroups: [],
      existingEndpoints: [],
    });

    expect(prompt).toContain("(no description)");
    expect(prompt).toContain("(none yet)");
  });
});

describe("ai/schema api response", () => {
  it("accepts a nested payload", () => {
    const parsed = aiApiResponseSchema.safeParse({
      groups: [{ name: "Users", prefix: "/users", description: "User admin." }],
      endpoints: [
        {
          group_name: "Users",
          method: "GET",
          path: "/users/{id}",
          name: "Get user",
          summary: "Fetch one user.",
          description: "Returns a single user.",
          authentication_required: true,
          parameters: [
            {
              name: "id",
              location: "path",
              data_type: "uuid",
              required: true,
              description: "User id.",
              example: "1",
            },
          ],
          request_body: {
            content_type: "application/json",
            description: "Payload.",
            schema: { type: "object" },
            example: { name: "Ada" },
          },
          responses: [
            {
              status_code: 200,
              content_type: "application/json",
              description: "OK",
              schema: null,
              example: null,
            },
          ],
          errors: [
            {
              code: "not_found",
              message: "User not found",
              http_status: 404,
              description: "Unknown id.",
            },
          ],
          entities: [{ entity_name: "Loan", role: "primary_resource" }],
          requirement_titles: ["Borrowers can apply for a loan"],
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.endpoints[0]?.request_body?.content_type).toBe(
      "application/json",
    );
    expect(parsed.data.endpoints[0]?.entities[0]?.role).toBe(
      "primary_resource",
    );
  });

  it("defaults omitted optional fields", () => {
    const parsed = aiApiResponseSchema.safeParse({
      endpoints: [{ method: "POST", path: "/users", name: "Create user" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const endpoint = parsed.data.endpoints[0];
    expect(endpoint?.group_name).toBe("");
    expect(endpoint?.summary).toBe("");
    expect(endpoint?.description).toBe("");
    expect(endpoint?.authentication_required).toBe(true);
    expect(endpoint?.parameters).toEqual([]);
    expect(endpoint?.request_body).toBeNull();
    expect(endpoint?.responses).toEqual([]);
    expect(endpoint?.errors).toEqual([]);
    expect(endpoint?.entities).toEqual([]);
    expect(endpoint?.requirement_titles).toEqual([]);
    expect(parsed.data.groups).toEqual([]);
  });

  it("normalises unsupported enum values instead of failing the stage", () => {
    const badMethod = aiApiResponseSchema.safeParse({
      endpoints: [{ method: "OPTIONS", path: "/users", name: "Options" }],
    });
    expect(badMethod.success).toBe(true);
    if (badMethod.success) {
      expect(badMethod.data.endpoints[0]?.method).toBe("GET");
    }

    const badLocation = aiApiResponseSchema.safeParse({
      endpoints: [
        {
          method: "GET",
          path: "/users",
          name: "List users",
          parameters: [{ name: "limit", location: "body", data_type: "integer" }],
        },
      ],
    });
    expect(badLocation.success).toBe(true);
    if (badLocation.success) {
      expect(badLocation.data.endpoints[0]?.parameters[0]?.location).toBe(
        "query",
      );
    }

    const badDataType = aiApiResponseSchema.safeParse({
      endpoints: [
        {
          method: "GET",
          path: "/users",
          name: "List users",
          parameters: [{ name: "limit", location: "query", data_type: "float" }],
        },
      ],
    });
    expect(badDataType.success).toBe(true);
    if (badDataType.success) {
      expect(badDataType.data.endpoints[0]?.parameters[0]?.data_type).toBe(
        "number",
      );
    }

    const badRole = aiApiResponseSchema.safeParse({
      endpoints: [
        {
          method: "GET",
          path: "/users",
          name: "List users",
          entities: [{ entity_name: "Loan", role: "owner" }],
        },
      ],
    });
    expect(badRole.success).toBe(true);
    if (badRole.success) {
      expect(badRole.data.endpoints[0]?.entities[0]?.role).toBe(
        "related_resource",
      );
    }
  });

  it("rejects an out-of-range status code", () => {
    const parsed = aiApiResponseSchema.safeParse({
      endpoints: [
        {
          method: "GET",
          path: "/users",
          name: "List users",
          responses: [{ status_code: 99 }],
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a response with no groups and no endpoints", () => {
    const parsed = aiApiResponseSchema.safeParse({ groups: [], endpoints: [] });

    expect(parsed.success).toBe(false);
  });

  it("flattens groups before endpoints", () => {
    const parsed = aiApiResponseSchema.safeParse({
      groups: [{ name: "Users" }],
      endpoints: [{ method: "GET", path: "/users", name: "List users" }],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const flat = flattenApiResponse(parsed.data);
    expect(flat.map((item) => item.kind)).toEqual(["group", "endpoint"]);
    expect(flat[0]?.name).toBe("Users");
    expect(flat[1]?.kind === "endpoint" && flat[1].path).toBe("/users");
  });
});
