"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createCredential,
  deleteCredential,
  testCredential,
  updateCredential,
} from "@/lib/ai/credentials-actions";
import { CredentialForm } from "@/components/account/settings/ai/credential-form";
import { useRouter } from "next/navigation";

export type CredentialRow = {
  id: string;
  label: string;
  provider: string;
  base_url: string;
  model: string;
  enabled: boolean;
  last_test_status: string | null;
  last_test_message: string | null;
  last_tested_at: string | null;
  updated_at: string;
};

type EditableDraft = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
};

export function CredentialsSection({
  initialCredentials,
}: {
  initialCredentials: CredentialRow[];
}) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<CredentialRow[]>(
    initialCredentials,
  );
  useEffect(() => {
    /* Sync credentials that arrived from the server after router.refresh().
     * Local optimistic updates (test/delete/enable) are preserved — we only
     * append new rows we haven't seen yet. Same pattern as credential-form. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCredentials((prev) => {
      const known = new Set(prev.map((c) => c.id));
      const additions = initialCredentials.filter((c) => !known.has(c.id));
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }, [initialCredentials]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  function add() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function edit(c: CredentialRow) {
    setEditing({
      id: c.id,
      label: c.label,
      baseUrl: c.base_url,
      model: c.model,
      enabled: c.enabled,
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(values: {
    label: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    enabled: boolean;
  }) {
    setError(null);
    startTransition(async () => {
      if (editing) {
        const result = await updateCredential(editing.id, {
          label: values.label,
          baseUrl: values.baseUrl,
          apiKey: values.apiKey.length > 0 ? values.apiKey : undefined,
          model: values.model,
          enabled: values.enabled,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        router.refresh();
      } else {
        const result = await createCredential(values);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        router.refresh();
      }
    });
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const result = await testCredential(id);
      setCredentials((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                last_test_status: result.ok ? "ok" : result.status,
                last_test_message: result.ok
                  ? `Found ${result.models.length} model(s).`
                  : "message" in result
                    ? result.message
                    : null,
                last_tested_at: new Date().toISOString(),
              }
            : r,
        ),
      );
    } finally {
      setTestingId(null);
    }
  }

  async function handleDeleteConfirmed(id: string) {
    setConfirmingDeleteId(null);
    const result = await deleteCredential(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCredentials((rows) => rows.filter((r) => r.id !== id));
    router.refresh();
  }

  function toggleEnabled(c: CredentialRow) {
    startTransition(async () => {
      const result = await updateCredential(c.id, { enabled: !c.enabled });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCredentials((rows) =>
        rows.map((r) =>
          r.id === c.id ? { ...r, enabled: !c.enabled } : r,
        ),
      );
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={add}>
          {credentials.length === 0 ? "Add credential" : "Add another"}
        </Button>
      </div>

      {credentials.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No credentials yet"
            description="Add an Ollama credential so this project can generate requirements from a prompt."
            action={
              <Button variant="secondary" size="sm" onClick={add}>
                Add credential
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {credentials.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-[var(--border)] bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {c.label}{" "}
                    <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">
                      · {c.provider}
                    </span>
                    {c.enabled ? null : (
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                        · disabled
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {c.base_url}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Model: <code className="rounded bg-white/80 px-1.5 py-0.5">{c.model}</code>
                  </p>
                  {c.last_test_status ? (
                    <p
                      className={`mt-1 text-xs ${
                        c.last_test_status === "ok"
                          ? "text-[var(--brand)]"
                          : "text-[var(--danger)]"
                      }`}
                    >
                      Last test: {c.last_test_status}
                      {c.last_test_message ? ` — ${c.last_test_message}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                  >
                    {testingId === c.id ? "Testing…" : "Test"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEnabled(c)}
                    disabled={pending}
                  >
                    {c.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => edit(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmingDeleteId(c.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CredentialForm
        open={open}
        onOpenChange={setOpen}
        initial={
          editing
            ? {
                label: editing.label,
                baseUrl: editing.baseUrl,
                model: editing.model,
                enabled: editing.enabled,
                apiKey: "",
              }
            : {
                label: "",
                baseUrl: "https://api.ollama.com",
                model: "",
                enabled: true,
                apiKey: "",
              }
        }
        mode={editing ? "edit" : "create"}
        pending={pending}
        onSubmit={handleSubmit}
        errorMessage={error ?? undefined}
      />

      <ConfirmDialog
        open={!!confirmingDeleteId}
        onOpenChange={(o) => {
          if (!o) setConfirmingDeleteId(null);
        }}
        title="Delete this credential?"
        description="Projects using this credential will be unlinked immediately and shown a setup-required banner. This cannot be undone."
        typeToConfirm
        onConfirm={() => {
          if (confirmingDeleteId) void handleDeleteConfirmed(confirmingDeleteId);
        }}
      />
    </div>
  );
}
