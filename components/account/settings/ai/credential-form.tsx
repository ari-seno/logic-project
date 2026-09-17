"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const baseInputClass = "block w-full rounded-lg border border-[var(--input)] bg-white px-3.5 py-2 text-sm";

type CredentialFormValues = {
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
};

type CredentialFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<CredentialFormValues>;
  mode: "create" | "edit";
  pending: boolean;
  onSubmit: (values: CredentialFormValues) => Promise<void> | void;
  errorMessage?: string;
  testResult?: { status: string; message: string; models?: string[] } | null;
};

export function CredentialForm({
  open,
  onOpenChange,
  initial,
  mode,
  pending,
  onSubmit,
  errorMessage,
  testResult,
}: CredentialFormProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [label, setLabel] = useState(initial.label ?? "");
  const [baseUrl, setBaseUrl] = useState(
    initial.baseUrl ?? "https://api.ollama.com",
  );
  const [apiKey, setApiKey] = useState(initial.apiKey ?? "");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(initial.model ?? "");
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelsPending, setModelsPending] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    /* The dialog intentionally re-syncs internal fields whenever the caller
     * hands us a new `initial` snapshot. This is the established pattern for
     * modal forms in this codebase; opt out of the cascading-render guard. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(initial.label ?? "");
    setBaseUrl(initial.baseUrl ?? "https://api.ollama.com");
    setApiKey(initial.apiKey ?? "");
    setModel(initial.model ?? "");
    setEnabled(initial.enabled ?? true);
    setShowKey(false);
  }, [initial, open]);  async function fetchModels() {
    if (!apiKey || !baseUrl) return;
    setModelsPending(true);
    try {
      const headers = new Headers();
      headers.set("authorization", `Bearer ${apiKey}`);
      headers.set("accept", "application/json");
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/tags`, {
        method: "GET",
        headers,
      });
      if (!res.ok) {
        setModelOptions([]);
        return;
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      setModelOptions(
        Array.isArray(data.models)
          ? data.models
              .map((m) => m?.name)
              .filter((n): n is string => typeof n === "string" && n.length > 0)
          : [],
      );
    } catch {
      setModelOptions([]);
    } finally {
      setModelsPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSubmit({ label, baseUrl, apiKey, model, enabled });
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => onOpenChange(false)}
      className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-[var(--glass-border)] bg-white p-6 shadow-2xl backdrop:bg-black/40 focus:outline-none"
    >
      <form
        method="dialog"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <h2
          id={titleId}
          className="text-base font-semibold tracking-tight text-[var(--foreground)]"
        >
          {mode === "create" ? "Add AI credential" : "Edit AI credential"}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Stored encrypted (AES-256-GCM) under SETTINGS_ENC_KEY in the project
          env.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Label
            <input
              required
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={baseInputClass}
              placeholder="Ollama Cloud (work)"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Base URL
            <input
              type="url"
              required
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              onBlur={() => {
                if (apiKey) void fetchModels();
              }}
              className={baseInputClass}
              placeholder="https://api.ollama.com"
            />
          </label>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              API key
            </label>
            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => {
                  if (apiKey) void fetchModels();
                }}
                required={mode === "create"}
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep the existing key."
                    : "ollama-..."
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowKey((s) => !s)}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void fetchModels()}
                disabled={!apiKey || !baseUrl || modelsPending}
              >
                {modelsPending ? "…" : "List models"}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Model
            {modelOptions.length > 0 ? (
              <Select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              >
                <option value="" disabled>
                  Pick a model
                </option>
                {modelOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="llama3.1"
              />
            )}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input)]"
            />
            Enable this credential
          </label>
        </div>

        {testResult ? (
          <p
            className={`mt-3 text-xs ${
              testResult.status === "ok"
                ? "text-[var(--brand)]"
                : "text-[var(--danger)]"
            }`}
          >
            Last test: {testResult.status}
            {testResult.message ? ` — ${testResult.message}` : ""}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 text-xs text-[var(--danger)]">{errorMessage}</p>
        ) : null}

        <div className="modal-action mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <Button type="submit" disabled={pending} variant="primary">
            {pending ? "Saving…" : mode === "create" ? "Save" : "Update"}
          </Button>
        </div>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}
