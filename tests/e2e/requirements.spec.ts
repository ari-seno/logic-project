import { expect, test } from "./helpers/fixtures";
import { signOut, signUp, uniqueEmail } from "./helpers/auth";

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page
    .getByLabel("Description")
    .fill("Project for requirement tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

test.describe("Requirements", () => {
  test.describe("with backend", () => {
    test("user can create a requirement in their project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("req-create"));
      const projectId = await createProject(page, `Req ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements/new`);
      const title = `Users can sign in ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page
        .getByLabel("Description")
        .fill("Email + password authentication.");
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/requirements/[0-9a-f-]{36}$`),
      );
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(page.getByText("Functional", { exact: true })).toBeVisible();
    });

    test("user sees an empty state when no requirements exist", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("req-empty"));
      const projectId = await createProject(page, `Empty ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements`);
      await expect(
        page.getByText(/no requirements yet/i),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /add requirement/i }),
      ).toBeVisible();
    });

    test("created requirement appears in the list and on the overview", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("req-list"));
      const projectId = await createProject(page, `Listed ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements/new`);
      const title = `Listed req ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
      await page.goto(`/projects/${projectId}/requirements`);
      await expect(page.getByRole("link", { name: title })).toBeVisible();
      await page.goto(`/projects/${projectId}`);
      await expect(page.getByText("1").first()).toBeVisible();
    });

    test("user can edit a requirement", async ({ page, backend }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("req-edit"));
      const projectId = await createProject(page, `Edit ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements/new`);
      await page.getByLabel("Title").fill(`Original ${Date.now()}`);
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
      await page.getByRole("link", { name: /^edit$/i }).click();
      await expect(page).toHaveURL(/\/edit$/);
      const newTitle = `Updated ${Date.now()}`;
      await page.getByLabel("Title").fill(newTitle);
      await page
        .getByLabel("Status")
        .selectOption("approved");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
      await expect(page.getByText("Approved")).toBeVisible();
    });

    test("user can delete a requirement from its detail page", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("req-delete"));
      const projectId = await createProject(page, `Del ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements/new`);
      const title = `Doomed req ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
      await page.goto(`/projects/${projectId}/requirements`);
      await expect(page.getByRole("link", { name: title })).toBeVisible();
      const card = page.locator("li", { hasText: title });
      await card.getByRole("button", { name: /^delete$/i }).click();
      await page.getByRole("button", { name: /click again to confirm/i }).click();
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    });

    test("user B cannot access user A's requirement", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-req"));
      const projectId = await createProject(page, `Alice req ${Date.now()}`);
      await page.goto(`/projects/${projectId}/requirements/new`);
      const title = `Alice private req ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByRole("button", { name: /create requirement/i }).click();
      await expect(page).toHaveURL(/\/requirements\/[0-9a-f-]{36}$/);
      const reqUrl = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-req"));
      const bobPage = await context.newPage();
      await bobPage.goto(reqUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.close();

      await page.goto(`/projects/${projectId}/requirements`);
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    });
  });
});
