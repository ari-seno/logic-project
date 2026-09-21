import { expect, test } from "./helpers/fixtures";
import { signOut, signUp, uniqueEmail } from "./helpers/auth";
import { confirmDeletion } from "./helpers/confirm-delete";

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

test.describe("Decisions", () => {
  test.describe("with backend", () => {
    test("user can create a decision in their project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-create"));
      const projectId = await createProject(page, `Dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      const title = `Choose database ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByLabel("Context").fill("We need relational data.");
      await page.getByLabel("Decision").fill("PostgreSQL");
      await page.getByLabel("Rationale").fill("It provides the relational model.");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/decisions/[0-9a-f-]{36}$`),
      );
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(page.getByText("PostgreSQL").first()).toBeVisible();
    });

    test("user sees an empty state when no decisions exist", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-empty"));
      const projectId = await createProject(page, `Empty dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions`);
      await expect(page.getByText(/no decisions yet/i)).toBeVisible();
      await expect(
        page.getByRole("link", { name: /add decision/i }),
      ).toBeVisible();
    });

    test("created decision appears in the list and on the overview", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-list"));
      const projectId = await createProject(page, `Listed dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      const title = `Listed dec ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByLabel("Decision").fill("PostgreSQL");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await page.goto(`/projects/${projectId}/decisions`);
      await expect(page.getByRole("link", { name: title })).toBeVisible();
      await page.goto(`/projects/${projectId}`);
      await expect(page.getByText("1").first()).toBeVisible();
    });

    test("user can edit a decision", async ({ page, backend }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-edit"));
      const projectId = await createProject(page, `Edit dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      await page.getByLabel("Title").fill(`Original dec ${Date.now()}`);
      await page.getByLabel("Decision").fill("MySQL");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await page.getByRole("link", { name: /^edit$/i }).click();
      await expect(page).toHaveURL(/\/edit$/);
      const newTitle = `Updated dec ${Date.now()}`;
      await page.getByLabel("Title").fill(newTitle);
      await page.getByLabel("Decision").fill("PostgreSQL");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
      await expect(page.getByText("PostgreSQL").first()).toBeVisible();
    });

    test("user can delete a decision from its detail page", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-delete"));
      const projectId = await createProject(page, `Del dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      const title = `Doomed dec ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByLabel("Decision").fill("Pick something");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await page.getByRole("button", { name: `Delete ${title}` }).click();
      await confirmDeletion(page);
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/decisions$`),
      );
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    });

    test("user B cannot access user A's decision", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-dec"));
      const projectId = await createProject(page, `Alice dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      const title = `Alice private dec ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByLabel("Decision").fill("Secret");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      const decUrl = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-dec"));
      const bobPage = await context.newPage();
      await bobPage.goto(decUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.close();

      await page.goto(`/projects/${projectId}/decisions`);
      await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    });

    test("superseded decision is not auto-deleted", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("dec-super"));
      const projectId = await createProject(page, `Super dec ${Date.now()}`);
      await page.goto(`/projects/${projectId}/decisions/new`);
      const title = `Kept dec ${Date.now()}`;
      await page.getByLabel("Title").fill(title);
      await page.getByLabel("Decision").fill("Pick A");
      await page.getByRole("button", { name: /create decision/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await page.getByRole("link", { name: /^edit$/i }).click();
      await page.getByLabel("Status").selectOption("superseded");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/decisions\/[0-9a-f-]{36}$/);
      await expect(page.getByText("Superseded")).toBeVisible();
      await page.goto(`/projects/${projectId}/decisions`);
      await expect(page.getByRole("link", { name: title })).toBeVisible();
    });
  });
});
