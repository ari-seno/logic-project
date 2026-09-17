import {
  OllamaAuthError,
  OllamaError,
  OllamaRateLimitError,
  OllamaUnreachableError,
} from "@/lib/ai/errors";

export type CredentialTestResult =
  | { ok: true; status: "ok"; models: string[] }
  | { ok: false; status: "auth_failed"; message: string }
  | { ok: false; status: "unreachable"; message: string }
  | { ok: false; status: "invalid_request"; message: string };

type TagsResponse = { models?: Array<{ name: string }> };

function classifyError(err: unknown): {
  ok: false;
  status: "unreachable" | "auth_failed" | "invalid_request";
  message: string;
} {
  if (err instanceof OllamaAuthError) {
    return {
      ok: false,
      status: "auth_failed",
      message: err.message,
    };
  }
  if (err instanceof OllamaRateLimitError) {
    return {
      ok: false,
      status: "invalid_request",
      message: err.message,
    };
  }
  if (err instanceof OllamaError) {
    if (err.httpStatus === 401 || err.httpStatus === 403) {
      return {
        ok: false,
        status: "auth_failed",
        message: "Provider rejected the API key.",
      };
    }
    if (err.httpStatus >= 400 && err.httpStatus < 500) {
      return {
        ok: false,
        status: "invalid_request",
        message: err.message,
      };
    }
    return {
      ok: false,
      status: "unreachable",
      message: err.message,
    };
  }
  if (err instanceof OllamaUnreachableError) {
    return {
      ok: false,
      status: "unreachable",
      message: err.message,
    };
  }
  if (err instanceof Error && err.name === "AbortError") {
    return {
      ok: false,
      status: "unreachable",
      message: "Timed out reaching the provider.",
    };
  }
  return {
    ok: false,
    status: "unreachable",
    message: err instanceof Error ? err.message : "Unknown error.",
  };
}

export type TestConnectionInput = {
  baseUrl: string;
  apiKey: string;
  signal?: AbortSignal;
};

export async function testConnection(
  input: TestConnectionInput,
): Promise<CredentialTestResult> {
  let response: Response;
  try {
    const trimmed = input.baseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${input.apiKey}`,
      Accept: "application/json",
    };
    response = await fetch(`${trimmed}/api/tags`, {
      method: "GET",
      headers,
      signal: input.signal ?? null,
    });
  } catch (err) {
    const classified = classifyError(err);
    if (classified.status === "auth_failed") return classified;
    if (classified.status === "invalid_request") return classified;
    return classified.ok === false
      ? classified
      : { ok: false, status: "unreachable", message: "Unknown." };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      status: "auth_failed",
      message: "Provider rejected the API key.",
    };
  }
  if (response.status === 429) {
    return {
      ok: false,
      status: "invalid_request",
      message: "Provider rate-limited the request.",
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      status: "unreachable",
      message: `Provider responded with HTTP ${response.status}.`,
    };
  }

  let parsed: TagsResponse;
  try {
    parsed = (await response.json()) as TagsResponse;
  } catch {
    return {
      ok: false,
      status: "unreachable",
      message: "Provider returned a non-JSON response.",
    };
  }
  const models = Array.isArray(parsed.models)
    ? parsed.models
        .map((m) => m?.name)
        .filter((n): n is string => typeof n === "string")
    : [];
  return { ok: true, status: "ok", models };
}

export async function checkModelExists(
  baseUrl: string,
  apiKey: string,
  model: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const result = await testConnection({ baseUrl, apiKey, signal });
  if (!result.ok) return false;
  return result.models.includes(model);
}
