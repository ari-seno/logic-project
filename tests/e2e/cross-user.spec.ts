import { expect, test } from "./helpers/fixtures";
import { signOut, signUp, uniqueEmail } from "./helpers/auth";

test.describe("Cross-user data isolation", () => {
  test("user B cannot see user A's projects in /projects", async ({
    page,
    context,
    backend,
  }) => {
    test.skip(!backend.hasBackend, "Supabase backend not configured");

    const userAEmail = uniqueEmail("alice");
    await signUp(page, userAEmail);
    await page.goto("/projects/new");
    const projectName = `Alice secret ${Date.now()}`;
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
    const aliceProjectUrl = page.url();
    await signOut(page);
    await expect(page).toHaveURL(/\/$/);

    const userBEmail = uniqueEmail("bob");
    await signUp(page, userBEmail);
    await page.goto("/projects");
    await expect(page.getByRole("link", { name: projectName })).toHaveCount(0);

    const alicePage = await context.newPage();
    await alicePage.goto(aliceProjectUrl);
    await expect(
      alicePage.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
    await alicePage.close();
  });

  test("user B cannot edit user A's project", async ({
    page,
    context,
    backend,
  }) => {
    test.skip(!backend.hasBackend, "Supabase backend not configured");

    const userAEmail = uniqueEmail("owner");
    await signUp(page, userAEmail);
    await page.goto("/projects/new");
    const projectName = `Owner only ${Date.now()}`;
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
    const ownerUrl = page.url();
    await signOut(page);

    const userBEmail = uniqueEmail("intruder");
    await signUp(page, userBEmail);
    const intruderPage = await context.newPage();
    await intruderPage.goto(ownerUrl);
    await expect(
      intruderPage.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
    await intruderPage.close();
  });
});
