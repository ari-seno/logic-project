import { Fragment, type ReactNode } from "react";

export type JsonTokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punct";

export interface JsonToken {
  type: JsonTokenType;
  value: string;
}

const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"\s*:?)|\b(true|false)\b|\bnull\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],])/g;

function classify(full: string, keyMaybe: string | undefined, bool: string | undefined, num: string | undefined, punct: string | undefined): JsonTokenType {
  if (punct) return "punct";
  if (num !== undefined) return "number";
  if (bool !== undefined) return "boolean";
  if (full === "null") return "null";
  if (keyMaybe && keyMaybe.endsWith(":")) return "key";
  return "string";
}

export function tokenizeJson(input: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ type: "string", value: input.slice(lastIndex, start) });
    }
    const full = match[0];
    const type = classify(full, match[1], match[2], match[3], match[4]);
    tokens.push({ type, value: full });
    lastIndex = start + full.length;
  }
  if (lastIndex < input.length) {
    tokens.push({ type: "string", value: input.slice(lastIndex) });
  }
  return tokens;
}

const CLASS_BY_TYPE: Record<JsonTokenType, string> = {
  key: "text-[var(--brand)]",
  string: "text-[var(--success)]",
  number: "text-[var(--warning)]",
  boolean: "text-[var(--brand-accent)]",
  null: "text-[var(--muted-foreground)] italic",
  punct: "text-[var(--muted-foreground)]",
};

export function renderJsonTokens(tokens: JsonToken[]): ReactNode {
  return tokens.map((token, i) => (
    <Fragment key={i}>
      {token.type === "string" ? (
        token.value
      ) : (
        <span className={CLASS_BY_TYPE[token.type]}>{token.value}</span>
      )}
    </Fragment>
  ));
}

export function JsonTokens({ value }: { value: string }) {
  return <>{renderJsonTokens(tokenizeJson(value))}</>;
}
