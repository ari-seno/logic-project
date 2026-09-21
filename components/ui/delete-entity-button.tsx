"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteEntityButton({
  action,
  entityLabel,
  description,
  size,
  extraFields,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | undefined>;
  entityLabel: string;
  description?: string;
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
        title={`Delete "${entityLabel}"?`}
        description={
          description ??
          "This will be permanently deleted and cannot be undone."
        }
        confirmLabel="Delete"
        typeToConfirm
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
