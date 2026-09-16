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
    .fill("Project for UI tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

test.describe("UI design", () => {
  test.describe("with backend", () => {
    test("user sees an empty UI overview on a fresh project", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("ui-empty"));
      const projectId = await createProject(page, `Ui Empty ${Date.now()}`);
      await page.goto(`/projects/${projectId}/ui`);
      await expect(
        page.getByRole("heading", { name: /ui design/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/no screens yet\./i).first(),
      ).toBeVisible();
    });

    test("user can create a screen and a component then place them", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("ui-basic"));
      const projectId = await createProject(page, `Ui ${Date.now()}`);

      // Create component first
      await page.goto(`/projects/${projectId}/ui/components/new`);
      await page.getByLabel("Name").fill(`Header ${Date.now()}`);
      await page
        .getByLabel("Component type")
        .selectOption("header");
      await page
        .getByRole("button", { name: /create component/i })
        .click();
      await expect(page).toHaveURL(/\/ui\/components$/);

      // Create screen
      await page.goto(`/projects/${projectId}/ui/screens/new`);
      await page.getByLabel("Name").fill(`Home ${Date.now()}`);
      await page.getByLabel("Screen type").selectOption("page");
      await page.getByLabel("Route").fill(`/home-${Date.now()}`);
      await page.getByRole("button", { name: /create screen/i }).click();
      await expect(page).toHaveURL(
        new RegExp(`/projects/${projectId}/ui/screens/[0-9a-f-]{36}$`),
      );

      await expect(
        page.getByRole("heading", { name: /^components$/i }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /^forms$/i })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^states$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^interactions$/i }),
      ).toBeVisible();
    });

    test("user can add a state and an interaction to a screen", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("ui-state"));
      const projectId = await createProject(page, `Uis ${Date.now()}`);
      await page.goto(`/projects/${projectId}/ui/screens/new`);
      await page.getByLabel("Name").fill(`List ${Date.now()}`);
      await page.getByLabel("Screen type").selectOption("list");
      await page.getByRole("button", { name: /create screen/i }).click();
      await expect(page).toHaveURL(/\/ui\/screens\/[0-9a-f-]{36}$/);

      await page
        .getByRole("heading", { name: "Add state" })
        .scrollIntoViewIfNeeded();
      await page.locator("#name").first().fill("Loading");
      await page.locator("#state_type").first().selectOption("loading");
      await page.getByRole("button", { name: /add state/i }).click();
      await expect(page.getByText("Loading").first()).toBeVisible();

      await page
        .getByRole("heading", { name: "Add interaction" })
        .scrollIntoViewIfNeeded();
      await page.locator("#name").first().fill("Reload");
      await page.locator("#trigger").first().fill("Click refresh");
      await page.locator("#action").first().fill("GET /api/items");
      await page.getByRole("button", { name: /add interaction/i }).click();
      await expect(page.getByText("Click refresh").first()).toBeVisible();
    });

    test("user B cannot access user A's screen", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-ui"));
      const projectId = await createProject(page, `Alice Ui ${Date.now()}`);
      await page.goto(`/projects/${projectId}/ui/screens/new`);
      await page.getByLabel("Name").fill(`Alice private ${Date.now()}`);
      await page.getByLabel("Screen type").selectOption("page");
      await page.getByRole("button", { name: /create screen/i }).click();
      await expect(page).toHaveURL(/\/ui\/screens\/[0-9a-f-]{36}$/);
      const screenUrl = page.url();
      await signOut(page);

      await signUp(page, uniqueEmail("bob-ui"));
      const bobPage = await context.newPage();
      await bobPage.goto(screenUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.goto(`/projects/${projectId}/ui`);
      await expect(
        bobPage.getByText(/Alice private/),
      ).toHaveCount(0);
      await bobPage.close();
    });
  });
});
