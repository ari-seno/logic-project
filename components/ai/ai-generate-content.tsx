"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AI_STAGE_UI, type AiSuggestionItem } from "@/components/ai/stage-config";
import { aiRejectSuggestion, aiUndoApply } from "@/lib/ai/actions";
import type { SuggestFailure } from "@/lib/ai/schema";
import type { AiStage } from "@/lib/ai/stages";
import { cn } from "@/lib/utils";

const ERROR_COPY: Record<SuggestFailure["code"], string> = {
  ai_setup_required:
    "Pick an AI credential for this project before generating.",
  ollama_error: "Ollama returned an error. Check the model output.",
  ollama_auth_error: "Ollama rejected the API key. Update the credential.",
  ollama_unreachable: "Could not reach Ollama. Check base URL and network.",
  ollama_rate_limit: "Ollama is rate-limiting. Try again in a few seconds.",
  ollama_timeout:
    "Ollama took too long to respond. Try again or use a smaller model.",
  zod_retry_failed:
    "Ollama output did not match the schema. Try again with a shorter prompt.",
  credential_test_failed: "Credential test failed. Update the credential.",
  quota_exceeded:
    "You have reached the daily generation limit. Try again tomorrow.",
  unknown: "Something went wrong. Try again.",
};

type BannerState = {
  open: boolean;
  title: string;
  detail: string;
  variant: "success" | "partial";
};

export type AiGenerateContentProps = {
  projectId: string;
  stage: AiStage;
  credential: {
    id: string;
    label: string;
    model: string;
    last_test_status: string | null;
  };
  onApplied?: () => void;
  autoPrompt?: string;
};

export function AiGenerateContent({
  projectId,
  stage,
  credential,
  onApplied,
  autoPrompt,
}: AiGenerateContentProps) {
  const { labels, renderItems, suggest, apply } = AI_STAGE_UI[stage];
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    id: string;
    items: AiSuggestionItem[];
    model: string;
    provider: string;
  } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, startApply] = useTransition();
  const [rejecting, startReject] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>({
    open: false,
    title: "",
    detail: "",
    variant: "success",
  });

  function submit(text: string) {
    if (!text.trim()) return;
    setLastPrompt(text);
    setError(null);
    setSuggestion(null);
    startTransition(async () => {
      const result = await suggest({ projectId, prompt: text });
      if (!result.ok) {
        setError(
          result.message
            ? `${ERROR_COPY[result.code]} (${result.message})`
            : ERROR_COPY[result.code],
        );
        return;
      }
      setSuggestion({
        id: result.suggestionId,
        items: result.items,
        model: result.model,
        provider: result.provider,
      });
      setSelected(new Set(result.items.map((_, i) => i)));
    });
  }

  function runSuggest() {
    submit(prompt);
  }

  const autoRunning = Boolean(autoPrompt) && pending && !suggestion;
  const autoStarted = useRef(false);

  useEffect(() => {
    if (!autoPrompt || autoStarted.current) return;
    autoStarted.current = true;
    submit(autoPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrompt]);

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
    const suggestionId = suggestion.id;
    const indices = Array.from(selected);
    if (indices.length === 0) return;
    setApplyError(null);
    startApply(async () => {
      const result = await apply({
        suggestionId,
        indices,
      });
      if (!result.ok) {
        setApplyError(result.error);
        toast.error(result.error);
        return;
      }
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      const titles = result.created.map((c) => c.title).slice(0, 3).join(", ");
      setBanner({
        open: true,
        title:
          createdCount > 0
            ? `Added ${createdCount} ${labels.singular}${
                createdCount === 1 ? "" : "s"
              }.`
            : "Nothing was added.",
        detail:
          skippedCount > 0
            ? `${skippedCount} skipped (duplicate or invalid). ${titles}`
            : titles,
        variant: createdCount > 0 ? "success" : "partial",
      });
      if (createdCount > 0) {
        const message = `Added ${createdCount} ${labels.singular}${
          createdCount === 1 ? "" : "s"
        }.`;
        const createdIds = result.created.map((c) => c.id);
        if (labels.undoable !== false && createdIds.length > 0) {
          toast.success(message, {
            action: {
              label: "Undo",
              onClick: () => undoApply(suggestionId, createdIds),
            },
          });
        } else {
          toast.success(message);
        }
      } else {
        toast.info("Nothing was added.");
      }
      setPrompt("");
      setSuggestion(null);
      onApplied?.();
    });
  }

  function undoApply(suggestionId: string, ids: string[]) {
    startApply(async () => {
      const result = await aiUndoApply({ suggestionId, ids });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.removed > 0
          ? `Undid ${result.removed} item${result.removed === 1 ? "" : "s"}.`
          : "Nothing was undone.",
      );
      onApplied?.();
    });
  }

  function reset() {
    setSuggestion(null);
    setError(null);
    setApplyError(null);
    setPrompt("");
  }

  function rejectSuggestion() {
    if (!suggestion) return;
    setApplyError(null);
    startReject(async () => {
      const result = await aiRejectSuggestion({ suggestionId: suggestion.id });
      if (!result.ok) {
        setApplyError(result.error);
        toast.error(result.error);
        return;
      }
      toast.info("Suggestion rejected.");
      reset();
      onApplied?.();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {suggestion ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {labels.suggestionsHeading}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Generated by {suggestion.provider} · {suggestion.model}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastPrompt ? (
                <button
                  type="button"
                  onClick={() => submit(lastPrompt)}
                  disabled={pending}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  ↻ Regenerate
                </button>
              ) : null}
              <button
                type="button"
                onClick={reset}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ← New prompt
              </button>
            </div>
          </div>

          {applyError ? (
            <p className="text-xs text-[var(--danger)]">{applyError}</p>
          ) : null}

          {renderItems({
            items: suggestion.items,
            selectedIndices: selected,
            onToggle: toggle,
            onSelectAll: () =>
              setSelected(new Set(suggestion.items.map((_, i) => i))),
            onSelectNone: () => setSelected(new Set()),
            showIndex: true,
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              Skipped items stay on disk; apply is non-destructive.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={rejectSuggestion}
                disabled={rejecting || applying}
                className="rounded-lg px-3.5 py-2 text-sm text-[var(--danger)] hover:bg-[var(--muted)] disabled:opacity-50"
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
              <button
                type="button"
                onClick={onApplied}
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
        </div>
      ) : autoRunning ? (
        <div className="flex flex-col items-start gap-2 py-6">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Generating from your existing data…
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Using {credential.label} · {credential.model}
          </p>
        </div>
      ) : autoPrompt && error ? (
        <div className="flex flex-col items-start gap-3 py-4">
          <p className="text-xs text-[var(--danger)]">{error}</p>
          <Button onClick={() => submit(autoPrompt)} variant="secondary" size="sm">
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Your prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={labels.promptPlaceholder}
            rows={4}
            maxLength={1500}
            disabled={pending}
          />
          {error ? (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          ) : null}
          {credential.last_test_status &&
          credential.last_test_status !== "ok" ? (
            <p className="text-xs text-amber-700">
              Last credential test: {credential.last_test_status}. Update the
              credential if requests keep failing.
            </p>
          ) : null}
          <div className="flex justify-end pt-1">
            <Button
              onClick={runSuggest}
              disabled={!prompt.trim() || pending}
              variant="primary"
              size="sm"
            >
              {pending ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      )}

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
          : "border-amber-400/40 bg-amber-100 text-[var(--foreground)]",
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
