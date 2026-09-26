"use client";

import { cn } from "@/lib/utils";
import type { AiErdDomainItem } from "@/lib/ai/schema";

export type DomainsSuggestionProps = {
  items: AiErdDomainItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

function humanizeType(value: string): string {
  return value.split("_").join(" ");
}

export function DomainsSuggestion({
  items,
  selectedIndices,
  onToggle,
  onSelectAll,
  onSelectNone,
  showIndex,
}: DomainsSuggestionProps) {
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
          const entityCount = item.entities.length;
          const attributeCount = item.entities.reduce(
            (sum, entity) => sum + entity.attributes.length,
            0,
          );
          return (
            <li
              key={`${item.name}-${index}`}
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
                  aria-label={`Select domain ${item.name}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {showIndex ? (
                      <span className="mr-1 text-xs text-[var(--muted-foreground)]">
                        #{index + 1}
                      </span>
                    ) : null}
                    {item.name}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {entityCount} {entityCount === 1 ? "entity" : "entities"}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {attributeCount}{" "}
                      {attributeCount === 1 ? "attribute" : "attributes"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {item.entities.map((entity, entityIndex) => (
                      <div
                        key={`${entity.name}-${entityIndex}`}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/60 p-2.5"
                      >
                        <p className="text-xs font-semibold text-[var(--foreground)]">
                          {entity.name}
                        </p>
                        {entity.description ? (
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {entity.description}
                          </p>
                        ) : null}
                        <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                          {entity.attributes.map((attribute, attributeIndex) => (
                            <li
                              key={`${attribute.name}-${attributeIndex}`}
                              className="flex items-center gap-2"
                            >
                              <span className="w-3 shrink-0 text-center text-[10px] text-[var(--brand)]">
                                {attribute.is_primary_key ? "PK" : ""}
                              </span>
                              <span className="flex-1 truncate">
                                {attribute.name}
                                <span className="text-[var(--muted-foreground)]/60">
                                  {" "}
                                  : {attribute.data_type}
                                  {attribute.is_required ? "*" : ""}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        {entity.relationships.length > 0 ? (
                          <ul className="mt-1.5 flex flex-wrap gap-1.5">
                            {entity.relationships.map((rel, relIndex) => (
                              <li
                                key={`${rel.target_entity}-${relIndex}`}
                                className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                              >
                                → {rel.target_entity} ·{" "}
                                {humanizeType(rel.relationship_type)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
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
