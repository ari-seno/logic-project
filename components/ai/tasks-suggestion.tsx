"use client";

import { cn } from "@/lib/utils";
import type { AiTaskItem } from "@/lib/ai/schema";

export type TasksSuggestionProps = {
  items: AiTaskItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

function chips(labels: string[], max = 6) {
  if (labels.length === 0) return null;
  const shown = labels.slice(0, max);
  const hidden = labels.length - shown.length;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((label, chipIndex) => (
        <li
          key={`${label}-${chipIndex}`}
          className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
        >
          {label}
        </li>
      ))}
      {hidden > 0 ? (
        <li className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
          +{hidden} more
        </li>
      ) : null}
    </ul>
  );
}

export function TasksSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: TasksSuggestionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">
          {selectedIndices.size} of {items.length} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-[var(--brand)] hover:underline"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={onSelectNone}
            className="text-xs text-[var(--muted-foreground)] hover:underline"
          >
            Reject all
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => {
          const selected = selectedIndices.has(index);
          return (
            <li
              key={`${item.title}-${index}`}
              className={cn(
                "rounded-xl border bg-[var(--surface-1)] p-3",
                selected
                  ? "border-[var(--brand)]/40 ring-1 ring-[var(--brand)]/20"
                  : "border-[var(--border)] opacity-80",
              )}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(index)}
                  className="mt-1 h-4 w-4 rounded border-[var(--input)]"
                  aria-label={`Select task ${item.title}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {showIndex ? (
                      <span className="mr-1 text-xs text-[var(--muted-foreground)]">
                        #{index + 1}
                      </span>
                    ) : null}
                    {item.title}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                      {humanizeType(item.task_type)}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                      {item.priority}
                    </span>
                    {item.estimated_effort ? (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        {item.estimated_effort}
                      </span>
                    ) : null}
                    {item.parent_title ? (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        ↳ {item.parent_title}
                      </span>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.description}
                    </p>
                  ) : null}
                  {item.acceptance_criteria ? (
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      Acceptance: {item.acceptance_criteria}
                    </p>
                  ) : null}
                  {chips(item.depends_on.map((title) => `blocked by ${title}`))}
                  {chips(
                    item.links.map(
                      (link) => `${humanizeType(link.kind)} · ${link.name}`,
                    ),
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
