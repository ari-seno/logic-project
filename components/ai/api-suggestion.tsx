"use client";

import { cn } from "@/lib/utils";
import type { AiApiItem } from "@/lib/ai/schema";

export type ApiSuggestionProps = {
  items: AiApiItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

type IndexedItem = { item: AiApiItem; index: number };

function byKind<K extends AiApiItem["kind"]>(
  items: AiApiItem[],
  kind: K,
): Array<{ item: Extract<AiApiItem, { kind: K }>; index: number }> {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry,
      ): entry is {
        item: Extract<AiApiItem, { kind: K }>;
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
          className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
        >
          {label}
        </li>
      ))}
      {hidden > 0 ? (
        <li className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
          +{hidden} more
        </li>
      ) : null}
    </ul>
  );
}

export function ApiSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: ApiSuggestionProps) {
  const groupEntries = byKind(items, "group");
  const endpointEntries = byKind(items, "endpoint");

  const renderRow = (entry: IndexedItem) => {
    const { item, index } = entry;
    const selected = selectedIndices.has(index);
    const heading = item.kind === "group" ? item.name : `${item.method} ${item.path}`;

    return (
      <li
        key={`${item.kind}-${heading}-${index}`}
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
            aria-label={`Select ${item.kind} ${heading}`}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {showIndex ? (
                <span className="mr-1 text-xs text-[var(--muted-foreground)]">
                  #{index + 1}
                </span>
              ) : null}
              <span className={item.kind === "endpoint" ? "font-mono" : undefined}>
                {heading}
              </span>
            </p>
            {item.kind === "endpoint" ? (
              <p className="mt-0.5 text-xs text-[var(--foreground)]">{item.name}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {item.kind === "group" && item.prefix ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                  {item.prefix}
                </span>
              ) : null}
              {item.kind === "endpoint" && item.group_name ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {item.group_name}
                </span>
              ) : null}
              {item.kind === "endpoint" ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {item.authentication_required ? "auth required" : "public"}
                </span>
              ) : null}
            </div>
            {item.kind === "endpoint" && item.summary ? (
              <p className="mt-1 text-xs text-[var(--foreground)]">{item.summary}</p>
            ) : null}
            {item.description ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {item.description}
              </p>
            ) : null}
            {item.kind === "endpoint" && item.parameters.length > 0
              ? chips(
                  item.parameters.map(
                    (parameter) =>
                      `${parameter.name} · ${humanizeType(parameter.location)} · ${parameter.data_type}${
                        parameter.required ? " *" : ""
                      }`,
                  ),
                )
              : null}
            {item.kind === "endpoint" && item.request_body
              ? chips([`body · ${item.request_body.content_type}`])
              : null}
            {item.kind === "endpoint" && item.responses.length > 0
              ? chips(item.responses.map((response) => `${response.status_code}`))
              : null}
            {item.kind === "endpoint" && item.errors.length > 0
              ? chips(
                  item.errors.map(
                    (error) =>
                      `${error.code}${error.http_status ? ` · ${error.http_status}` : ""}`,
                  ),
                )
              : null}
            {item.kind === "endpoint" && item.entities.length > 0
              ? chips(
                  item.entities.map(
                    (link) => `${link.entity_name} · ${humanizeType(link.role)}`,
                  ),
                )
              : null}
            {item.kind === "endpoint" && item.requirement_titles.length > 0
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
      {section("Groups", groupEntries.length, groupEntries)}
      {section("Endpoints", endpointEntries.length, endpointEntries)}
    </div>
  );
}
