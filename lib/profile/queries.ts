import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export type ProfileView = Profile & {
  email: string;
};

export async function getCurrentProfile(): Promise<ProfileView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? "",
      display_name: null,
      created_at: user.created_at,
      updated_at: user.updated_at ?? user.created_at,
      deleted_at: null,
      purge_after: null,
    };
  }
  return {
    ...(profile as Profile),
    email: user.email ?? profile.email ?? "",
  };
}
