import { expect, test } from "./helpers/fixtures";
import { signUp, uniqueEmail } from "./helpers/auth";

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page
    .getByLabel("Description")
    .fill("Project for task-from-artifact tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const m = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return m?.[1] ?? "";
}

test.describe("Create task from artifact", () => {
  test.describe("with backend", () => {
    test("creates a task from an API endpoint and attaches it", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("from-endpoint"));
      const projectId = await createProject(page, `FromE ${Date.now()}`);

      // Create an API endpoint first
      await page.goto(`/projects/${projectId}/api/endpoints/new`);
      await page.getByLabel("Method").selectOption("POST");
      await page.getByLabel("Path").fill(`/api/x-${Date.now()}`);
      await page.getByLabel("Name").fill("Create thing");
      await page.getByRole("button", { name: /create endpoint/i }).click();
      await expect(page).toHaveURL(/\/api\/[0-9a-f-]{36}$/);

      // Click the Create task button on the endpoint detail page
      await page.getByRole("button", { name: /create task/i }).first().click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      await expect(
        page.getByRole("heading", { name: /implement api endpoint/i }),
      ).toBeVisible();
      // The linked API endpoint should appear in the traceability section
      await expect(page.getByText("POST /api/x-").first()).toBeVisible();
    });

    test("creates a task from a Requirement and links it", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("from-req"));
      const projectId = await createProject(page, `FromR ${Date.now()}`);

      // Create requirement
      await page.goto(`/projects/${projectId}/requirements/new`);
      await page.getByLabel("Title").fill(`Users can reset passwords ${Date.now()}`);
      await page
        .getByLabel("Description")
        .fill("Reset email flow");
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);

      await page.getByRole("button", { name: /create task/i }).first().click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      await expect(
        page.getByRole("heading", { name: /implement requirement/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/Users can reset passwords/).first(),
      ).toBeVisible();
    });
  });
});
