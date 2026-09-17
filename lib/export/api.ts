import type { ProjectApiContract } from "@/lib/api/endpoints/queries";

type EndpointGroup = {
  groupId: string | null;
  groupName: string | null;
  prefix: string | null;
  endpoints: Array<{
    id: string;
    name: string;
    method: string;
    path: string;
    summary: string | null;
    authentication_required: boolean;
    parameters: ProjectApiContract["parameters"];
    requestBody: ProjectApiContract["requestBodies"][number] | null;
    responses: ProjectApiContract["responses"];
    errors: ProjectApiContract["errors"];
    entities: ProjectApiContract["endpointEntities"];
    requirements: ProjectApiContract["endpointRequirements"];
  }>;
};

export function apiContractToJson(contract: ProjectApiContract) {
  const endpointsByGroup = new Map<string | null, EndpointGroup>();
  endpointsByGroup.set(null, {
    groupId: null,
    groupName: null,
    prefix: null,
    endpoints: [],
  });

  for (const group of contract.groups) {
    endpointsByGroup.set(group.id, {
      groupId: group.id,
      groupName: group.name,
      prefix: group.prefix,
      endpoints: [],
    });
  }

  const paramsByEndpoint = new Map<string, typeof contract.parameters>();
  for (const p of contract.parameters) {
    const list = paramsByEndpoint.get(p.endpoint_id) ?? [];
    list.push(p);
    paramsByEndpoint.set(p.endpoint_id, list);
  }
  const responsesByEndpoint = new Map<string, typeof contract.responses>();
  for (const r of contract.responses) {
    const list = responsesByEndpoint.get(r.endpoint_id) ?? [];
    list.push(r);
    responsesByEndpoint.set(r.endpoint_id, list);
  }
  const errorsByEndpoint = new Map<string, typeof contract.errors>();
  for (const e of contract.errors) {
    const list = errorsByEndpoint.get(e.endpoint_id) ?? [];
    list.push(e);
    errorsByEndpoint.set(e.endpoint_id, list);
  }
  const bodiesByEndpoint = new Map<string, typeof contract.requestBodies[number]>();
  for (const b of contract.requestBodies) {
    bodiesByEndpoint.set(b.endpoint_id, b);
  }
  const entitiesByEndpoint = new Map<string, typeof contract.endpointEntities>();
  for (const link of contract.endpointEntities) {
    const list = entitiesByEndpoint.get(link.endpoint_id) ?? [];
    list.push(link);
    entitiesByEndpoint.set(link.endpoint_id, list);
  }
  const requirementsByEndpoint = new Map<string, typeof contract.endpointRequirements>();
  for (const link of contract.endpointRequirements) {
    const list = requirementsByEndpoint.get(link.endpoint_id) ?? [];
    list.push(link);
    requirementsByEndpoint.set(link.endpoint_id, list);
  }

  for (const ep of contract.endpoints) {
    const bucket = endpointsByGroup.get(ep.group_id) ??
      endpointsByGroup.get(null)!;
    const responses = (responsesByEndpoint.get(ep.id) ?? []).slice().sort(
      (a, b) => a.status_code - b.status_code,
    );
    bucket.endpoints.push({
      id: ep.id,
      name: ep.name,
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      authentication_required: ep.authentication_required,
      parameters: (paramsByEndpoint.get(ep.id) ?? []).slice().sort(
        (a, b) => a.position - b.position,
      ),
      requestBody: bodiesByEndpoint.get(ep.id) ?? null,
      responses,
      errors: errorsByEndpoint.get(ep.id) ?? [],
      entities: entitiesByEndpoint.get(ep.id) ?? [],
      requirements: requirementsByEndpoint.get(ep.id) ?? [],
    });
  }

  const groups = Array.from(endpointsByGroup.values()).filter(
    (g) => g.groupId !== null || g.endpoints.length > 0,
  );

  return {
    openapi: "3.0.3",
    info: {
      description: "Generated from stored API design data. Source of truth is the database.",
    },
    servers: [],
    paths: groups.flatMap((g) =>
      g.endpoints.map((ep) => ({
        group: g.groupName,
        prefix: g.prefix,
endpoint_id: ep.id,
        method: ep.method.toUpperCase(),
        summary: ep.summary ?? null,
        authentication_required: ep.authentication_required,
        parameters: ep.parameters.map((p) => ({
          name: p.name,
          location: p.location,
          data_type: p.data_type,
          required: p.required,
          description: p.description ?? null,
          example: p.example ?? null,
        })),
        request_body: ep.requestBody
          ? {
              content_type: ep.requestBody.content_type,
              description: ep.requestBody.description ?? null,
              schema: ep.requestBody.schema_definition ?? null,
              example: ep.requestBody.example ?? null,
            }
          : null,
        responses: ep.responses.map((r) => ({
          status_code: r.status_code,
          description: r.description ?? null,
          content_type: r.content_type ?? null,
          schema: r.schema_definition ?? null,
          example: r.example ?? null,
        })),
        errors: ep.errors.map((e) => ({
          code: e.code,
          message: e.message,
          http_status: e.http_status ?? null,
          description: e.description ?? null,
        })),
        traceability: {
          entities: ep.entities.map((en) => ({
            entity_id: en.entity_id,
            entity_name: en.entity_name,
            domain_id: en.domain_id,
            domain_name: en.domain_name,
            role: en.role,
          })),
          requirements: ep.requirements.map((r) => ({
            requirement_id: r.requirement_id,
            requirement_title: r.requirement_title,
            requirement_status: r.requirement_status,
          })),
        },
      })),
    ),
  };
}

export function serializeApiContract(contract: ProjectApiContract): string {
  return JSON.stringify(apiContractToJson(contract), null, 2);
}
