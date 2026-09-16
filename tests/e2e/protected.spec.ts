import { expect, test } from "./helpers/fixtures";

test.describe("Protected routes", () => {
  test("unauthenticated visitor to /dashboard is redirected to /login with next param", async ({
    page,
  }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("unauthenticated visitor to /projects is redirected to /login with next param", async ({
    page,
  }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects$/);
  });

  test("unauthenticated visitor to /projects/new is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2Fnew$/);
  });

  test("/login is reachable when not signed in", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: /sign in to your account/i }),
    ).toBeVisible();
  });

  test("/register is reachable when not signed in", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: /create an account/i }),
    ).toBeVisible();
  });

  test("landing page shows marketing copy", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /plan projects\. capture decisions/i }),
    ).toBeVisible();
  });
});
