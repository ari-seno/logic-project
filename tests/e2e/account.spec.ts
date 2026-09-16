import { expect, test } from "./helpers/fixtures";
import { signUp, uniqueEmail } from "./helpers/auth";

test.describe("Account", () => {
  test.describe("with backend", () => {
    test("user can view their profile after signup", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      await signUp(page, uniqueEmail("account-view"));
      await page.goto("/account");
      await expect(
        page.getByRole("heading", { name: /your account/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /edit settings/i }),
      ).toBeVisible();
      await expect(page.getByText(/Member since/i)).toBeVisible();
    });

    test("user can update their display name from settings", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("account-edit");
      await signUp(page, email);
      await page.goto("/account/settings");
      const newName = `Demo ${Date.now()}`;
      await page.getByLabel("Display name").fill(newName);
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL(/\/account\/settings/);
      await expect(page.getByText(/profile updated/i)).toBeVisible();
      await page.goto("/account");
      await expect(page.getByText(newName).first()).toBeVisible();
    });

    test("clearing display name falls back to email-based name", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("account-clear");
      await signUp(page, email);
      await page.goto("/account/settings");
      await page.getByLabel("Display name").fill(`Initial ${Date.now()}`);
      await page.getByRole("button", { name: /save changes/i }).click();
      await page.goto("/account/settings");
      await page.getByLabel("Display name").fill("");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page.getByText(/profile updated/i)).toBeVisible();
      await page.goto("/account");
      await expect(
        page.getByText(/no display name/i).first(),
      ).toBeVisible();
    });

    test("account routes redirect to login when unauthenticated", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      // Open a fresh page without auth
      await page.goto("/account");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
