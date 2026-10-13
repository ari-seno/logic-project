import { createClient } from "@/lib/supabase/server";
import type {
  UserAiCredential,
} from "@/lib/supabase/types";
import { decryptSecret } from "@/lib/ai/crypto";

export type CredentialView = Omit<UserAiCredential, "api_key_encrypted"> & {
  api_key_encrypted: null;
};

export type CredentialWithSecret = UserAiCredential & {
  apiKey: string;
};

// Read paths that only ever expose a masked credential never need the
// ciphertext, so they select explicit columns and leave the secret in the DB.
const CREDENTIAL_PUBLIC_COLUMNS =
  "id, user_id, label, provider, base_url, model, enabled, last_tested_at, last_test_status, last_test_message, created_at, updated_at";

function mask(
  credential: Omit<UserAiCredential, "api_key_encrypted">,
): CredentialView {
  return { ...credential, api_key_encrypted: null };
}

export async function listUserCredentials(
  userId: string,
): Promise<CredentialView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select(CREDENTIAL_PUBLIC_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listUserCredentials failed:", error.message);
    return [];
  }
  return (data ?? []).map(mask);
}

export async function getCredential(
  id: string,
  userId: string,
): Promise<CredentialView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select(CREDENTIAL_PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getCredential failed:", error.message);
    return null;
  }
  if (!data) return null;
  return mask(data);
}

export async function getDecryptedCredential(
  id: string,
  userId: string,
): Promise<CredentialWithSecret | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getDecryptedCredential failed:", error.message);
    return null;
  }
  if (!data) return null;
  if (!data.enabled) return null;
  try {
    const apiKey = decryptSecret(data.api_key_encrypted);
    return { ...data, apiKey };
  } catch (err) {
    console.error(
      "getDecryptedCredential: failed to decrypt key",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function getProjectCredential(
  projectId: string,
): Promise<CredentialWithSecret | null> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, ai_credential_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("getProjectCredential failed:", projectError.message);
    return null;
  }
  if (!project || !project.ai_credential_id) return null;
  return getDecryptedCredential(project.ai_credential_id, project.owner_id);
}

export async function getProjectCredentialView(
  projectId: string,
): Promise<CredentialView | null> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, ai_credential_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    console.error("getProjectCredentialView failed:", projectError.message);
    return null;
  }
  if (!project || !project.ai_credential_id) return null;
  return getCredential(project.ai_credential_id, project.owner_id);
}

export async function countUserCredentials(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("user_ai_credentials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("countUserCredentials failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
