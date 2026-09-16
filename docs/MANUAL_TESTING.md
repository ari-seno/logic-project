# Manual testing — Part 1

This document walks through every user-facing flow and the security boundary it exercises. Run these checks after pulling changes or before a release. Each scenario includes the expected outcome and the data path it verifies.

## Prerequisites

- `bun install` completed.
- `.env.local` populated with a Supabase project's URL + anon key.
- The migration `20250916120000_init_schema.sql` applied to that project.
- `bun run dev` running on http://localhost:3000.

If you don't have a Supabase project yet, create one at https://supabase.com and grab the credentials from **Project Settings → API**.

## 1. Landing page (unauthenticated)

1. Visit http://localhost:3000/
2. **Expected**: "Plan projects. Capture decisions. Stay in control." with a `Create account` and `Sign in` button.
3. **Verified**: Server-side `getUser()` returns null; landing renders for guests.

## 2. Account registration

1. Click **Create account**.
2. Enter an email you control + a password (min 6 chars).
3. Click **Create account**.
4. **Expected**: Land on `/dashboard` with "Welcome back, &lt;your-name&gt;".
5. **Verified**:
   - zod validation passes (see the error messages if you break it intentionally).
   - `supabase.auth.signUp` succeeded; a profile row was auto-created via the `handle_new_user` trigger in the migration.

### Validation negative cases

| Input | Expected error |
| --- | --- |
| Empty email | "Email is required" |
| `not-an-email` | "Invalid email address" |
| Password `12345` | "Password must be at least 6 characters" |
| Password ≠ Confirm | "Passwords do not match" |

## 3. Sign in

1. Sign out from the dashboard header.
2. Visit `/login` and enter the credentials from step 2.
3. **Expected**: Redirect to `/dashboard`.
4. **Verified**: `supabase.auth.signInWithPassword` succeeds; session cookie set; `proxy` lets you through.

### Negative case

- Try logging in with a wrong password. **Expected**: red alert "Invalid login credentials" (or similar) above the form, no redirect.

## 4. Protected-route guard

1. Open a fresh incognito window (or clear cookies for localhost).
2. Try to visit `/dashboard`, `/projects`, or `/projects/new` directly.
3. **Expected**: Each one bounces you to `/login?next=<original-path>`.
4. **Verified**: `proxy.ts` calls `updateSession`, finds no user, redirects to login with `next` so we can resume afterward.

## 5. Sign in preserves the `next` parameter

1. From an unauthenticated browser, visit `/projects` directly.
2. Sign in with valid credentials.
3. **Expected**: You land on `/dashboard` (the action's redirect target) — the proxy redirect target. **Note**: Part 1 sends everyone to `/dashboard`; honoring `next` is left for a later part.

## 6. Authenticated visitors on auth pages

1. While signed in, visit `/login` or `/register`.
2. **Expected**: Immediate redirect to `/dashboard`.
3. **Verified**: `proxy.ts` checks `isAuthPath` and redirects.

## 7. Dashboard

1. Sign in. Land on `/dashboard`.
2. **Expected**:
   - Heading "Welcome back, &lt;email-prefix&gt;".
   - Counter showing `0` projects.
   - Empty-state card "You don't have any projects yet" with a CTA.
   - Two buttons: `Create project`, `View all projects`.
3. Create a few projects (see step 8) and revisit. The counter updates, and the "Recent projects" list shows the five most recently updated.

## 8. Create a project

1. From the dashboard, click **Create project**.
2. Fill in a name (required) and an optional description.
3. Click **Create project**.
4. **Expected**: Redirect to `/projects/&lt;uuid&gt;` with the project name as `<h1>` and timestamps.
5. **Verified**: `createProject` server action validated input, called `supabase.from('projects').insert(...)`, the RLS policy `projects_insert_owner` allowed the insert because `auth.uid() = owner_id`.

### Negative cases

| Input | Expected error |
| --- | --- |
| Empty name | "Name is required" |
| Name &gt; 120 chars | "Name is too long" |
| Description &gt; 2000 chars | "Description is too long" |

## 9. List projects

1. Visit `/projects`.
2. **Expected**:
   - Empty state if you have no projects.
   - Otherwise, a grid of cards. Each shows the name (link to detail), description, created/updated dates, and a **Delete** button.
3. **Verified**: `listProjects()` queries `projects WHERE owner_id = auth.uid()` — only yours.

## 10. Delete a project

1. On `/projects`, click **Delete** on a card.
2. The button changes to "Click again to confirm" with a **Cancel** button.
3. Click again.
4. **Expected**: The card disappears. No full-page reload.
5. **Verified**: `deleteProject` calls `supabase.from('projects').delete().eq('id', id).eq('owner_id', auth.uid())`; RLS enforces ownership.

## 11. Cross-user isolation (manual)

1. Open two browsers (or two private windows).
2. In window A, sign up as `alice@example.com` and create a project "Alice secret".
3. Copy the URL from window A's address bar.
4. Sign out of window A.
5. In window B, sign up as `bob@example.com`.
6. Visit `/projects` in window B. **Expected**: "Alice secret" is NOT in the list.
7. Paste Alice's project URL into window B's address bar. **Expected**: The page shows the "Page not found" 404.
8. **Verified**: RLS policies `projects_select_owner`, `projects_update_owner`, `projects_delete_owner` scope all reads and writes to `auth.uid()`.

## 12. Sign out

1. From the dashboard or any `/projects/*` page, click **Sign out** in the header.
2. **Expected**: Redirect to `/`. Visiting `/dashboard` now redirects back to `/login`.
3. **Verified**: `signOut` server action calls `supabase.auth.signOut()` and clears the session cookies via the SSR adapter.

## 13. Error boundaries

- **404**: visit `/projects/nonexistent-uuid`. **Expected**: 404 page with "Page not found".
- **Runtime error**: temporarily throw an error inside a server component, e.g. add `throw new Error('test')` at the top of `app/(app)/dashboard/page.tsx`, reload `/dashboard`. **Expected**: Friendly error UI with a "Try again" button (no stack trace leaks).

## 14. Keyboard + accessibility spot checks

- Tab through the login form: focus lands on Email → Password → Submit in that order; visible focus ring on each.
- Submit the login form with the keyboard: Enter triggers the action.
- Screen-reader announcement: the field-error messages appear in the DOM when validation fails and the input gets `aria-invalid="true"`.

## Automated coverage

| Suite | File | Coverage |
| --- | --- | --- |
| Unit | `tests/auth-validation.test.ts` | login + register zod schemas |
| Unit | `tests/project-validation.test.ts` | project name/description schema |
| Unit | `tests/utils.test.ts` | `cn`, date formatters |
| Unit | `tests/middleware-redirect.test.ts` | protected/auth path classification |
| E2E | `tests/e2e/auth.spec.ts` | form validation + successful signup (backend required) |
| E2E | `tests/e2e/protected.spec.ts` | unauthenticated → `/login?next=…` redirects |
| E2E | `tests/e2e/projects.spec.ts` | create / list / delete / count (backend required) |
| E2E | `tests/e2e/cross-user.spec.ts` | RLS isolation (backend required) |

Run them with:

```bash
bun run test       # unit
bun run test:e2e   # Playwright (dev server auto-started)
```

E2E suites whose names include "with backend" or "Cross-user" will skip themselves unless `.env.test` points at a real Supabase project.
