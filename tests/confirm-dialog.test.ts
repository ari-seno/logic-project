import { describe, expect, it } from "vitest";

function requiredWord(typeToConfirm: string | true | undefined): string | undefined {
  if (typeToConfirm === undefined) return undefined;
  if (typeToConfirm === true) return "confirm";
  return typeToConfirm;
}

function canConfirm(
  typed: string,
  typeToConfirm: string | true | undefined,
): boolean {
  const word = requiredWord(typeToConfirm);
  if (!word) return true;
  return typed === word;
}

describe("ConfirmDialog type-to-confirm gate", () => {
  it("allows confirm when no typeToConfirm required", () => {
    expect(canConfirm("", undefined)).toBe(true);
    expect(canConfirm("anything", undefined)).toBe(true);
  });

  it("requires exact match when typeToConfirm set to a custom word", () => {
    expect(canConfirm("", "hello")).toBe(false);
    expect(canConfirm("Hello", "hello")).toBe(false);
    expect(canConfirm("hello ", "hello")).toBe(false);
    expect(canConfirm("hello", "hello")).toBe(true);
  });

  it("requires exact word 'confirm' when typeToConfirm=true", () => {
    expect(canConfirm("", true)).toBe(false);
    expect(canConfirm("Confirm", true)).toBe(false);
    expect(canConfirm("confirm ", true)).toBe(false);
    expect(canConfirm("confirm", true)).toBe(true);
  });
});

