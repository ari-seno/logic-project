import type { ProjectBundle } from "@/lib/export/bundle";
import type {
  LinkedEntity,
  LinkedRequirement,
} from "@/lib/api/endpoints/queries";
import type {
  ApiEndpoint,
  ApiError,
  ApiGroup,
  ApiParameter,
  ApiResponse,
  ArchitectureComponent,
  ArchitectureComponentDependency,
  ArchitectureDecision,
  ArchitectureTechnology,
  Decision,
  Domain,
  Entity,
  EntityAttribute,
  EntityRelationship,
  Project,
  Requirement,
  Task,
  TaskApiEndpointLink,
  TaskArchitectureComponentLink,
  TaskDecisionLink,
  TaskDependency,
  TaskDomainLink,
  TaskRequirementLink,
  TaskUiScreenLink,
  UiComponent,
  UiForm,
  UiFormField,
  UiInteraction,
  UiInteractionEndpoint,
  UiNavigationItem,
  UiScreen,
  UiScreenComponent,
  UiScreenEntity,
  UiScreenRequirement,
  UiState,
} from "@/lib/supabase/types";

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

function base(id: string, project_id: string) {
  return {
    id,
    project_id,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export function makeBundle(
  overrides: Partial<ProjectBundle> = {},
): ProjectBundle {
  const projectId = "p1";

  const project: Project = {
    ...base(projectId, projectId),
    owner_id: "u1",
    name: "Library Management System",
    description: "A system to manage books and loans.",
    ai_credential_id: null,
  };

  const requirements: Requirement[] = [
    {
      ...base("req1", projectId),
      title: "Book catalog search",
      description: "Members can search the catalog.",
      type: "functional",
      status: "approved",
      priority: "high",
    },
    {
      ...base("req2", projectId),
      title: "Search p95 under 300ms",
      description: "Search must stay fast.",
      type: "non_functional",
      status: "draft",
      priority: "medium",
    },
  ];

  const decisions: Decision[] = [
    {
      ...base("dec1", projectId),
      title: "Use PostgreSQL",
      context: "Need a relational store.",
      decision: "Adopt PostgreSQL.",
      rationale: "Strong relational guarantees.",
      status: "accepted",
    },
  ];

  const domains: Domain[] = [
    {
      ...base("dom1", projectId),
      name: "Catalog",
      description: "Books and members.",
    },
  ];

  const entities: Entity[] = [
    {
      ...base("ent1", projectId),
      domain_id: "dom1",
      name: "Book",
      description: "A book in the catalog.",
    },
    {
      ...base("ent2", projectId),
      domain_id: "dom1",
      name: "Member",
      description: "A library member.",
    },
  ];

  const attributes: EntityAttribute[] = [
    {
      ...base("attr1", projectId),
      entity_id: "ent1",
      name: "id",
      data_type: "uuid",
      is_required: true,
      is_primary_key: true,
      default_value: "gen_random_uuid()",
      description: "Primary key",
      position: 1,
    },
    {
      ...base("attr2", projectId),
      entity_id: "ent1",
      name: "title",
      data_type: "string",
      is_required: true,
      is_primary_key: false,
      default_value: null,
      description: "Book title",
      position: 2,
    },
    {
      ...base("attr3", projectId),
      entity_id: "ent1",
      name: "isbn",
      data_type: "string",
      is_required: false,
      is_primary_key: false,
      default_value: null,
      description: null,
      position: 3,
    },
    {
      ...base("attr4", projectId),
      entity_id: "ent2",
      name: "id",
      data_type: "uuid",
      is_required: true,
      is_primary_key: true,
      default_value: "gen_random_uuid()",
      description: null,
      position: 1,
    },
    {
      ...base("attr5", projectId),
      entity_id: "ent2",
      name: "email",
      data_type: "string",
      is_required: true,
      is_primary_key: false,
      default_value: null,
      description: null,
      position: 2,
    },
  ];

  const relationships: EntityRelationship[] = [
    {
      ...base("rel1", projectId),
      source_entity_id: "ent2",
      target_entity_id: "ent1",
      relationship_type: "one_to_many",
      name: "loans",
      description: "A member has many books on loan.",
    },
  ];

  const components: ArchitectureComponent[] = [
    {
      ...base("comp1", projectId),
      name: "Web API",
      description: "Next.js route handlers.",
      type: "backend",
      position: 1,
    },
    {
      ...base("comp2", projectId),
      name: "PostgreSQL",
      description: "Primary datastore.",
      type: "database",
      position: 2,
    },
  ];

  const technologies: ArchitectureTechnology[] = [
    {
      ...base("tech1", projectId),
      name: "Next.js",
      description: "Full-stack React framework.",
      category: "framework",
    },
  ];

  const architectureDecisions: ArchitectureDecision[] = [
    {
      ...base("adec1", projectId),
      title: "Server-first rendering",
      context: "Data is read-heavy.",
      decision: "Render on the server.",
      rationale: "Simpler data access.",
      status: "accepted",
    },
  ];

  const dependencies: ArchitectureComponentDependency[] = [
    {
      ...base("dep1", projectId),
      source_component_id: "comp1",
      target_component_id: "comp2",
      description: "Reads and writes through SQL.",
    },
  ];

  const apiGroups: ApiGroup[] = [
    {
      ...base("grp1", projectId),
      name: "Catalog",
      description: "Book catalog endpoints.",
      prefix: "/api/catalog",
      position: 1,
    },
  ];

  const apiEndpoints: ApiEndpoint[] = [
    {
      ...base("ep1", projectId),
      group_id: "grp1",
      name: "Search books",
      method: "GET",
      path: "/api/catalog/books",
      summary: "Search the book catalog",
      description: "Returns books matching the query.",
      authentication_required: false,
      position: 1,
    },
    {
      ...base("ep2", projectId),
      group_id: "grp1",
      name: "Create loan",
      method: "POST",
      path: "/api/catalog/loans",
      summary: null,
      description: null,
      authentication_required: true,
      position: 2,
    },
  ];

  const apiParameters: ApiParameter[] = [
    {
      ...base("param1", projectId),
      endpoint_id: "ep1",
      name: "q",
      location: "query",
      data_type: "string",
      required: false,
      description: "Search term",
      example: "dune",
      position: 1,
    },
  ];

  const apiResponses: ApiResponse[] = [
    {
      ...base("resp1", projectId),
      endpoint_id: "ep1",
      status_code: 200,
      description: "Matching books",
      content_type: "application/json",
      schema_definition: { type: "array" },
      example: null,
      position: 1,
    },
  ];

  const apiErrors: ApiError[] = [
    {
      ...base("err1", projectId),
      endpoint_id: "ep1",
      code: "INVALID_QUERY",
      message: "Query is invalid",
      description: "Returned when q is malformed.",
      http_status: 400,
    },
  ];

  const endpointEntities: LinkedEntity[] = [
    {
      ...base("ee1", projectId),
      endpoint_id: "ep1",
      entity_id: "ent1",
      role: "primary_resource",
      entity_name: "Book",
      domain_id: "dom1",
      domain_name: "Catalog",
    },
  ];

  const endpointRequirements: LinkedRequirement[] = [
    {
      ...base("er1", projectId),
      endpoint_id: "ep1",
      requirement_id: "req1",
      requirement_title: "Book catalog search",
      requirement_status: "approved",
    },
  ];

  const screens: UiScreen[] = [
    {
      ...base("scr1", projectId),
      name: "Book list",
      route: "/books",
      screen_type: "list",
      description: "Browse the catalog.",
      purpose: "Let members find books.",
      authentication_required: false,
      position: 1,
    },
  ];

  const uiComponents: UiComponent[] = [
    {
      ...base("uic1", projectId),
      name: "BookCard",
      component_type: "card",
      description: "Book summary card.",
      purpose: "Show a book at a glance.",
      technology: "React",
      position: 1,
    },
  ];

  const screenComponents: UiScreenComponent[] = [
    {
      ...base("sc1", projectId),
      screen_id: "scr1",
      component_id: "uic1",
      parent_id: null,
      label: "Book grid",
      description: null,
      position: 1,
      required: true,
    },
  ];

  const forms: UiForm[] = [
    {
      ...base("form1", projectId),
      screen_id: "scr1",
      name: "Search form",
      description: "Search the catalog.",
      submit_label: "Search",
      success_behavior: "Reload the list",
    },
  ];

  const formFields: UiFormField[] = [
    {
      ...base("ff1", projectId),
      form_id: "form1",
      name: "q",
      label: "Search",
      field_type: "text",
      required: false,
      placeholder: "Title or author",
      help_text: null,
      default_value: null,
      position: 1,
    },
  ];

  const states: UiState[] = [
    {
      ...base("st1", projectId),
      screen_id: "scr1",
      name: "Empty",
      state_type: "empty",
      description: "No books found.",
      behavior: "Show a hint.",
    },
  ];

  const interactions: UiInteraction[] = [
    {
      ...base("int1", projectId),
      screen_id: "scr1",
      name: "Submit search",
      trigger: "Search button",
      action: "Fetch matching books",
      description: null,
    },
  ];

  const interactionEndpoints: UiInteractionEndpoint[] = [
    {
      ...base("ie1", projectId),
      interaction_id: "int1",
      endpoint_id: "ep1",
    },
  ];

  const screenRequirements: UiScreenRequirement[] = [
    {
      ...base("sr1", projectId),
      screen_id: "scr1",
      requirement_id: "req1",
    },
  ];

  const screenEntities: UiScreenEntity[] = [
    {
      ...base("se1", projectId),
      screen_id: "scr1",
      entity_id: "ent1",
      role: "displayed",
    },
  ];

  const navigation: UiNavigationItem[] = [
    {
      ...base("nav1", projectId),
      name: "books",
      label: "Books",
      route: "/books",
      parent_id: null,
      position: 1,
      description: "Catalog navigation item.",
    },
  ];

  const tasks: Task[] = [
    {
      ...base("task1", projectId),
      parent_task_id: null,
      title: "Build catalog search",
      description: "Implement the search endpoint.",
      task_type: "feature",
      status: "in_progress",
      priority: "high",
      estimated_effort: "m",
      acceptance_criteria: "Search returns matches.",
      implementation_notes: "Use a Postgres index.",
      position: 1,
    },
    {
      ...base("task2", projectId),
      parent_task_id: "task1",
      title: "Add search index",
      description: "Index title and author.",
      task_type: "testing",
      status: "todo",
      priority: "medium",
      estimated_effort: "s",
      acceptance_criteria: null,
      implementation_notes: null,
      position: 1,
    },
  ];

  const taskDependencies: TaskDependency[] = [
    {
      ...base("tdep1", projectId),
      task_id: "task2",
      depends_on_task_id: "task1",
      dependency_type: "related",
      description: "Subtask of the search work.",
    },
  ];

  const taskRequirements: TaskRequirementLink[] = [
    { ...base("tr1", projectId), task_id: "task1", requirement_id: "req1" },
  ];
  const taskDecisions: TaskDecisionLink[] = [
    { ...base("td1", projectId), task_id: "task1", decision_id: "dec1" },
  ];
  const taskDomains: TaskDomainLink[] = [
    { ...base("tdo1", projectId), task_id: "task1", entity_id: "ent1" },
  ];
  const taskArchitectureComponents: TaskArchitectureComponentLink[] = [
    { ...base("tac1", projectId), task_id: "task1", component_id: "comp1" },
  ];
  const taskApiEndpoints: TaskApiEndpointLink[] = [
    { ...base("tae1", projectId), task_id: "task1", endpoint_id: "ep1" },
  ];
  const taskUiScreens: TaskUiScreenLink[] = [
    { ...base("tus1", projectId), task_id: "task1", screen_id: "scr1" },
  ];

  const bundle: ProjectBundle = {
    project,
    requirements,
    decisions,
    domains,
    entities,
    attributes,
    relationships,
    architecture: {
      components,
      technologies,
      decisions: architectureDecisions,
      dependencies,
    },
    api: {
      groups: apiGroups,
      endpoints: apiEndpoints,
      parameters: apiParameters,
      requestBodies: [],
      responses: apiResponses,
      errors: apiErrors,
      endpointEntities,
      endpointRequirements,
    },
    ui: {
      screens,
      components: uiComponents,
      screenComponents,
      forms,
      formFields,
      states,
      interactions,
      interactionEndpoints,
      screenRequirements,
      screenEntities,
      navigation,
    },
    tasks,
    taskDependencies,
    taskLinks: {
      requirements: taskRequirements,
      decisions: taskDecisions,
      domains: taskDomains,
      architectureComponents: taskArchitectureComponents,
      apiEndpoints: taskApiEndpoints,
      uiScreens: taskUiScreens,
    },
  };

  return { ...bundle, ...overrides };
}

export function makeEmptyBundle(): ProjectBundle {
  return makeBundle({
    requirements: [],
    decisions: [],
    domains: [],
    entities: [],
    attributes: [],
    relationships: [],
    architecture: {
      components: [],
      technologies: [],
      decisions: [],
      dependencies: [],
    },
    api: {
      groups: [],
      endpoints: [],
      parameters: [],
      requestBodies: [],
      responses: [],
      errors: [],
      endpointEntities: [],
      endpointRequirements: [],
    },
    ui: {
      screens: [],
      components: [],
      screenComponents: [],
      forms: [],
      formFields: [],
      states: [],
      interactions: [],
      interactionEndpoints: [],
      screenRequirements: [],
      screenEntities: [],
      navigation: [],
    },
    tasks: [],
    taskDependencies: [],
    taskLinks: {
      requirements: [],
      decisions: [],
      domains: [],
      architectureComponents: [],
      apiEndpoints: [],
      uiScreens: [],
    },
  });
}
