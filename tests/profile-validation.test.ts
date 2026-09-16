import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX,
  profileUpdateSchema,
} from "@/lib/validation/profile";

describe("profile validation", () => {
  it("accepts a valid display name", () => {
    const r = profileUpdateSchema.safeParse({ display_name: "Ari S" });
    expect(r.success).toBe(true);
  });

  it("accepts an empty display name (clearing it)", () => {
    const r = profileUpdateSchema.safeParse({ display_name: "" });
    expect(r.success).toBe(true);
  });

  it("accepts omitted (treated as clearing)", () => {
    const r = profileUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("trims whitespace before validation", () => {
    const r = profileUpdateSchema.safeParse({ display_name: "   " });
    expect(r.success).toBe(true);
  });

  it("rejects display name longer than the limit", () => {
    const r = profileUpdateSchema.safeParse({
      display_name: "a".repeat(DISPLAY_NAME_MAX + 1),
    });
    expect(r.success).toBe(false);
  });

  it("accepts display name at exactly the limit", () => {
    const r = profileUpdateSchema.safeParse({
      display_name: "a".repeat(DISPLAY_NAME_MAX),
    });
    expect(r.success).toBe(true);
  });
});
