import type { Page } from "@playwright/test";

export async function confirmDeletion(
  page: Page,
  confirmLabel: string = "Delete",
) {
  await page.getByLabel(/type confirm to confirm/i).fill("confirm");
  await page
    .getByRole("button", { name: confirmLabel, exact: true })
    .click();
}
