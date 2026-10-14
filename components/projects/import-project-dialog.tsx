"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { importProjectAction } from "@/lib/import/actions";

export function ImportProjectDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError("That file is not valid JSON.");
      return;
    }

    startTransition(async () => {
      const result = await importProjectAction(parsed);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
      toast.success(`Imported ${total} item${total === 1 ? "" : "s"}.`);
      setOpen(false);
      reset();
      router.push(`/projects/${result.projectId}`);
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="md">
          Import
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-3)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                Import a project
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
                Choose a project bundle exported from Logic Project. It is added
                as a new project you own.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <label
            htmlFor="import-bundle-file"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--muted)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)] hover:border-[var(--brand)]"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            <span>{fileName ?? "Click to choose a .bundle.json file"}</span>
            <input
              ref={inputRef}
              id="import-bundle-file"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          {error ? (
            <div className="mt-4">
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {pending ? "Importing…" : "Cancel"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
