import {
  createClient,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import type { Domain } from "@/lib/supabase/types";

export type ListDomainsOptions = {
  projectId: string;
  limit?: number;
};

export async function listDomains(
  options: ListDomainsOptions,
): Promise<Domain[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();

  let query = supabase
    .from("domains")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listDomains failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countDomains(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("countDomains failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getDomain(id: string): Promise<Domain | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDomain failed:", error.message);
    return null;
  }
  return data ?? null;
}
