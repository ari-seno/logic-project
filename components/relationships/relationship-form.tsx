"use client";

import { useActionState } from "react";

import {
  RELATIONSHIP_TYPES,
  type Entity,
  type EntityRelationship,
} from "@/lib/supabase/types";
import {
  createRelationship,
  updateRelationship,
} from "@/lib/relationships/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RelationshipActionState } from "@/lib/validation/relationships";

const initialState: RelationshipActionState | null = null;

export function RelationshipForm({
  projectId,
  entities,
  relationship,
}: {
  projectId: string;
  entities: Entity[];
  relationship?: EntityRelationship;
}) {
  const isEdit = Boolean(relationship);
  const action = isEdit ? updateRelationship : createRelationship;

  const [state, formAction, pending] = useActionState(action, initialState);

  const sortedEntities = [...entities].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {isEdit && relationship ? (
        <input type="hidden" name="id" value={relationship.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source_entity_id">Source entity</Label>
          <Select
            id="source_entity_id"
            name="source_entity_id"
            defaultValue={relationship?.source_entity_id ?? ""}
            required
            aria-invalid={
              Boolean(state?.fieldErrors?.source_entity_id?.length) || undefined
            }
          >
            <option value="">Select source…</option>
            {sortedEntities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.source_entity_id} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target_entity_id">Target entity</Label>
          <Select
            id="target_entity_id"
            name="target_entity_id"
            defaultValue={relationship?.target_entity_id ?? ""}
            required
            aria-invalid={
              Boolean(state?.fieldErrors?.target_entity_id?.length) || undefined
            }
          >
            <option value="">Select target…</option>
            {sortedEntities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.target_entity_id} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="relationship_type">Relationship type</Label>
        <Select
          id="relationship_type"
          name="relationship_type"
          defaultValue={relationship?.relationship_type ?? "one_to_many"}
          aria-invalid={
            Boolean(state?.fieldErrors?.relationship_type?.length) || undefined
          }
        >
          {RELATIONSHIP_TYPES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " → ")}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.relationship_type} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          name="name"
          maxLength={200}
          defaultValue={relationship?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={5000}
          rows={3}
          defaultValue={relationship?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Create relationship"}
      </Button>
    </form>
  );
}
