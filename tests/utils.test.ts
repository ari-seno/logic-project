import { describe, expect, it } from "vitest";

import { cn, formatDate, formatDateTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-01-15T12:34:56Z");
    expect(result).toMatch(/Jan.*15.*2026/);
  });

  it("accepts a Date", () => {
    const result = formatDate(new Date("2026-12-31T00:00:00Z"));
    expect(result).toMatch(/Dec.*31.*2026/);
  });
});

describe("formatDateTime", () => {
  it("includes time component", () => {
    const result = formatDateTime("2026-06-15T08:30:00Z");
    expect(result).toMatch(/Jun.*15.*2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
