"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setError(null);
      return;
    }
    const { deleteProject } = await import("@/lib/projects/actions");
    const fd = new FormData();
    fd.set("id", projectId);
    startTransition(async () => {
      const result = await deleteProject(fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        {confirming ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
          aria-label={
            confirming
              ? `Confirm delete project ${projectName}`
              : `Delete project ${projectName}`
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
