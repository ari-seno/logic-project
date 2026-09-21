"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErdSourceButton({
  chart,
  className,
  title = "Mermaid source",
  description = "Copy this into a markdown file or any Mermaid renderer.",
}: {
  chart: string;
  className?: string;
  title?: string;
  description?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleClose() {
    setOpen(false);
    setCopied(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        View source
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="erd-source-title"
        onClose={handleClose}
        onCancel={(e) => {
          e.preventDefault();
          handleClose();
        }}
        className={cn(
          "fixed left-1/2 top-1/2 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-[var(--glass-border)] bg-white/95 p-6 shadow-2xl backdrop-blur-xl",
          "backdrop:bg-black/40 focus:outline-none",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="erd-source-title"
                className="text-lg font-semibold tracking-tight"
              >
                {title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <pre className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 font-mono text-xs leading-relaxed">
            <code>{chart}</code>
          </pre>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
