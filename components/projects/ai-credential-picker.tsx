"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  listCredentialsForProjectAction,
  setProjectCredential,
} from "@/lib/ai/credentials-actions";

export type AiCredentialPickerProps = {
  projectId: string;
  currentLabel: string | null;
};

export function AiCredentialPicker({
  projectId,
  currentLabel,
}: AiCredentialPickerProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<
    Array<{ id: string; label: string; model: string; provider: string }>
  >([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const result = await listCredentialsForProjectAction();
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.credentials);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function pick(id: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await setProjectCredential(projectId, id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrentId(id);
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {currentLabel ? `AI: ${currentLabel}` : "Choose AI credential"}
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">
          {options.length === 0 ? (
            <p className="px-2 py-3 text-xs text-[var(--muted-foreground)]">
              No saved credentials yet.{" "}
              <a
                href="/account/settings"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                Add one in Settings
              </a>
              .
            </p>
          ) : (
            <ul className="flex flex-col">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => pick(opt.id)}
                    disabled={pending}
                    className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--muted)] disabled:opacity-60"
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {opt.provider} · {opt.model}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {currentId ? (
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <button
                type="button"
                onClick={() => pick(null)}
                disabled={pending}
                className="w-full rounded-lg px-2 py-2 text-left text-xs text-[var(--danger)] hover:bg-[var(--danger)]/5 disabled:opacity-60"
              >
                Unlink current credential
              </button>
            </div>
          ) : null}
          {error ? (
            <p className="mt-2 px-2 text-xs text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
