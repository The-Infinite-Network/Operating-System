import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

function loadEnv() {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
}

loadEnv();

const envSchema = z.object({
  // Auth: token-based (delegated, personal + enterprise)
  MS_TODO_ACCESS_TOKEN: z.string().optional(),

  // Auth: client credentials (enterprise tenants only)
  MICROSOFT_TENANT_ID: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // Graph API base
  MICROSOFT_GRAPH_ENDPOINT: z.string().default("https://graph.microsoft.com/v1.0"),

  // Server
  PORT: z.string().default("3004").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ALLOWED_ORIGINS: z.string().optional().transform((val) =>
    val ? val.split(",").map((o) => o.trim()) : []
  ),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    _config = result.data;

    const hasToken = !!_config.MS_TODO_ACCESS_TOKEN;
    const hasClientCreds =
      !!_config.MICROSOFT_TENANT_ID &&
      !!_config.MICROSOFT_CLIENT_ID &&
      !!_config.MICROSOFT_CLIENT_SECRET;

    if (!hasToken && !hasClientCreds) {
      throw new Error(
        "Configuration error: provide MS_TODO_ACCESS_TOKEN, or MICROSOFT_TENANT_ID + MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET"
      );
    }
  }
  return _config;
}

export function validateConfig(): void {
  getConfig();
}
