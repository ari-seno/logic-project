import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "@/lib/ai/crypto";

const KEY = "a".repeat(64);

function withKey<T>(fn: () => T): T {
  const previous = process.env.SETTINGS_ENC_KEY;
  process.env.SETTINGS_ENC_KEY = KEY;
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.SETTINGS_ENC_KEY;
    } else {
      process.env.SETTINGS_ENC_KEY = previous;
    }
  }
}

describe("ai/crypto", () => {
  it("round-trips ASCII secrets", () => {
    withKey(() => {
      const secret = "sk-ollama-7f2c9b";
      const cipher = encryptSecret(secret);
      expect(cipher).not.toContain(secret);
      expect(decryptSecret(cipher)).toBe(secret);
    });
  });

  it("round-trips non-ASCII secrets byte-for-byte", () => {
    withKey(() => {
      const secret = "küçük gizli · 🔐 · 漢字";
      const cipher = encryptSecret(secret);
      expect(decryptSecret(cipher)).toBe(secret);
    });
  });

  it("produces a fresh IV on every call so ciphertexts never repeat", () => {
    withKey(() => {
      const a = encryptSecret("same-plaintext");
      const b = encryptSecret("same-plaintext");
      expect(a).not.toBe(b);
    });
  });

  it("rejects tampered ciphertext (GCM auth tag fails)", () => {
    withKey(() => {
      const cipher = encryptSecret("original-secret");
      const [ivB64, tagB64, ctB64] = cipher.split(".");
      const ct = Buffer.from(ctB64 ?? "", "base64");
      if (ct.length > 0) {
        ct[0] = ct[0] ^ 0x01;
      }
      const tampered = `${ivB64}.${tagB64}.${ct.toString("base64")}`;
      expect(() => decryptSecret(tampered)).toThrow();
    });
  });

  it("rejects tampered auth tag", () => {
    withKey(() => {
      const cipher = encryptSecret("original-secret");
      const [ivB64, tagB64, ctB64] = cipher.split(".");
      const tag = Buffer.from(tagB64 ?? "", "base64");
      tag[0] = tag[0] ^ 0xff;
      const tampered = `${ivB64}.${tag.toString("base64")}.${ctB64}`;
      expect(() => decryptSecret(tampered)).toThrow();
    });
  });

  it("rejects malformed payloads", () => {
    withKey(() => {
      expect(() => decryptSecret("")).toThrow();
      expect(() => decryptSecret("only-one-segment")).toThrow();
      expect(() => decryptSecret("a.b")).toThrow();
    });
  });

  it("refuses to load with a missing or invalid master key", () => {
    const previous = process.env.SETTINGS_ENC_KEY;
    delete process.env.SETTINGS_ENC_KEY;
    try {
      expect(() => encryptSecret("x")).toThrow(/SETTINGS_ENC_KEY/);
    } finally {
      if (previous !== undefined) process.env.SETTINGS_ENC_KEY = previous;
    }

    process.env.SETTINGS_ENC_KEY = "too-short";
    try {
      expect(() => encryptSecret("x")).toThrow(/32-byte hex/);
    } finally {
      if (previous === undefined) {
        delete process.env.SETTINGS_ENC_KEY;
      } else {
        process.env.SETTINGS_ENC_KEY = previous;
      }
    }
  });
});
