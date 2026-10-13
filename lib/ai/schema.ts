import { z } from "zod";

import {
  AI_SUGGESTION_STATUSES,
  AI_TEST_STATUSES,
  API_ENDPOINT_ENTITY_ROLES,
  API_HTTP_METHODS,
  API_PARAMETER_DATA_TYPES,
  API_PARAMETER_LOCATIONS,
  ARCHITECTURE_COMPONENT_TYPES,
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
  ENTITY_DATA_TYPES,
  RELATIONSHIP_TYPES,
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_TYPES,
  UI_COMPONENT_TYPES,
  UI_FIELD_TYPES,
  UI_SCREEN_ENTITY_ROLES,
  UI_SCREEN_TYPES,
  UI_STATE_TYPES,
} from "@/lib/supabase/types";

export const aiTestStatusSchema = z.enum(AI_TEST_STATUSES);
export const aiSuggestionStatusSchema = z.enum(AI_SUGGESTION_STATUSES);

// Models occasionally invent an enum value that is not in our allowed list
// (for example "cache" or "monitoring" for architecture technology categories).
// Rejecting the whole response for one such value loses an otherwise valid
// suggestion, so unknown values are normalised: exact matches are kept,
// common synonyms are mapped onto the closest allowed value, and anything else
// falls back to the provided fallback (usually "other").
function tolerantEnum<const T extends readonly [string, ...string[]]>(
  values: T,
  options: { fallback: T[number]; synonyms?: Record<string, T[number]> },
) {
  const allowed = new Set<string>(values);
  const synonyms = new Map<string, string>(
    Object.entries(options.synonyms ?? {}).map(([key, target]) => [
      normalizeEnumKey(key),
      target,
    ]),
  );

  return z
    .string()
    .trim()
    .transform((raw) => {
      const key = normalizeEnumKey(raw);
      if (allowed.has(raw)) return raw;
      const synonym = synonyms.get(key);
      if (synonym) return synonym;
      if (allowed.has(key)) return key;
      return options.fallback;
    })
    .pipe(z.enum(values));
}

function normalizeEnumKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export const aiRequirementTypeSchema = tolerantEnum(
  ["functional", "non_functional", "business"] as const,
  {
    fallback: "functional",
    synonyms: {
      nonfunctional: "non_functional",
      nonfunctional_requirement: "non_functional",
      quality: "non_functional",
      business_requirement: "business",
      user: "functional",
      technical: "non_functional",
      system: "functional",
    },
  },
);

export const aiRequirementPrioritySchema = tolerantEnum(
  ["must", "should", "could", "wont"] as const,
  {
    fallback: "should",
    synonyms: {
      must_have: "must",
      required: "must",
      critical: "must",
      high: "should",
      should_have: "should",
      medium: "could",
      could_have: "could",
      low: "could",
      wont_have: "wont",
      optional: "could",
      nice_to_have: "could",
    },
  },
);

export const aiRequirementItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  type: aiRequirementTypeSchema,
  priority: aiRequirementPrioritySchema,
  description: z.string().trim().min(10).max(2000),
});

export const aiRequirementsResponseSchema = z.object({
  requirements: z.array(aiRequirementItemSchema).min(1).max(15),
});

export const aiDecisionItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  context: z.string().trim().max(5000),
  decision: z.string().trim().min(1).max(2000),
  rationale: z.string().trim().max(5000),
});

export const aiDecisionsResponseSchema = z.object({
  decisions: z.array(aiDecisionItemSchema).min(1).max(15),
});

const aiErdNameSchema = z.string().trim().min(1).max(120);
const aiErdDescriptionSchema = z.string().trim().max(5000).default("");

export const aiErdAttributeSchema = z.object({
  name: aiErdNameSchema,
  data_type: tolerantEnum(ENTITY_DATA_TYPES, {
    fallback: "string",
    synonyms: {
      int: "integer",
      bigint: "integer",
      float: "decimal",
      double: "decimal",
      numeric: "decimal",
      money: "decimal",
      bool: "boolean",
      timestamp: "datetime",
      time: "datetime",
      jsonb: "json",
      object: "json",
      array: "json",
      enum: "string",
      varchar: "string",
      char: "string",
      blob: "text",
      uuidv4: "uuid",
    },
  }),
  is_required: z.boolean().default(false),
  is_primary_key: z.boolean().default(false),
  description: aiErdDescriptionSchema,
});

export const aiErdRelationshipSchema = z.object({
  target_entity: aiErdNameSchema,
  relationship_type: tolerantEnum(RELATIONSHIP_TYPES, {
    fallback: "one_to_many",
    synonyms: {
      one_to_one_: "one_to_one",
      has_one: "one_to_one",
      has_many: "one_to_many",
      one_to_many_: "one_to_many",
      belongs_to: "many_to_one",
      many_to_one_: "many_to_one",
      many_to_many_: "many_to_many",
      has_and_belongs_to_many: "many_to_many",
    },
  }),
  name: z.string().trim().max(200).default(""),
  description: aiErdDescriptionSchema,
});

export const aiErdEntitySchema = z.object({
  name: aiErdNameSchema,
  description: aiErdDescriptionSchema,
  attributes: z.array(aiErdAttributeSchema).min(1).max(30),
  relationships: z.array(aiErdRelationshipSchema).max(20).default([]),
});

export const aiErdDomainItemSchema = z.object({
  name: aiErdNameSchema,
  description: aiErdDescriptionSchema,
  entities: z.array(aiErdEntitySchema).min(1).max(15),
});

export const aiErdResponseSchema = z.object({
  domains: z.array(aiErdDomainItemSchema).min(1).max(8),
});

const aiArchitectureNameSchema = z.string().trim().min(1).max(120);
const aiArchitectureDescriptionSchema = z.string().trim().max(5000).default("");

export const aiArchitectureDependencySchema = z.object({
  target_component: aiArchitectureNameSchema,
  description: aiArchitectureDescriptionSchema,
});

export const aiArchitectureComponentSchema = z.object({
  name: aiArchitectureNameSchema,
  type: tolerantEnum(ARCHITECTURE_COMPONENT_TYPES, {
    fallback: "other",
    synonyms: {
      api: "backend",
      service: "backend",
      server: "backend",
      web: "frontend",
      ui: "frontend",
      mobile: "frontend",
      datastore: "database",
      db: "database",
      message_bus: "queue",
      broker: "queue",
      stream: "queue",
      object_storage: "storage",
      blob_storage: "storage",
      auth: "authentication",
      monitoring: "infrastructure",
      logging: "infrastructure",
      observability: "infrastructure",
      gateway: "infrastructure",
      cdn: "infrastructure",
      cloud: "infrastructure",
      container: "infrastructure",
    },
  }),
  description: aiArchitectureDescriptionSchema,
  depends_on: z.array(aiArchitectureDependencySchema).max(20).default([]),
});

export const aiArchitectureTechnologySchema = z.object({
  name: aiArchitectureNameSchema,
  category: tolerantEnum(ARCHITECTURE_TECHNOLOGY_CATEGORIES, {
    fallback: "other",
    synonyms: {
      cache: "infrastructure",
      caching: "infrastructure",
      message_bus: "infrastructure",
      broker: "infrastructure",
      queue: "infrastructure",
      streaming: "infrastructure",
      monitoring: "infrastructure",
      observability: "infrastructure",
      logging: "infrastructure",
      dashboard: "infrastructure",
      visualization: "infrastructure",
      encryption: "infrastructure",
      secrets: "infrastructure",
      security: "authentication",
      auth: "authentication",
      storage: "hosting",
      object_storage: "hosting",
      cloud: "hosting",
      cdn: "hosting",
      container: "infrastructure",
      orchestration: "infrastructure",
      ci: "infrastructure",
      build: "infrastructure",
      tooling: "other",
      library: "package",
      dependencies: "package",
      orm: "package",
      validator: "package",
      styling: "framework",
      css: "framework",
      state_management: "framework",
      runtime: "language",
      database_driver: "package",
    },
  }),
  description: aiArchitectureDescriptionSchema,
});

export const aiArchitectureDecisionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  context: z.string().trim().max(5000),
  decision: z.string().trim().min(1).max(2000),
  rationale: z.string().trim().max(5000),
});

export const aiArchitectureResponseSchema = z
  .object({
    components: z.array(aiArchitectureComponentSchema).max(20).default([]),
    technologies: z.array(aiArchitectureTechnologySchema).max(20).default([]),
    decisions: z.array(aiArchitectureDecisionSchema).max(15).default([]),
  })
  .refine(
    (value) =>
      value.components.length + value.technologies.length + value.decisions.length >
      0,
    { message: "At least one component, technology, or decision is required." },
  );

export type AiRequirementItem = z.infer<typeof aiRequirementItemSchema>;
export type AiRequirementsResponse = z.infer<typeof aiRequirementsResponseSchema>;
export type AiDecisionItem = z.infer<typeof aiDecisionItemSchema>;
export type AiDecisionsResponse = z.infer<typeof aiDecisionsResponseSchema>;
export type AiErdAttributeItem = z.infer<typeof aiErdAttributeSchema>;
export type AiErdRelationshipItem = z.infer<typeof aiErdRelationshipSchema>;
export type AiErdEntityItem = z.infer<typeof aiErdEntitySchema>;
export type AiErdDomainItem = z.infer<typeof aiErdDomainItemSchema>;
export type AiErdResponse = z.infer<typeof aiErdResponseSchema>;
export type AiArchitectureComponentItem = z.infer<
  typeof aiArchitectureComponentSchema
>;
export type AiArchitectureTechnologyItem = z.infer<
  typeof aiArchitectureTechnologySchema
>;
export type AiArchitectureDecisionItem = z.infer<
  typeof aiArchitectureDecisionSchema
>;
export type AiArchitectureDependencyItem = z.infer<
  typeof aiArchitectureDependencySchema
>;
export type AiArchitectureResponse = z.infer<typeof aiArchitectureResponseSchema>;

export type AiArchitectureItem =
  | ({ kind: "component" } & AiArchitectureComponentItem)
  | ({ kind: "technology" } & AiArchitectureTechnologyItem)
  | ({ kind: "decision" } & AiArchitectureDecisionItem);

export function flattenArchitectureResponse(
  response: AiArchitectureResponse,
): AiArchitectureItem[] {
  return [
    ...response.components.map(
      (item): AiArchitectureItem => ({ kind: "component", ...item }),
    ),
    ...response.technologies.map(
      (item): AiArchitectureItem => ({ kind: "technology", ...item }),
    ),
    ...response.decisions.map(
      (item): AiArchitectureItem => ({ kind: "decision", ...item }),
    ),
  ];
}

const aiApiNameSchema = z.string().trim().min(1).max(120);
const aiApiDescriptionSchema = z.string().trim().max(5000).default("");
const aiApiDetailSchema = z.string().trim().max(2000).default("");
const aiApiExampleTextSchema = z.string().trim().max(1000).default("");

const aiApiJsonSchema = z
  .union([z.record(z.string(), z.unknown()), z.array(z.unknown()), z.null()])
  .default(null);

export const aiApiGroupItemSchema = z.object({
  name: aiApiNameSchema,
  prefix: z.string().trim().max(200).default(""),
  description: aiApiDescriptionSchema,
});

export const aiApiParameterSchema = z.object({
  name: aiApiNameSchema,
  location: tolerantEnum(API_PARAMETER_LOCATIONS, {
    fallback: "query",
    synonyms: {
      body: "query",
      url: "path",
      route: "path",
      url_param: "path",
      query_param: "query",
      querystring: "query",
      header_param: "header",
      http_header: "header",
    },
  }),
  data_type: tolerantEnum(API_PARAMETER_DATA_TYPES, {
    fallback: "string",
    synonyms: {
      int: "integer",
      long: "integer",
      float: "number",
      double: "number",
      decimal: "number",
      bool: "boolean",
      timestamp: "datetime",
      date_time: "datetime",
      json: "string",
      object: "string",
      array: "string",
      guid: "uuid",
    },
  }),
  required: z.boolean().default(false),
  description: aiApiDetailSchema,
  example: aiApiExampleTextSchema,
});

export const aiApiRequestBodySchema = z.object({
  content_type: aiApiNameSchema,
  description: aiApiDetailSchema,
  schema: aiApiJsonSchema,
  example: aiApiJsonSchema,
});

export const aiApiResponseItemSchema = z.object({
  status_code: z.number().int().min(100).max(599),
  content_type: z.string().trim().max(200).default(""),
  description: aiApiDetailSchema,
  schema: aiApiJsonSchema,
  example: aiApiJsonSchema,
});

export const aiApiErrorItemSchema = z.object({
  code: aiApiNameSchema,
  message: z.string().trim().min(1).max(500),
  http_status: z.number().int().min(100).max(599).nullish().default(null),
  description: aiApiDetailSchema,
});

export const aiApiEntityLinkSchema = z.object({
  entity_name: aiApiNameSchema,
  role: tolerantEnum(API_ENDPOINT_ENTITY_ROLES, {
    fallback: "related_resource",
    synonyms: {
      primary: "primary_resource",
      resource: "primary_resource",
      request: "request_resource",
      response: "response_resource",
      input: "request_resource",
      output: "response_resource",
      related: "related_resource",
    },
  }),
});

export const aiApiEndpointItemSchema = z.object({
  group_name: z.string().trim().max(120).default(""),
  method: tolerantEnum(API_HTTP_METHODS, {
    fallback: "GET",
    synonyms: { head: "GET", options: "GET", read: "GET" },
  }),
  path: z.string().trim().min(1).max(500),
  name: aiApiNameSchema,
  summary: z.string().trim().max(500).default(""),
  description: aiApiDescriptionSchema,
  authentication_required: z.boolean().default(true),
  parameters: z.array(aiApiParameterSchema).max(20).default([]),
  request_body: aiApiRequestBodySchema.nullish().default(null),
  responses: z.array(aiApiResponseItemSchema).max(10).default([]),
  errors: z.array(aiApiErrorItemSchema).max(10).default([]),
  entities: z.array(aiApiEntityLinkSchema).max(10).default([]),
  requirement_titles: z
    .array(z.string().trim().min(1).max(200))
    .max(10)
    .default([]),
});

export const aiApiResponseSchema = z
  .object({
    groups: z.array(aiApiGroupItemSchema).max(20).default([]),
    endpoints: z.array(aiApiEndpointItemSchema).max(25).default([]),
  })
  .refine(
    (value) => value.groups.length + value.endpoints.length > 0,
    { message: "At least one group or endpoint is required." },
  );

export type AiApiGroupItem = z.infer<typeof aiApiGroupItemSchema>;
export type AiApiParameterItem = z.infer<typeof aiApiParameterSchema>;
export type AiApiRequestBodyItem = z.infer<typeof aiApiRequestBodySchema>;
export type AiApiResponseItem = z.infer<typeof aiApiResponseItemSchema>;
export type AiApiErrorItem = z.infer<typeof aiApiErrorItemSchema>;
export type AiApiEntityLinkItem = z.infer<typeof aiApiEntityLinkSchema>;
export type AiApiEndpointItem = z.infer<typeof aiApiEndpointItemSchema>;
export type AiApiResponse = z.infer<typeof aiApiResponseSchema>;

export type AiApiItem =
  | ({ kind: "group" } & AiApiGroupItem)
  | ({ kind: "endpoint" } & AiApiEndpointItem);

export function flattenApiResponse(response: AiApiResponse): AiApiItem[] {
  return [
    ...response.groups.map((item): AiApiItem => ({ kind: "group", ...item })),
    ...response.endpoints.map(
      (item): AiApiItem => ({ kind: "endpoint", ...item }),
    ),
  ];
}

const aiUiNameSchema = z.string().trim().min(1).max(120);
const aiUiDescriptionSchema = z.string().trim().max(5000).default("");
const aiUiDetailSchema = z.string().trim().max(2000).default("");

export const aiUiPlacementSchema = z.object({
  component_name: aiUiNameSchema,
  label: z.string().trim().max(200).default(""),
  description: aiUiDetailSchema,
  required: z.boolean().default(false),
  parent_label: z.string().trim().max(200).default(""),
});

export const aiUiScreenEntityLinkSchema = z.object({
  entity_name: aiUiNameSchema,
  role: tolerantEnum(UI_SCREEN_ENTITY_ROLES, {
    fallback: "related",
    synonyms: {
      view: "displayed",
      show: "displayed",
      create: "created",
      insert: "created",
      edit: "edited",
      update: "edited",
      delete: "deleted",
      remove: "deleted",
      filter: "filtered",
      search: "filtered",
      select: "selected",
      pick: "selected",
    },
  }),
});

export const aiUiScreenItemSchema = z.object({
  name: aiUiNameSchema,
  route: z.string().trim().max(500).default(""),
  screen_type: tolerantEnum(UI_SCREEN_TYPES, {
    fallback: "page",
    synonyms: {
      screen: "page",
      popup: "modal",
      overlay: "modal",
      edit: "form",
      create: "form",
      index: "list",
      table: "list",
      view: "detail",
      login: "authentication",
      signin: "authentication",
      register: "authentication",
      error_page: "error",
      home: "dashboard",
    },
  }),
  description: aiUiDescriptionSchema,
  purpose: aiUiDetailSchema,
  authentication_required: z.boolean().default(true),
  placements: z.array(aiUiPlacementSchema).max(20).default([]),
  entities: z.array(aiUiScreenEntityLinkSchema).max(10).default([]),
  requirement_titles: z
    .array(z.string().trim().min(1).max(200))
    .max(10)
    .default([]),
});

export const aiUiComponentItemSchema = z.object({
  name: aiUiNameSchema,
  component_type: tolerantEnum(UI_COMPONENT_TYPES, {
    fallback: "other",
    synonyms: {
      navbar: "navigation",
      menu: "navigation",
      breadcrumb: "navigation",
      container: "layout",
      grid: "layout",
      section: "layout",
      panel: "card",
      tile: "card",
      datagrid: "table",
      timeline: "list",
      dropdown: "select",
      combobox: "select",
      toggle: "checkbox",
      switch: "checkbox",
      cta: "button",
      popup: "modal",
      sheet: "drawer",
      toast: "notification",
      graph: "chart",
      graphql: "other",
    },
  }),
  description: aiUiDescriptionSchema,
  purpose: aiUiDetailSchema,
  technology: z.string().trim().max(200).default(""),
});

export const aiUiResponseSchema = z
  .object({
    components: z.array(aiUiComponentItemSchema).max(25).default([]),
    screens: z.array(aiUiScreenItemSchema).max(25).default([]),
  })
  .refine(
    (value) => value.components.length + value.screens.length > 0,
    { message: "At least one component or screen is required." },
  );

export type AiUiPlacementItem = z.infer<typeof aiUiPlacementSchema>;
export type AiUiScreenEntityLinkItem = z.infer<
  typeof aiUiScreenEntityLinkSchema
>;
export type AiUiScreenItem = z.infer<typeof aiUiScreenItemSchema>;
export type AiUiComponentItem = z.infer<typeof aiUiComponentItemSchema>;
export type AiUiResponse = z.infer<typeof aiUiResponseSchema>;

export type AiUiItem =
  | ({ kind: "component" } & AiUiComponentItem)
  | ({ kind: "screen" } & AiUiScreenItem);

export function flattenUiResponse(response: AiUiResponse): AiUiItem[] {
  return [
    ...response.components.map(
      (item): AiUiItem => ({ kind: "component", ...item }),
    ),
    ...response.screens.map((item): AiUiItem => ({ kind: "screen", ...item })),
  ];
}

const aiUiDetailFieldTypeSchema = tolerantEnum(UI_FIELD_TYPES, {
  fallback: "text",
  synonyms: {
    string: "text",
    string_field: "text",
    integer: "number",
    decimal: "number",
    int: "number",
    float: "number",
    bool: "checkbox",
    boolean: "checkbox",
    multiselect: "select",
    dropdown: "select",
    combobox: "select",
    textarea_field: "textarea",
    long_text: "textarea",
    email_address: "email",
    timestamp: "datetime",
    date_time: "datetime",
    upload: "file",
  },
});

const aiUiDetailStateTypeSchema = tolerantEnum(UI_STATE_TYPES, {
  fallback: "default",
  synonyms: {
    initial: "default",
    normal: "default",
    loading_state: "loading",
    spinner: "loading",
    no_data: "empty",
    success_state: "success",
    failure: "error",
    error_state: "error",
    validation: "validation_error",
    invalid: "validation_error",
    not_found_state: "not_found",
    unauthorised: "unauthorized",
    forbidden_state: "forbidden",
    offline_state: "offline",
  },
});

const aiUiDetailStateNameSchema = z.string().trim().min(1).max(200);

export const aiUiDetailFieldSchema = z.object({
  name: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(200),
  field_type: aiUiDetailFieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(500).default(""),
  help_text: z.string().trim().max(2000).default(""),
  default_value: z.string().trim().max(2000).default(""),
});

export const aiUiDetailFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  submit_label: z.string().trim().max(100).default(""),
  success_behavior: z.string().trim().max(2000).default(""),
  fields: z.array(aiUiDetailFieldSchema).max(30).default([]),
});

export const aiUiDetailStateSchema = z.object({
  name: aiUiDetailStateNameSchema,
  state_type: aiUiDetailStateTypeSchema,
  description: z.string().trim().max(3000).default(""),
  behavior: z.string().trim().max(5000).default(""),
});

export const aiUiDetailInteractionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  trigger: z.string().trim().min(1).max(500),
  action: z.string().trim().min(1).max(2000),
  description: z.string().trim().max(5000).default(""),
  endpoint_labels: z
    .array(z.string().trim().min(1).max(200))
    .max(10)
    .default([]),
});

export const aiUiDetailScreenItemSchema = z.object({
  screen_name: aiUiNameSchema,
  forms: z.array(aiUiDetailFormSchema).max(10).default([]),
  states: z.array(aiUiDetailStateSchema).max(15).default([]),
  interactions: z.array(aiUiDetailInteractionSchema).max(15).default([]),
});

export const aiUiDetailNavigationItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(200),
  route: z.string().trim().max(500).default(""),
  description: z.string().trim().max(5000).default(""),
  parent_label: z.string().trim().max(200).default(""),
  screen_names: z.array(aiUiNameSchema).max(10).default([]),
});

export const aiUiDetailResponseSchema = z
  .object({
    screens: z.array(aiUiDetailScreenItemSchema).max(25).default([]),
    navigation: z.array(aiUiDetailNavigationItemSchema).max(25).default([]),
  })
  .refine(
    (value) => value.screens.length + value.navigation.length > 0,
    { message: "At least one screen detail or navigation item is required." },
  );

export type AiUiDetailFieldItem = z.infer<typeof aiUiDetailFieldSchema>;
export type AiUiDetailFormItem = z.infer<typeof aiUiDetailFormSchema>;
export type AiUiDetailStateItem = z.infer<typeof aiUiDetailStateSchema>;
export type AiUiDetailInteractionItem = z.infer<
  typeof aiUiDetailInteractionSchema
>;
export type AiUiDetailScreenItem = z.infer<typeof aiUiDetailScreenItemSchema>;
export type AiUiDetailNavigationItem = z.infer<
  typeof aiUiDetailNavigationItemSchema
>;
export type AiUiDetailResponse = z.infer<typeof aiUiDetailResponseSchema>;

export type AiUiDetailItem =
  | ({ kind: "screen" } & AiUiDetailScreenItem)
  | ({ kind: "navigation" } & AiUiDetailNavigationItem);

export function flattenUiDetailResponse(
  response: AiUiDetailResponse,
): AiUiDetailItem[] {
  return [
    ...response.screens.map(
      (item): AiUiDetailItem => ({ kind: "screen", ...item }),
    ),
    ...response.navigation.map(
      (item): AiUiDetailItem => ({ kind: "navigation", ...item }),
    ),
  ];
}

export type SuggestSuccess<TItem> = {
  ok: true;
  suggestionId: string;
  items: TItem[];
  model: string;
  provider: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    durationMs: number;
  };
};

export type SuggestFailure = {
  ok: false;
  code:
    | "ai_setup_required"
    | "ollama_error"
    | "ollama_auth_error"
    | "ollama_unreachable"
    | "ollama_rate_limit"
    | "ollama_timeout"
    | "zod_retry_failed"
    | "credential_test_failed"
    | "quota_exceeded"
    | "unknown";
  message: string;
};

export type SuggestResult<TItem> = SuggestSuccess<TItem> | SuggestFailure;

export type AiApplyCreated = { index: number; id: string; title: string };
export type AiApplySkipped = {
  index: number;
  title: string;
  reason: "duplicate" | "invalid";
};

export type AiApplyResult =
  | { ok: true; created: AiApplyCreated[]; skipped: AiApplySkipped[] }
  | { ok: false; error: string };
const aiTaskTitleSchema = z.string().trim().min(1).max(200);
const aiTaskDescriptionSchema = z.string().trim().max(5000).default("");
const aiTaskLongTextSchema = z.string().trim().max(10000).default("");

export const aiTaskLinkSchema = z.object({
  kind: tolerantEnum(
    ["requirement", "decision", "entity", "component", "endpoint", "screen"],
    {
      fallback: "requirement",
      synonyms: {
        requirements: "requirement",
        decisions: "decision",
        entities: "entity",
        domain: "entity",
        model: "entity",
        components: "component",
        architecture: "component",
        service: "component",
        endpoints: "endpoint",
        api: "endpoint",
        route: "endpoint",
        screens: "screen",
        ui: "screen",
        page: "screen",
      },
    },
  ),
  name: aiTaskTitleSchema,
});

export const aiTaskItemSchema = z.object({
  title: aiTaskTitleSchema,
  task_type: tolerantEnum(TASK_TYPES, {
    fallback: "other",
    synonyms: {
      chore: "other",
      task: "other",
      improvement: "refactor",
      enhancement: "feature",
      story: "feature",
      fix: "bug",
      hotfix: "bug",
      db: "database",
      schema: "database",
      migration: "database",
      api: "backend",
      server: "backend",
      web: "frontend",
      ui: "frontend",
      devops: "infrastructure",
      deploy: "infrastructure",
      ci: "infrastructure",
      qa: "testing",
      test: "testing",
      docs: "documentation",
      auth: "security",
      hardening: "security",
    },
  }),
  priority: tolerantEnum(TASK_PRIORITIES, {
    fallback: "medium",
    synonyms: {
      urgent: "critical",
      blocker: "critical",
      p0: "critical",
      p1: "high",
      major: "high",
      normal: "medium",
      p2: "medium",
      minor: "low",
      p3: "low",
      trivial: "low",
    },
  }).default("medium"),
  estimated_effort: tolerantEnum(TASK_EFFORTS, {
    fallback: "m",
    synonyms: {
      xsmall: "xs",
      extra_small: "xs",
      tiny: "xs",
      small: "s",
      medium: "m",
      moderate: "m",
      large: "l",
      xlarge: "xl",
      extra_large: "xl",
      huge: "xl",
    },
  })
    .nullable()
    .default(null),
  description: aiTaskDescriptionSchema,
  acceptance_criteria: aiTaskLongTextSchema,
  implementation_notes: aiTaskLongTextSchema,
  parent_title: z.string().trim().max(200).default(""),
  depends_on: z
    .array(z.string().trim().min(1).max(200))
    .max(10)
    .default([]),
  links: z.array(aiTaskLinkSchema).max(15).default([]),
});

export const aiTasksResponseSchema = z.object({
  tasks: z.array(aiTaskItemSchema).min(1).max(25),
});

export type AiTaskLinkItem = z.infer<typeof aiTaskLinkSchema>;
export type AiTaskItem = z.infer<typeof aiTaskItemSchema>;
export type AiTasksResponse = z.infer<typeof aiTasksResponseSchema>;
