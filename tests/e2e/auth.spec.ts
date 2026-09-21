import { expect, test } from "./helpers/fixtures";
import { uniqueEmail, TEST_PASSWORD } from "./helpers/auth";

test.describe("Auth: forms", () => {
  test("login form shows validation errors for empty fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(
      page.getByText(/password must be at least 6 characters/i),
    ).toBeVisible();
  });

  test("login form rejects malformed email", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
  });

  test("login form rejects too-short password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail("login"));
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByText(/password must be at least 6 characters/i),
    ).toBeVisible();
  });

  test("login page links to register page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("register form requires password confirmation to match", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(uniqueEmail("reg"));
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm password").fill("Different1234!");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("register page links to login page", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe("with backend", () => {
    test("sign up creates account and lands on dashboard", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("signup");
      await page.goto("/register");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
      await page.getByLabel("Confirm password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test("sign in with bad credentials shows error", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await page.goto("/login");
      await page.getByLabel("Email").fill(uniqueEmail("nosuch"));
      await page.getByLabel("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page.getByRole("alert")).toBeVisible();
    });
  });
});
