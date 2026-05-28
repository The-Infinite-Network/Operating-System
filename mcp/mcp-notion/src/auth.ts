import { google } from "googleapis";
import { Config } from "./config.js";

/**
 * Token Standard v1.0
 * Standardized Google Auth selection.
 * 
 * If GOOGLE_APPLICATION_CREDENTIALS is set -> treat as service_account.
 * Else fallback to Application Default Credentials (ADC).
 */
export function getGoogleAuth(config: Config, scopes: string[]) {
  const options: { scopes: string[]; keyFile?: string } = { scopes };
  const resolved_auth_mode = config.GOOGLE_APPLICATION_CREDENTIALS
    ? "service_account"
    : "adc";

  if (config.GOOGLE_APPLICATION_CREDENTIALS) {
    options.keyFile = config.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return {
    auth: new google.auth.GoogleAuth(options),
    resolved_auth_mode,
  };
}
