"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  typeToConfirm?: string;
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  typeToConfirm,
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (!next) setTyped("");
    onOpenChange(next);
  }

  const requiresTyping = Boolean(typeToConfirm);
  const canConfirm = !pending && (!requiresTyping || typed === typeToConfirm);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClose={() => handleOpenChange(false)}
      onCancel={(e) => {
        e.preventDefault();
        handleOpenChange(false);
      }}
      className={cn(
        "fixed left-1/2 top-1/2 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2",
        "rounded-2xl border border-[var(--glass-border)] bg-white/95 p-6 shadow-2xl backdrop-blur-xl",
        "backdrop:bg-black/40",
        "focus:outline-none",
      )}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
          <p
            id={descId}
            className="mt-1 text-sm text-[var(--muted-foreground)]"
          >
            {description}
          </p>
        </div>

        {typeToConfirm ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-typed">
              Type <span className="font-mono">{typeToConfirm}</span> to
              confirm
            </Label>
            <Input
              id="confirm-typed"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
