"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import {
  loginSchema,
  registerSchema,
  type AuthActionState,
} from "@/lib/validation/auth";

export async function signIn(
  _prev: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as AuthActionState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prev: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as AuthActionState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled Supabase returns no session, so the
  // user has to confirm before they can sign in. Surface that instead of
  // redirecting to a page that would immediately bounce back to /login.
  if (!data.session) {
    return {
      message:
        "Check your inbox to confirm your email address, then sign in.",
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
