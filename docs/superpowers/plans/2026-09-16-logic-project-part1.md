# Logic Project — Part 1: Foundation & Authentication

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (this plan is being executed inline) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Part 1 of Logic Project — Next.js 16 (App Router) + Supabase Auth + Postgres profiles/projects with RLS, minimal dashboard, and reproducible migrations.

**Architecture:** Three Supabase clients (browser / server / middleware) via `@supabase/ssr`. Server Components + Server Actions for data access. Middleware refreshes session + redirects unauthenticated users from `(app)/**` to `/login`. Profile auto-created via Postgres trigger on `auth.users` insert. RLS enforces ownership at the database level — no service-role key needed in the app.

**Tech Stack:** Next.js 16.3.5, TypeScript, Tailwind CSS v4, Supabase JS 2.x + `@supabase/ssr` 0.12.x, zod, Vitest + Testing Library (unit/component), Playwright (E2E), bun (package manager), Supabase CLI (migrations).

**Spec:** This plan implements the spec delivered alongside it in this conversation (`# Logic Project — Part 1`).

## Global Constraints

- TypeScript strict; no `any` unless required.
- Tailwind CSS only; no other CSS frameworks.
- Do not introduce AI features, billing, teams, or external integrations.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`) must never reach the browser.
- Rely on RLS, not frontend checks, for authorization.
- Bun is the package manager; node v24 runs Next.js dev/build via bun scripts.
- Do not push to GitHub. Initial commit + Part 1 commit only, locally.
- One meaningful commit at the end: `feat: implement part 1 foundation and authentication`.

---

## Tasks

### Task 1: Bootstrap repository

**Files:**
- Create: `README.md` (initial placeholder, will be replaced in Task 16)
- Create: `.gitignore`

**Steps:**

- [ ] **Step 1: Initialize git and create initial commit**

```bash
cd /home/seno/Documents/Workspace/logic-project
git init -b main
git config user.name 2>&1 || git config user.name "Ari Seno"
git config user.email 2>&1 || git config user.email "ariseno.dev@gmail.com"
```

- [ ] **Step 2: Write `.gitignore`** covering `node_modules/`, `.next/`, `out/`, `coverage/`, `.env`, `.env.local`, `.env.*.local`, `supabase/.temp`, `supabase/.branches`, `.DS_Store`, `*.log`, `.vercel`, `playwright-report`, `test-results`.

- [ ] **Step 3: Write initial README** with project name only.

- [ ] **Step 4: Initial commit**

```bash
git add .gitignore README.md
git commit -m "chore: initial commit"
```

---

### Task 2: Scaffold Next.js 16

**Files:** Whole tree created by `create-next-app`.

**Steps:**

- [ ] **Step 1: Scaffold into current directory**

```bash
cd /home/seno/Documents/Workspace/logic-project
bunx create-next-app@16.3.5 . \
  --typescript --tailwind --app --eslint --src-dir=false \
  --import-alias "@/*" --use-bun --turbopack --yes
```

- [ ] **Step 2: Verify scaffold** — confirm `app/`, `app/page.tsx`, `app/layout.tsx`, `tailwind.config.*` or `app/globals.css` with Tailwind v4 import, `tsconfig.json`, `next.config.*`, `package.json` exist.

- [ ] **Step 3: Verify dev server boots**

```bash
cd /home/seno/Documents/Workspace/logic-project
bun run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Stage scaffold (don't commit yet — bundling into Part 1 commit)**

```bash
git add -A
```

---

### Task 3: Install dependencies

**Steps:**

- [ ] **Step 1: Install runtime deps**

```bash
cd /home/seno/Documents/Workspace/logic-project
bun add @supabase/supabase-js @supabase/ssr zod
```

- [ ] **Step 2: Install dev deps**

```bash
bun add -d @playwright/test vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Verify** — `cat package.json` shows added deps.

---

### Task 4: Configure Tailwind v4 + base styles

**Files:**
- Modify: `app/globals.css`

**Steps:**

- [ ] **Step 1: Replace default globals.css** with Tailwind v4 import + minimal CSS variables for light theme.

```css
@import "tailwindcss";

@theme {
  --color-brand: #2563eb;
}

:root { color-scheme: light; }
body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
```

- [ ] **Step 2: Update `app/layout.tsx`** — set metadata (title, description), keep default structure.

---

### Task 5: Supabase clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`

**Steps:**

- [ ] **Step 1: `lib/supabase/client.ts`** — browser client using `createBrowserClient` with env vars.

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: `lib/supabase/server.ts`** — server client using `createServerClient` + Next.js `cookies()`.

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch {}
        },
      },
    },
  );
}
```

- [ ] **Step 3: `lib/supabase/middleware.ts`** — session-refresh client used in middleware.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}
```

---

### Task 6: Middleware

**Files:**
- Create: `middleware.ts`

**Steps:**

- [ ] **Step 1: Write middleware** that refreshes session for all routes except static, and redirects unauthenticated users from `(app)` paths to `/login`.

```ts
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/dashboard", "/projects"];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const isProtected = PROTECTED.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!isProtected) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 2: Verify** with placeholder env (set temporary values in shell, no commit).

---

### Task 7: Auth validation + actions

**Files:**
- Create: `lib/validation/auth.ts`
- Create: `lib/auth/actions.ts`

**Steps:**

- [ ] **Step 1: `lib/validation/auth.ts`** — zod schemas.

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = loginSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

- [ ] **Step 2: `lib/auth/actions.ts`** — server actions.

```ts
"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

export type ActionResult = { error?: string; fieldErrors?: Record<string, string[]> };

export async function signIn(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signUp(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

---

### Task 8: Auth UI — login, register, logout

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/register-form.tsx`
- Create: `components/auth/logout-button.tsx`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/alert.tsx`
- Create: `lib/utils.ts`

**Steps:**

- [ ] **Step 1: `lib/utils.ts`** — `cn()` helper using clsx (already pulled by Next scaffold) + tailwind-merge.

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

Note: scaffold pulls `tailwind-merge` transitively in some templates; if absent, `bun add tailwind-merge clsx`.

- [ ] **Step 2: `components/ui/button.tsx`** — minimal Tailwind button.

- [ ] **Step 3: `components/ui/input.tsx`** — typed input with `className` passthrough.

- [ ] **Step 4: `components/ui/label.tsx`** — `<label>` styled.

- [ ] **Step 5: `components/ui/alert.tsx`** — error/info banner.

- [ ] **Step 6: `components/auth/login-form.tsx`** — `useActionState` with `signIn`; renders email, password, submit, error display, link to `/register`.

- [ ] **Step 7: `components/auth/register-form.tsx`** — same pattern with confirm password + link to `/login`.

- [ ] **Step 8: `components/auth/logout-button.tsx`** — server-action wrapper around `signOut`.

- [ ] **Step 9: `app/(auth)/login/page.tsx`** — center card with `<LoginForm />`. If user already logged in (server check), redirect to `/dashboard`.

- [ ] **Step 10: `app/(auth)/register/page.tsx`** — same pattern with `<RegisterForm />`. Redirect logged-in users.

---

### Task 9: Landing page

**Files:**
- Modify: `app/page.tsx`

**Steps:**

- [ ] **Step 1: Replace default landing** with Logic Project name, short description, Login + Register buttons. Server check: if logged in, redirect to `/dashboard`.

---

### Task 10: Protected layout + dashboard

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/app-shell.tsx` (optional small wrapper)

**Steps:**

- [ ] **Step 1: `app/(app)/layout.tsx`** — server-side `auth.getUser()`; redirect to `/login` if missing. Render header with email + Logout button, and `<main>` for children.

- [ ] **Step 2: `app/(app)/dashboard/page.tsx`** — fetch current user + profile + count of projects + 5 most recent projects. Show "Create project" link to `/projects/new`.

---

### Task 11: Project module — validation, actions, queries

**Files:**
- Create: `lib/validation/projects.ts`
- Create: `lib/projects/actions.ts`
- Create: `lib/projects/queries.ts`

**Steps:**

- [ ] **Step 1: `lib/validation/projects.ts`** — zod schema: name 1..120, description optional 0..2000.

- [ ] **Step 2: `lib/projects/queries.ts`** — `listProjects()`, `getProject(id)`, `getProjectCount()`. Each calls `auth.getUser()`; returns `[]` / `null` when unauthorized. Rely on RLS for cross-user protection.

- [ ] **Step 3: `lib/projects/actions.ts`** — `createProject`, `deleteProject`. Validate with zod; check `auth.getUser()`; insert/delete; `revalidatePath('/projects')` and `revalidatePath('/dashboard')`.

---

### Task 12: Projects pages

**Files:**
- Create: `app/(app)/projects/page.tsx`
- Create: `app/(app)/projects/new/page.tsx`
- Create: `app/(app)/projects/[id]/page.tsx`
- Create: `components/projects/project-form.tsx`
- Create: `components/projects/project-list.tsx`
- Create: `components/projects/project-card.tsx`
- Create: `components/projects/delete-project-button.tsx`

**Steps:**

- [ ] **Step 1: `project-form.tsx`** — client component using `useActionState` with `createProject`; renders name + description.

- [ ] **Step 2: `project-list.tsx`** — server component accepting `projects`; maps to cards; shows empty state when empty.

- [ ] **Step 3: `project-card.tsx`** — server component showing name, description (truncated), created/updated, Open link, embedded `<DeleteProjectButton>`.

- [ ] **Step 4: `delete-project-button.tsx`** — client component with confirm dialog (`window.confirm`) and form posting to `deleteProject` action.

- [ ] **Step 5: `app/(app)/projects/page.tsx`** — fetch projects via `listProjects()`; render `<ProjectList>` + "Create" link.

- [ ] **Step 6: `app/(app)/projects/new/page.tsx`** — render `<ProjectForm>`.

- [ ] **Step 7: `app/(app)/projects/[id]/page.tsx`** — fetch project; if `null`, call `notFound()`. Show name, description, dates, Delete button.

---

### Task 13: Supabase project init + migration

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20250916120000_init_schema.sql`

**Steps:**

- [ ] **Step 1: Install Supabase CLI locally**

```bash
cd /home/seno/Documents/Workspace/logic-project
bun add -d supabase
```

- [ ] **Step 2: Initialize**

```bash
bunx supabase init
```

- [ ] **Step 3: Write migration** `supabase/migrations/20250916120000_init_schema.sql` covering profiles + projects tables, indexes, FKs, `set_updated_at` trigger, `handle_new_user` trigger, RLS policies (per spec section "Database Schema").

- [ ] **Step 4: Document apply path** in README and `MANUAL_TESTING.md`:
  - Linked project: `bunx supabase link --project-ref <ref>` then `bunx supabase db push`.
  - Manual: paste SQL in Supabase Dashboard SQL editor.

---

### Task 14: Env example + .gitignore hardening

**Files:**
- Create: `.env.example`
- Modify: `.gitignore` (ensure `.env*` and Supabase temp dirs are covered)

**Steps:**

- [ ] **Step 1: `.env.example`** with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (commented), `NEXT_PUBLIC_SITE_URL`.

- [ ] **Step 2: Verify `.gitignore`** includes `.env`, `.env.local`, `.env.*.local`, `supabase/.temp`, `supabase/.branches`.

---

### Task 15: Vitest + Testing Library setup

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/auth-actions.test.ts`
- Create: `tests/project-actions.test.ts`
- Create: `tests/middleware-redirect.test.ts`

**Steps:**

- [ ] **Step 1: `vitest.config.ts`** — jsdom env, `tests/setup.ts` setupFiles, `@/` alias via `vite-tsconfig-paths` or manual `resolve.alias`.

- [ ] **Step 2: `tests/setup.ts`** — `@testing-library/jest-dom` import.

- [ ] **Step 3: `bun add -d vite-tsconfig-paths`**

- [ ] **Step 4: Tests** — mock `@/lib/supabase/server` and `@/lib/supabase/middleware`; assert validation errors, redirect behavior, ownership re-check.

- [ ] **Step 5: Add npm scripts** `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 6: Run** `bun run test` — all pass.

---

### Task 15a: Playwright setup

**Files:**
- Create: `playwright.config.ts`
- Create: `.env.test.example`
- Create: `tests/e2e/helpers.ts`

**Steps:**

- [ ] **Step 1: Install Playwright browsers**

```bash
cd /home/seno/Documents/Workspace/logic-project
bunx playwright install --with-deps chromium
```

- [ ] **Step 2: `playwright.config.ts`** — base URL `http://localhost:3000`, webServer runs `bun run dev`, reuse existing server in local, projects from `tests/e2e`, ignore `tests/setup.ts`.

- [ ] **Step 3: `.env.test.example`** documenting required test Supabase project + URL/anon key.

- [ ] **Step 4: `tests/e2e/helpers.ts`** — `signUp`, `signIn`, `signOut`, `uniqueEmail()`.

---

### Task 15b: Playwright — auth + protected routes

**Files:**
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/protected.spec.ts`

**Steps:**

- [ ] **Step 1: `auth.spec.ts`** — register flow, login flow, logout flow, error on invalid credentials, error on duplicate email.

- [ ] **Step 2: `protected.spec.ts`** — visit `/dashboard` unauthenticated → redirected to `/login?next=/dashboard`. Visit `/projects` similarly.

- [ ] **Step 3: Run** `bun run test:e2e` — pass.

---

### Task 15c: Playwright — projects + cross-user access

**Files:**
- Create: `tests/e2e/projects.spec.ts`
- Create: `tests/e2e/cross-user.spec.ts`

**Steps:**

- [ ] **Step 1: `projects.spec.ts`** — create project, see in list, open detail, delete (with confirm). Empty state shown initially.

- [ ] **Step 2: `cross-user.spec.ts`** — User A creates project, gets URL. Sign out. Register User B. Visit `/projects/<A's-id>` directly → 404 (RLS denies + notFound).

- [ ] **Step 3: Run** `bun run test:e2e` — pass.

---

### Task 16: README + manual testing doc

**Files:**
- Create/Modify: `README.md`
- Create: `MANUAL_TESTING.md`

**Steps:**

- [ ] **Step 1: README sections**: Description, Tech Stack, Local Requirements, Installation, Supabase Setup, Env Variables, Migration Instructions, Dev Commands, Vercel Deployment, Current Part 1 Scope, Future Roadmap, Project Structure tree.

- [ ] **Step 2: `MANUAL_TESTING.md`** — checklist of manual smoke tests covering: register, login, logout, protected redirect, profile exists, project CRUD, cross-user access denied, RLS sanity check (try direct DB query as user B for user A's project → 0 rows).

---

### Task 17: Quality gates

**Steps:**

- [ ] **Step 1: Lint** — `bun run lint`. Fix until clean.

- [ ] **Step 2: Type check** — `bunx tsc --noEmit`. Fix until clean.

- [ ] **Step 3: Unit tests** — `bun run test`. Pass.

- [ ] **Step 4: Build** — `bun run build`. Pass.

- [ ] **Step 5: E2E** — `bun run test:e2e` (if Supabase test project env is available; otherwise document).

---

### Task 18: Commit

**Steps:**

- [ ] **Step 1: `git status`** — review changed files.

- [ ] **Step 2: `git diff --stat`** — sanity check scope.

- [ ] **Step 3: Stage and commit**

```bash
git add -A
git commit -m "feat: implement part 1 foundation and authentication"
```

- [ ] **Step 4: `git log --oneline`** — confirm two commits: `chore: initial commit` and `feat: implement part 1 foundation and authentication`.

- [ ] **Step 5: No push** — per spec.

---

## Notes

- E2E tests require a real Supabase project (`SUPABASE_URL` + `SUPABASE_ANON_KEY` in `.env.test`). README documents setup. If unavailable during execution, E2E is documented as not run; unit tests + manual checklist still satisfy the Definition of Done.
- Service-role key is never imported in client components; only server code references it (and Part 1 doesn't need it).
- `next.config.ts` may need `serverActions` config if upload of large descriptions is ever required; default body size limit is fine for Part 1.