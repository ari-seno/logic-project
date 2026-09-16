import { createClient } from "@/lib/supabase/server";
import {
  type ApiEndpointEntityRole,
  type UiScreenEntityRole,
} from "@/lib/supabase/types";

export type UiInteractionEndpointLink = {
  id: string;
  interaction_id: string;
  endpoint_id: string;
  endpoint_label: string;
  endpoint_method: string;
  endpoint_path: string;
};

export type UiScreenRequirementLink = {
  id: string;
  screen_id: string;
  requirement_id: string;
  requirement_title: string;
  requirement_status: string;
};

export type UiScreenEntityLink = {
  id: string;
  screen_id: string;
  entity_id: string;
  role: UiScreenEntityRole;
  entity_name: string;
  domain_name: string;
};

export async function listInteractionEndpoints(
  interactionId: string,
): Promise<UiInteractionEndpointLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_interaction_endpoints")
    .select(
      "id, interaction_id, endpoint_id, api_endpoints(name, method, path)",
    )
    .eq("interaction_id", interactionId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as {
      id: string;
      interaction_id: string;
      endpoint_id: string;
      api_endpoints: { name: string; method: string; path: string } | null;
    };
    return {
      id: r.id,
      interaction_id: r.interaction_id,
      endpoint_id: r.endpoint_id,
      endpoint_label: r.api_endpoints?.name ?? "(deleted)",
      endpoint_method: r.api_endpoints?.method ?? "GET",
      endpoint_path: r.api_endpoints?.path ?? "",
    };
  });
}

export async function listScreenRequirements(
  screenId: string,
): Promise<UiScreenRequirementLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_screen_requirements")
    .select("id, screen_id, requirement_id, requirements(title, status)")
    .eq("screen_id", screenId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as {
      id: string;
      screen_id: string;
      requirement_id: string;
      requirements: { title: string; status: string } | null;
    };
    return {
      id: r.id,
      screen_id: r.screen_id,
      requirement_id: r.requirement_id,
      requirement_title: r.requirements?.title ?? "(deleted)",
      requirement_status: r.requirements?.status ?? "draft",
    };
  });
}

export async function listScreenEntities(
  screenId: string,
): Promise<UiScreenEntityLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_screen_entities")
    .select(
      "id, screen_id, entity_id, role, entities(name, domains(name))",
    )
    .eq("screen_id", screenId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as {
      id: string;
      screen_id: string;
      entity_id: string;
      role: UiScreenEntityRole;
      entities: { name: string; domains: { name: string } | null } | null;
    };
    return {
      id: r.id,
      screen_id: r.screen_id,
      entity_id: r.entity_id,
      role: r.role,
      entity_name: r.entities?.name ?? "(deleted)",
      domain_name: r.entities?.domains?.name ?? "",
    };
  });
}

export { type ApiEndpointEntityRole };
