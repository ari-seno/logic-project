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
    .fill("Project for task tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const m = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return m?.[1] ?? "";
}

test.describe("Tasks", () => {
  test.describe("with backend", () => {
    test("user sees an empty task list on a fresh project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("tasks-empty"));
      const projectId = await createProject(page, `Empty ${Date.now()}`);
      await page.goto(`/projects/${projectId}/tasks`);
      await expect(page.getByRole("heading", { name: /^tasks$/i })).toBeVisible();
      await expect(
        page.getByText(/no tasks match these filters\./i),
      ).toBeVisible();
    });

    test("user can create, view, edit, and delete a task", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("tasks-flow"));
      const projectId = await createProject(page, `TaskFlow ${Date.now()}`);

      await page.goto(`/projects/${projectId}/tasks/new`);
      await page.getByLabel("Title").fill(`Build login ${Date.now()}`);
      await page.getByLabel("Type").selectOption("feature");
      await page.getByLabel("Priority").selectOption("high");
      await page.getByLabel("Effort").selectOption("m");
      await page
        .getByLabel("Acceptance criteria")
        .fill("- happy path\n- validation errors");
      await page.getByRole("button", { name: /create task/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/tasks/[0-9a-f-]{36}$`),
      );
      await expect(
        page.getByRole("heading", { name: /Build login /i }),
      ).toBeVisible();

      await page.getByRole("link", { name: /^edit$/i }).click();
      await expect(page).toHaveURL(/\/edit$/);
      await page.getByLabel("Title").fill(`Build login v2 ${Date.now()}`);
      await page.getByLabel("Priority").selectOption("critical");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      await expect(page.getByText("Critical").first()).toBeVisible();

      await page.goto(`/projects/${projectId}/tasks`);
      await expect(
        page.getByRole("link", { name: /Build login v2/ }),
      ).toBeVisible();

      // Delete via the detail page
      await page.locator("a", { hasText: "Build login v2" }).click();
      await page.getByRole("button", { name: /^delete$/i }).click();
      await page.getByRole("button", { name: /click again to confirm/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/tasks$`),
      );
      await expect(
        page.getByRole("link", { name: /Build login v2/ }),
      ).toHaveCount(0);
    });

    test("user can create a child task and a blocks dependency", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("tasks-dep"));
      const projectId = await createProject(page, `Deps ${Date.now()}`);

      // Create parent task
      await page.goto(`/projects/${projectId}/tasks/new`);
      await page.getByLabel("Title").fill(`Schema ${Date.now()}`);
      await page.getByLabel("Type").selectOption("database");
      await page.getByRole("button", { name: /create task/i }).click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      const schemaUrl = page.url();
      const schemaId = schemaUrl.match(/\/tasks\/([0-9a-f-]{36})/)?.[1];

      // Create child task linking to parent
      await page.goto(`/projects/${projectId}/tasks/new`);
      await page.getByLabel("Title").fill(`Repository ${Date.now()}`);
      await page.getByLabel("Type").selectOption("backend");
      if (schemaId) {
        await page.getByLabel("Parent task").selectOption(schemaId);
      }
      await page.getByRole("button", { name: /create task/i }).click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      const repoUrl = page.url();

      // Add dependency in the child task
      await page.goto(repoUrl);
      await page.getByLabel("Depends on").selectOption(schemaId ?? "");
      await page.getByRole("button", { name: /add dependency/i }).click();
      await expect(page.getByText(/Schema \d+/).first()).toBeVisible();
    });

    test("user B cannot access user A's task", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-task"));
      const projectId = await createProject(
        page,
        `Alice Task ${Date.now()}`,
      );
      await page.goto(`/projects/${projectId}/tasks/new`);
      await page.getByLabel("Title").fill(`Alice secret ${Date.now()}`);
      await page.getByLabel("Type").selectOption("feature");
      await page.getByRole("button", { name: /create task/i }).click();
      await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
      const url = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-task"));
      const bobPage = await context.newPage();
      await bobPage.goto(url);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.goto(`/projects/${projectId}/tasks`);
      await expect(
        bobPage.getByText(/Alice secret/),
      ).toHaveCount(0);
      await bobPage.close();
    });
  });
});
