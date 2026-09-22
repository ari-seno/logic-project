import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  DEFAULT_NUM_CTX,
  __test_only__,
  completeOllamaJson,
} from "@/lib/ai/provider";

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

describe("ai/provider / callOllamaChat options", () => {
  const url = "https://api.ollama.com/api/chat";

  function capture(): { current: Record<string, unknown> | null } {
    const box: { current: Record<string, unknown> | null } = { current: null };
    handlers.set(url, (init) => {
      box.current = JSON.parse(String(init?.body ?? "{}")) as Record<
        string,
        unknown
      >;
      return new Response(
        JSON.stringify({ message: { role: "assistant", content: "{}" } }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    return box;
  }

  function baseInput() {
    return {
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
      model: "llama3.1",
      system: "you are a tester",
      user: "say hi",
    };
  }

  it("sends a context window so long prompts are not silently truncated", async () => {
    const box = capture();

    await __test_only__.callOllamaChat(baseInput());

    const options = box.current?.options as Record<string, unknown>;
    expect(options.num_ctx).toBe(DEFAULT_NUM_CTX);
    expect(options.temperature).toBe(0.2);
    expect(options.num_predict).toBeUndefined();
  });

  it("honours explicit numCtx and numPredict", async () => {
    const box = capture();

    await __test_only__.callOllamaChat({
      ...baseInput(),
      numCtx: 2048,
      numPredict: 512,
    });

    const options = box.current?.options as Record<string, unknown>;
    expect(options.num_ctx).toBe(2048);
    expect(options.num_predict).toBe(512);
  });

  it("reports a timeout as ollama_timeout", async () => {
    handlers.set(url, () => {
      const error = new Error("The operation timed out.");
      error.name = "TimeoutError";
      throw error;
    });

    await expect(
      __test_only__.callOllamaChat({ ...baseInput(), timeoutMs: 5_000 }),
    ).rejects.toMatchObject({
      code: "ollama_timeout",
      message: "Ollama did not respond within 5s.",
    });
  });

  it("reports a cancelled request as ollama_unreachable", async () => {
    handlers.set(url, () => {
      const error = new Error("The operation was aborted.");
      error.name = "AbortError";
      throw error;
    });

    await expect(
      __test_only__.callOllamaChat(baseInput()),
    ).rejects.toMatchObject({
      code: "ollama_unreachable",
      message: "Ollama request was cancelled.",
    });
  });
});
