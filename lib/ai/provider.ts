import {
  OllamaAuthError,
  OllamaError,
  OllamaRateLimitError,
  OllamaUnreachableError,
  ZodRetryFailedError,
} from "@/lib/ai/errors";

export type OllamaProviderInput = {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  temperature?: number;
  signal?: AbortSignal;
};

export type OllamaUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
};

export type OllamaResult = {
  text: string;
  usage: OllamaUsage;
};

type OllamaChatResponse = {
  model?: string;
  message?: { role?: string; content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
};

async function callOllamaChat(
  input: OllamaProviderInput,
): Promise<OllamaResult> {
  const baseUrl = input.baseUrl.replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${input.apiKey}`,
    Accept: "application/json",
  };
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: input.model,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        options: {
          temperature: input.temperature ?? 0.2,
        },
      }),
      signal: input.signal ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new OllamaUnreachableError("Timed out reaching Ollama.");
    }
    throw new OllamaUnreachableError(
      err instanceof Error ? err.message : "Unknown network error.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new OllamaAuthError(
      "Ollama rejected the API key. Check the credential in Settings.",
    );
  }
  if (response.status === 429) {
    throw new OllamaRateLimitError(
      "Ollama is rate-limiting requests. Try again in a few seconds.",
    );
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new OllamaError(
      response.status,
      `Ollama call failed (HTTP ${response.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }

  let parsed: OllamaChatResponse;
  try {
    parsed = (await response.json()) as OllamaChatResponse;
  } catch {
    throw new OllamaError(response.status, "Ollama returned a non-JSON body.");
  }

  const text = parsed.message?.content ?? "";
  if (typeof text !== "string") {
    throw new OllamaError(
      response.status,
      "Ollama returned no content in the assistant message.",
    );
  }

  return {
    text,
    usage: {
      inputTokens:
        typeof parsed.prompt_eval_count === "number"
          ? parsed.prompt_eval_count
          : null,
      outputTokens:
        typeof parsed.eval_count === "number" ? parsed.eval_count : null,
    },
  };
}

export type OllamaJsonInput = Omit<OllamaProviderInput, "user" | "system"> & {
  system: string;
  user: string;
  parse: (text: string) => { ok: true; value: unknown } | { ok: false };
  parseErrorMessage: string;
};

export async function completeOllamaJson<T>(
  input: OllamaJsonInput,
): Promise<{ value: T; usage: OllamaUsage; text: string; attempts: number }> {
  const first = await callOllamaChat(input);
  const firstParsed = input.parse(first.text) as
    | { ok: true; value: T }
    | { ok: false };
  if (firstParsed.ok) {
    return {
      value: firstParsed.value,
      text: first.text,
      usage: first.usage,
      attempts: 1,
    };
  }

  const reminder = `${input.system}\n\nThe previous attempt failed validation: ${input.parseErrorMessage}. Output ONLY valid JSON matching the schema described above. Do not include prose, code fences, or trailing commas.`;
  const second = await callOllamaChat({ ...input, system: reminder });
  const secondParsed = input.parse(second.text) as
    | { ok: true; value: T }
    | { ok: false };
  if (!secondParsed.ok) {
    throw new ZodRetryFailedError(input.parseErrorMessage);
  }
  const combined: OllamaUsage = {
    inputTokens:
      (first.usage.inputTokens ?? 0) + (second.usage.inputTokens ?? 0) || null,
    outputTokens:
      (first.usage.outputTokens ?? 0) + (second.usage.outputTokens ?? 0) ||
      null,
  };
  return {
    value: secondParsed.value,
    text: second.text,
    usage: combined,
    attempts: 2,
  };
}

export const __test_only__ = { callOllamaChat };
