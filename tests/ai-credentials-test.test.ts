import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  checkModelExists,
  testConnection,
} from "@/lib/ai/credentials-test";

const realFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const handler = handlers.get(url);
    if (!handler) {
      return new Response(JSON.stringify({ models: [] }), {
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
});

const handlers = new Map<string, (init?: RequestInit) => Response>();

function register(url: string, handler: (init?: RequestInit) => Response) {
  handlers.set(url, handler);
}

describe("credentials-test / testConnection", () => {
  it("returns ok + models list on 200 JSON", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response(
        JSON.stringify({
          models: [{ name: "llama3.1" }, { name: "mistral" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const result = await testConnection({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.models).toEqual(["llama3.1", "mistral"]);
    }
  });

  it("returns auth_failed on HTTP 401", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response("unauthorized", { status: 401 }),
    );
    const result = await testConnection({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe("auth_failed");
    }
  });

  it("returns invalid_request on HTTP 429", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response("too many", { status: 429 }),
    );
    const result = await testConnection({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe("invalid_request");
    }
  });

  it("returns unreachable on network failure", async () => {
    register("https://api.ollama.com/api/tags", () => {
      throw new Error("ECONNREFUSED");
    });
    const result = await testConnection({
      baseUrl: "https://api.ollama.com",
      apiKey: "sk-test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe("unreachable");
    }
  });

  it("returns unreachable on non-JSON 200", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response("<html>not json</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    const result = await testConnection({
      baseUrl: "https://api.ollama.com/",
      apiKey: "sk-test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe("unreachable");
    }
  });
});

describe("credentials-test / checkModelExists", () => {
  it("returns true if model is in the listing", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response(JSON.stringify({ models: [{ name: "llama3.1" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const found = await checkModelExists(
      "https://api.ollama.com",
      "sk-test",
      "llama3.1",
    );
    expect(found).toBe(true);
  });

  it("returns false if model is missing", async () => {
    register("https://api.ollama.com/api/tags", () =>
      new Response(JSON.stringify({ models: [{ name: "gemma3" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const found = await checkModelExists(
      "https://api.ollama.com",
      "sk-test",
      "llama3.1",
    );
    expect(found).toBe(false);
  });
});
