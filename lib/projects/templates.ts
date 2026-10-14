import type { ImportBundle } from "@/lib/import/bundle";

export interface ProjectTemplateSummary {
  id: string;
  label: string;
  description: string;
}

export interface ProjectTemplate extends ProjectTemplateSummary {
  build(): ImportBundle;
}

type TemplateRow = ImportBundle["requirements"][number];
type BundleParts = Omit<ImportBundle, "project">;

function bundle(
  project: { name: string; description: string },
  parts: Partial<BundleParts>,
): ImportBundle {
  return {
    project: { name: project.name, description: project.description },
    requirements: [],
    decisions: [],
    domains: [],
    entities: [],
    attributes: [],
    relationships: [],
    architecture: { components: [], technologies: [], decisions: [], dependencies: [] },
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
    ...parts,
  };
}

function requirement(
  id: string,
  title: string,
  type: TemplateRow["type"],
  status: TemplateRow["status"],
  priority: TemplateRow["priority"],
  description: string,
): TemplateRow {
  return { id, title, type, status, priority, description };
}

function decision(
  id: string,
  title: string,
  context: string,
  choice: string,
  rationale: string,
): TemplateRow {
  return {
    id,
    title,
    context,
    decision: choice,
    rationale,
    status: "proposed",
  };
}

function attribute(
  id: string,
  entityId: string,
  name: string,
  dataType: TemplateRow["data_type"],
  position: number,
  options: { required?: boolean; primaryKey?: boolean; description?: string } = {},
): TemplateRow {
  return {
    id,
    entity_id: entityId,
    name,
    data_type: dataType,
    is_required: options.required ?? false,
    is_primary_key: options.primaryKey ?? false,
    position,
    description: options.description ?? null,
  };
}

function primaryKey(id: string, entityId: string): TemplateRow {
  return attribute(id, entityId, "id", "uuid", 0, {
    required: true,
    primaryKey: true,
    description: "Surrogate primary key.",
  });
}

function component(
  id: string,
  name: string,
  type: TemplateRow["type"],
  position: number,
  description: string,
): TemplateRow {
  return { id, name, type, position, description };
}

function technology(
  id: string,
  name: string,
  category: TemplateRow["category"],
  description: string,
): TemplateRow {
  return { id, name, category, description };
}

function task(
  id: string,
  title: string,
  taskType: TemplateRow["task_type"],
  position: number,
  description: string,
): TemplateRow {
  return {
    id,
    title,
    task_type: taskType,
    status: "todo",
    priority: "medium",
    estimated_effort: null,
    description,
    position,
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "web-app-accounts",
    label: "Web app with accounts",
    description:
      "Sign-up, sign-in, profiles, and role-based access, modelling users and sessions.",
    build: () =>
      bundle(
        {
          name: "Web app with accounts",
          description:
            "A web application where people create accounts, sign in, manage their profile, and see only what their role allows.",
        },
        {
          requirements: [
            requirement(
              "req-signup",
              "People can create an account and sign in",
              "functional",
              "draft",
              "critical",
              "A visitor registers with an email address and password, then signs in with the same credentials.",
            ),
            requirement(
              "req-reset",
              "People can reset a forgotten password",
              "functional",
              "draft",
              "high",
              "A signed-out person requests a reset link by email and chooses a new password from it.",
            ),
            requirement(
              "req-profile",
              "People can view and edit their profile",
              "functional",
              "draft",
              "medium",
              "A signed-in person changes their display name and sees their account details.",
            ),
            requirement(
              "req-roles",
              "Access is limited by role",
              "functional",
              "draft",
              "high",
              "Pages and actions are only available to roles that are allowed to use them.",
            ),
            requirement(
              "req-audit",
              "Authentication events are recorded",
              "non_functional",
              "draft",
              "medium",
              "Sign-ins, failed sign-ins, and password resets are written to an audit trail.",
            ),
          ],
          decisions: [
            decision(
              "dec-sessions",
              "Session handling",
              "Users stay signed in across page loads and the app is server rendered.",
              "Use server-managed sessions stored in an HTTP-only cookie, not a token in local storage.",
              "Cookies can be marked HTTP-only and same-site, so scripts cannot read the session.",
            ),
            decision(
              "dec-identity-db",
              "Where identity lives",
              "Accounts need to be joined against application data.",
              "Keep the user record in the application database and reference it from every other table.",
              "A single user id keeps foreign keys simple and avoids a second source of truth.",
            ),
          ],
          domains: [
            {
              id: "dom-identity",
              name: "Identity",
              description: "Accounts, credentials, and the sessions they open.",
            },
          ],
          entities: [
            {
              id: "ent-user",
              domain_id: "dom-identity",
              name: "User",
              description: "A person with an account.",
            },
            {
              id: "ent-session",
              domain_id: "dom-identity",
              name: "Session",
              description: "One signed-in browser session for a user.",
            },
          ],
          attributes: [
            primaryKey("attr-user-id", "ent-user"),
            attribute("attr-user-email", "ent-user", "email", "string", 1, {
              required: true,
              description: "Login address, unique per user.",
            }),
            attribute("attr-user-name", "ent-user", "display_name", "string", 2, {
              description: "Name shown in the interface.",
            }),
            attribute("attr-user-role", "ent-user", "role", "string", 3, {
              required: true,
              description: "Role used for access checks.",
            }),
            primaryKey("attr-session-id", "ent-session"),
            attribute("attr-session-user", "ent-session", "user_id", "uuid", 1, {
              required: true,
              description: "The user this session belongs to.",
            }),
            attribute("attr-session-expires", "ent-session", "expires_at", "datetime", 2, {
              required: true,
              description: "When the session stops being valid.",
            }),
          ],
          relationships: [
            {
              id: "rel-session-user",
              source_entity_id: "ent-session",
              target_entity_id: "ent-user",
              relationship_type: "many_to_one",
              name: "belongs to",
              description: "Many sessions belong to one user.",
            },
          ],
          architecture: {
            components: [
              component("cmp-web", "Web App", "frontend", 0, "Server-rendered pages and forms."),
              component("cmp-auth", "Auth Service", "authentication", 1, "Sign-up, sign-in, and session handling."),
              component("cmp-db", "Application Database", "database", 2, "Stores accounts and application data."),
            ],
            technologies: [
              technology("tech-next", "Next.js", "framework", "Routing, rendering, and server actions."),
              technology("tech-pg", "PostgreSQL", "database", "Relational store for accounts and data."),
            ],
            decisions: [],
            dependencies: [
              { id: "dep-1", source_component_id: "cmp-web", target_component_id: "cmp-auth" },
              { id: "dep-2", source_component_id: "cmp-auth", target_component_id: "cmp-db" },
              { id: "dep-3", source_component_id: "cmp-web", target_component_id: "cmp-db" },
            ],
          },
          tasks: [
            task("task-schema", "Create the users and sessions tables", "database", 0, "Migrate the accounts schema."),
            task("task-auth", "Implement sign-up and sign-in", "feature", 1, "Registration, login, and session cookie."),
            task("task-protect", "Protect pages and actions by role", "security", 2, "Guard the signed-in area."),
            task("task-tests", "Write integration tests for auth", "testing", 3, "Cover sign-up, sign-in, and reset."),
          ],
        },
      ),
  },
  {
    id: "rest-api",
    label: "REST API backend",
    description:
      "A versioned JSON API with validation, pagination, key authentication, and rate limiting.",
    build: () =>
      bundle(
        {
          name: "REST API backend",
          description:
            "A versioned JSON API that other applications call, with request validation, pagination, API keys, and rate limiting.",
        },
        {
          requirements: [
            requirement(
              "req-versioning",
              "The API is versioned",
              "functional",
              "draft",
              "high",
              "Breaking changes ship under a new version prefix while old versions keep working.",
            ),
            requirement(
              "req-validation",
              "Requests are validated before they reach the database",
              "functional",
              "draft",
              "critical",
              "Malformed payloads are rejected with a clear error instead of being stored.",
            ),
            requirement(
              "req-pagination",
              "List endpoints are paginated",
              "functional",
              "draft",
              "high",
              "Collections return a page of results plus a cursor for the next page.",
            ),
            requirement(
              "req-keys",
              "Callers authenticate with API keys",
              "functional",
              "draft",
              "critical",
              "Each integration sends a key that identifies it.",
            ),
            requirement(
              "req-limits",
              "Requests are rate limited per key",
              "non_functional",
              "draft",
              "medium",
              "A caller that exceeds its quota receives a clear retry response.",
            ),
          ],
          decisions: [
            decision(
              "dec-json-rest",
              "API style",
              "Clients of several languages need to integrate quickly.",
              "Expose a JSON REST API over HTTPS with conventional status codes.",
              "Plain HTTP and JSON is the lowest common denominator and is easy to document.",
            ),
            decision(
              "dec-cursor",
              "Pagination strategy",
              "Collections grow while clients page through them.",
              "Paginate with an opaque cursor rather than an offset.",
              "A cursor stays correct when rows are inserted or removed between pages.",
            ),
          ],
          domains: [
            {
              id: "dom-api",
              name: "API Core",
              description: "The resources the API exposes and the keys that call it.",
            },
          ],
          entities: [
            {
              id: "ent-resource",
              domain_id: "dom-api",
              name: "Resource",
              description: "An addressable record exposed by the API.",
            },
            {
              id: "ent-key",
              domain_id: "dom-api",
              name: "ApiKey",
              description: "A credential a caller presents.",
            },
          ],
          attributes: [
            primaryKey("attr-res-id", "ent-resource"),
            attribute("attr-res-name", "ent-resource", "name", "string", 1, {
              required: true,
              description: "Human readable name.",
            }),
            attribute("attr-res-status", "ent-resource", "status", "string", 2, {
              required: true,
              description: "Current lifecycle state.",
            }),
            primaryKey("attr-key-id", "ent-key"),
            attribute("attr-key-hash", "ent-key", "key_hash", "string", 1, {
              required: true,
              description: "Hash of the key, never the key itself.",
            }),
            attribute("attr-key-quota", "ent-key", "rate_limit", "integer", 2, {
              required: true,
              description: "Requests allowed per minute.",
            }),
          ],
          relationships: [
            {
              id: "rel-res-key",
              source_entity_id: "ent-resource",
              target_entity_id: "ent-key",
              relationship_type: "many_to_one",
              name: "owned by",
              description: "Resources are owned by the key that created them.",
            },
          ],
          architecture: {
            components: [
              component("cmp-api", "Public API", "backend", 0, "HTTP handlers for every endpoint."),
              component("cmp-limiter", "Rate Limiter", "infrastructure", 1, "Enforces per-key request quotas."),
              component("cmp-db", "Primary Database", "database", 2, "Durable store for API resources."),
            ],
            technologies: [
              technology("tech-ts", "TypeScript", "language", "Shared types between handlers and clients."),
              technology("tech-pg", "PostgreSQL", "database", "Primary relational store."),
            ],
            decisions: [],
            dependencies: [
              { id: "dep-1", source_component_id: "cmp-api", target_component_id: "cmp-limiter" },
              { id: "dep-2", source_component_id: "cmp-api", target_component_id: "cmp-db" },
            ],
          },
          tasks: [
            task("task-scaffold", "Scaffold the API service", "infrastructure", 0, "Routing, config, and error handling."),
            task("task-keys", "Implement API key authentication", "security", 1, "Issue, hash, and verify keys."),
            task("task-lists", "Add the first list endpoint with cursor pagination", "backend", 2, "Return a page and a next cursor."),
            task("task-limits", "Enforce per-key rate limits", "backend", 3, "Reject over-quota calls with retry hints."),
          ],
        },
      ),
  },
  {
    id: "data-dashboard",
    label: "Data dashboard",
    description:
      "Import data, chart it on dashboards, filter by range, and refresh it on a schedule.",
    build: () =>
      bundle(
        {
          name: "Data dashboard",
          description:
            "An internal dashboard that imports data, charts key metrics, lets people filter by range, and refreshes on a schedule.",
        },
        {
          requirements: [
            requirement(
              "req-import",
              "People can import a dataset",
              "functional",
              "draft",
              "critical",
              "A person uploads a file and sees it appear as a dataset with its row count.",
            ),
            requirement(
              "req-charts",
              "Dashboards chart the metrics that matter",
              "functional",
              "draft",
              "high",
              "Each dashboard shows charts for the metrics chosen for it.",
            ),
            requirement(
              "req-filters",
              "Charts can be filtered by date range",
              "functional",
              "draft",
              "high",
              "Changing the range updates every chart on the page.",
            ),
            requirement(
              "req-refresh",
              "Datasets refresh on a schedule",
              "functional",
              "draft",
              "medium",
              "A background job re-imports each connected source on its own cadence.",
            ),
            requirement(
              "req-export",
              "People can export the current view",
              "functional",
              "draft",
              "low",
              "The visible data downloads as CSV.",
            ),
          ],
          decisions: [
            decision(
              "dec-read-models",
              "How dashboards read data",
              "Charts must stay fast while the raw dataset grows.",
              "Precompute summary tables that the charts read, instead of scanning raw rows per request.",
              "Aggregates are cheap to read and keep chart latency flat as data grows.",
            ),
            decision(
              "dec-worker",
              "How scheduled refreshes run",
              "Imports are slow and must not block a page request.",
              "Run refreshes in a background worker triggered on a schedule, not inside the web request.",
              "Long work belongs off the request path so pages stay responsive.",
            ),
          ],
          domains: [
            {
              id: "dom-analytics",
              name: "Analytics",
              description: "Imported datasets and the metrics computed from them.",
            },
          ],
          entities: [
            {
              id: "ent-dataset",
              domain_id: "dom-analytics",
              name: "Dataset",
              description: "One imported source of rows.",
            },
            {
              id: "ent-metric",
              domain_id: "dom-analytics",
              name: "Metric",
              description: "A number computed from a dataset over a period.",
            },
          ],
          attributes: [
            primaryKey("attr-ds-id", "ent-dataset"),
            attribute("attr-ds-name", "ent-dataset", "name", "string", 1, {
              required: true,
              description: "Name shown in the picker.",
            }),
            attribute("attr-ds-rows", "ent-dataset", "row_count", "integer", 2, {
              required: true,
              description: "Rows imported in the last run.",
            }),
            attribute("attr-ds-refreshed", "ent-dataset", "refreshed_at", "datetime", 3, {
              description: "When the dataset was last refreshed.",
            }),
            primaryKey("attr-metric-id", "ent-metric"),
            attribute("attr-metric-label", "ent-metric", "label", "string", 1, {
              required: true,
              description: "Name of the metric.",
            }),
            attribute("attr-metric-value", "ent-metric", "value", "decimal", 2, {
              required: true,
              description: "Computed value for the period.",
            }),
          ],
          relationships: [
            {
              id: "rel-metric-ds",
              source_entity_id: "ent-metric",
              target_entity_id: "ent-dataset",
              relationship_type: "many_to_one",
              name: "derived from",
              description: "Metrics are derived from one dataset.",
            },
          ],
          architecture: {
            components: [
              component("cmp-ui", "Dashboard UI", "frontend", 0, "Charts, filters, and the dataset picker."),
              component("cmp-api", "Analytics API", "backend", 1, "Serves summary tables to the dashboard."),
              component("cmp-db", "Warehouse", "database", 2, "Raw rows and precomputed summaries."),
              component("cmp-worker", "Refresh Worker", "worker", 3, "Re-imports each dataset on its cadence."),
            ],
            technologies: [
              technology("tech-react", "React", "framework", "Charting and filter state."),
              technology("tech-pg", "PostgreSQL", "database", "Raw rows plus summary tables."),
            ],
            decisions: [],
            dependencies: [
              { id: "dep-1", source_component_id: "cmp-ui", target_component_id: "cmp-api" },
              { id: "dep-2", source_component_id: "cmp-api", target_component_id: "cmp-db" },
              { id: "dep-3", source_component_id: "cmp-worker", target_component_id: "cmp-db" },
            ],
          },
          tasks: [
            task("task-model", "Model datasets and metrics", "database", 0, "Create the analytics tables."),
            task("task-import", "Build the dataset import", "backend", 1, "Upload, parse, and store rows."),
            task("task-charts", "Render the first dashboard", "frontend", 2, "Charts bound to summary tables."),
            task("task-refresh", "Schedule the refresh worker", "infrastructure", 3, "Run imports on a cadence."),
          ],
        },
      ),
  },
];

export const PROJECT_TEMPLATE_SUMMARIES: ProjectTemplateSummary[] =
  PROJECT_TEMPLATES.map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));

export function findProjectTemplate(id: string): ProjectTemplate | null {
  return PROJECT_TEMPLATES.find((template) => template.id === id) ?? null;
}
