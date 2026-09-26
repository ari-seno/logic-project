"use client";

import { cn } from "@/lib/utils";
import type { AiUiItem } from "@/lib/ai/schema";

export type UiSuggestionProps = {
  items: AiUiItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

type IndexedItem = { item: AiUiItem; index: number };

function byKind<K extends AiUiItem["kind"]>(
  items: AiUiItem[],
  kind: K,
): Array<{ item: Extract<AiUiItem, { kind: K }>; index: number }> {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry,
      ): entry is {
        item: Extract<AiUiItem, { kind: K }>;
        index: number;
      } => entry.item.kind === kind,
    );
}

function groupLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function chips(labels: string[], max = 8) {
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

export function UiSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: UiSuggestionProps) {
  const componentEntries = byKind(items, "component");
  const screenEntries = byKind(items, "screen");

  const renderRow = (entry: IndexedItem) => {
    const { item, index } = entry;
    const selected = selectedIndices.has(index);
    const heading = item.name;

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
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                {humanizeType(
                  item.kind === "screen" ? item.screen_type : item.component_type,
                )}
              </span>
              {item.kind === "screen" && item.route ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                  {item.route}
                </span>
              ) : null}
              {item.kind === "screen" ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {item.authentication_required ? "auth required" : "public"}
                </span>
              ) : null}
              {item.kind === "component" && item.technology ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                  {item.technology}
                </span>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {item.description}
              </p>
            ) : null}
            {item.purpose ? (
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                Purpose: {item.purpose}
              </p>
            ) : null}
            {item.kind === "screen" && item.placements.length > 0
              ? chips(
                  item.placements.map((placement) =>
                    placement.label
                      ? `${placement.component_name} · ${placement.label}`
                      : placement.component_name,
                  ),
                )
              : null}
            {item.kind === "screen" && item.entities.length > 0
              ? chips(
                  item.entities.map(
                    (link) => `${link.entity_name} · ${humanizeType(link.role)}`,
                  ),
                )
              : null}
            {item.kind === "screen" && item.requirement_titles.length > 0
              ? chips(item.requirement_titles)
              : null}
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
      {section("Screens", screenEntries.length, screenEntries)}
    </div>
  );
}
