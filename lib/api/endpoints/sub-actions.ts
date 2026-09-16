"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  apiParameterInputSchema,
  apiParameterUpdateSchema,
  apiRequestBodyInputSchema,
  apiResponseInputSchema,
  apiResponseUpdateSchema,
  apiErrorInputSchema,
  apiErrorUpdateSchema,
  type ApiParameterActionState,
  type ApiRequestBodyActionState,
  type ApiResponseActionState,
  type ApiErrorActionState,
} from "@/lib/validation/api";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { getApiEndpoint, listApiResponsesByEndpoint } from "./queries";

async function assertEndpointOwnsProject(endpointId: string): Promise<
  { ok: true; projectId: string } | { ok: false; error: string }
> {
  const endpoint = await getApiEndpoint(endpointId);
  if (!endpoint) return { ok: false, error: "Endpoint not found." };
  const project = await getProject(endpoint.project_id);
  if (!project) return { ok: false, error: "Project not found." };
  return { ok: true, projectId: endpoint.project_id };
}

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeOpt(value: FormDataEntryValue | null): string | undefined {
  const norm = normalizeText(value);
  return norm === null ? undefined : norm;
}

function parseJsonField(value: FormDataEntryValue | null): {
  ok: true;
  value: null | unknown;
} | { ok: false; error: string } {
  const text = normalizeText(value);
  if (text === null) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, error: "is not valid JSON" };
  }
}

function jsonFieldValue(result: {
  ok: true;
  value: null | unknown;
} | { ok: false; error: string }): null | unknown {
  if (result.ok) return result.value;
  // Caller already checked `result.ok` before calling this.
  return null;
}

function parseRequiredField(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

// ============================================================================
// Parameters
// ============================================================================

export async function createApiParameter(
  _prev: ApiParameterActionState | null,
  formData: FormData,
): Promise<ApiParameterActionState> {
  const parsed = apiParameterInputSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    data_type: formData.get("data_type"),
    required: formData.get("required") ?? "",
    description: normalizeOpt(formData.get("description")),
    example: normalizeOpt(formData.get("example")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiParameterActionState["fieldErrors"],
    };
  }

  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("api_parameters").insert({
    endpoint_id: endpointId,
    name: parsed.data.name,
    location: parsed.data.location as
      | "path"
      | "query"
      | "header"
      | "cookie",
    data_type: parsed.data.data_type as
      | "string"
      | "integer"
      | "number"
      | "boolean"
      | "uuid"
      | "date"
      | "datetime",
    required: parseRequiredField(formData.get("required")),
    description: normalizeText(formData.get("description")) ?? null,
    example: normalizeText(formData.get("example")) ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function updateApiParameter(
  _prev: ApiParameterActionState | null,
  formData: FormData,
): Promise<ApiParameterActionState> {
  const parsed = apiParameterUpdateSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    data_type: formData.get("data_type"),
    required: formData.get("required") ?? "",
    description: normalizeOpt(formData.get("description")),
    example: normalizeOpt(formData.get("example")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiParameterActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Missing parameter reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_parameters")
    .update({
      name: parsed.data.name,
      location: parsed.data.location as
        | "path"
        | "query"
        | "header"
        | "cookie",
      data_type: parsed.data.data_type as
        | "string"
        | "integer"
        | "number"
        | "boolean"
        | "uuid"
        | "date"
        | "datetime",
      required: parseRequiredField(formData.get("required")),
      description: normalizeText(formData.get("description")) ?? null,
      example: normalizeText(formData.get("example")) ?? null,
    })
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function deleteApiParameter(formData: FormData) {
  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Invalid parameter reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_parameters")
    .delete()
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

// ============================================================================
// Request Body (single per endpoint — upsert)
// ============================================================================

export async function upsertApiRequestBody(
  _prev: ApiRequestBodyActionState | null,
  formData: FormData,
): Promise<ApiRequestBodyActionState> {
  const parsed = apiRequestBodyInputSchema.safeParse({
    content_type: formData.get("content_type"),
    description: normalizeOpt(formData.get("description")),
    schema_definition: normalizeOpt(formData.get("schema_definition")),
    example: normalizeOpt(formData.get("example")),
  });
  const fieldErrorsAccumulator: ApiRequestBodyActionState["fieldErrors"] = {};
  if (!parsed.success) {
    const e = parsed.error.flatten().fieldErrors as ApiRequestBodyActionState["fieldErrors"];
    Object.assign(fieldErrorsAccumulator, e);
  }

  const schemaParsed = parseJsonField(formData.get("schema_definition"));
  if (!schemaParsed.ok) {
    fieldErrorsAccumulator.schema_definition = [
      ...(fieldErrorsAccumulator.schema_definition ?? []),
      schemaParsed.error,
    ];
  }
  const exampleParsed = parseJsonField(formData.get("example"));
  if (!exampleParsed.ok) {
    fieldErrorsAccumulator.example = [
      ...(fieldErrorsAccumulator.example ?? []),
      exampleParsed.error,
    ];
  }
  if (Object.keys(fieldErrorsAccumulator).length > 0) {
    return { fieldErrors: fieldErrorsAccumulator };
  }

  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const payload = {
    endpoint_id: endpointId,
    content_type: parsed.data!.content_type,
    description: normalizeText(formData.get("description")) ?? null,
    schema_definition: jsonFieldValue(schemaParsed) as null,
    example: jsonFieldValue(exampleParsed) as null,
  };

  const { error } = await supabase
    .from("api_request_bodies")
    .upsert(payload, { onConflict: "endpoint_id" });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function deleteApiRequestBody(formData: FormData) {
  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Invalid request body reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_request_bodies")
    .delete()
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

// ============================================================================
// Responses
// ============================================================================

export async function createApiResponse(
  _prev: ApiResponseActionState | null,
  formData: FormData,
): Promise<ApiResponseActionState> {
  const fieldErrorsAccumulator: ApiResponseActionState["fieldErrors"] = {};
  const parsed = apiResponseInputSchema.safeParse({
    status_code: formData.get("status_code"),
    description: normalizeOpt(formData.get("description")),
    content_type: normalizeOpt(formData.get("content_type")),
    schema_definition: normalizeOpt(formData.get("schema_definition")),
    example: normalizeOpt(formData.get("example")),
  });
  if (!parsed.success) {
    const e = parsed.error.flatten().fieldErrors as ApiResponseActionState["fieldErrors"];
    Object.assign(fieldErrorsAccumulator, e);
  }
  const schemaParsed = parseJsonField(formData.get("schema_definition"));
  if (!schemaParsed.ok) {
    fieldErrorsAccumulator.schema_definition = [
      ...(fieldErrorsAccumulator.schema_definition ?? []),
      schemaParsed.error,
    ];
  }
  const exampleParsed = parseJsonField(formData.get("example"));
  if (!exampleParsed.ok) {
    fieldErrorsAccumulator.example = [
      ...(fieldErrorsAccumulator.example ?? []),
      exampleParsed.error,
    ];
  }
  if (Object.keys(fieldErrorsAccumulator).length > 0) {
    return { fieldErrors: fieldErrorsAccumulator };
  }

  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const existing = await listApiResponsesByEndpoint(endpointId);
  const position = existing.length;

  const { error } = await supabase.from("api_responses").insert({
    endpoint_id: endpointId,
    status_code: parsed.data!.status_code,
    description: normalizeText(formData.get("description")) ?? null,
    content_type: normalizeText(formData.get("content_type")) ?? null,
    schema_definition: jsonFieldValue(schemaParsed) as null,
    example: jsonFieldValue(exampleParsed) as null,
    position,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function updateApiResponse(
  _prev: ApiResponseActionState | null,
  formData: FormData,
): Promise<ApiResponseActionState> {
  const fieldErrorsAccumulator: ApiResponseActionState["fieldErrors"] = {};
  const parsed = apiResponseUpdateSchema.safeParse({
    status_code: formData.get("status_code"),
    description: normalizeOpt(formData.get("description")),
    content_type: normalizeOpt(formData.get("content_type")),
    schema_definition: normalizeOpt(formData.get("schema_definition")),
    example: normalizeOpt(formData.get("example")),
  });
  if (!parsed.success) {
    const e = parsed.error.flatten().fieldErrors as ApiResponseActionState["fieldErrors"];
    Object.assign(fieldErrorsAccumulator, e);
  }
  const schemaParsed = parseJsonField(formData.get("schema_definition"));
  if (!schemaParsed.ok) {
    fieldErrorsAccumulator.schema_definition = [
      ...(fieldErrorsAccumulator.schema_definition ?? []),
      schemaParsed.error,
    ];
  }
  const exampleParsed = parseJsonField(formData.get("example"));
  if (!exampleParsed.ok) {
    fieldErrorsAccumulator.example = [
      ...(fieldErrorsAccumulator.example ?? []),
      exampleParsed.error,
    ];
  }
  if (Object.keys(fieldErrorsAccumulator).length > 0) {
    return { fieldErrors: fieldErrorsAccumulator };
  }

  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Missing response reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_responses")
    .update({
      status_code: parsed.data!.status_code,
      description: normalizeText(formData.get("description")) ?? null,
      content_type: normalizeText(formData.get("content_type")) ?? null,
      schema_definition: jsonFieldValue(schemaParsed) as null,
      example: jsonFieldValue(exampleParsed) as null,
    })
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function deleteApiResponse(formData: FormData) {
  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Invalid response reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_responses")
    .delete()
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

// ============================================================================
// Errors
// ============================================================================

export async function createApiError(
  _prev: ApiErrorActionState | null,
  formData: FormData,
): Promise<ApiErrorActionState> {
  const parsed = apiErrorInputSchema.safeParse({
    code: formData.get("code"),
    message: formData.get("message"),
    description: normalizeOpt(formData.get("description")),
    http_status: formData.get("http_status") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiErrorActionState["fieldErrors"],
    };
  }

  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("api_errors").insert({
    endpoint_id: endpointId,
    code: parsed.data.code,
    message: parsed.data.message,
    description: normalizeText(formData.get("description")) ?? null,
    http_status:
      typeof parsed.data.http_status === "number"
        ? parsed.data.http_status
        : null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function updateApiError(
  _prev: ApiErrorActionState | null,
  formData: FormData,
): Promise<ApiErrorActionState> {
  const parsed = apiErrorUpdateSchema.safeParse({
    code: formData.get("code"),
    message: formData.get("message"),
    description: normalizeOpt(formData.get("description")),
    http_status: formData.get("http_status") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiErrorActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Missing error reference." };
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_errors")
    .update({
      code: parsed.data.code,
      message: parsed.data.message,
      description: normalizeText(formData.get("description")) ?? null,
      http_status:
        typeof parsed.data.http_status === "number"
          ? parsed.data.http_status
          : null,
    })
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function deleteApiError(formData: FormData) {
  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof endpointId !== "string" ||
    !endpointId
  ) {
    return { error: "Invalid error reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_errors")
    .delete()
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}
