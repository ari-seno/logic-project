"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    const { requestAccountDeletion } = await import("@/lib/account/actions");
    const fd = new FormData();
    fd.set("confirmEmail", email);
    startTransition(async () => {
      const result = await requestAccountDeletion(null, fd);
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
        size="sm"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description={
          <>
            Your account and all of its projects become inaccessible now, and are
            permanently deleted after 30 days. You can restore access at any time
            before then.
          </>
        }
        confirmLabel="Delete account"
        typeToConfirm={email}
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
