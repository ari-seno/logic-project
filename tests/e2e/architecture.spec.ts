import { expect, test } from "./helpers/fixtures";
import { signOut, signUp, uniqueEmail } from "./helpers/auth";
import { confirmDeletion } from "./helpers/confirm-delete";

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page
    .getByLabel("Description")
    .fill("Project for architecture tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

async function createComponent(
  page: import("@playwright/test").Page,
  projectId: string,
  name: string,
  type: string,
) {
  await page.goto(`/projects/${projectId}/architecture/components/new`);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Type").selectOption(type);
  await page.getByRole("button", { name: /create component/i }).click();
  await expect(page).toHaveURL(
    new RegExp(`/architecture/components/[0-9a-f-]{36}$`),
  );
  return page.url();
}

test.describe("Architecture", () => {
  test.describe("with backend", () => {
    test("user can create a component and see it on the architecture overview", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-comp"));
      const projectId = await createProject(page, `Arch ${Date.now()}`);
      await createComponent(page, projectId, `Web App ${Date.now()}`, "frontend");
      await page.goto(`/projects/${projectId}/architecture`);
      await expect(
        page.getByRole("link", { name: /^Web App \d+ Frontend$/ }).first(),
      ).toBeVisible();
    });

    test("user sees an empty state for architecture on a fresh project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-empty"));
      const projectId = await createProject(page, `Arch Empty ${Date.now()}`);
      await page.goto(`/projects/${projectId}/architecture`);
      await expect(page.getByText(/no components yet/i)).toBeVisible();
      await expect(page.getByText(/no technologies yet/i)).toBeVisible();
      await expect(page.getByText(/no architecture decisions yet/i)).toBeVisible();
      await expect(page.getByText(/no dependencies yet/i)).toBeVisible();
    });

    test("user can create a technology and a decision and the overview counts increment", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-tech"));
      const projectId = await createProject(page, `Tech ${Date.now()}`);

      await page.goto(`/projects/${projectId}/architecture/technologies/new`);
      await page.getByLabel("Name").fill(`TypeScript ${Date.now()}`);
      await page.getByLabel("Category").selectOption("language");
      await page
        .getByRole("button", { name: /create technology/i })
        .click();
      await expect(page).toHaveURL(/\/architecture\/technologies\//);

      await page.goto(`/projects/${projectId}/architecture/decisions/new`);
      await page.getByLabel("Title").fill(`Use Postgres ${Date.now()}`);
      await page
        .getByLabel("Decision")
        .fill("Use Postgres as the primary datastore.");
      await page
        .getByRole("button", { name: /create decision/i })
        .click();
      await expect(page).toHaveURL(/\/architecture\/decisions\/[0-9a-f-]{36}$/);

      await page.goto(`/projects/${projectId}/architecture`);
      await expect(
        page.getByRole("link", { name: /^TypeScript \d+$/ }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /^Use Postgres \d+$/ }).first(),
      ).toBeVisible();
    });

    test("user can edit a component", async ({ page, backend }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-edit"));
      const projectId = await createProject(page, `Edit ${Date.now()}`);
      const original = `Original Comp ${Date.now()}`;
      await createComponent(page, projectId, original, "frontend");
      await page.getByRole("link", { name: /^edit$/i }).click();
      await expect(page).toHaveURL(/\/edit$/);
      const newName = `Updated Comp ${Date.now()}`;
      await page.getByLabel("Name").fill(newName);
      await page.getByLabel("Type").selectOption("backend");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/architecture\/components\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: newName })).toBeVisible();
    });

    test("user can delete a component from its detail page", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-del"));
      const projectId = await createProject(page, `Del Comp ${Date.now()}`);
      const target = `Doomed Comp ${Date.now()}`;
      await createComponent(page, projectId, target, "frontend");
      await page.getByRole("button", { name: "Delete this component" }).click();
      await confirmDeletion(page);
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/architecture$`),
      );
      await page.goto(`/projects/${projectId}/architecture/components`);
      await expect(
        page.getByRole("link", { name: target }).first(),
      ).toHaveCount(0);
    });

    test("user can create a dependency between two components", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("arch-dep"));
      const projectId = await createProject(page, `Deps ${Date.now()}`);
      await createComponent(page, projectId, `API ${Date.now()}`, "backend");
      await createComponent(page, projectId, `DB ${Date.now()}`, "database");
      await page.goto(
        `/projects/${projectId}/architecture/dependencies/new`,
      );
      const apiOptions = await page
        .getByLabel("Source component")
        .locator("option")
        .allInnerTexts();
      const dbOptions = await page
        .getByLabel("Target component")
        .locator("option")
        .allInnerTexts();
      expect(apiOptions.length).toBeGreaterThan(1);
      expect(dbOptions.length).toBeGreaterThan(1);
      const sourceVal = await page
        .getByLabel("Source component")
        .locator("option")
        .nth(1)
        .getAttribute("value");
      const targetVal = await page
        .getByLabel("Target component")
        .locator("option")
        .nth(2)
        .getAttribute("value");
      expect(sourceVal).not.toBeNull();
      expect(targetVal).not.toBeNull();
      expect(sourceVal).not.toEqual(targetVal);
      await page
        .getByLabel("Source component")
        .selectOption(sourceVal ?? "");
      await page
        .getByLabel("Target component")
        .selectOption(targetVal ?? "");
      await page
        .getByRole("button", { name: /create dependency/i })
        .click();
      await expect(page).toHaveURL(
        /\/architecture\/dependencies\/[0-9a-f-]{36}$/,
      );
    });

    test("user B cannot access user A's architecture entities", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-arch"));
      const projectId = await createProject(
        page,
        `Alice arch ${Date.now()}`,
      );
      await createComponent(page, projectId, `Alice secret ${Date.now()}`, "frontend");
      const componentUrl = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-arch"));
      const bobPage = await context.newPage();
      await bobPage.goto(componentUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.goto(`/projects/${projectId}/architecture`);
      await expect(
        bobPage.getByRole("link", { name: /Alice secret/ }),
      ).toHaveCount(0);
      await bobPage.close();
    });
  });
});
