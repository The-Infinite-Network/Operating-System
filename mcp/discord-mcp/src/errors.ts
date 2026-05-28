import { z } from "zod";

/**
 * Token Standard v1.0 - Error Taxonomy
 */

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "MCPError";
  }

  toResponse(): ErrorResponse {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  CONFIG_ERROR: "CONFIG_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export class Logger {
  constructor(private module: string) {}

  info(message: string, context?: Record<string, unknown>): void {
    console.log(
      `[${this.module}] INFO: ${message}`,
      context ? JSON.stringify(context) : ""
    );
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
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
