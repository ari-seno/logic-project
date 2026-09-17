import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { completeOllamaJson } from "@/lib/ai/provider";

const realFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const handler = handlers.get(url);
    if (!handler) {
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return handler(init);
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

afterEach(() => {
  handlers.clear();
  callIndex.clear();
});

const handlers = new Map<string, (init?: RequestInit) => Response>();
const callIndex = new Map<string, number>();

function registerSequenced(
  url: string,
  factory: (call: number) => Response,
) {
  handlers.set(url, () => {
    const call = (callIndex.get(url) ?? 0) + 1;
    callIndex.set(url, call);
    return factory(call);
  });
}

const schema = z.object({ greeting: z.string().min(1) });

function makeParse() {
  return (text: string): { ok: true; value: unknown } | { ok: false } => {
    try {
      const parsed = schema.safeParse(JSON.parse(text));
      return parsed.success
        ? { ok: true as const, value: parsed.data as unknown }
        : { ok: false as const };
    } catch {
      return { ok: false as const };
    }
  };
}

describe("ai/provider / completeOllamaJson", () => {
  it("parses valid response on first attempt", async () => {
    registerSequenced("https://api.ollama.com/api/chat", () =>
      new Response(
        JSON.stringify({
          model: "llama3.1",
          message: { role: "assistant", content: '{"greeting":"hi"}' },
          prompt_eval_count: 11,
          eval_count: 7,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await completeOllamaJson({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
      model: "llama3.1",
      system: "you are a tester",
      user: "say hi",
      parse: makeParse(),
      parseErrorMessage: "expected greeting",
    });
    expect(result.attempts).toBe(1);
    expect(result.value).toEqual({ greeting: "hi" });
    expect(result.usage.outputTokens).toBe(7);
  });

  it("retries once with a system reminder on parse failure", async () => {
    registerSequenced("https://api.ollama.com/api/chat", (call) => {
      if (call === 1) {
        return new Response(
          JSON.stringify({
            model: "llama3.1",
            message: { role: "assistant", content: "not json at all" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          model: "llama3.1",
          message: { role: "assistant", content: '{"greeting":"retry"}' },
          prompt_eval_count: 3,
          eval_count: 5,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const result = await completeOllamaJson({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
      model: "llama3.1",
      system: "you are a tester",
      user: "say hi",
      parse: makeParse(),
      parseErrorMessage: "expected greeting",
    });
    expect(result.attempts).toBe(2);
    expect(result.value).toEqual({ greeting: "retry" });
    expect(result.usage.outputTokens).toBe(5);
  });

  it("throws ZodRetryFailedError when both attempts fail", async () => {
    registerSequenced("https://api.ollama.com/api/chat", () =>
      new Response(
        JSON.stringify({
          model: "llama3.1",
          message: { role: "assistant", content: "{}" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    await expect(
      completeOllamaJson({
        baseUrl: "https://api.ollama.com",
        apiKey: "sk-test",
        model: "llama3.1",
        system: "you are a tester",
        user: "say hi",
        parse: makeParse(),
        parseErrorMessage: "expected greeting",
      }),
    ).rejects.toThrow(/expected greeting/);
  });
});
