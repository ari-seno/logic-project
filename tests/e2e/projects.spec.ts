import { expect, test } from "./helpers/fixtures";
import { signUp, uniqueEmail } from "./helpers/auth";

test.describe("Project module", () => {
  test.describe("with backend", () => {
    test("signed-up user lands on dashboard with empty state", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("dashboard");
      await signUp(page, email);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText("0")).toBeVisible();
      await expect(page.getByText(/you don't have any projects yet/i)).toBeVisible();
    });

    test("creating a project navigates to its detail page", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("create");
      await signUp(page, email);
      await page.getByRole("link", { name: /create project/i }).first().click();
      await expect(page).toHaveURL(/\/projects\/new$/);
      const name = `My Plan ${Date.now()}`;
      await page.getByLabel("Name").fill(name);
      await page
        .getByLabel("Description")
        .fill("An E2E-generated description.");
      await page.getByRole("button", { name: /create project/i }).click();
      await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name })).toBeVisible();
    });

    test("project appears on /projects list after creation", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("list");
      await signUp(page, email);
      await page.goto("/projects/new");
      const name = `Listed ${Date.now()}`;
      await page.getByLabel("Name").fill(name);
      await page.getByRole("button", { name: /create project/i }).click();
      await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
      await page.goto("/projects");
      await expect(page.getByRole("link", { name })).toBeVisible();
    });

    test("deleting a project removes it from the list", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("delete");
      await signUp(page, email);
      await page.goto("/projects/new");
      const name = `Doomed ${Date.now()}`;
      await page.getByLabel("Name").fill(name);
      await page.getByRole("button", { name: /create project/i }).click();
      await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
      await page.goto("/projects");
      await expect(page.getByRole("link", { name })).toBeVisible();
      const deleteButton = page.getByRole("button", {
        name: `Delete ${name}`,
      });
      await deleteButton.click();
      await page.getByRole("button", { name: /click again to confirm/i }).click();
      await expect(page.getByRole("link", { name })).toHaveCount(0);
    });

    test("dashboard counts reflect the number of projects", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("count");
      await signUp(page, email);
      await expect(page.getByText("0")).toBeVisible();
      await page.goto("/projects/new");
      await page.getByLabel("Name").fill(`A ${Date.now()}`);
      await page.getByRole("button", { name: /create project/i }).click();
      await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
      await page.goto("/dashboard");
      await expect(page.getByText("1")).toBeVisible();
    });
  });
});
