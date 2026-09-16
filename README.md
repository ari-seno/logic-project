# Logic Project

> An AI Project Planner that structures requirements, decisions, architecture, tasks, and agent prompts. You make the calls; the tool keeps things organized.

This repository contains **Part 1: Foundation & Authentication** and **Part 2: Requirements & Decisions** — a Next.js 16 app backed by Supabase Auth and Postgres, with row-level security enforced on every table.

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
  api/                       (none yet)
  globals.css                Tailwind v4 theme tokens
  page.tsx                   landing
  proxy.ts -> lib/supabase/middleware.ts
components/
  ui/                        Button, ButtonLink, Input, Textarea, Label,
                             Alert, FieldError, Select, DeleteEntityButton
  auth/                      login-form, register-form, logout-button
  projects/                  project-form, delete-project-button,
                             project-tabs, project-header, badges
  requirements/              requirement-form
  decisions/                 decision-form
lib/
  auth/actions.ts            signIn / signUp / signOut server actions
  projects/queries.ts        listProjects, getProject
  projects/actions.ts        createProject, deleteProject
  requirements/queries.ts    listRequirements, countRequirements, getRequirement
  requirements/actions.ts    createRequirement, updateRequirement, deleteRequirement
  decisions/queries.ts       listDecisions, countDecisions, getDecision
  decisions/actions.ts       createDecision, updateDecision, deleteDecision
  supabase/                  client, server, middleware, types, path helpers
  validation/                zod schemas + action state types
  utils.ts                   cn, formatDate, formatDateTime
supabase/
  config.toml                `supabase init` output
  migrations/
    20250916120000_init_schema.sql              profiles + projects + RLS + triggers
    20250916180000_part2_requirements_decisions.sql   requirements + decisions + RLS + triggers
tests/
  *.test.ts                  Vitest unit tests (auth, project, utils,
                             middleware, requirement, decision validation)
  e2e/                       Playwright specs (auth, protected, projects,
                             requirements, decisions, cross-user)
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
  - `requirements`, `decisions` rows are scoped through their parent project:
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

## Roadmap

| Part | Scope | Status |
| --- | --- | --- |
| 1 | Foundation, auth, projects CRUD | ✓ shipped |
| 2 | Requirements & Decisions | ✓ shipped |
| 3 | Domain / ERD | planned |
| 4 | Architecture / API / UI | planned |
| 5 | Tasks & Dependencies | planned |
| 6 | Agent Prompt Generation | planned |
| 7 | AI Assistance | planned |
| 8 | Coding Agent Integration | planned |
