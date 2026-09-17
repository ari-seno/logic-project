export class AiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}

export class AiSetupRequired extends AiError {
  constructor(
    message = "Pick an AI credential for this project before generating.",
  ) {
    super("ai_setup_required", message);
    this.name = "AiSetupRequired";
  }
}

export class OllamaError extends AiError {
  readonly httpStatus: number;
  constructor(httpStatus: number, message: string) {
    super("ollama_error", message);
    this.name = "OllamaError";
    this.httpStatus = httpStatus;
  }
}

export class OllamaAuthError extends AiError {
  constructor(message = "Ollama rejected the API key (HTTP 401).") {
    super("ollama_auth_error", message);
    this.name = "OllamaAuthError";
  }
}

export class OllamaRateLimitError extends AiError {
  constructor(message = "Ollama rate-limited the request (HTTP 429).") {
    super("ollama_rate_limit", message);
    this.name = "OllamaRateLimitError";
  }
}

export class OllamaUnreachableError extends AiError {
  constructor(message = "Ollama endpoint is unreachable.") {
    super("ollama_unreachable", message);
    this.name = "OllamaUnreachableError";
  }
}

export class ZodRetryFailedError extends AiError {
  constructor(message = "Ollama returned output we could not parse.") {
    super("zod_retry_failed", message);
    this.name = "ZodRetryFailedError";
  }
}

export class CredentialTestFailed extends AiError {
  readonly testStatus: string;
  constructor(testStatus: string, message: string) {
    super("credential_test_failed", message);
    this.name = "CredentialTestFailed";
    this.testStatus = testStatus;
  }
}
