import type { AiContextEntry } from "@/lib/ai/context";

export const CONTEXT_ENTRY_MAX = 300;

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function describeEntry(entry: AiContextEntry): string {
  if (!entry.description) return `- ${entry.name}`;
  return `- ${entry.name}\n  ${truncate(entry.description, CONTEXT_ENTRY_MAX)}`;
}

export function bulletList(entries: AiContextEntry[]): string {
  if (entries.length === 0) return "(none yet)";
  return entries.slice(0, 60).map(describeEntry).join("\n");
}
