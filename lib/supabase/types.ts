export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export const REQUIREMENT_TYPES = [
  "functional",
  "non_functional",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const REQUIREMENT_STATUSES = [
  "draft",
  "approved",
  "rejected",
  "implemented",
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export const REQUIREMENT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];

export type Requirement = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: RequirementType;
  status: RequirementStatus;
  priority: RequirementPriority;
  created_at: string;
  updated_at: string;
};

export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export type Decision = {
  id: string;
  project_id: string;
  title: string;
  context: string | null;
  decision: string;
  rationale: string | null;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
};

export type Domain = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Entity = {
  id: string;
  domain_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const ENTITY_DATA_TYPES = [
  "uuid",
  "string",
  "text",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "json",
] as const;
export type EntityDataType = (typeof ENTITY_DATA_TYPES)[number];

export type EntityAttribute = {
  id: string;
  entity_id: string;
  name: string;
  data_type: EntityDataType;
  is_required: boolean;
  is_primary_key: boolean;
  default_value: string | null;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export const RELATIONSHIP_TYPES = [
  "one_to_one",
  "one_to_many",
  "many_to_one",
  "many_to_many",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type EntityRelationship = {
  id: string;
  project_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const ARCHITECTURE_COMPONENT_TYPES = [
  "frontend",
  "backend",
  "database",
  "authentication",
  "storage",
  "external_service",
  "infrastructure",
  "worker",
  "queue",
  "cache",
  "other",
] as const;
export type ArchitectureComponentType =
  (typeof ARCHITECTURE_COMPONENT_TYPES)[number];

export const ARCHITECTURE_TECHNOLOGY_CATEGORIES = [
  "language",
  "framework",
  "database",
  "authentication",
  "hosting",
  "infrastructure",
  "testing",
  "package",
  "external_service",
  "other",
] as const;
export type ArchitectureTechnologyCategory =
  (typeof ARCHITECTURE_TECHNOLOGY_CATEGORIES)[number];

export const ARCHITECTURE_DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
] as const;
export type ArchitectureDecisionStatus =
  (typeof ARCHITECTURE_DECISION_STATUSES)[number];

export type ArchitectureComponent = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  type: ArchitectureComponentType;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ArchitectureTechnology = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  category: ArchitectureTechnologyCategory;
  created_at: string;
  updated_at: string;
};

export type ArchitectureDecision = {
  id: string;
  project_id: string;
  title: string;
  context: string | null;
  decision: string | null;
  rationale: string | null;
  status: ArchitectureDecisionStatus;
  created_at: string;
  updated_at: string;
};

export type ArchitectureComponentDependency = {
  id: string;
  project_id: string;
  source_component_id: string;
  target_component_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const API_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;
export type ApiHttpMethod = (typeof API_HTTP_METHODS)[number];

export const API_PARAMETER_LOCATIONS = ["path", "query", "header", "cookie"] as const;
export type ApiParameterLocation = (typeof API_PARAMETER_LOCATIONS)[number];

export const API_PARAMETER_DATA_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "uuid",
  "date",
  "datetime",
] as const;
export type ApiParameterDataType = (typeof API_PARAMETER_DATA_TYPES)[number];

export const API_ENDPOINT_ENTITY_ROLES = [
  "primary_resource",
  "request_resource",
  "response_resource",
  "related_resource",
] as const;
export type ApiEndpointEntityRole = (typeof API_ENDPOINT_ENTITY_ROLES)[number];

export type ApiGroup = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  prefix: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ApiEndpoint = {
  id: string;
  project_id: string;
  group_id: string | null;
  name: string;
  method: ApiHttpMethod;
  path: string;
  summary: string | null;
  description: string | null;
  authentication_required: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ApiParameter = {
  id: string;
  endpoint_id: string;
  name: string;
  location: ApiParameterLocation;
  data_type: ApiParameterDataType;
  required: boolean;
  description: string | null;
  example: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ApiRequestBody = {
  id: string;
  endpoint_id: string;
  content_type: string;
  description: string | null;
  schema_definition: Json | null;
  example: Json | null;
  created_at: string;
  updated_at: string;
};

export type ApiResponse = {
  id: string;
  endpoint_id: string;
  status_code: number;
  description: string | null;
  content_type: string | null;
  schema_definition: Json | null;
  example: Json | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ApiError = {
  id: string;
  endpoint_id: string;
  code: string;
  message: string;
  description: string | null;
  http_status: number | null;
  created_at: string;
  updated_at: string;
};

export type ApiEndpointEntity = {
  id: string;
  endpoint_id: string;
  entity_id: string;
  role: ApiEndpointEntityRole;
  created_at: string;
};

export type ApiEndpointRequirement = {
  id: string;
  endpoint_id: string;
  requirement_id: string;
  created_at: string;
};

export const UI_SCREEN_TYPES = [
  "page",
  "modal",
  "drawer",
  "dialog",
  "wizard",
  "dashboard",
  "form",
  "list",
  "detail",
  "settings",
  "authentication",
  "error",
  "other",
] as const;
export type UiScreenType = (typeof UI_SCREEN_TYPES)[number];

export const UI_COMPONENT_TYPES = [
  "layout",
  "navigation",
  "header",
  "footer",
  "sidebar",
  "card",
  "table",
  "list",
  "form",
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "button",
  "modal",
  "dialog",
  "drawer",
  "tabs",
  "badge",
  "alert",
  "notification",
  "chart",
  "custom",
  "other",
] as const;
export type UiComponentType = (typeof UI_COMPONENT_TYPES)[number];

export const UI_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "password",
  "number",
  "date",
  "datetime",
  "select",
  "checkbox",
  "radio",
  "file",
  "hidden",
  "other",
] as const;
export type UiFieldType = (typeof UI_FIELD_TYPES)[number];

export const UI_STATE_TYPES = [
  "default",
  "loading",
  "empty",
  "success",
  "error",
  "disabled",
  "unauthorized",
  "forbidden",
  "not_found",
  "validation_error",
  "offline",
  "custom",
] as const;
export type UiStateType = (typeof UI_STATE_TYPES)[number];

export const UI_SCREEN_ENTITY_ROLES = [
  "displayed",
  "created",
  "edited",
  "deleted",
  "filtered",
  "selected",
  "related",
] as const;
export type UiScreenEntityRole = (typeof UI_SCREEN_ENTITY_ROLES)[number];

export type UiScreen = {
  id: string;
  project_id: string;
  name: string;
  route: string | null;
  screen_type: UiScreenType;
  description: string | null;
  purpose: string | null;
  authentication_required: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type UiComponent = {
  id: string;
  project_id: string;
  name: string;
  component_type: UiComponentType;
  description: string | null;
  purpose: string | null;
  technology: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type UiScreenComponent = {
  id: string;
  screen_id: string;
  component_id: string;
  parent_id: string | null;
  label: string | null;
  description: string | null;
  position: number;
  required: boolean;
  created_at: string;
  updated_at: string;
};

export type UiForm = {
  id: string;
  screen_id: string;
  name: string;
  description: string | null;
  submit_label: string | null;
  success_behavior: string | null;
  created_at: string;
  updated_at: string;
};

export type UiFormField = {
  id: string;
  form_id: string;
  name: string;
  label: string;
  field_type: UiFieldType;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type UiState = {
  id: string;
  screen_id: string;
  name: string;
  state_type: UiStateType;
  description: string | null;
  behavior: string | null;
  created_at: string;
  updated_at: string;
};

export type UiInteraction = {
  id: string;
  screen_id: string;
  name: string;
  trigger: string;
  action: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type UiInteractionEndpoint = {
  id: string;
  interaction_id: string;
  endpoint_id: string;
  created_at: string;
};

export type UiScreenRequirement = {
  id: string;
  screen_id: string;
  requirement_id: string;
  created_at: string;
};

export type UiScreenEntity = {
  id: string;
  screen_id: string;
  entity_id: string;
  role: UiScreenEntityRole;
  created_at: string;
};

export type UiNavigationItem = {
  id: string;
  project_id: string;
  name: string;
  label: string;
  route: string | null;
  parent_id: string | null;
  position: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type UiNavigationScreen = {
  id: string;
  navigation_item_id: string;
  screen_id: string;
  created_at: string;
};

type Tables = {
  profiles: {
    Row: Profile;
    Insert: {
      id: string;
      email: string;
      display_name?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      email?: string;
      display_name?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  projects: {
    Row: Project;
    Insert: {
      id?: string;
      owner_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      owner_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  requirements: {
    Row: Requirement;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      description?: string | null;
      type: RequirementType;
      status: RequirementStatus;
      priority: RequirementPriority;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      description?: string | null;
      type?: RequirementType;
      status?: RequirementStatus;
      priority?: RequirementPriority;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  decisions: {
    Row: Decision;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      context?: string | null;
      decision: string;
      rationale?: string | null;
      status: DecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      context?: string | null;
      decision?: string;
      rationale?: string | null;
      status?: DecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  domains: {
    Row: Domain;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entities: {
    Row: Entity;
    Insert: {
      id?: string;
      domain_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      domain_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entity_attributes: {
    Row: EntityAttribute;
    Insert: {
      id?: string;
      entity_id: string;
      name: string;
      data_type: EntityDataType;
      is_required?: boolean;
      is_primary_key?: boolean;
      default_value?: string | null;
      description?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      entity_id?: string;
      name?: string;
      data_type?: EntityDataType;
      is_required?: boolean;
      is_primary_key?: boolean;
      default_value?: string | null;
      description?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entity_relationships: {
    Row: EntityRelationship;
    Insert: {
      id?: string;
      project_id: string;
      source_entity_id: string;
      target_entity_id: string;
      relationship_type: RelationshipType;
      name?: string | null;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      source_entity_id?: string;
      target_entity_id?: string;
      relationship_type?: RelationshipType;
      name?: string | null;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_components: {
    Row: ArchitectureComponent;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      type: ArchitectureComponentType;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      type?: ArchitectureComponentType;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_technologies: {
    Row: ArchitectureTechnology;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      category: ArchitectureTechnologyCategory;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      category?: ArchitectureTechnologyCategory;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_decisions: {
    Row: ArchitectureDecision;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      context?: string | null;
      decision?: string | null;
      rationale?: string | null;
      status?: ArchitectureDecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      context?: string | null;
      decision?: string | null;
      rationale?: string | null;
      status?: ArchitectureDecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_component_dependencies: {
    Row: ArchitectureComponentDependency;
    Insert: {
      id?: string;
      project_id: string;
      source_component_id: string;
      target_component_id: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      source_component_id?: string;
      target_component_id?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_groups: {
    Row: ApiGroup;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      prefix?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      prefix?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_endpoints: {
    Row: ApiEndpoint;
    Insert: {
      id?: string;
      project_id: string;
      group_id?: string | null;
      name: string;
      method: ApiHttpMethod;
      path: string;
      summary?: string | null;
      description?: string | null;
      authentication_required?: boolean;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      group_id?: string | null;
      name?: string;
      method?: ApiHttpMethod;
      path?: string;
      summary?: string | null;
      description?: string | null;
      authentication_required?: boolean;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_parameters: {
    Row: ApiParameter;
    Insert: {
      id?: string;
      endpoint_id: string;
      name: string;
      location: ApiParameterLocation;
      data_type: ApiParameterDataType;
      required?: boolean;
      description?: string | null;
      example?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      name?: string;
      location?: ApiParameterLocation;
      data_type?: ApiParameterDataType;
      required?: boolean;
      description?: string | null;
      example?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_request_bodies: {
    Row: ApiRequestBody;
    Insert: {
      id?: string;
      endpoint_id: string;
      content_type: string;
      description?: string | null;
      schema_definition?: Json | null;
      example?: Json | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      content_type?: string;
      description?: string | null;
      schema_definition?: Json | null;
      example?: Json | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_responses: {
    Row: ApiResponse;
    Insert: {
      id?: string;
      endpoint_id: string;
      status_code: number;
      description?: string | null;
      content_type?: string | null;
      schema_definition?: Json | null;
      example?: Json | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      status_code?: number;
      description?: string | null;
      content_type?: string | null;
      schema_definition?: Json | null;
      example?: Json | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_errors: {
    Row: ApiError;
    Insert: {
      id?: string;
      endpoint_id: string;
      code: string;
      message: string;
      description?: string | null;
      http_status?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      code?: string;
      message?: string;
      description?: string | null;
      http_status?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  api_endpoint_entities: {
    Row: ApiEndpointEntity;
    Insert: {
      id?: string;
      endpoint_id: string;
      entity_id: string;
      role: ApiEndpointEntityRole;
      created_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      entity_id?: string;
      role?: ApiEndpointEntityRole;
      created_at?: string;
    };
    Relationships: [];
  };
  api_endpoint_requirements: {
    Row: ApiEndpointRequirement;
    Insert: {
      id?: string;
      endpoint_id: string;
      requirement_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      endpoint_id?: string;
      requirement_id?: string;
      created_at?: string;
    };
    Relationships: [];
  };
  ui_screens: {
    Row: UiScreen;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      route?: string | null;
      screen_type: UiScreenType;
      description?: string | null;
      purpose?: string | null;
      authentication_required?: boolean;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      route?: string | null;
      screen_type?: UiScreenType;
      description?: string | null;
      purpose?: string | null;
      authentication_required?: boolean;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_components: {
    Row: UiComponent;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      component_type: UiComponentType;
      description?: string | null;
      purpose?: string | null;
      technology?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      component_type?: UiComponentType;
      description?: string | null;
      purpose?: string | null;
      technology?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_screen_components: {
    Row: UiScreenComponent;
    Insert: {
      id?: string;
      screen_id: string;
      component_id: string;
      parent_id?: string | null;
      label?: string | null;
      description?: string | null;
      position?: number;
      required?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      component_id?: string;
      parent_id?: string | null;
      label?: string | null;
      description?: string | null;
      position?: number;
      required?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_forms: {
    Row: UiForm;
    Insert: {
      id?: string;
      screen_id: string;
      name: string;
      description?: string | null;
      submit_label?: string | null;
      success_behavior?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      name?: string;
      description?: string | null;
      submit_label?: string | null;
      success_behavior?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_form_fields: {
    Row: UiFormField;
    Insert: {
      id?: string;
      form_id: string;
      name: string;
      label: string;
      field_type: UiFieldType;
      required?: boolean;
      placeholder?: string | null;
      help_text?: string | null;
      default_value?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      form_id?: string;
      name?: string;
      label?: string;
      field_type?: UiFieldType;
      required?: boolean;
      placeholder?: string | null;
      help_text?: string | null;
      default_value?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_states: {
    Row: UiState;
    Insert: {
      id?: string;
      screen_id: string;
      name: string;
      state_type: UiStateType;
      description?: string | null;
      behavior?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      name?: string;
      state_type?: UiStateType;
      description?: string | null;
      behavior?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_interactions: {
    Row: UiInteraction;
    Insert: {
      id?: string;
      screen_id: string;
      name: string;
      trigger: string;
      action: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      name?: string;
      trigger?: string;
      action?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_interaction_endpoints: {
    Row: UiInteractionEndpoint;
    Insert: {
      id?: string;
      interaction_id: string;
      endpoint_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      interaction_id?: string;
      endpoint_id?: string;
      created_at?: string;
    };
    Relationships: [];
  };
  ui_screen_requirements: {
    Row: UiScreenRequirement;
    Insert: {
      id?: string;
      screen_id: string;
      requirement_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      requirement_id?: string;
      created_at?: string;
    };
    Relationships: [];
  };
  ui_screen_entities: {
    Row: UiScreenEntity;
    Insert: {
      id?: string;
      screen_id: string;
      entity_id: string;
      role: UiScreenEntityRole;
      created_at?: string;
    };
    Update: {
      id?: string;
      screen_id?: string;
      entity_id?: string;
      role?: UiScreenEntityRole;
      created_at?: string;
    };
    Relationships: [];
  };
  ui_navigation_items: {
    Row: UiNavigationItem;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      label: string;
      route?: string | null;
      parent_id?: string | null;
      position?: number;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      label?: string;
      route?: string | null;
      parent_id?: string | null;
      position?: number;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  ui_navigation_screens: {
    Row: UiNavigationScreen;
    Insert: {
      id?: string;
      navigation_item_id: string;
      screen_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      navigation_item_id?: string;
      screen_id?: string;
      created_at?: string;
    };
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
