import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

// Server-only client that bypasses row level security. Only ever use it behind
// an explicit authorization check (for example, a validated share token).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
