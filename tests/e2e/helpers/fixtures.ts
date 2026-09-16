import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ backend: { hasBackend: boolean } }>({
  backend: async ({ }, apply) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const hasBackend = Boolean(url && key && !url.includes("localhost"));
    await apply({ hasBackend });
  },
});

export { expect };
