import { z } from "zod";

import {
  API_HTTP_METHODS,
  API_PARAMETER_DATA_TYPES,
  API_PARAMETER_LOCATIONS,
} from "@/lib/supabase/types";

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const prefixField = z
  .string()
  .trim()
  .max(200, "Prefix must be 200 characters or fewer")
  .optional()
  .or(z.literal(""));

export const apiGroupInputSchema = z.object({
  name: nameField,
  description: descriptionField,
  prefix: prefixField,
});

export const apiGroupUpdateSchema = apiGroupInputSchema;

export type ApiGroupInput = z.infer<typeof apiGroupInputSchema>;
export type ApiGroupUpdateInput = z.infer<typeof apiGroupUpdateSchema>;

export type ApiGroupActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "description" | "prefix", string[]>
  >;
};

export const apiMethodField = z.enum(
  API_HTTP_METHODS as unknown as [string, ...string[]],
);

const pathField = z
  .string()
  .trim()
  .min(1, "Path is required")
  .max(500, "Path must be 500 characters or fewer")
  .regex(/^\//, "Path must start with /");

const summaryField = z
  .string()
  .trim()
  .max(500, "Summary must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

export const apiEndpointInputSchema = z.object({
  name: nameField,
  method: apiMethodField,
  path: pathField,
  summary: summaryField,
  description: descriptionField,
  authentication_required: z.boolean().optional().default(true),
  group_id: z.string().uuid("Invalid group").optional().or(z.literal("")),
});

export const apiEndpointUpdateSchema = apiEndpointInputSchema;

export type ApiEndpointInput = z.infer<typeof apiEndpointInputSchema>;
export type ApiEndpointUpdateInput = z.infer<typeof apiEndpointUpdateSchema>;

export type ApiEndpointActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "name"
      | "method"
      | "path"
      | "summary"
      | "description"
      | "authentication_required"
      | "group_id",
      string[]
    >
  >;
};

const parameterNameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

export const apiParameterLocationField = z.enum(
  API_PARAMETER_LOCATIONS as unknown as [string, ...string[]],
);

export const apiParameterDataTypeField = z.enum(
  API_PARAMETER_DATA_TYPES as unknown as [string, ...string[]],
);

const parameterDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

const parameterExampleField = z
  .string()
  .trim()
  .max(1000, "Example must be 1000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const apiParameterInputSchema = z.object({
  name: parameterNameField,
  location: apiParameterLocationField,
  data_type: apiParameterDataTypeField,
  required: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional(),
  description: parameterDescriptionField,
  example: parameterExampleField,
});

export const apiParameterUpdateSchema = apiParameterInputSchema;

export type ApiParameterInput = z.infer<typeof apiParameterInputSchema>;
export type ApiParameterUpdateInput = z.infer<typeof apiParameterUpdateSchema>;

export type ApiParameterActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "name"
      | "location"
      | "data_type"
      | "description"
      | "example",
      string[]
    >
  >;
};

const contentTypeField = z
  .string()
  .trim()
  .min(1, "Content type is required")
  .max(200, "Content type must be 200 characters or fewer");

const requestBodyDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

const optionalJsonField = z
  .string()
  .trim()
  .max(20000, "JSON payload is too large")
  .optional()
  .or(z.literal(""));

export const apiRequestBodyInputSchema = z.object({
  content_type: contentTypeField,
  description: requestBodyDescriptionField,
  schema_definition: optionalJsonField,
  example: optionalJsonField,
});

export const apiRequestBodyUpdateSchema = apiRequestBodyInputSchema;

export type ApiRequestBodyInput = z.infer<typeof apiRequestBodyInputSchema>;
export type ApiRequestBodyUpdateInput = z.infer<typeof apiRequestBodyUpdateSchema>;

export type ApiRequestBodyActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "content_type"
      | "description"
      | "schema_definition"
      | "example"
      | "_json",
      string[]
    >
  >;
};

const statusCodeField = z
  .coerce
  .number()
  .int("Status code must be a whole number")
  .min(100, "Status code must be 100 or greater")
  .max(599, "Status code must be 599 or less");

const responseDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

const responseContentTypeField = z
  .string()
  .trim()
  .max(200, "Content type must be 200 characters or fewer")
  .optional()
  .or(z.literal(""));

export const apiResponseInputSchema = z.object({
  status_code: statusCodeField,
  description: responseDescriptionField,
  content_type: responseContentTypeField,
  schema_definition: optionalJsonField,
  example: optionalJsonField,
});

export const apiResponseUpdateSchema = apiResponseInputSchema;

export type ApiResponseInput = z.infer<typeof apiResponseInputSchema>;
export type ApiResponseUpdateInput = z.infer<typeof apiResponseUpdateSchema>;

export type ApiResponseActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "status_code"
      | "description"
      | "content_type"
      | "schema_definition"
      | "example"
      | "_json",
      string[]
    >
  >;
};

const errorCodeField = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(100, "Code must be 100 characters or fewer");

const errorMessageField = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(500, "Message must be 500 characters or fewer");

const errorDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

const errorHttpStatusField = z
  .preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce
      .number()
      .int("HTTP status must be a whole number")
      .min(100, "HTTP status must be 100 or greater")
      .max(599, "HTTP status must be 599 or less")
      .optional(),
  );

export const apiErrorInputSchema = z.object({
  code: errorCodeField,
  message: errorMessageField,
  description: errorDescriptionField,
  http_status: errorHttpStatusField,
});

export const apiErrorUpdateSchema = apiErrorInputSchema;

export type ApiErrorInput = z.infer<typeof apiErrorInputSchema>;
export type ApiErrorUpdateInput = z.infer<typeof apiErrorUpdateSchema>;

export type ApiErrorActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "code" | "message" | "description" | "http_status",
      string[]
    >
  >;
};
