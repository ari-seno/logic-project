"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

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
  // Which credential is linked. The server already knows the label, so seed it
  // from that prop; picking a credential only needs to track the id and label.
  const [override, setOverride] = useState<{
    id: string | null;
    label: string | null;
  } | null>(null);
  const currentId = override?.id ?? null;
  const label = override ? override.label : currentLabel;
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const result = await listCredentialsForProjectAction();
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.credentials);
        // Seed the linked id on a fresh page load, where only the label is
        // known, so "Unlink current credential" is offered without re-picking.
        setOverride((prev) => {
          if (prev) return prev;
          const match = result.credentials.find((c) => c.label === currentLabel);
          return match ? { id: match.id, label: match.label } : prev;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentLabel]);

  function pick(id: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await setProjectCredential(projectId, id);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setOverride({ id, label: result.credential?.label ?? null });
      setSaved(true);
      setOpen(false);
      toast.success(
        result.credential
          ? `AI credential set to ${result.credential.label}.`
          : "AI credential unlinked.",
      );
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
        {label ? `AI: ${label}` : "Choose AI credential"}
      </Button>
      {saved ? (
        <p
          className="absolute right-0 top-full mt-1 text-xs text-[var(--brand)]"
          role="status"
        >
          AI credential saved.
        </p>
      ) : null}
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-xl">
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
