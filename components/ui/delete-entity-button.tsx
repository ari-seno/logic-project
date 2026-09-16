"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ItemKind = "entity" | "attribute";

const KIND_DESCRIPTION: Record<ItemKind, string> = {
  entity:
    "This removes the entity and its attributes. Relationships that reference it will also be removed.",
  attribute: "This permanently removes this attribute from the entity.",
};

export function DeleteEntityButton({
  action,
  entityLabel,
  itemKind = "entity",
  size,
  extraFields,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | undefined>;
  entityLabel: string;
  itemKind?: ItemKind;
  size?: "sm" | "md";
  extraFields?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const formData = new FormData();
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.set(key, value);
      }
    }
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={size ?? "sm"}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${entityLabel}`}
      >
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${entityLabel}?`}
        description={KIND_DESCRIPTION[itemKind]}
        confirmLabel={`Delete ${entityLabel}`}
        typeToConfirm={entityLabel}
        pending={pending}
        onConfirm={handleConfirm}
      />

      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
