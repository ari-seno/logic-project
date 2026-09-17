"use client";

import { cn } from "@/lib/utils";
import type { AiRequirementItem } from "@/lib/ai/schema";

export type RequirementsSuggestionProps = {
  items: AiRequirementItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

const TYPE_LABEL: Record<AiRequirementItem["type"], string> = {
  functional: "Functional",
  non_functional: "Non-functional",
  business: "Business",
};

const PRIORITY_LABEL: Record<AiRequirementItem["priority"], string> = {
  must: "Must",
  should: "Should",
  could: "Could",
  wont: "Won't",
};

const PRIORITY_BADGE: Record<AiRequirementItem["priority"], string> = {
  must: "bg-[var(--danger)]/15 text-[var(--danger)]",
  should: "bg-[var(--brand)]/15 text-[var(--brand)]",
  could: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  wont: "bg-white text-[var(--muted-foreground)] line-through",
};

export function RequirementsSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: RequirementsSuggestionProps) {
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
                "rounded-xl border bg-white p-3",
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
                  aria-label={`Select requirement ${item.title}`}
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
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        PRIORITY_BADGE[item.priority],
                      )}
                    >
                      {PRIORITY_LABEL[item.priority]}
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
