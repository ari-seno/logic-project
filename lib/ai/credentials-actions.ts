"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/ai/crypto";
import { testConnection } from "@/lib/ai/credentials-test";

const baseInput = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label is required")
    .max(80, "Label must be 80 characters or fewer"),
  baseUrl: z
    .string()
    .trim()
    .url("Base URL must be a valid URL")
    .refine(
      (u) => u.startsWith("http://") || u.startsWith("https://"),
      "Base URL must start with http:// or https://",
    ),
  apiKey: z
    .string()
    .trim()
    .min(1, "API key is required")
    .max(2048, "API key is too long"),
  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(120, "Model name is too long"),
  enabled: z.boolean().default(true),
});

export type CreateCredentialInput = z.infer<typeof baseInput>;

function formatError(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  if (err instanceof Error) return err.message;
  return "Unknown error.";
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export type CredentialActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createCredential(
  input: z.input<typeof baseInput>,
): Promise<CredentialActionResult> {
  const parsed = baseInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatError(parsed.error) };
  }
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .insert({
      user_id: userId,
      label: parsed.data.label,
      base_url: parsed.data.baseUrl,
      api_key_encrypted: encryptSecret(parsed.data.apiKey),
      model: parsed.data.model,
      enabled: parsed.data.enabled,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.code === "23505"
          ? "A credential with this label already exists."
          : error?.message ?? "Could not create credential.",
    };
  }
  revalidatePath("/account/settings");
  return { ok: true, id: data.id };
}

const updateInput = baseInput.partial().extend({
  apiKey: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .optional(),
});

export async function updateCredential(
  id: string,
  input: z.input<typeof updateInput>,
): Promise<CredentialActionResult> {
  const parsed = updateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatError(parsed.error) };
  }
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }
  const supabase = await createClient();

  const updates: {
    label?: string;
    base_url?: string;
    model?: string;
    enabled?: boolean;
    api_key_encrypted?: string;
  } = {};
  if (typeof parsed.data.label === "string") updates.label = parsed.data.label;
  if (typeof parsed.data.baseUrl === "string")
    updates.base_url = parsed.data.baseUrl;
  if (typeof parsed.data.model === "string") updates.model = parsed.data.model;
  if (typeof parsed.data.enabled === "boolean")
    updates.enabled = parsed.data.enabled;
  if (typeof parsed.data.apiKey === "string" && parsed.data.apiKey.length > 0) {
    updates.api_key_encrypted = encryptSecret(parsed.data.apiKey);
  }

  if (Object.keys(updates).length === 0) {
    return { ok: true, id };
  }

  const { error } = await supabase
    .from("user_ai_credentials")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A credential with this label already exists."
          : error.message,
    };
  }
  revalidatePath("/account/settings");
  return { ok: true, id };
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteCredential(id: string): Promise<DeleteResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_ai_credentials")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/account/settings");
  return { ok: true };
}

export type TestCredentialResult =
  | { ok: true; status: "ok"; models: string[] }
  | { ok: false; status: string; message: string };

export async function testCredential(
  id: string,
): Promise<TestCredentialResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, status: "unreachable", message: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: "unreachable", message: "Credential not found." };
  }

  const { decryptSecret } = await import("@/lib/ai/crypto");
  const apiKey = decryptSecret(data.api_key_encrypted);
  const result = await testConnection({
    baseUrl: data.base_url,
    apiKey,
  });

  const now = new Date().toISOString();
  if (result.ok) {
    await supabase
      .from("user_ai_credentials")
      .update({
        last_tested_at: now,
        last_test_status: "ok",
        last_test_message: `Found ${result.models.length} model(s).`,
      })
      .eq("id", id)
      .eq("user_id", userId);
    return { ok: true, status: "ok", models: result.models };
  }

  await supabase
    .from("user_ai_credentials")
    .update({
      last_tested_at: now,
      last_test_status: result.status,
      last_test_message: result.message,
    })
    .eq("id", id)
    .eq("user_id", userId);

  return { ok: false, status: result.status, message: result.message };
}

export type SetProjectCredentialResult = { ok: true } | { ok: false; error: string };

export async function setProjectCredential(
  projectId: string,
  credentialId: string | null,
): Promise<SetProjectCredentialResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }
  const supabase = await createClient();

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !project || project.owner_id !== userId) {
    return { ok: false, error: "Project not found." };
  }

  if (credentialId !== null) {
    const { data: credential, error: credErr } = await supabase
      .from("user_ai_credentials")
      .select("id, user_id")
      .eq("id", credentialId)
      .eq("user_id", userId)
      .maybeSingle();
    if (credErr || !credential) {
      return { ok: false, error: "Credential not found." };
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ ai_credential_id: credentialId })
    .eq("id", projectId)
    .eq("owner_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function getProjectCredentialAction(
  projectId: string,
): Promise<{
  ok: true;
  credential:
    | {
        id: string;
        label: string;
        provider: string;
        model: string;
        last_test_status: string | null;
      }
    | null;
} | { ok: false; error: string }> {
  const userId = await currentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in." };
  }
  const supabase = await createClient();
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, owner_id, ai_credential_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectErr || !project || project.owner_id !== userId) {
    return { ok: false, error: "Project not found." };
  }
  if (!project.ai_credential_id) {
    return { ok: true, credential: null };
  }
  const { data: credential } = await supabase
    .from("user_ai_credentials")
    .select("id, label, provider, model, last_test_status, user_id")
    .eq("id", project.ai_credential_id)
    .maybeSingle();
  if (!credential || credential.user_id !== userId) {
    return { ok: true, credential: null };
  }
  return {
    ok: true,
    credential: {
      id: credential.id,
      label: credential.label,
      provider: credential.provider,
      model: credential.model,
      last_test_status: credential.last_test_status,
    },
  };
}

export async function listMyCredentialsAction(): Promise<
  | {
      ok: true;
      credentials: Array<{
        id: string;
        label: string;
        provider: string;
        base_url: string;
        model: string;
        enabled: boolean;
        last_test_status: string | null;
        last_test_message: string | null;
        last_tested_at: string | null;
        updated_at: string;
      }>;
    }
  | { ok: false; error: string }
> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_credentials")
    .select(
      "id, label, provider, base_url, model, enabled, last_test_status, last_test_message, last_tested_at, updated_at, api_key_encrypted",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    credentials: (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      provider: row.provider,
      base_url: row.base_url,
      model: row.model,
      enabled: row.enabled,
      last_test_status: row.last_test_status,
      last_test_message: row.last_test_message,
      last_tested_at: row.last_tested_at,
      updated_at: row.updated_at,
    })),
  };
}

export async function listCredentialsForProjectAction(): Promise<{
  ok: true;
  credentials: Array<{
    id: string;
    label: string;
    model: string;
    provider: string;
  }>;
}> {
  const result = await listMyCredentialsAction();
  if (!result.ok) {
    return { ok: true, credentials: [] };
  }
  return {
    ok: true,
    credentials: result.credentials.map((c) => ({
      id: c.id,
      label: c.label,
      model: c.model,
      provider: c.provider,
    })),
  };
}

export async function credentialFormRedirectAfterSave(target: string) {
  redirect(target);
}
