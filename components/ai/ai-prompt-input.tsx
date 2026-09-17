"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AiDrawer } from "@/components/ai/ai-drawer";
import { RequirementsSuggestion } from "@/components/ai/requirements-suggestion";
import {
  aiApplyRequirements,
  aiSuggestRequirements,
} from "@/lib/ai/actions";
import type {
  AiRequirementItem,
  SuggestResult,
} from "@/lib/ai/schema";
import { cn } from "@/lib/utils";

export type AiPromptInputProps = {
  projectId: string;
  credential: {
    id: string;
    label: string;
    model: string;
    last_test_status: string | null;
  } | null;
};

const ERROR_COPY: Record<Extract<SuggestResult, { ok: false }>["code"], string> = {
  ai_setup_required:
    "Pick an AI credential for this project before generating.",
  ollama_error: "Ollama returned an error. Check the model output.",
  ollama_auth_error: "Ollama rejected the API key. Update the credential.",
  ollama_unreachable: "Could not reach Ollama. Check base URL and network.",
  ollama_rate_limit: "Ollama is rate-limiting. Try again in a few seconds.",
  zod_retry_failed:
    "Ollama output did not match the schema. Try again with a shorter prompt.",
  credential_test_failed: "Credential test failed. Update the credential.",
  unknown: "Something went wrong. Try again.",
};

type BannerState = {
  open: boolean;
  title: string;
  detail: string;
  variant: "success" | "partial";
};

export function AiPromptInput({ projectId, credential }: AiPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    id: string;
    items: AiRequirementItem[];
    model: string;
    provider: string;
  } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, startApply] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>({
    open: false,
    title: "",
    detail: "",
    variant: "success",
  });

  if (!credential) {
    return null;
  }

  function runSuggest() {
    if (!prompt.trim()) return;
    setError(null);
    setSuggestion(null);
    startTransition(async () => {
      const result = await aiSuggestRequirements({
        projectId,
        prompt,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.code]);
        return;
      }
      setSuggestion({
        id: result.suggestionId,
        items: result.requirements,
        model: result.model,
        provider: result.provider,
      });
      setSelected(new Set(result.requirements.map((_, i) => i)));
      setOpen(true);
    });
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function applySelected() {
    if (!suggestion) return;
    const indices = Array.from(selected);
    if (indices.length === 0) return;
    setApplyError(null);
    startApply(async () => {
      const result = await aiApplyRequirements({
        suggestionId: suggestion.id,
        indices,
      });
      if (!result.ok) {
        setApplyError(result.error);
        return;
      }
      setOpen(false);
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      const titles = result.created.map((c) => c.title).slice(0, 3).join(", ");
      setBanner({
        open: true,
        title:
          createdCount > 0
            ? `Added ${createdCount} requirement${createdCount === 1 ? "" : "s"}.`
            : "Nothing was added.",
        detail:
          skippedCount > 0
            ? `${skippedCount} skipped (duplicate or invalid). ${titles}`
            : titles,
        variant: createdCount > 0 ? "success" : "partial",
      });
      setPrompt("");
      setSuggestion(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        Ask AI (using {credential.label} · {credential.model})
      </label>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Focus on borrower auth, due-date reminders, and overdue fines."
        rows={3}
        maxLength={1500}
      />
      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={runSuggest}
          disabled={!prompt.trim() || pending}
          variant="primary"
          size="sm"
        >
          {pending ? "Generating…" : "Generate"}
        </Button>
        {credential.last_test_status &&
        credential.last_test_status !== "ok" ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Last credential test: {credential.last_test_status}
          </p>
        ) : null}
      </div>

      <AiDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Suggested requirements"
        subtitle={
          suggestion
            ? `Generated by ${suggestion.provider} · ${suggestion.model}`
            : undefined
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted-foreground)]">
              Skipped items stay on disk; apply is non-destructive.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3.5 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <Button
                onClick={applySelected}
                disabled={applying || selected.size === 0}
                variant="primary"
                size="sm"
              >
                {applying
                  ? "Applying…"
                  : `Apply ${selected.size || 0}`}
              </Button>
            </div>
          </div>
        }
      >
        {applyError ? (
          <p className="mb-2 text-xs text-[var(--danger)]">{applyError}</p>
        ) : null}
        {suggestion ? (
          <RequirementsSuggestion
            items={suggestion.items}
            selectedIndices={selected}
            onToggle={toggle}
            onSelectAll={() =>
              setSelected(new Set(suggestion.items.map((_, i) => i)))
            }
            onSelectNone={() => setSelected(new Set())}
            showIndex
          />
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No items.</p>
        )}
      </AiDrawer>

      <BannerHost
        banner={banner}
        onDismiss={() => setBanner((b) => ({ ...b, open: false }))}
      />
    </div>
  );
}

function BannerHost({
  banner,
  onDismiss,
}: {
  banner: BannerState;
  onDismiss: () => void;
}) {
  if (!banner.open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur",
        banner.variant === "success"
          ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--foreground)]"
          : "border-[var(--brand)]/40 bg-amber-100 text-[var(--foreground)]",
      )}
    >
      <p className="text-sm font-medium">{banner.title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {banner.detail}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
