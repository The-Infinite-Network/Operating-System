import { z } from "zod";

/**
 * Token Standard v1.0 - Error Taxonomy
 */

// Canonical error shape: { code, message, details, triage_required?, sync_key? }
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  triage_required: z.boolean().optional(),
  sync_key: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type MCPResult<T> = {
  request_id: string;
  result?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export class MCPError extends Error {
  public triageRequired?: boolean;
  public syncKey?: string;

  constructor(
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
    triageRequired: boolean = false,
    syncKey?: string
  ) {
    super(message);
    this.name = "MCPError";
    this.triageRequired = triageRequired;
    this.syncKey = syncKey;
  }

  toResponse(): ErrorResponse {
    const response: ErrorResponse = {
      code: this.code,
      message: this.message,
      details: this.details,
    };
    if (this.triageRequired !== undefined) {
      response.triage_required = this.triageRequired;
    }
    if (this.syncKey) {
      response.sync_key = this.syncKey;
    }
    return response;
  }
}

// Common error codes (v1.0 standardized taxonomy)
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  CONFIG_ERROR: "CONFIG_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// Logger utility
export class Logger {
  constructor(private module: string) { }

  info(message: string, context?: Record<string, unknown>): void {
    console.log(
      `[${this.module}] INFO: ${message}`,
      context ? JSON.stringify(context) : ""
    );
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    console.error(
      `[${this.module}] ERROR: ${message}`,
      error instanceof Error ? error.message : String(error),
      context ? JSON.stringify(context) : ""
    );
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(
      `[${this.module}] WARN: ${message}`,
      context ? JSON.stringify(context) : ""
    );
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[${this.module}] DEBUG: ${message}`,
        context ? JSON.stringify(context) : ""
      );
    }
  }
}
