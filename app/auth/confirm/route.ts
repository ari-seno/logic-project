import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Landing point for the link Supabase sends when email confirmation is
// enabled. It accepts either the PKCE `code` flow or the `token_hash` + `type`
// flow, establishes the session, then sends the user on to the dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const destination = request.nextUrl.clone();
  destination.pathname = "/dashboard";
  destination.search = "";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(destination);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(destination);
    }
  }

  const failure = request.nextUrl.clone();
  failure.pathname = "/login";
  failure.search = "";
  failure.searchParams.set(
    "error",
    "We could not confirm your email. Try signing in, or register again.",
  );
  return NextResponse.redirect(failure);
}
