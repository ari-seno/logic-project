import { describe, expect, it } from "vitest";

import { generateShareToken } from "@/lib/projects/share";

describe("projects/share", () => {
  it("generates a url-safe token with enough entropy", () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(30);
  });

  it("generates a different token every time", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateShareToken()),
    );
    expect(tokens.size).toBe(50);
  });
});
