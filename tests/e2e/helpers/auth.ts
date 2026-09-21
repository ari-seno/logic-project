import type { Page } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}@example.com`;
}

export const TEST_PASSWORD = "Test1234!";

export async function signUp(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  try {
    await page.waitForURL(/\/dashboard$/, { timeout: 25_000 });
  } catch {
    // The auth round-trip can be slow against a remote backend. Before failing,
    // check whether the session was actually established by loading the
    // dashboard directly; an unauthenticated visit redirects back to /login.
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
  }
}

export async function signIn(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL(/\/(login)?$/);
}
