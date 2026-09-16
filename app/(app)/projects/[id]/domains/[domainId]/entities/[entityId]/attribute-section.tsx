"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { EntityAttribute } from "@/lib/supabase/types";

import { AttributeForm } from "@/components/entities/attribute-form";
import { AttributeRow } from "./attribute-row-actions";

export function AttributeSection({
  entityId,
  attributes,
}: {
  projectId: string;
  domainId: string;
  entityId: string;
  attributes: EntityAttribute[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {attributes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No attributes yet.
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Add the fields that describe this entity.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Required</th>
                <th className="px-3 py-2 font-medium">PK</th>
                <th className="px-3 py-2 font-medium">Default</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, idx) => {
                const isEditing = editingId === attr.id;
                return (
                  <AttributeRow
                    key={attr.id}
                    attr={attr}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < attributes.length - 1}
                    onStartEdit={() => setEditingId(attr.id)}
                    isEditing={isEditing}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingId ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold">
            Edit attribute:{" "}
            {attributes.find((a) => a.id === editingId)?.name}
          </h3>
          <AttributeForm
            entityId={entityId}
            attribute={attributes.find((a) => a.id === editingId)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditingId(null)}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {showForm ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold">New attribute</h3>
          <AttributeForm entityId={entityId} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        !editingId && (
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              Add attribute
            </Button>
          </div>
        )
      )}
    </div>
  );
}
