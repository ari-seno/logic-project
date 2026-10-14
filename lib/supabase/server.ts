import { cache } from "react";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AuthUser = { id: string; email: string | null };

/**
 * The signed-in user, resolved once per request.
 *
 * `getClaims()` verifies the JWT locally against the project's JWKS when the
 * project uses asymmetric signing keys, avoiding a round-trip to the Auth
 * server. If that fails for any reason we fall back to `getUser()`, which
 * always validates server-side. Wrapping both in `cache()` means the layout,
 * page, and any server action invoked during the same request share a single
 * auth lookup.
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (!error && data?.claims?.sub) {
    return {
      id: data.claims.sub,
      email: typeof data.claims.email === "string" ? data.claims.email : null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
