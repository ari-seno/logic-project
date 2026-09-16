# Logic Project

> An AI Project Planner that structures requirements, decisions, architecture, tasks, and agent prompts. You make the calls; the tool keeps things organized.

This repository contains **Part 1: Foundation & Authentication**, **Part 2: Requirements & Decisions**, **Part 3: Domain & ERD**, **Part 4: Architecture Foundation**, **Part 5: API Design Foundation**, and **Part 6: UI Design Foundation** — a Next.js 16 app backed by Supabase Auth and Postgres, with row-level security enforced on every table.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3.5 (App Router, `proxy.ts`) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS v4, hand-rolled UI components |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Validation | zod 4 |
| Unit tests | Vitest 5 + Testing Library |
| E2E tests | Playwright 1.63 |
| Local stack | Supabase CLI (Docker not required for tests) |
| Package manager | bun 1.4 |

## Repository layout

```
app/                         Next.js App Router
  (auth)/                    /login, /register
  (app)/                     protected layout + dashboard + projects
    projects/[id]/           overview (counts + recents + context)
    projects/[id]/requirements/   list / new / [reqId] / [reqId]/edit
    projects/[id]/decisions/      list / new / [decId] / [decId]/edit
    projects/[id]/domains/        list / new / [domainId] / [domainId]/edit / erd
    projects/[id]/domains/[domainId]/entities/        new / [entityId] / [entityId]/edit
    projects/[id]/domains/relationships/               new / [relId] / [relId]/edit
    projects/[id]/architecture/      overview + components/technologies/decisions/dependencies CRUD
    projects/[id]/api/           overview + groups + endpoints CRUD + sub-resources + traceability
    projects/[id]/ui/            overview + screens + components + navigation CRUD + screen detail (components/forms/states/interactions/traceability)
  globals.css                Tailwind v4 theme tokens
  page.tsx                   landing
  proxy.ts -> lib/supabase/middleware.ts
components/
  ui/                        Button, ButtonLink, Input, Textarea, Label,
                             Alert, FieldError, Select, DeleteEntityButton,
                             PositionStepper
  auth/                      login-form, register-form, logout-button
  projects/                  project-form, delete-project-button,
                             project-tabs, project-header, badges
  requirements/              requirement-form
  decisions/                 decision-form
  domains/                   domain-form
  entities/                  entity-form, attribute-form
  relationships/             relationship-form
  architecture/              component-form, technology-form,
                             decision-form, dependency-form
  api/                       group-form, endpoint-form, parameter-form,
                             request-body-form, response-form, error-form,
                             traceability-forms
  ui (in components/ui/screens): screen-form, component-form, navigation-form,
                             ui-form-form, ui-form-field-form, ui-state-form,
                             ui-interaction-form, add-screen-component-form,
                             traceability-forms, actions wrappers
lib/
  auth/actions.ts            signIn / signUp / signOut server actions
  projects/queries.ts        listProjects, getProject
  projects/actions.ts        createProject, deleteProject
  requirements/queries.ts    listRequirements, countRequirements, getRequirement
  requirements/actions.ts    createRequirement, updateRequirement, deleteRequirement
  decisions/queries.ts       listDecisions, countDecisions, getDecision
  decisions/actions.ts       createDecision, updateDecision, deleteDecision
  domains/                   queries, actions, erd loader
  entities/                  queries, actions
  attributes/                queries, actions (incl. reorder)
  relationships/             queries, actions (assertProjectAndSharedEntities)
  architecture/              components/, technologies/, decisions/, dependencies/
                             (queries + actions each)
  api/                       groups/ (queries + actions) + endpoints/
                             (queries + actions + sub-actions + traceability-actions)
  ui/                        screens/ + components/ + screen-components/ +
                             forms/ (incl. sub-actions) + navigation/ +
                             traceability/ (queries + actions)
  supabase/                  client, server, middleware, types, path helpers
  validation/                zod schemas + action state types
  utils.ts                   cn, formatDate, formatDateTime
supabase/
  config.toml                `supabase init` output
  migrations/
    20250916120000_init_schema.sql              profiles + projects + RLS + triggers
    20250916180000_part2_requirements_decisions.sql   requirements + decisions + RLS + triggers
    20250916190000_part3_domain_erd.sql         domains + entities + attributes + relationships + RLS + triggers
    20250916200000_part4_architecture.sql       components + technologies + arch decisions + dependencies + RLS + triggers
    20250916210000_part5_api_design.sql         api_groups + api_endpoints + parameters + request_bodies + responses + errors + traceability
    20250916220000_part6_ui_design.sql         ui_screens + ui_components + ui_screen_components + ui_forms + ui_form_fields + ui_states + ui_interactions + ui_navigation_items + traceability tables
tests/
  *.test.ts                  Vitest unit tests (auth, project, utils,
                             middleware, requirement, decision, domain,
                             entity, attribute, relationship, architecture-*
                             validation)
  e2e/                       Playwright specs (auth, protected, projects,
                             requirements, decisions, domain, cross-user,
                             architecture)
docs/
  MANUAL_TESTING.md          manual test walkthrough (Part 1)
  superpowers/plans/         implementation plans
proxy.ts                     Next.js 16 middleware (named "proxy")
```

## Prerequisites

- **Node.js ≥ 20**
- **bun ≥ 1.4** (`curl -fsSL https://bun.sh/install | bash`)
- A Supabase project (free tier is fine). Get a project's URL + anon key from `Project Settings → API`.
- Optional: Docker for running Supabase locally (`supabase start`).

## Setup

```bash
bun install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and ANON_KEY
```

If you intend to run the database migrations through the Supabase CLI:

```bash
bun run db:push   # requires `supabase link` first
```

### Configure for E2E tests (optional)

```bash
cp .env.test.example .env.test
# Fill in credentials for a *dedicated test project* — never reuse production.
```

E2E tests automatically load `.env.test` when present. Without it, the
backend-dependent tests skip themselves and the rest still run.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Next.js dev server on http://localhost:3000 |
| `bun run build` | Production build |
| `bun run start` | Run the built app |
| `bun run lint` | ESLint (next preset) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest unit tests |
| `bun run test:watch` | Vitest watch mode |
| `bun run test:e2e` | Playwright (auto-starts dev server) |
| `bun run db:push` | Apply migrations to the linked Supabase project |
| `bun run db:reset` | Reset the local DB and re-apply migrations |

## CI/CD (GitHub Actions)

Three workflows under `.github/workflows/` run automatically on every push to `main` and on pull requests. Each is also exposed as `workflow_dispatch` so it can be re-triggered from the GitHub UI (Actions → workflow → Run workflow):

| Workflow | Triggers | What it does |
| --- | --- | --- |
| `ci.yml` | push to main, PRs | `lint`, `typecheck`, `vitest`, `next build` (with placeholder env so the build does not depend on real Supabase secrets). Concurrency-cancelled on new pushes. |
| `migrate.yml` | push to main | `supabase db push --project-ref $SUPABASE_PROJECT_REF` against production. Serialised, not cancelled. |
| `deploy.yml` | push to main | `vercel link` → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. Drives production deploys from CI. |

### Repository secrets required

Configure these at https://github.com/ari-seno/logic-project/settings/secrets/actions:

| Secret | Purpose |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for the Supabase CLI; lets `migrate.yml` apply SQL to the linked project. |
| `SUPABASE_PROJECT_REF` | Project reference slug, e.g. `svlzrzygnueyzzygqxqu`. |
| `VERCEL_TOKEN` | Vercel account token (full-account scope) used by `deploy.yml`. |
| `VERCEL_ORG_ID` | Vercel team/owner ID (visible via `vercel project ls`). |
| `VERCEL_PROJECT_ID` | Vercel project ID (visible via `vercel inspect`). |

### Why three workflows instead of one

- **CI** runs on every PR too — fast feedback on changes that haven't merged yet.
- **Migrate** is gated to `main` only and is non-cancellable, so a half-applied migration can't be left dangling.
- **Deploy** is also gated to `main`. If you ever want to swap GitHub Actions for the Vercel GitHub App, delete `deploy.yml` and connect the repo from https://vercel.com/dashboard → Project → Settings → Git.

## Manual testing

See **[docs/MANUAL_TESTING.md](docs/MANUAL_TESTING.md)** for a step-by-step
walkthrough of the user flows and the security boundaries they verify.

## Security model

- **Authentication**: Supabase Auth (email + password). Sessions are stored as
  HTTP-only cookies via `@supabase/ssr`. The Next.js `proxy` refreshes the
  session on every request to `/dashboard` or `/projects`.
- **Authorization**:
  - `profiles`, `projects` rows are scoped to `owner_id = auth.uid()` (Part 1).
  - `requirements`, `decisions`, `domains`, `entities`, `entity_attributes`,
    `entity_relationships`, `architecture_components`, `architecture_technologies`,
    `architecture_decisions`, `architecture_component_dependencies`, `api_groups`,
    `api_endpoints`, `api_parameters`, `api_request_bodies`, `api_responses`,
    `api_errors`, `api_endpoint_entities`, `api_endpoint_requirements`, `ui_screens`,
    `ui_components`, `ui_screen_components`, `ui_forms`, `ui_form_fields`,
    `ui_states`, `ui_interactions`, `ui_interaction_endpoints`,
    `ui_screen_requirements`, `ui_screen_entities`, `ui_navigation_items`, and
    `ui_navigation_screens` rows are scoped through their parent project:
    `EXISTS (SELECT 1 FROM projects p WHERE p.id = <table>.project_id AND p.owner_id = auth.uid())`.
    This enforces "user owns parent project" without weakening Part 1 RLS.
  - RLS policies are checked at the database, not in application code.
- **Server-side re-checks**: Every server action re-fetches the parent
  project via `getProject` (which is itself RLS-gated) before mutating
  children, so URL tampering can never bypass authorization.
- **No service-role key in client code**: The service-role key (if added later)
  must remain server-only.

## Part 2 — Requirements & Decisions

Adds two structured-knowledge subsystems to every project:

### Requirements
Structured capture of what a project must accomplish.

| Field | Type | Notes |
| --- | --- | --- |
| `type` | enum | `functional`, `non_functional` |
| `status` | enum | `draft`, `approved`, `rejected`, `implemented` |
| `priority` | enum | `low`, `medium`, `high`, `critical` |
| `title` | string | required, 1–200 chars |
| `description` | string | optional, ≤ 5000 chars |

### Decisions
An append-only decision log; `superseded` decisions remain in the database so the reasoning stays auditable.

| Field | Type | Notes |
| --- | --- | --- |
| `status` | enum | `proposed`, `accepted`, `superseded` |
| `title` | string | required, 1–200 chars |
| `context` | string | optional, ≤ 5000 chars |
| `decision` | string | required, ≤ 2000 chars |
| `rationale` | string | optional, ≤ 5000 chars |

### Available routes
| URL | Purpose |
| --- | --- |
| `/projects/[id]` | Overview — counts, recent requirements/decisions, project context block |
| `/projects/[id]/requirements` | List + empty state |
| `/projects/[id]/requirements/new` | Create form |
| `/projects/[id]/requirements/[reqId]` | Detail + edit/delete |
| `/projects/[id]/requirements/[reqId]/edit` | Edit form |
| `/projects/[id]/decisions` | List + empty state |
| `/projects/[id]/decisions/new` | Create form |
| `/projects/[id]/decisions/[decId]` | Detail + edit/delete |
| `/projects/[id]/decisions/[decId]/edit` | Edit form |

The top of every project page renders `<ProjectTabs>` (Overview /
Requirements / Decisions) with `aria-current="page"` on the active tab.

### Database tables
- `requirements` — FK to `projects(id) ON DELETE CASCADE`, indexes on
  `project_id`, `status`, `priority`, `updated_at`, `set_updated_at` trigger.
- `decisions` — FK to `projects(id) ON DELETE CASCADE`, indexes on
  `project_id`, `status`, `updated_at`, `set_updated_at` trigger.
- Both have CHECK constraints on their enum columns so the database rejects
  invalid values even if application validation is bypassed.

### Authorization model
- A requirement or decision is visible to **a user only if that user owns the
  parent project**. The RLS `EXISTS` check in every policy enforces this.
- Server actions re-check ownership before any mutation.
- Deleting a project cascades to its requirements and decisions (intentional:
  child rows belong to a single project; orphaned records were not useful).

### Project context (preview)
The overview page surfaces a `Project Context` block with requirement count,
decision count, and "Last updated" timestamp. This is a UI placeholder for the
future AI-assisted context generation — there is no AI call in Part 2.

### Current limitations
- No version history beyond the `superseded` decision state.
- No bulk import/export.
- No markdown rendering for descriptions (plain text only).
- No AI context generation yet.

## Part 3 — Domain & ERD

Part 3 introduces structured domain modeling: a project contains **domains**, each domain holds **entities**, each entity has **attributes**, and entities are connected by **relationships**. A read-only ERD page renders the model.

### Concepts

| Concept | Belongs to | Has |
| --- | --- | --- |
| Domain | Project | name, description, entities |
| Entity | Domain | name, description, attributes |
| Attribute | Entity | name, data type, is required, is primary key, default, description, position |
| Relationship | Project | source entity, target entity, type, optional name + description |

### Database tables

| Table | Indexes | RLS |
| --- | --- | --- |
| `domains` | `(project_id)`, `(updated_at)`; UNIQUE `(project_id, name)` | enabled |
| `entities` | `(domain_id)`, `(updated_at)`; UNIQUE `(domain_id, name)` | enabled |
| `entity_attributes` | `(entity_id)`, `(updated_at)` | enabled |
| `entity_relationships` | `(project_id)`, `(source_entity_id)`, `(target_entity_id)`, `(updated_at)` | enabled |

Foreign keys all use `ON DELETE CASCADE`. The cross-project prevention is enforced both in the database (`entity_relationships_share_project` trigger) and in the application (`assertProjectAndSharedEntities` helper inside `lib/relationships/actions.ts`).

### Authorization model

Same RLS pattern as Part 2: each child row's policy gates on `EXISTS (SELECT 1 FROM … WHERE … owner_id = auth.uid())` walking up the parent chain.

### Available routes

| Route | Purpose |
| --- | --- |
| `/projects/[id]/domains` | List domains in project |
| `/projects/[id]/domains/new` | Create domain |
| `/projects/[id]/domains/[domainId]` | Domain detail + entities list |
| `/projects/[id]/domains/[domainId]/edit` | Edit domain |
| `/projects/[id]/domains/[domainId]/entities/new` | Create entity |
| `/projects/[id]/domains/[domainId]/entities/[entityId]` | Entity detail + attributes table |
| `/projects/[id]/domains/[domainId]/entities/[entityId]/edit` | Edit entity |
| `/projects/[id]/domains/erd` | Read-only ERD visualization |
| `/projects/[id]/domains/relationships/new` | Create relationship |
| `/projects/[id]/domains/relationships/[relId]` | Relationship detail |
| `/projects/[id]/domains/relationships/[relId]/edit` | Edit relationship |

### Limitations

- ERD is read-only (no drag-and-drop editing). Editing is done through forms.
- Primary-key uniqueness within an entity is enforced at the application layer, not the database.
- No markdown rendering for descriptions.

## Part 4 — Architecture Foundation

Part 4 introduces a structured system-architecture capture. Each project owns **components**, **technologies**, **architecture decisions**, and component-to-component **dependencies**.

### Concepts

| Concept | Belongs to | Fields |
| --- | --- | --- |
| Component | Project | name, type, description, position (implicit) |
| Technology | Project | name, category, description |
| Architecture decision | Project | title, status (`proposed`/`accepted`/`superseded`), context, decision, rationale |
| Component dependency | Project | source component, target component, description |

### Enum values

| Type | Values |
| --- | --- |
| Component type | `frontend`, `backend`, `database`, `authentication`, `storage`, `external_service`, `infrastructure`, `worker`, `queue`, `cache`, `other` |
| Technology category | `language`, `framework`, `database`, `authentication`, `hosting`, `infrastructure`, `testing`, `package`, `external_service`, `other` |
| Decision status | `proposed`, `accepted`, `superseded` |

### Database tables

| Table | Indexes / constraints | RLS |
| --- | --- | --- |
| `architecture_components` | `(project_id)`, `(updated_at)`; CHECK on `type` | enabled |
| `architecture_technologies` | `(project_id)`, `(updated_at)`; CHECK on `category` | enabled |
| `architecture_decisions` | `(project_id)`, `(updated_at)`; CHECK on `status` | enabled |
| `architecture_component_dependencies` | `(project_id)`, `(source_component_id)`, `(target_component_id)`; UNIQUE `(source_component_id, target_component_id)`; `share_project` trigger | enabled |

All four FKs cascade on project/component deletion. The `share_project` trigger ensures source and target components always belong to the dependency's own `project_id`.

### Available routes

| Route | Purpose |
| --- | --- |
| `/projects/[id]/architecture` | Overview — components, technologies, recent decisions, dependencies |
| `/projects/[id]/architecture/components` | List components |
| `/projects/[id]/architecture/components/new` | Create component |
| `/projects/[id]/architecture/components/[componentId]` | Detail + edit/delete |
| `/projects/[id]/architecture/components/[componentId]/edit` | Edit form |
| `/projects/[id]/architecture/technologies` | List technologies |
| `/projects/[id]/architecture/technologies/new` | Create technology |
| `/projects/[id]/architecture/technologies/[technologyId]` | Detail + edit/delete |
| `/projects/[id]/architecture/technologies/[technologyId]/edit` | Edit form |
| `/projects/[id]/architecture/decisions` | List decisions |
| `/projects/[id]/architecture/decisions/new` | Create decision |
| `/projects/[id]/architecture/decisions/[decisionId]` | Detail + edit/delete |
| `/projects/[id]/architecture/decisions/[decisionId]/edit` | Edit form |
| `/projects/[id]/architecture/dependencies/new` | Create dependency (requires ≥ 2 components) |
| `/projects/[id]/architecture/dependencies/[dependencyId]` | Detail + edit/delete |
| `/projects/[id]/architecture/dependencies/[dependencyId]/edit` | Edit form |

### Limitations

- No component-to-architecture-decision linking yet (planned for a later part).
- No architecture-level diagram visualization (boxes + arrows) — only the dependency list.
- No markdown rendering for descriptions.

## Part 5 — API Design Foundation

Part 5 introduces structured modeling of the user's planned application API. **This is a design / planning module** — Logic Project does not generate or run real endpoints for the user's project. Everything in Part 5 exists to capture, organize, and trace the planned contract.

### Concepts

| Concept | Belongs to | Has |
| --- | --- | --- |
| Group | Project | name, prefix, description |
| Endpoint | Project (optionally in a Group) | method, path, name, summary, description, authentication_required |
| Parameter | Endpoint | name, location, data_type, required, description, example |
| Request body | Endpoint | content_type, description, schema (JSON), example (JSON) |
| Response | Endpoint | status_code, description, content_type, schema (JSON), example (JSON) |
| Error | Endpoint | code, message, http_status, description |
| Endpoint ↔ Entity | (cross-module link) | role (`primary_resource` / `request_resource` / `response_resource` / `related_resource`) |
| Endpoint ↔ Requirement | (cross-module link) | the requirement this endpoint implements |

### Enum values

| Type | Values |
| --- | --- |
| HTTP method | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| Parameter location | `path`, `query`, `header`, `cookie` |
| Parameter data type | `string`, `integer`, `number`, `boolean`, `uuid`, `date`, `datetime` |
| Endpoint-entity role | `primary_resource`, `request_resource`, `response_resource`, `related_resource` |

### Database tables

| Table | Notes | RLS |
| --- | --- | --- |
| `api_groups` | UNIQUE `(project_id, name)` | enabled |
| `api_endpoints` | UNIQUE `(project_id, method, path)`; FK to `api_groups.id ON DELETE SET NULL` | enabled |
| `api_parameters` | FK to `api_endpoints ON DELETE CASCADE` | enabled |
| `api_request_bodies` | 1:1 with endpoint (UNIQUE `endpoint_id`), JSONB payload for schema/example | enabled |
| `api_responses` | Multiple per endpoint, ordered by `status_code` | enabled |
| `api_errors` | Per endpoint, code + message + optional `http_status` | enabled |
| `api_endpoint_entities` | UNIQUE `(endpoint_id, entity_id, role)`; application enforces same-project | enabled |
| `api_endpoint_requirements` | UNIQUE `(endpoint_id, requirement_id)`; application enforces same-project | enabled |

All FKs cascade on project/endpoint deletion as appropriate. Every parent table has a `set_updated_at` trigger.

### Design vs. implementation

Part 5 is strictly a design tool. It does not generate routes, controllers, schemas, or tests for the user's planned application. Future parts (Tasks, Agent Prompt) can read the modeled contract as input.

### Available routes

| Route | Purpose |
| --- | --- |
| `/projects/[id]/api` | Overview with groups, endpoints (method/path/name/auth), and contract preview |
| `/projects/[id]/api/groups/new` | Create group |
| `/projects/[id]/api/groups/[groupId]/edit` | Edit group |
| `/projects/[id]/api/endpoints/new` | Create endpoint |
| `/projects/[id]/api/endpoints/[endpointId]/edit` | Edit endpoint |
| `/projects/[id]/api/[endpointId]` | Detail with parameters, request body, responses, errors, traceability + contract sections |
| `/projects/[id]/api/[endpointId]/responses/[responseId]/edit` | Edit a response |
| `/projects/[id]/api/[endpointId]/errors/[errorId]/edit` | Edit an error |

### Contract preview

The overview page renders a read-only contract preview generated from the stored data:

```
# API contract (preview)
# 3 endpoints across 2 groups

# Group: Authentication  (/api/auth)
  POST   /api/login                         # Login (auth: required)

# Ungrouped
  GET    /api/projects                      # List projects (auth: required)
```

The preview is derived — it never becomes a second source of truth. A full OpenAPI document generation is intentionally deferred; documenting the modeling produces the same outcomes with less coupling.

### Traceability

Each endpoint can link to:
- One or more **Requirements** (one-direction: requirement implies an endpoint exists to fulfill it).
- One or more **Domain Entities** with a role describing how the entity participates (`primary_resource`, `request_resource`, `response_resource`, `related_resource`).

Both link types are surfaced on the endpoint detail page so future Tasks and Agent Prompts have an immediate map from "what must be built" → "where in the API" → "with what data".

### Limitations

- No OpenAPI 3.x document download yet (structured preview only).
- No JSON Schema strict validation library; the `schema_definition` field is freeform JSON suitable for visual review.
- Per-endpoint request body is one-per-endpoint; future versions may allow multiple alternative content-types.
- API auth model in the preview only supports boolean `authentication_required`; granular roles (per-endpoint) live in the `errors` table.

## Part 6 — UI Design Foundation

Part 6 introduces a structured UI blueprint per project. **This is a planning module** — Logic Project does not generate, scaffold, or execute real UI code for the user's application.

### Concepts

| Concept | Belongs to | Has |
| --- | --- | --- |
| Screen | Project | name, route, screen_type, description, purpose, authentication_required |
| Component | Project | name, component_type, description, purpose, technology |
| Screen component placement | Screen | component reference, optional parent placement (hierarchy), label override, description, required flag |
| Form | Screen | name, description, submit_label, success_behavior |
| Form field | Form | name, label, field_type, required, placeholder, help_text, default_value |
| State | Screen | name, state_type, description, behavior |
| Interaction | Screen | name, trigger, action, description |
| Navigation item | Project (optional parent) | name, label, route, parent_id, description |

### Enum values

| Type | Values |
| --- | --- |
| Screen type | `page`, `modal`, `drawer`, `dialog`, `wizard`, `dashboard`, `form`, `list`, `detail`, `settings`, `authentication`, `error`, `other` |
| Component type | `layout`, `navigation`, `header`, `footer`, `sidebar`, `card`, `table`, `list`, `form`, `input`, `textarea`, `select`, `checkbox`, `radio`, `button`, `modal`, `dialog`, `drawer`, `tabs`, `badge`, `alert`, `notification`, `chart`, `custom`, `other` |
| Field type | `text`, `textarea`, `email`, `password`, `number`, `date`, `datetime`, `select`, `checkbox`, `radio`, `file`, `hidden`, `other` |
| State type | `default`, `loading`, `empty`, `success`, `error`, `disabled`, `unauthorized`, `forbidden`, `not_found`, `validation_error`, `offline`, `custom` |
| Entity role | `displayed`, `created`, `edited`, `deleted`, `filtered`, `selected`, `related` |

### Database tables

| Table | Notes | RLS |
| --- | --- | --- |
| `ui_screens` | Direct `project_id`; CHECK on screen_type | enabled |
| `ui_components` | Direct `project_id`; CHECK on component_type | enabled |
| `ui_screen_components` | Hierarchical placements; UNIQUE `(screen_id, component_id, parent_id)` via `parent_id <> id` check | enabled |
| `ui_forms` | 1:N with screen | enabled |
| `ui_form_fields` | 1:N with form | enabled |
| `ui_states` | 1:N with screen | enabled |
| `ui_interactions` | 1:N with screen | enabled |
| `ui_interaction_endpoints` | UNIQUE `(interaction_id, endpoint_id)`; UI ↔ API | enabled |
| `ui_screen_requirements` | UNIQUE `(screen_id, requirement_id)`; UI ↔ Requirements | enabled |
| `ui_screen_entities` | UNIQUE `(screen_id, entity_id, role)`; UI ↔ Domain | enabled |
| `ui_navigation_items` | Hierarchical; parent must be same project; self-parent prohibited | enabled |
| `ui_navigation_screens` | UNIQUE `(navigation_item_id, screen_id)` | enabled |

All FKs cascade appropriately; every parent table has a `set_updated_at` trigger.

### Design vs. implementation

Part 6 is strictly a design tool. It does not produce React/Vue/etc. components or route handlers, and it does not perform visual drag-and-drop editing. Reordering is achieved by deleting and re-adding placements, matching the structured nature of the data.

### Available routes

| Route | Purpose |
| --- | --- |
| `/projects/[id]/ui` | Overview with summary, screens, components, navigation tree, specification preview |
| `/projects/[id]/ui/screens/new` | Create screen |
| `/projects/[id]/ui/screens/[screenId]` | Detail with components tree, forms + fields, states, interactions, traceability |
| `/projects/[id]/ui/screens/[screenId]/edit` | Edit screen |
| `/projects/[id]/ui/components/new` | Create component |
| `/projects/[id]/ui/components/[componentId]/edit` | Edit component |
| `/projects/[id]/ui/navigation/new` | Create navigation item |
| `/projects/[id]/ui/navigation/[itemId]/edit` | Edit navigation item |

### Specification preview

A read-only structured summary is rendered on the overview page:

```
# UI specification (preview)
# 3 screens, 8 components, 4 navigation items

## Screens
  - Home (page) route=/home auth=required
  - Project Detail (detail) route=/projects/:id auth=required
  ...

## Components
  - Header (header)
  - Project Card (card)
  ...

## Navigation
  - Dashboard
  - Projects
    - All Projects
    - Recent
```

Derived entirely from the stored data; never stored separately.

### Traceability

| Link | Source | Use |
| --- | --- | --- |
| Screen ↔ Requirement | `ui_screen_requirements` | Captures which requirements a screen fulfils |
| Screen ↔ Domain entity | `ui_screen_entities` | Captures which entities participate (with role) |
| Interaction ↔ API endpoint | `ui_interaction_endpoints` | Captures which endpoint an interaction fires |

Each screen detail page surfaces its requirements, entities, and (per interaction) endpoints. Future Tasks and Agent Prompts use these maps to derive implementation work.

### Limitations

- No visual drag-and-drop screen builder.
- Reordering requires delete + re-add.
- Specifications are text-based; markdown rendering of fields/descriptions is plain text only.
- Navigation items do not yet track ordering relative to siblings beyond the `position` field.

## Roadmap

| Part | Scope | Status |
| --- | --- | --- |
| 1 | Foundation, auth, projects CRUD | ✓ shipped |
| 2 | Requirements & Decisions | ✓ shipped |
| 3 | Domain & ERD | ✓ shipped |
| 4 | Architecture Foundation | ✓ shipped |
| 5 | API Design Foundation | ✓ shipped |
| 6 | UI Design Foundation | ✓ shipped |
| 7 | Tasks & Dependencies | planned |
| 8 | Agent Prompt Generation | planned |
| 9 | AI Assistance | planned |
| 10 | Coding Agent Integration | planned |
