import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthPath, isProtectedPath } from "@/lib/supabase/middleware-paths";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  let isAuthed = !claimsError && Boolean(claimsData?.claims?.sub);

  // `getClaims()` verifies the JWT locally (JWKS) when the project uses
  // asymmetric signing keys and costs nothing for signed-out visitors. If it
  // cannot verify (e.g. a JWKS fetch failure), fall back to the Auth server.
  if (claimsError) {
    const {
      data: { user: fallbackUser },
    } = await supabase.auth.getUser();
    isAuthed = Boolean(fallbackUser);
  }

  const pathname = request.nextUrl.pathname;

  if (!isAuthed && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAuthed && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export { PROTECTED_PREFIXES, AUTH_PREFIXES, isProtectedPath, isAuthPath } from "@/lib/supabase/middleware-paths";
