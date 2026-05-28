export const ErrorCodes = {
  BAD_REQUEST: "bad_request",
  INTERNAL_ERROR: "internal_error",
};

export class MCPError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }

  toResponse() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class Logger {
  constructor(scope) {
    this.scope = scope;
  }

  info(message, meta) {
    console.log(`[${this.scope}] ${message}`, meta || "");
  }

  error(message, meta) {
    console.error(`[${this.scope}] ${message}`, meta || "");
  }
}
