# Logic Project

> An AI Project Planner that structures requirements, decisions, architecture, tasks, and agent prompts. You make the calls; the tool keeps things organized.

This repository contains **Part 1: Foundation & Authentication**, **Part 2: Requirements & Decisions**, **Part 3: Domain & ERD**, and **Part 4: Architecture Foundation** — a Next.js 16 app backed by Supabase Auth and Postgres, with row-level security enforced on every table.

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
  api/                       (none yet)
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

Three workflows under `.github/workflows/` run automatically on every push to `main` and on pull requests:

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
    `architecture_decisions`, and `architecture_component_dependencies` rows are
    scoped through their parent project:
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

## Roadmap

| Part | Scope | Status |
| --- | --- | --- |
| 1 | Foundation, auth, projects CRUD | ✓ shipped |
| 2 | Requirements & Decisions | ✓ shipped |
| 3 | Domain & ERD | ✓ shipped |
| 4 | Architecture Foundation | ✓ shipped |
| 5 | Tasks & Dependencies | planned |
| 6 | Agent Prompt Generation | planned |
| 7 | AI Assistance | planned |
| 8 | Coding Agent Integration | planned |
