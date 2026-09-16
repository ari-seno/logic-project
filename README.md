# Logic Project

> An AI Project Planner that structures requirements, decisions, architecture, tasks, and agent prompts. You make the calls; the tool keeps things organized.

This repository contains **Part 1: Foundation & Authentication** — a Next.js 16 app backed by Supabase Auth and Postgres, with row-level security enforced on every table.

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
  (app)/                     protected layout + dashboard/projects
  api/                       (none yet)
  globals.css                Tailwind v4 theme tokens
  page.tsx                   landing
  proxy.ts -> lib/supabase/middleware.ts
components/
  ui/                        Button, Input, Textarea, Label, Alert
  auth/                      login-form, register-form, logout-button
  projects/                  project-form, delete-project-button
lib/
  auth/actions.ts            signIn / signUp / signOut server actions
  projects/queries.ts        listProjects, getProject
  projects/actions.ts        createProject, deleteProject
  supabase/                  client, server, middleware, types, path helpers
  validation/                zod schemas + action state types
  utils.ts                   cn, formatDate, formatDateTime
supabase/
  config.toml                `supabase init` output
  migrations/
    20250916120000_init_schema.sql   profiles + projects + RLS + triggers
tests/
  *.test.ts                  Vitest unit tests
  e2e/                       Playwright specs (auth, protected, projects, cross-user)
docs/
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

## Manual testing

See **[docs/MANUAL_TESTING.md](docs/MANUAL_TESTING.md)** for a step-by-step
walkthrough of the user flows and the security boundaries they verify.

## Security model (Part 1)

- **Authentication**: Supabase Auth (email + password). Sessions are stored as
  HTTP-only cookies via `@supabase/ssr`. The Next.js `proxy` refreshes the
  session on every request to `/dashboard` or `/projects`.
- **Authorization**: Every Supabase query runs as the current user with the
  anon key. Row-Level Security policies in `20250916120000_init_schema.sql`
  scope reads and writes to rows whose `owner_id` equals `auth.uid()`.
- **Server-side re-checks**: Even with RLS in place, server components and
  server actions call `supabase.auth.getUser()` again before mutating data.
- **No service-role key in client code**: The service-role key (if added later)
  must remain server-only.

## Roadmap

| Part | Scope |
| --- | --- |
| 1 | Foundation, auth, projects CRUD (this release) |
| 2 | Project requirements + AI suggestions |
| 3 | Decision log + architecture canvas |
| 4 | Tasks + agent prompt library |
