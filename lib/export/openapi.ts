import type { ProjectApiContract } from "@/lib/api/endpoints/queries";

export interface OpenApiProject {
  name: string;
  description: string | null;
}

export interface OpenApiOptions {
  version?: string;
  generatedAt?: string;
}

type JsonSchema = Record<string, unknown>;

const DATA_TYPE_SCHEMA: Record<string, JsonSchema> = {
  string: { type: "string" },
  integer: { type: "integer" },
  number: { type: "number" },
  boolean: { type: "boolean" },
  uuid: { type: "string", format: "uuid" },
  date: { type: "string", format: "date" },
  datetime: { type: "string", format: "date-time" },
};

const SECURITY_SCHEME_NAME = "bearerAuth";

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parameterSchema(dataType: string): JsonSchema {
  return DATA_TYPE_SCHEMA[dataType] ?? { type: "string" };
}

function schemaFromDefinition(definition: unknown): JsonSchema | null {
  if (definition === null || definition === undefined) return null;
  if (typeof definition === "object" && !Array.isArray(definition)) {
    return definition as JsonSchema;
  }
  return { type: "string", example: definition };
}

function operationId(method: string, path: string): string {
  const cleaned = path
    .replace(/[{}]/g, "")
    .split("/")
    .filter(Boolean)
    .join("_");
  return `${method.toLowerCase()}_${cleaned || "root"}`.replace(
    /[^A-Za-z0-9_]/g,
    "_",
  );
}

export function apiContractToOpenApi(
  contract: ProjectApiContract,
  project: OpenApiProject,
  options: OpenApiOptions = {},
): Record<string, unknown> {
  const version = options.version ?? "1.0.0";
  const groupById = new Map(contract.groups.map((g) => [g.id, g]));

  const tags = contract.groups
    .map((g) => ({
      name: g.name,
      ...(g.description ? { description: g.description } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const paths: Record<string, Record<string, unknown>> = {};
  let usesAuth = false;

  for (const ep of contract.endpoints) {
    const path = normalizePath(ep.path);
    const method = ep.method.toLowerCase();
    const group = ep.group_id ? groupById.get(ep.group_id) : undefined;

    const params = contract.parameters
      .filter((p) => p.endpoint_id === ep.id)
      .sort((a, b) => a.position - b.position)
      .map((p) => {
        const required = p.location === "path" ? true : p.required;
        return {
          name: p.name,
          in: p.location,
          required,
          ...(p.description ? { description: p.description } : {}),
          schema: parameterSchema(p.data_type),
          ...(p.example !== null && p.example !== undefined
            ? { example: p.example }
            : {}),
        };
      });

    const body = contract.requestBodies.find((b) => b.endpoint_id === ep.id);
    const requestBody = body
      ? {
          ...(body.description ? { description: body.description } : {}),
          required: true,
          content: {
            [body.content_type || "application/json"]: {
              schema: schemaFromDefinition(body.schema_definition) ?? {
                type: "object",
              },
              ...(body.example !== null && body.example !== undefined
                ? { example: body.example }
                : {}),
            },
          },
        }
      : undefined;

    const responses = contract.responses
      .filter((r) => r.endpoint_id === ep.id)
      .sort((a, b) => a.status_code - b.status_code);

    const responseObject: Record<string, unknown> = {};
    for (const r of responses) {
      const contentType = r.content_type || "application/json";
      const schema = schemaFromDefinition(r.schema_definition);
      responseObject[String(r.status_code)] = {
        description: r.description || "",
        ...(schema || r.example !== null
          ? {
              content: {
                [contentType]: {
                  schema: schema ?? { type: "object" },
                  ...(r.example !== null && r.example !== undefined
                    ? { example: r.example }
                    : {}),
                },
              },
            }
          : {}),
      };
    }

    for (const err of contract.errors.filter((e) => e.endpoint_id === ep.id)) {
      const status = String(err.http_status ?? 400);
      const existing = responseObject[status] as
        | { description?: string; content?: unknown }
        | undefined;
      const description = [
        existing?.description,
        `[${err.code}] ${err.message}${err.description ? ` — ${err.description}` : ""}`,
      ]
        .filter(Boolean)
        .join(" ");
      responseObject[status] = {
        ...(existing ?? {}),
        description,
      };
    }

    const entities = contract.endpointEntities
      .filter((l) => l.endpoint_id === ep.id)
      .map((l) => ({
        entity_id: l.entity_id,
        entity_name: l.entity_name,
        domain_name: l.domain_name,
        role: l.role,
      }));
    const requirements = contract.endpointRequirements
      .filter((l) => l.endpoint_id === ep.id)
      .map((l) => ({
        requirement_id: l.requirement_id,
        title: l.requirement_title,
        status: l.requirement_status,
      }));

    if (ep.authentication_required) usesAuth = true;

    const operation: Record<string, unknown> = {
      operationId: operationId(method, path),
      ...(ep.summary ? { summary: ep.summary } : {}),
      ...(ep.description ? { description: ep.description } : {}),
      ...(group ? { tags: [group.name] } : {}),
      ...(params.length > 0 ? { parameters: params } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses: responseObject,
      security: ep.authentication_required
        ? [{ [SECURITY_SCHEME_NAME]: [] }]
        : [],
      "x-logic-endpoint-id": ep.id,
      "x-logic-endpoint-name": ep.name,
      "x-logic-group": group?.name ?? null,
      "x-logic-group-prefix": group?.prefix ?? null,
      "x-logic-traceability": {
        entities,
        requirements,
      },
    };

    paths[path] = { ...(paths[path] ?? {}), [method]: operation };
  }

  const document: Record<string, unknown> = {
    openapi: "3.1.0",
    info: {
      title: project.name,
      version,
      ...(project.description ? { description: project.description } : {}),
    },
    servers: [],
    ...(tags.length > 0 ? { tags } : {}),
    paths,
    ...(usesAuth
      ? {
          components: {
            securitySchemes: {
              [SECURITY_SCHEME_NAME]: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
        }
      : {}),
    "x-logic-project": {
      name: project.name,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      groups: contract.groups.length,
      endpoints: contract.endpoints.length,
    },
  };

  return document;
}

export function serializeOpenApi(
  contract: ProjectApiContract,
  project: OpenApiProject,
  options: OpenApiOptions = {},
): string {
  return JSON.stringify(apiContractToOpenApi(contract, project, options), null, 2);
}
