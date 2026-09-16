"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteEntityButton({
  action,
  entityLabel,
  size,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | undefined>;
  entityLabel: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const formData = new FormData();
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
        description="This removes the entity and its attributes. Relationships that reference it will also be removed."
        confirmLabel="Delete entity"
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
