"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteEntityButton({
  action,
  entityLabel,
  size,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | undefined>;
  entityLabel: string;
  size?: "sm" | "md";
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setError(null);
      return;
    }
    const formData = new FormData();
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        {confirming ? (
          <Button
            type="button"
            variant="secondary"
            size={size ?? "sm"}
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="button"
          variant="danger"
          size={size ?? "sm"}
          onClick={handleDelete}
          disabled={pending}
          aria-label={
            confirming
              ? `Confirm delete ${entityLabel}`
              : `Delete ${entityLabel}`
          }
        >
          {pending
            ? "Deleting…"
            : confirming
              ? "Click again to confirm"
              : "Delete"}
        </Button>
      </div>
    </div>
  );
}
