import { createClient } from "@supabase/supabase-js";
import { MCPError, ErrorCodes } from "./errors.js";

export const getConfig = () => {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PORT: Number(process.env.PORT || 3020),
    NODE_ENV: process.env.NODE_ENV || "development",
  };
};

export const validateConfig = () => {
  const config = getConfig();
  if (!config.SUPABASE_URL) {
    throw new MCPError(
      ErrorCodes.BAD_REQUEST,
      "SUPABASE_URL is required",
      { missing: "SUPABASE_URL" }
    );
  }
  if (!config.SUPABASE_ANON_KEY && !config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new MCPError(
      ErrorCodes.BAD_REQUEST,
      "SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required",
      { missing: "SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" }
    );
  }
};

export const getSupabaseClient = (authToken) => {
  const config = getConfig();
  const key = config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY;
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  return createClient(config.SUPABASE_URL, key, {
    global: { headers },
    auth: { persistSession: false },
  });
};
