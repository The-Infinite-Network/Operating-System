import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

function loadEnv() {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
}

loadEnv();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  PORT: z.string().default("3003").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((o) => o.trim()) : [])),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    _config = result.data;
  }
  return _config;
}

export function validateConfig(): void {
  getConfig();
}
