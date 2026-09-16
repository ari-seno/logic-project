import { expect, test } from "./helpers/fixtures";
import { signUp, uniqueEmail } from "./helpers/auth";

async function createProjectFor(page: import("@playwright/test").Page, name: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: /create project/i }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  return page.url();
}

test.describe("Domain modeling", () => {
  test.describe("with backend", () => {
    test("user can create a domain and land on its detail page", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("domain");
      await signUp(page, email);
      const projectUrl = await createProjectFor(page, "Project for domain");

      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Catalog");
      await page.getByLabel("Description").fill("Product catalog");
      await page.getByRole("button", { name: /create domain/i }).click();
      await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}\/domains\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    });

    test("domain appears on the domains list after creation", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("domlist");
      await signUp(page, email);
      const projectUrl = await createProjectFor(page, "List domain project");
      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Orders");
      await page.getByRole("button", { name: /create domain/i }).click();
      await expect(page).toHaveURL(/\/domains\/[0-9a-f-]{36}$/);
      await page.goto(`${projectUrl}/domains`);
      await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
    });

    test("user can add an entity to a domain", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("entity");
      await signUp(page, email);
      const projectUrl = await createProjectFor(page, "Entity project");
      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Catalog");
      await page.getByRole("button", { name: /create domain/i }).click();
      await expect(page).toHaveURL(/\/domains\/[0-9a-f-]{36}$/);
      const domainUrl = page.url();

      await page.goto(`${domainUrl}/entities/new`);
      await page.getByLabel("Name").fill("Product");
      await page.getByRole("button", { name: /create entity/i }).click();
      await expect(page).toHaveURL(/\/entities\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: "Product" })).toBeVisible();
    });

    test("user can add an attribute to an entity", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("attr");
      await signUp(page, email);
      const projectUrl = await createProjectFor(page, "Attribute project");
      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Catalog");
      await page.getByRole("button", { name: /create domain/i }).click();
      const domainUrl = page.url();
      await page.goto(`${domainUrl}/entities/new`);
      await page.getByLabel("Name").fill("Product");
      await page.getByRole("button", { name: /create entity/i }).click();
      const entityUrl = page.url();
      void entityUrl;

      await page.getByRole("button", { name: /add attribute/i }).click();
      await page.getByLabel("Name").fill("price");
      await page.getByLabel("Data type").selectOption("decimal");
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("price")).toBeVisible();
      await expect(page.getByText("decimal")).toBeVisible();
    });

    test("ERD page renders entities and relationships", async ({
      page,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const email = uniqueEmail("erd");
      await signUp(page, email);
      const projectUrl = await createProjectFor(page, "ERD project");
      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Sales");
      await page.getByRole("button", { name: /create domain/i }).click();
      const domainUrl = page.url();
      await page.goto(`${domainUrl}/entities/new`);
      await page.getByLabel("Name").fill("Customer");
      await page.getByRole("button", { name: /create entity/i }).click();
      await page.goto(`${domainUrl}/entities/new`);
      await page.getByLabel("Name").fill("Order");
      await page.getByRole("button", { name: /create entity/i }).click();

      await page.goto(`${projectUrl}/domains/erd`);
      await expect(page.getByText("Customer")).toBeVisible();
      await expect(page.getByText("Order")).toBeVisible();
    });

    test("cross-user cannot access another user's domain", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const userAEmail = uniqueEmail("alice");
      await signUp(page, userAEmail);
      const projectUrl = await createProjectFor(page, "Alice domain project");
      await page.goto(`${projectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Alice's private domain");
      await page.getByRole("button", { name: /create domain/i }).click();
      await expect(page).toHaveURL(/\/domains\/[0-9a-f-]{36}$/);
      const aliceDomainUrl = page.url();
      await page.getByRole("button", { name: /sign out/i }).click();
      await expect(page).toHaveURL(/\/$/);

      const userBEmail = uniqueEmail("bob");
      await signUp(page, userBEmail);
      const bobPage = await context.newPage();
      await bobPage.goto(aliceDomainUrl);
      await expect(
        bobPage.getByRole("heading", { name: /page not found/i }),
      ).toBeVisible();
      await bobPage.close();
    });

    test("cross-project relationship is rejected", async ({
      page,
      context,
      backend,
    }) => {
      test.skip(!backend.hasBackend, "Supabase backend not configured");
      const aliceEmail = uniqueEmail("alice-rel");
      await signUp(page, aliceEmail);
      const aliceProjectUrl = await createProjectFor(
        page,
        "Alice relationship project",
      );
      await page.goto(`${aliceProjectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Catalog");
      await page.getByRole("button", { name: /create domain/i }).click();
      const aliceDomainUrl = page.url();
      await page.goto(`${aliceDomainUrl}/entities/new`);
      await page.getByLabel("Name").fill("AliceProduct");
      await page.getByRole("button", { name: /create entity/i }).click();
      await page.getByRole("button", { name: /sign out/i }).click();

      const bobEmail = uniqueEmail("bob-rel");
      await signUp(page, bobEmail);
      const bobProjectUrl = await createProjectFor(
        page,
        "Bob relationship project",
      );
      await page.goto(`${bobProjectUrl}/domains/new`);
      await page.getByLabel("Name").fill("Bob Catalog");
      await page.getByRole("button", { name: /create domain/i }).click();
      const bobDomainUrl = page.url();
      await page.goto(`${bobDomainUrl}/entities/new`);
      await page.getByLabel("Name").fill("BobProduct");
      await page.getByRole("button", { name: /create entity/i }).click();

      const bobEntitiesPage = await context.newPage();
      await bobEntitiesPage.goto(
        `${bobProjectUrl}/domains/relationships/new`,
      );
      const sourceSelect = bobEntitiesPage.getByLabel("Source entity");
      const aliceOption = sourceSelect
        .locator("option")
        .filter({ hasText: "AliceProduct" });
      await expect(aliceOption).toHaveCount(0);
      await bobEntitiesPage.close();
    });
  });
});
