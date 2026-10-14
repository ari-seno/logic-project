"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProjectView, deleteProjectView } from "@/lib/views/actions";
import type { ProjectViewSummary } from "@/lib/views/queries";
import { normalizeViewQuery, viewHref, type ViewScope } from "@/lib/views/shared";

export type SavedViewsProps = {
  projectId: string;
  scope: ViewScope;
  views: ProjectViewSummary[];
  currentQuery: string;
};

export function SavedViews({
  projectId,
  scope,
  views,
  currentQuery,
}: SavedViewsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = normalizeViewQuery(currentQuery);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await createProjectView({
        projectId,
        scope,
        label,
        query: active,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLabel("");
      setOpen(false);
      toast.success("View saved.");
      router.refresh();
    });
  }

  function remove(view: ProjectViewSummary) {
    setBusyId(view.id);
    startTransition(async () => {
      const result = await deleteProjectView({
        projectId,
        scope,
        viewId: view.id,
      });
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("View deleted.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          Saved views
        </span>

        {views.length === 0 ? (
          <span className="text-xs text-[var(--muted-foreground)]">
            None yet.
          </span>
        ) : (
          views.map((view) => {
            const isActive =
              view.query.length > 0
                ? normalizeViewQuery(view.query) === active && active.length > 0
                : active.length === 0;
            return (
              <span
                key={view.id}
                className={
                  isActive
                    ? "inline-flex items-center rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--foreground)]"
                }
              >
                <Link
                  href={viewHref(projectId, scope, view.query)}
                  className="px-2.5 py-1 text-xs font-medium hover:underline"
                >
                  {view.label}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(view)}
                  disabled={busyId === view.id}
                  aria-label={`Delete view ${view.label}`}
                  className="mr-1 rounded-full p-0.5 text-[var(--muted-foreground)] hover:text-[var(--danger-fg)] disabled:opacity-50"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            );
          })
        )}

        {!open ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Save current view
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-wrap items-end gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-3"
        >
          <div className="min-w-48 flex-1">
            <label
              htmlFor="view-label"
              className="text-xs font-medium text-[var(--muted-foreground)]"
            >
              Name this view
            </label>
            <Input
              id="view-label"
              name="view-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. High priority"
              maxLength={60}
              autoFocus
              className="mt-1"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending || !label.trim()}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
          {error ? (
            <p className="w-full text-xs text-[var(--danger-fg)]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
