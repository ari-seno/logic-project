"use client";

import { DataTypeBadge } from "@/components/projects/badges";
import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { PositionStepper } from "@/components/ui/position-stepper";
import { formatDate } from "@/lib/utils";
import type { EntityAttribute } from "@/lib/supabase/types";

import {
  handleAttributeDelete,
  handleAttributeMove,
} from "./attribute-actions";

export function AttributeRow({ attr, canMoveUp, canMoveDown }: {
  attr: EntityAttribute;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-3 py-2 font-medium">{attr.name}</td>
      <td className="px-3 py-2">
        <DataTypeBadge dataType={attr.data_type} />
      </td>
      <td className="px-3 py-2">{attr.is_required ? "yes" : "no"}</td>
      <td className="px-3 py-2">{attr.is_primary_key ? "yes" : "no"}</td>
      <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
        {attr.default_value ?? "—"}
      </td>
      <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
        {formatDate(attr.updated_at)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          <PositionStepper
            action={handleAttributeMove}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            itemId={attr.id}
            parentId={attr.entity_id}
            parentField="entityId"
            label={attr.name}
          />
          <DeleteEntityButton
            action={handleAttributeDelete}
            entityLabel={attr.name}
            itemKind="attribute"
            size="sm"
          />
        </div>
      </td>
    </tr>
  );
}
