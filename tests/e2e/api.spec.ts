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
    .fill("Project for API tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

test.describe("API design", () => {
  test.describe("with backend", () => {
    test("user sees an empty API overview on a fresh project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("api-empty"));
      const projectId = await createProject(page, `Api Empty ${Date.now()}`);
      await page.goto(`/projects/${projectId}/api`);
      await expect(page.getByRole("heading", { name: /api design/i })).toBeVisible();
      await expect(
        page.getByText(/create one to organize related endpoints/i),
      ).toBeVisible();
      await expect(page.getByText(/no endpoints yet\./i)).toBeVisible();
    });

    test("user can create a group then an endpoint", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("api-grp"));
      const projectId = await createProject(page, `Api ${Date.now()}`);

      await page.goto(`/projects/${projectId}/api/groups/new`);
      await page.getByLabel("Name").fill(`Auth ${Date.now()}`);
      await page.getByLabel("URL prefix").fill("/api/auth");
      await page.getByRole("button", { name: /create group/i }).click();
      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/api($|#)`));

      await page.goto(`/projects/${projectId}/api/endpoints/new`);
      await page.getByLabel("Method").selectOption("POST");
      await page.getByLabel("Path").fill(`/api/login-${Date.now()}`);
      await page.getByLabel("Name").fill("Login");
      await page.getByLabel("Summary").fill("Authenticate a user");
      await page.getByRole("button", { name: /create endpoint/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/api/[0-9a-f-]{36}$`),
      );
      await expect(page.getByText(/Login/i).first()).toBeVisible();
    });

    test("endpoint shows parameters and request body sections", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("api-sections"));
      const projectId = await createProject(page, `Sec ${Date.now()}`);

      await page.goto(`/projects/${projectId}/api/endpoints/new`);
      await page.getByLabel("Method").selectOption("GET");
      await page.getByLabel("Path").fill(`/api/items-${Date.now()}`);
      await page.getByLabel("Name").fill("List items");
      await page.getByRole("button", { name: /create endpoint/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/api/[0-9a-f-]{36}$`),
      );
      await expect(
        page.getByRole("heading", { name: /parameters/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Request body", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /responses/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^errors$/i }),
      ).toBeVisible();
    });

    test("user can add a parameter and a response", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("api-add"));
      const projectId = await createProject(page, `Add ${Date.now()}`);

      await page.goto(`/projects/${projectId}/api/endpoints/new`);
      await page.getByLabel("Method").selectOption("GET");
      await page.getByLabel("Path").fill(`/api/x-${Date.now()}`);
      await page.getByLabel("Name").fill("Get one");
      await page.getByRole("button", { name: /create endpoint/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/api/[0-9a-f-]{36}$`),
      );

      await page.getByLabel("Name").first().fill("id");
      await page.getByLabel("Location").first().selectOption("path");
      await page.getByLabel("Type").first().selectOption("uuid");
      await page.getByRole("button", { name: /add parameter/i }).click();
      await expect(page.getByText("id").first()).toBeVisible();

      await page.getByLabel("Status code").fill("200");
      await page.getByLabel("Content type").first().fill("application/json");
      await page.getByRole("button", { name: /add response/i }).click();
      await expect(page.getByText("200").first()).toBeVisible();
    });

    test("user B cannot access user A's API design", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-api"));
      const projectId = await createProject(page, `Alice Api ${Date.now()}`);
      await page.goto(`/projects/${projectId}/api/endpoints/new`);
      await page.getByLabel("Method").selectOption("POST");
      await page.getByLabel("Path").fill(`/api/private-${Date.now()}`);
      await page.getByLabel("Name").fill("Alice private");
      await page.getByRole("button", { name: /create endpoint/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/api/[0-9a-f-]{36}$`),
      );
      const endpointUrl = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-api"));
      const bobPage = await context.newPage();
      await bobPage.goto(endpointUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.goto(`/projects/${projectId}/api`);
      await expect(
        bobPage.getByText(/Alice private/i),
      ).toHaveCount(0);
      await bobPage.close();
    });
  });
});
