import { describe, expect, it } from "vitest";

import { AI_DAILY_GENERATION_LIMIT, startOfUtcDay } from "@/lib/ai/meter";

describe("ai/meter quota helpers", () => {
  it("exposes a positive daily generation limit", () => {
    expect(AI_DAILY_GENERATION_LIMIT).toBeGreaterThan(0);
  });

  it("snaps a timestamp to the start of its UTC day", () => {
    const start = startOfUtcDay(new Date("2026-03-15T18:42:11.500Z"));
    expect(start.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("keeps the same UTC day for times before and after midnight", () => {
    const late = startOfUtcDay(new Date("2026-03-15T23:59:59.999Z"));
    const early = startOfUtcDay(new Date("2026-03-15T00:00:00.001Z"));
    expect(late.getTime()).toBe(early.getTime());
  });
});
