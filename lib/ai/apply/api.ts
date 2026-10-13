import { createClient } from "@/lib/supabase/server";
import type {
  ApiHttpMethod,
  ApiParameterDataType,
  ApiParameterLocation,
  Json,
} from "@/lib/supabase/types";
import type {
  AiApiEndpointItem,
  AiApiErrorItem,
  AiApiGroupItem,
  AiApiItem,
  AiApiParameterItem,
  AiApiRequestBodyItem,
  AiApiResponseItem,
} from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

export type ApplyApiOptions = {
  projectId: string;
  userId: string;
  items: AiApiItem[];
  indices: number[];
};

export type ApiGroupRow = {
  name: string;
  prefix: string | null;
  description: string | null;
};

export type ApiEndpointRow = {
  name: string;
  method: ApiHttpMethod;
  path: string;
  summary: string | null;
  description: string | null;
  authentication_required: boolean;
  group_name: string;
};

export type ApiParameterRow = {
  name: string;
  location: ApiParameterLocation;
  data_type: ApiParameterDataType;
  required: boolean;
  description: string | null;
  example: string | null;
};

export type ApiRequestBodyRow = {
  content_type: string;
  description: string | null;
  schema_definition: Json | null;
  example: Json | null;
};

export type ApiResponseRow = {
  status_code: number;
  content_type: string | null;
  description: string | null;
  schema_definition: Json | null;
  example: Json | null;
};

export type ApiErrorRow = {
  code: string;
  message: string;
  http_status: number | null;
  description: string | null;
};

export function buildApiGroupRow(item: AiApiGroupItem): ApiGroupRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const prefix = item.prefix.trim();
  if (prefix.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  return {
    name,
    prefix: optionalText(prefix),
    description: optionalText(description),
  };
}

export function buildApiEndpointRow(
  item: AiApiEndpointItem,
): ApiEndpointRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const path = item.path.trim();
  if (path.length < 1 || path.length > 500) return null;
  if (!path.startsWith("/")) return null;
  const summary = item.summary.trim();
  if (summary.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const groupName = item.group_name.trim();
  if (groupName.length > 200) return null;
  return {
    name,
    method: item.method,
    path,
    summary: optionalText(summary),
    description: optionalText(description),
    authentication_required: item.authentication_required,
    group_name: groupName,
  };
}

export function buildApiParameterRow(
  item: AiApiParameterItem,
): ApiParameterRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  const example = item.example.trim();
  if (example.length > 1000) return null;
  return {
    name,
    location: item.location,
    data_type: item.data_type,
    required: item.required,
    description: optionalText(description),
    example: optionalText(example),
  };
}

export function buildApiRequestBodyRow(
  item: AiApiRequestBodyItem,
): ApiRequestBodyRow | null {
  const contentType = item.content_type.trim();
  if (contentType.length < 1 || contentType.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  return {
    content_type: contentType,
    description: optionalText(description),
    schema_definition: toJson(item.schema),
    example: toJson(item.example),
  };
}

export function buildApiResponseRow(
  item: AiApiResponseItem,
): ApiResponseRow | null {
  if (!Number.isInteger(item.status_code)) return null;
  if (item.status_code < 100 || item.status_code > 599) return null;
  const contentType = item.content_type.trim();
  if (contentType.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  return {
    status_code: item.status_code,
    content_type: optionalText(contentType),
    description: optionalText(description),
    schema_definition: toJson(item.schema),
    example: toJson(item.example),
  };
}

export function buildApiErrorRow(item: AiApiErrorItem): ApiErrorRow | null {
  const code = item.code.trim();
  if (code.length < 1 || code.length > 100) return null;
  const message = item.message.trim();
  if (message.length < 1 || message.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  const httpStatus = item.http_status ?? null;
  if (
    httpStatus !== null &&
    (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599)
  ) {
    return null;
  }
  return {
    code,
    message,
    http_status: httpStatus,
    description: optionalText(description),
  };
}







function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) return null;
  return value as Json;
}


type ApiBundleGroup = {
  index: number;
  name: string;
  prefix: string;
  description: string;
};

type ApiBundleEndpoint = {
  index: number;
  group_name: string;
  name: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  authentication_required: boolean;
  parameters: Array<{
    name: string;
    location: string;
    data_type: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  request_body: {
    content_type: string;
    description: string;
    schema: Json | null;
    example: Json | null;
  } | null;
  responses: Array<{
    status_code: number;
    content_type: string;
    description: string;
    schema: Json | null;
    example: Json | null;
  }>;
  errors: Array<{
    code: string;
    message: string;
    http_status: number | null;
    description: string;
  }>;
  entities: Array<{ entity_name: string; role: string }>;
  requirement_titles: string[];
};

// Pure builder: filters and validates the model output into the JSONB shape the
// apply_api_bundle function consumes. Invalid entries are recorded as skipped.
export function buildApiBundle(
  items: AiApiItem[],
  indices: number[],
): {
  groups: ApiBundleGroup[];
  endpoints: ApiBundleEndpoint[];
  skipped: ApplyItemOutcome[];
} {
  const groups: ApiBundleGroup[] = [];
  const endpoints: ApiBundleEndpoint[] = [];
  const skipped: ApplyItemOutcome[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "group") {
      const row = buildApiGroupRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      groups.push({
        index,
        name: row.name,
        prefix: row.prefix ?? "",
        description: row.description ?? "",
      });
      continue;
    }

    const label = `${item.method} ${item.path}`;
    const row = buildApiEndpointRow(item);
    if (!row) {
      skipped.push({ kind: "skipped", index, title: label, reason: "invalid" });
      continue;
    }

    const parameters: ApiBundleEndpoint["parameters"] = [];
    for (const parameterItem of item.parameters) {
      const parameterRow = buildApiParameterRow(parameterItem);
      if (!parameterRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${parameterItem.name}`,
          reason: "invalid",
        });
        continue;
      }
      parameters.push({
        name: parameterRow.name,
        location: parameterRow.location,
        data_type: parameterRow.data_type,
        required: parameterRow.required,
        description: parameterRow.description ?? "",
        example: parameterRow.example ?? "",
      });
    }

    let requestBody: ApiBundleEndpoint["request_body"] = null;
    if (item.request_body) {
      const bodyRow = buildApiRequestBodyRow(item.request_body);
      if (!bodyRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → request body`,
          reason: "invalid",
        });
      } else {
        requestBody = {
          content_type: bodyRow.content_type,
          description: bodyRow.description ?? "",
          schema: bodyRow.schema_definition,
          example: bodyRow.example,
        };
      }
    }

    const responses: ApiBundleEndpoint["responses"] = [];
    for (const responseItem of item.responses) {
      const responseRow = buildApiResponseRow(responseItem);
      if (!responseRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${responseItem.status_code}`,
          reason: "invalid",
        });
        continue;
      }
      responses.push({
        status_code: responseRow.status_code,
        content_type: responseRow.content_type ?? "",
        description: responseRow.description ?? "",
        schema: responseRow.schema_definition,
        example: responseRow.example,
      });
    }

    const errors: ApiBundleEndpoint["errors"] = [];
    for (const errorItem of item.errors) {
      const errorRow = buildApiErrorRow(errorItem);
      if (!errorRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${errorItem.code}`,
          reason: "invalid",
        });
        continue;
      }
      errors.push({
        code: errorRow.code,
        message: errorRow.message,
        http_status: errorRow.http_status,
        description: errorRow.description ?? "",
      });
    }

    endpoints.push({
      index,
      group_name: row.group_name,
      name: row.name,
      method: row.method,
      path: row.path,
      summary: row.summary ?? "",
      description: row.description ?? "",
      authentication_required: row.authentication_required,
      parameters,
      request_body: requestBody,
      responses,
      errors,
      entities: item.entities.map((link) => ({
        entity_name: link.entity_name,
        role: link.role,
      })),
      requirement_titles: item.requirement_titles,
    });
  }

  return { groups, endpoints, skipped };
}

export async function applyApiBundleToProject(
  options: ApplyApiOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const built = buildApiBundle(options.items, options.indices);
  out.skipped.push(...built.skipped);

  if (built.groups.length === 0 && built.endpoints.length === 0) {
    return out;
  }

  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_api_bundle", {
    p_project_id: options.projectId,
    p_groups: built.groups,
    p_endpoints: built.endpoints,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
  }

  return out;
}
