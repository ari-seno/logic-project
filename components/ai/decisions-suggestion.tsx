"use client";

import { cn } from "@/lib/utils";
import type { AiDecisionItem } from "@/lib/ai/schema";

export type DecisionsSuggestionProps = {
  items: AiDecisionItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

export function DecisionsSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: DecisionsSuggestionProps) {
  return (
    <div className="flex flex-col gap-3">
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
                  aria-label={`Select decision ${item.title}`}
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
                  {item.context ? (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.context}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    {item.decision}
                  </p>
                  {item.rationale ? (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Rationale: {item.rationale}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      Proposed
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
