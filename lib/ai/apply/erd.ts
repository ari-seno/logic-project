import { createClient } from "@/lib/supabase/server";
import { domainInputSchema } from "@/lib/validation/domains";
import { entityInputSchema } from "@/lib/validation/entities";
import { attributeInputSchema } from "@/lib/validation/attributes";
import { relationshipInputSchema } from "@/lib/validation/relationships";
import type { EntityDataType, RelationshipType } from "@/lib/supabase/types";
import type {
  AiErdAttributeItem,
  AiErdDomainItem,
  AiErdRelationshipItem,
} from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

export type ApplyErdOptions = {
  projectId: string;
  userId: string;
  items: AiErdDomainItem[];
  indices: number[];
};

export type ErdDomainRow = { name: string; description: string | null };
export type ErdEntityRow = { name: string; description: string | null };
export type ErdAttributeRow = {
  name: string;
  data_type: EntityDataType;
  is_required: boolean;
  is_primary_key: boolean;
  description: string | null;
};
export type ErdRelationshipRow = {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  name: string | null;
  description: string | null;
};


export type ErdDomainInput = { name: string; description: string };
export type ErdEntityInput = { name: string; description: string };

export function buildDomainRow(item: ErdDomainInput): ErdDomainRow | null {
  const parsed = domainInputSchema.safeParse({
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildEntityRow(item: ErdEntityInput): ErdEntityRow | null {
  const parsed = entityInputSchema.safeParse({
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildAttributeRow(
  item: AiErdAttributeItem,
): ErdAttributeRow | null {
  const parsed = attributeInputSchema.safeParse({
    name: item.name,
    data_type: item.data_type,
    is_required: item.is_required,
    is_primary_key: item.is_primary_key,
    default_value: "",
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    data_type: parsed.data.data_type,
    is_required: parsed.data.is_required,
    is_primary_key: parsed.data.is_primary_key,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildRelationshipRow(
  item: AiErdRelationshipItem,
  sourceEntityId: string,
  targetEntityId: string,
): ErdRelationshipRow | null {
  const parsed = relationshipInputSchema.safeParse({
    source_entity_id: sourceEntityId,
    target_entity_id: targetEntityId,
    relationship_type: item.relationship_type,
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    source_entity_id: parsed.data.source_entity_id,
    target_entity_id: parsed.data.target_entity_id,
    relationship_type: parsed.data.relationship_type,
    name: optionalText(parsed.data.name ?? ""),
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function relationshipDedupeKey(
  sourceEntityId: string,
  targetEntityId: string,
  relationshipType: RelationshipType,
): string {
  return `${sourceEntityId}|${targetEntityId}|${relationshipType}`;
}


// Normalised payload handed to the apply_erd_bundle function. Everything here
// has already passed the row builders above, so the SQL can trust the shapes.
type ErdBundleDomain = {
  index: number;
  name: string;
  description: string;
  entities: Array<{
    name: string;
    description: string;
    attributes: Array<{
      name: string;
      data_type: string;
      is_required: boolean;
      is_primary_key: boolean;
      description: string;
    }>;
    relationships: Array<{
      target_entity: string;
      relationship_type: string;
      name: string;
      description: string;
    }>;
  }>;
};

// Transactional variant: the whole bundle is applied inside a single database
// transaction by apply_erd_bundle, so a failure no longer leaves partial rows.
// Invalid entries become skipped entries rather than aborting the apply.
// Pure transformation from the selected suggestion items into the JSONB
// payload apply_erd_bundle consumes. Invalid entries are recorded as skipped
// results instead of aborting; the returned payload has passed the row
// builders so the SQL can trust every shape.
export function buildErdBundle(
  items: AiErdDomainItem[],
  indices: number[],
): { domains: ErdBundleDomain[]; skipped: ApplyItemOutcome[] } {
  const skipped: ApplyItemOutcome[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  const domains: ErdBundleDomain[] = [];

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    const domainRow = buildDomainRow(item);
    if (!domainRow) {
      skipped.push({
        kind: "skipped",
        index,
        title: typeof item.name === "string" ? item.name : "",
        reason: "invalid",
      });
      continue;
    }

    const entities: ErdBundleDomain["entities"] = [];

    for (const entityItem of item.entities) {
      const entityRow = buildEntityRow(entityItem);
      if (!entityRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${domainRow.name} / ${entityItem.name}`,
          reason: "invalid",
        });
        continue;
      }

      const attributes: ErdBundleDomain["entities"][number]["attributes"] = [];
      for (const attributeItem of entityItem.attributes) {
        const attributeRow = buildAttributeRow(attributeItem);
        if (!attributeRow) {
          skipped.push({
            kind: "skipped",
            index,
            title: `${domainRow.name} / ${entityRow.name} / ${attributeItem.name}`,
            reason: "invalid",
          });
          continue;
        }
        attributes.push({
          name: attributeRow.name,
          data_type: attributeRow.data_type,
          is_required: attributeRow.is_required,
          is_primary_key: attributeRow.is_primary_key,
          description: attributeRow.description ?? "",
        });
      }

      const relationships: ErdBundleDomain["entities"][number]["relationships"] =
        [];
      for (const relationshipItem of entityItem.relationships) {
        relationships.push({
          target_entity: relationshipItem.target_entity,
          relationship_type: relationshipItem.relationship_type,
          name: relationshipItem.name ?? "",
          description: relationshipItem.description ?? "",
        });
      }

      entities.push({
        name: entityRow.name,
        description: entityRow.description ?? "",
        attributes,
        relationships,
      });
    }

    domains.push({
      index,
      name: domainRow.name,
      description: domainRow.description ?? "",
      entities,
    });
  }

  return { domains, skipped };
}

// Transactional variant: the whole bundle is applied inside a single database
// transaction by apply_erd_bundle, so a failure no longer leaves partial rows.
// Invalid entries become skipped entries rather than aborting the apply.
export async function applyErdBundleToProject(
  options: ApplyErdOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const { domains, skipped } = buildErdBundle(options.items, options.indices);
  out.skipped.push(...skipped);

  if (domains.length === 0) {
    return out;
  }

  // The generated Database type declares no functions, so the rpc call is
  // typed through a narrow local cast; the SQL contract lives in the
  // apply_erd_bundle migration.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_erd_bundle", {
    p_project_id: options.projectId,
    p_domains: domains,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
  }

  return out;
}
