import { expect, test } from "./helpers/fixtures";
import { signOut, signUp, uniqueEmail } from "./helpers/auth";

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Description").fill("Project for export tests.");
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/projects\/([0-9a-f-]{36})/);
  return match?.[1] ?? "";
}

test.describe("Export", () => {
  test.describe("with backend", () => {
    test("user can open the export menu and download markdown", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("export-md"));
      await createProject(page, `Export ${Date.now()}`);

      await page.getByRole("button", { name: /^export$/i }).click();
      await expect(
        page.getByRole("link", { name: /markdown/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /openapi 3.1/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /sql schema/i }),
      ).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("link", { name: /markdown/i }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.md$/);
    });

    test("export route serves openapi, sql, and json for the owner", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("export-api"));
      const projectId = await createProject(page, `Export API ${Date.now()}`);

      const openapi = await page.request.get(
        `/api/projects/${projectId}/export?format=openapi`,
      );
      expect(openapi.status()).toBe(200);
      expect(openapi.headers()["content-disposition"]).toContain("attachment");
      const openapiBody = await openapi.json();
      expect(openapiBody.openapi).toBe("3.1.0");

      const sql = await page.request.get(
        `/api/projects/${projectId}/export?format=sql`,
      );
      expect(sql.status()).toBe(200);
      expect(await sql.text()).toContain("-- project:");

      const json = await page.request.get(
        `/api/projects/${projectId}/export?format=json`,
      );
      expect(json.status()).toBe(200);
      expect((await json.json()).generator).toBe("logic-project");
    });

    test("export route rejects unsupported formats", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("export-bad"));
      const projectId = await createProject(page, `Export Bad ${Date.now()}`);

      const response = await page.request.get(
        `/api/projects/${projectId}/export?format=pdf`,
      );
      expect(response.status()).toBe(400);
      expect((await response.json()).formats).toContain("md");
    });

    test("user B cannot export user A's project", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("alice-export"));
      const projectId = await createProject(page, `Alice export ${Date.now()}`);
      await signOut(page);

      await signUp(page, uniqueEmail("bob-export"));
      const bobPage = await context.newPage();
      const response = await bobPage.request.get(
        `/api/projects/${projectId}/export?format=md`,
      );
      expect(response.status()).toBe(404);
      await bobPage.close();
    });
  });
});
