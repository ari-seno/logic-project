import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function loadMasterKey(): Buffer {
  const raw = process.env.SETTINGS_ENC_KEY;
  if (!raw) {
    throw new Error(
      "SETTINGS_ENC_KEY is not set. Provide a 32-byte hex string in .env.local.",
    );
  }
  const trimmed = raw.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error(
      "SETTINGS_ENC_KEY must be a 32-byte hex string (64 hex characters).",
    );
  }
  return Buffer.from(trimmed, "hex");
}

function packParts(iv: Buffer, tag: Buffer, ciphertext: Buffer): string {
  return `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}`;
}

function unpackParts(payload: string): {
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
} {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Encrypted payload is malformed (expected iv.tag.ct).");
  }
  const [ivPart, tagPart, ctPart] = parts;
  if (!ivPart || !tagPart || !ctPart) {
    throw new Error("Encrypted payload is missing a segment.");
  }
  return {
    iv: Buffer.from(ivPart, "base64"),
    tag: Buffer.from(tagPart, "base64"),
    ciphertext: Buffer.from(ctPart, "base64"),
  };
}

export function encryptSecret(plain: string): string {
  if (typeof plain !== "string") {
    throw new TypeError("encryptSecret expects a string plaintext.");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, loadMasterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return packParts(iv, tag, ciphertext);
}

export function decryptSecret(payload: string): string {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new TypeError("decryptSecret expects a non-empty string payload.");
  }
  const { iv, tag, ciphertext } = unpackParts(payload);
  if (iv.length !== IV_LENGTH) {
    throw new Error("Encrypted payload has an invalid IV length.");
  }
  if (tag.length !== 16) {
    throw new Error("Encrypted payload has an invalid auth tag length.");
  }
  const decipher = createDecipheriv(ALGORITHM, loadMasterKey(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}
