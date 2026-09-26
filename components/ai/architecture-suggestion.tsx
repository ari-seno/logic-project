"use client";

import { cn } from "@/lib/utils";
import type { AiArchitectureItem } from "@/lib/ai/schema";

export type ArchitectureSuggestionProps = {
  items: AiArchitectureItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

type IndexedItem = { item: AiArchitectureItem; index: number };

function byKind<K extends AiArchitectureItem["kind"]>(
  items: AiArchitectureItem[],
  kind: K,
): Array<{ item: Extract<AiArchitectureItem, { kind: K }>; index: number }> {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry,
      ): entry is {
        item: Extract<AiArchitectureItem, { kind: K }>;
        index: number;
      } => entry.item.kind === kind,
    );
}

function groupLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ArchitectureSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: ArchitectureSuggestionProps) {
  const componentEntries = byKind(items, "component");
  const technologyEntries = byKind(items, "technology");
  const decisionEntries = byKind(items, "decision");

  const renderRow = (entry: IndexedItem) => {
    const { item, index } = entry;
    const selected = selectedIndices.has(index);
    const heading =
      item.kind === "component"
        ? item.name
        : item.kind === "technology"
          ? item.name
          : item.title;

    return (
      <li
        key={`${item.kind}-${heading}-${index}`}
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
            aria-label={`Select ${item.kind} ${heading}`}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {showIndex ? (
                <span className="mr-1 text-xs text-[var(--muted-foreground)]">
                  #{index + 1}
                </span>
              ) : null}
              {heading}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.kind === "component" || item.kind === "technology" ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {humanizeType(
                    item.kind === "component" ? item.type : item.category,
                  )}
                </span>
              ) : null}
            </div>
            {item.kind === "decision" ? (
              <p className="mt-1 text-xs text-[var(--foreground)]">
                {item.decision}
              </p>
            ) : null}
            {item.kind === "decision" && item.rationale ? (
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                Rationale: {item.rationale}
              </p>
            ) : null}
            {item.kind !== "decision" && item.description ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {item.description}
              </p>
            ) : null}
            {item.kind === "component" && item.depends_on.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {item.depends_on.map((dependency, dependencyIndex) => (
                  <li
                    key={`${dependency.target_component}-${dependencyIndex}`}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                  >
                    → {dependency.target_component}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </li>
    );
  };

  const section = (title: string, count: number, entries: IndexedItem[]) => {
    if (entries.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {title} · {groupLabel(count, "item", "items")}
        </h3>
        <ul className="flex flex-col gap-3">{entries.map(renderRow)}</ul>
      </div>
    );
  };

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
      {section("Components", componentEntries.length, componentEntries)}
      {section("Technologies", technologyEntries.length, technologyEntries)}
      {section("Decisions", decisionEntries.length, decisionEntries)}
    </div>
  );
}
