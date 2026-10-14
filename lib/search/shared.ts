export type SearchResultKind =
  | "requirement"
  | "decision"
  | "domain"
  | "entity"
  | "component"
  | "technology"
  | "endpoint"
  | "screen"
  | "task";

export type SearchResult = {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_LIMIT_PER_KIND = 5;

/**
 * Strips characters that would break a PostgREST `ilike` / `or` filter and
 * collapses whitespace, so user input can never widen a query unexpectedly.
 */
export function sanitizeSearchQuery(query: string, maxLength = 80): string {
  return query
    .replace(/[%_,()*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
