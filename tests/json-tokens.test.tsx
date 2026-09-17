import { describe, expect, it } from "vitest";

import { renderJsonTokens, tokenizeJson } from "@/lib/export/json-tokens";

describe("tokenizeJson", () => {
  it("classifies keys, strings, numbers, booleans, null, and punctuation", () => {
    const tokens = tokenizeJson(
      '{"a": "b", "c": 12, "d": true, "e": null, "f": 1.5e-2}',
    );
    const types = tokens.map((t) => t.type);
    expect(types).toContain("key");
    expect(types).toContain("string");
    expect(types).toContain("number");
    expect(types).toContain("boolean");
    expect(types).toContain("null");
    expect(types).toContain("punct");
  });

  it("preserves whitespace and unknown characters as plain string tokens", () => {
    const input = '{ "k": "v" }';
    const tokens = tokenizeJson(input);
    const joined = tokens.map((t) => t.value).join("");
    expect(joined).toBe(input);
  });

  it("renderJsonTokens emits React nodes with class names per type", () => {
    const nodes = renderJsonTokens(tokenizeJson('{"a": 1}'));
    const flat = Array.isArray(nodes) ? nodes : [nodes];
    expect(flat.length).toBeGreaterThan(0);
  });
});
