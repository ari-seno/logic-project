import { describe, expect, it } from "vitest";

import {
  SEARCH_LIMIT_PER_KIND,
  SEARCH_MIN_LENGTH,
  sanitizeSearchQuery,
} from "@/lib/search/shared";

describe("search/shared sanitizeSearchQuery", () => {
  it("strips characters that would break a PostgREST filter", () => {
    expect(sanitizeSearchQuery("lo%an_,( )*pay")).toBe("loan pay");
  });

  it("collapses whitespace and trims the edges", () => {
    expect(sanitizeSearchQuery("   loan    pay  ")).toBe("loan pay");
  });

  it("caps the length so a query can never be enormous", () => {
    expect(sanitizeSearchQuery("a".repeat(500), 20)).toHaveLength(20);
  });

  it("exposes sane search limits", () => {
    expect(SEARCH_MIN_LENGTH).toBeGreaterThanOrEqual(2);
    expect(SEARCH_LIMIT_PER_KIND).toBeGreaterThan(0);
  });
});
