import { getConfig } from "./config.js";
import { MCPError, ErrorCodes } from "./errors.js";

export interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
  hostname: string;
}

export async function verifyRecaptchaToken(token: string, expectedAction?: string): Promise<RecaptchaResult> {
  const secretKey = getConfig().RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new MCPError(ErrorCodes.CONFIG_ERROR, "RECAPTCHA_SECRET_KEY is not configured");
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
  });

  if (!response.ok) {
    throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "reCAPTCHA verification request failed");
  }

  const data = await response.json() as any;

  if (!data.success) {
    throw new MCPError(ErrorCodes.VALIDATION_ERROR, "reCAPTCHA token invalid or expired", {
      errorCodes: data["error-codes"],
    });
  }

  if (expectedAction && data.action !== expectedAction) {
    throw new MCPError(ErrorCodes.VALIDATION_ERROR, "reCAPTCHA action mismatch", {
      expected: expectedAction,
      received: data.action,
    });
  }

  // v3 scores: 1.0 = likely human, 0.0 = likely bot. Threshold of 0.5 is standard.
  if (data.score < 0.5) {
    throw new MCPError(ErrorCodes.VALIDATION_ERROR, "reCAPTCHA score too low", {
      score: data.score,
    });
  }

  return {
    success: data.success,
    score: data.score,
    action: data.action,
    hostname: data.hostname,
  };
}
