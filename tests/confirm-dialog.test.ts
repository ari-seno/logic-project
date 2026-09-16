import { describe, expect, it } from "vitest";

function canConfirm(typed: string, required: string | undefined): boolean {
  if (!required) return true;
  return typed === required;
}

describe("ConfirmDialog type-to-confirm gate", () => {
  it("allows confirm when no typeToConfirm required", () => {
    expect(canConfirm("", undefined)).toBe(true);
    expect(canConfirm("anything", undefined)).toBe(true);
  });

  it("requires exact match when typeToConfirm set", () => {
    expect(canConfirm("", "hello")).toBe(false);
    expect(canConfirm("Hello", "hello")).toBe(false);
    expect(canConfirm("hello ", "hello")).toBe(false);
    expect(canConfirm("hello", "hello")).toBe(true);
  });
});
