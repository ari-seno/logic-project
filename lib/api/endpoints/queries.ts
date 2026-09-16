import { createClient } from "@/lib/supabase/server";
import type {
  ApiEndpoint,
  ApiEndpointEntity,
  ApiEndpointRequirement,
  ApiError,
  ApiGroup,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
} from "@/lib/supabase/types";

export async function listApiEndpointsByProject({
  projectId,
  limit,
}: {
  projectId: string;
  limit?: number;
}): Promise<ApiEndpoint[]> {
  const supabase = await createClient();
  let q = supabase
    .from("api_endpoints")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export async function countApiEndpointsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("api_endpoints")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function getApiEndpoint(id: string): Promise<ApiEndpoint | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_endpoints")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export type ApiEndpointWithGroupName = ApiEndpoint & {
  group_name: string | null;
};

export async function listApiEndpointsByProjectWithGroupName({
  projectId,
}: {
  projectId: string;
}): Promise<ApiEndpointWithGroupName[]> {
  const supabase = await createClient();
  const { data: endpoints, error } = await supabase
    .from("api_endpoints")
    .select("*, api_groups(name)")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !endpoints) return [];
  return endpoints.map((e) => {
    const { api_groups, ...rest } = e as ApiEndpoint & {
      api_groups: { name: string } | null;
    };
    return { ...rest, group_name: api_groups?.name ?? null };
  });
}

export async function listApiParametersByEndpoint(
  endpointId: string,
): Promise<ApiParameter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_parameters")
    .select("*")
    .eq("endpoint_id", endpointId)
    .order("position", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getApiRequestBody(
  endpointId: string,
): Promise<ApiRequestBody | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_request_bodies")
    .select("*")
    .eq("endpoint_id", endpointId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listApiResponsesByEndpoint(
  endpointId: string,
): Promise<ApiResponse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_responses")
    .select("*")
    .eq("endpoint_id", endpointId)
    .order("status_code", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getApiResponse(id: string): Promise<ApiResponse | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listApiErrorsByEndpoint(
  endpointId: string,
): Promise<ApiError[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_errors")
    .select("*")
    .eq("endpoint_id", endpointId)
    .order("code", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getApiError(id: string): Promise<ApiError | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_errors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export type LinkedEntity = ApiEndpointEntity & {
  entity_name: string;
  domain_name: string;
  domain_id: string;
};

export type LinkedRequirement = ApiEndpointRequirement & {
  requirement_title: string;
  requirement_status: string;
};

export async function listEndpointEntityLinks(
  endpointId: string,
): Promise<LinkedEntity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_endpoint_entities")
    .select("*, entities(name, domain_id, domains(name))")
    .eq("endpoint_id", endpointId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as ApiEndpointEntity & {
      entities: { name: string; domain_id: string; domains: { name: string } | null } | null;
    };
    return {
      id: r.id,
      endpoint_id: r.endpoint_id,
      entity_id: r.entity_id,
      role: r.role,
      created_at: r.created_at,
      entity_name: r.entities?.name ?? "(deleted)",
      domain_id: r.entities?.domain_id ?? "",
      domain_name: r.entities?.domains?.name ?? "",
    };
  });
}

export async function listEndpointRequirementLinks(
  endpointId: string,
): Promise<LinkedRequirement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_endpoint_requirements")
    .select("*, requirements(title, status)")
    .eq("endpoint_id", endpointId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as ApiEndpointRequirement & {
      requirements: { title: string; status: string } | null;
    };
    return {
      id: r.id,
      endpoint_id: r.endpoint_id,
      requirement_id: r.requirement_id,
      created_at: r.created_at,
      requirement_title: r.requirements?.title ?? "(deleted)",
      requirement_status: r.requirements?.status ?? "draft",
    };
  });
}

export type ProjectApiContract = {
  groups: ApiGroup[];
  endpoints: ApiEndpoint[];
  parameters: ApiParameter[];
  requestBodies: ApiRequestBody[];
  responses: ApiResponse[];
  errors: ApiError[];
  endpointEntities: LinkedEntity[];
  endpointRequirements: LinkedRequirement[];
};

export async function loadProjectApiContract(
  projectId: string,
): Promise<ProjectApiContract> {
  const supabase = await createClient();

  const [groupsR, endpointsR, parametersR, requestBodiesR, responsesR, errorsR, linksER, linksRR] =
    await Promise.all([
      supabase.from("api_groups").select("*").eq("project_id", projectId),
      supabase.from("api_endpoints").select("*").eq("project_id", projectId),
      supabase.from("api_parameters").select("*, api_endpoints!inner(project_id)").eq(
        "api_endpoints.project_id",
        projectId,
      ),
      supabase.from("api_request_bodies").select("*, api_endpoints!inner(project_id)").eq(
        "api_endpoints.project_id",
        projectId,
      ),
      supabase
        .from("api_responses")
        .select("*, api_endpoints!inner(project_id)")
        .eq("api_endpoints.project_id", projectId),
      supabase
        .from("api_errors")
        .select("*, api_endpoints!inner(project_id)")
        .eq("api_endpoints.project_id", projectId),
      supabase
        .from("api_endpoint_entities")
        .select("id, endpoint_id, entity_id, role, created_at, entities(name, domain_id, domains(name)), api_endpoints!inner(project_id)")
        .eq("api_endpoints.project_id", projectId),
      supabase
        .from("api_endpoint_requirements")
        .select("id, endpoint_id, requirement_id, created_at, requirements(title, status), api_endpoints!inner(project_id)")
        .eq("api_endpoints.project_id", projectId),
    ]);

  return {
    groups: groupsR.data ?? [],
    endpoints: (endpointsR.data ?? []) as ApiEndpoint[],
    parameters: ((parametersR.data ?? []) as unknown as Array<ApiParameter & { api_endpoints: unknown }>).map(
      (p) => {
        const { api_endpoints: _ignored, ...rest } = p as ApiParameter & { api_endpoints: unknown };
        void _ignored;
        return rest;
      },
    ),
    requestBodies: ((requestBodiesR.data ?? []) as unknown as Array<ApiRequestBody & { api_endpoints: unknown }>).map(
      (b) => {
        const { api_endpoints: _ignored, ...rest } = b as ApiRequestBody & { api_endpoints: unknown };
        void _ignored;
        return rest;
      },
    ),
    responses: ((responsesR.data ?? []) as unknown as Array<ApiResponse & { api_endpoints: unknown }>).map(
      (r) => {
        const { api_endpoints: _ignored, ...rest } = r as ApiResponse & { api_endpoints: unknown };
        void _ignored;
        return rest;
      },
    ),
    errors: ((errorsR.data ?? []) as unknown as Array<ApiError & { api_endpoints: unknown }>).map(
      (e) => {
        const { api_endpoints: _ignored, ...rest } = e as ApiError & { api_endpoints: unknown };
        void _ignored;
        return rest;
      },
    ),
    endpointEntities: ((linksER.data ?? []) as unknown as Array<ApiEndpointEntity & {
      entities: { name: string; domain_id: string; domains: { name: string } | null };
    }>).map((row) => ({
      id: row.id,
      endpoint_id: row.endpoint_id,
      entity_id: row.entity_id,
      role: row.role,
      created_at: row.created_at,
      entity_name: row.entities?.name ?? "(deleted)",
      domain_name: row.entities?.domains?.name ?? "",
      domain_id: row.entities?.domain_id ?? "",
    })),
    endpointRequirements: ((linksRR.data ?? []) as unknown as Array<ApiEndpointRequirement & {
      requirements: { title: string; status: string };
    }>).map((row) => ({
      id: row.id,
      endpoint_id: row.endpoint_id,
      requirement_id: row.requirement_id,
      created_at: row.created_at,
      requirement_title: row.requirements?.title ?? "(deleted)",
      requirement_status: row.requirements?.status ?? "draft",
    })),
  };
}
