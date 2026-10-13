"use client";

import { cn } from "@/lib/utils";
import type { AiUiDetailItem } from "@/lib/ai/schema";

export type UiDetailSuggestionProps = {
  items: AiUiDetailItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

type IndexedItem = { item: AiUiDetailItem; index: number };

function byKind<K extends AiUiDetailItem["kind"]>(
  items: AiUiDetailItem[],
  kind: K,
): Array<{ item: Extract<AiUiDetailItem, { kind: K }>; index: number }> {
  return items
    .map((item, index) => ({ item, index }))
    .filter(
      (
        entry,
      ): entry is {
        item: Extract<AiUiDetailItem, { kind: K }>;
        index: number;
      } => entry.item.kind === kind,
    );
}

function groupLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function chips(labels: string[], max = 10) {
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

function nestedGroup(
  title: string,
  count: number,
  singular: string,
  plural: string,
  children: React.ReactNode,
) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
        {title} · {groupLabel(count, singular, plural)}
      </p>
      {children}
    </div>
  );
}

export function UiDetailSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: UiDetailSuggestionProps) {
  const screenEntries = byKind(items, "screen");
  const navigationEntries = byKind(items, "navigation");

  const renderRow = (entry: IndexedItem) => {
    const { item, index } = entry;
    const selected = selectedIndices.has(index);
    const heading =
      item.kind === "screen" ? item.screen_name : item.label || item.name;

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
              {item.kind === "screen" ? `Screen · ${item.screen_name}` : heading}
            </p>

            {item.kind === "screen" ? (
              <>
                {item.forms.length > 0
                  ? nestedGroup(
                      "Forms",
                      item.forms.length,
                      "form",
                      "forms",
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {item.forms.map((form, formIndex) => (
                          <li
                            key={`${form.name}-${formIndex}`}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
                          >
                            <p className="text-xs font-medium text-[var(--foreground)]">
                              {form.name}
                            </p>
                            {form.submit_label ? (
                              <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                                Submit: {form.submit_label}
                              </p>
                            ) : null}
                            {form.fields.length > 0
                              ? chips(
                                  form.fields.map((field) =>
                                    field.required
                                      ? `${field.label} · ${humanizeType(field.field_type)} *`
                                      : `${field.label} · ${humanizeType(field.field_type)}`,
                                  ),
                                )
                              : null}
                          </li>
                        ))}
                      </ul>,
                    )
                  : null}

                {item.states.length > 0
                  ? nestedGroup(
                      "States",
                      item.states.length,
                      "state",
                      "states",
                      chips(
                        item.states.map(
                          (state) =>
                            `${state.name} · ${humanizeType(state.state_type)}`,
                        ),
                      ),
                    )
                  : null}

                {item.interactions.length > 0
                  ? nestedGroup(
                      "Interactions",
                      item.interactions.length,
                      "interaction",
                      "interactions",
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {item.interactions.map((interaction, interactionIndex) => (
                          <li
                            key={`${interaction.name}-${interactionIndex}`}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
                          >
                            <p className="text-xs font-medium text-[var(--foreground)]">
                              {interaction.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                              {interaction.trigger} → {interaction.action}
                            </p>
                            {interaction.endpoint_labels.length > 0
                              ? chips(interaction.endpoint_labels)
                              : null}
                          </li>
                        ))}
                      </ul>,
                    )
                  : null}
              </>
            ) : (
              <>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    navigation
                  </span>
                  {item.route ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                      {item.route}
                    </span>
                  ) : null}
                  {item.parent_label ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      ↳ {item.parent_label}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                ) : null}
                {item.screen_names.length > 0 ? chips(item.screen_names) : null}
              </>
            )}
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
      {section("Screens", screenEntries.length, screenEntries)}
      {section("Navigation", navigationEntries.length, navigationEntries)}
    </div>
  );
}
