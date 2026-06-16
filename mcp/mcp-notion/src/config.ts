import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import { getRequestContext } from "./context.js";

/**
 * Token Standard v1.1 - Venture Aware
 * Centralized configuration loader with explicit file precedence and Venture-Scoped overrides.
 */

function loadEnv() {
  const isScript = process.env.INOS_SCRIPT === "true";

  if (isScript) {
    dotenv.config({ path: path.resolve(process.cwd(), "scripts.env") });
    dotenv.config({ path: path.resolve(process.cwd(), "..", "scripts.env") });
  } else {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
  }
}

loadEnv();

const envSchema = z.object({
  NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required"),
  NOTION_DB_MISSIONS: z.string().min(1, "NOTION_DB_MISSIONS database ID is required"),

  // Core OS Canon DBs
  NOTION_DB_BUILD: z.string().optional(),
  NOTION_DB_BUILD_TASKS: z.string().optional(),
  NOTION_DB_DRAFT_BLOCKS: z.string().optional(),
  NOTION_DB_ARK_ASSETS: z.string().optional(),
  NOTION_DB_TIMELINE: z.string().optional(),
  NOTION_DB_LAW_DOCS: z.string().optional(),
  NOTION_DB_CLASS_KB: z.string().optional(),
  NOTION_DB_BAKE_RND: z.string().optional(),
  NOTION_DB_BOB_BRAND: z.string().optional(),
  NOTION_DB_AIR_RESEARCH: z.string().optional(),
  NOTION_DB_AGENTS: z.string().optional(),
  NOTION_DB_INBOX: z.string().optional(),
  NOTION_DB_TASKS: z.string().optional(),
  NOTION_DB_RUNS_AARS: z.string().optional(),
  NOTION_DB_ENTITIES: z.string().optional(),
  NOTION_DB_ROOMS: z.string().optional(),
  NOTION_DB_ARK_REGISTRY: z.string().optional(),
  NOTION_DB_POLE_EVENTS: z.string().optional(),
  NOTION_DB_CAPABILITY_REGISTRY: z.string().optional(),

  // INOS Epoch 0 — Canonical Database IDs
  NOTION_IDENTITY_DB_ID: z.string().optional(),
  NOTION_TIMELINE_DB_ID: z.string().optional(),
  NOTION_MISSIONS_DB_ID: z.string().optional(),
  NOTION_MISSION_RUNS_DB_ID: z.string().optional(),
  NOTION_SPECS_DB_ID: z.string().optional(),
  NOTION_CANON_REGISTRY_DB_ID: z.string().optional(),
  NOTION_POLICIES_DB_ID: z.string().optional(),
  NOTION_APPROVALS_DB_ID: z.string().optional(),
  NOTION_ARTIFACT_INDEX_DB_ID: z.string().optional(),
  NOTION_KNOWLEDGE_ARTICLES_DB_ID: z.string().optional(),
  NOTION_FOOD_INGREDIENTS_DB_ID: z.string().optional(),
  NOTION_CAPABILITY_REGISTRY_DB_ID: z.string().optional(),

  // Legacy Alias Keys
  NOTION_TASKS_DB_ID: z.string().optional(),
  NOTION_AAR_DB_ID: z.string().optional(),
  NOTION_DB_TEAM_AI_PEOPLE: z.string().optional(),

  // Vertex AI Configuration
  GCP_PROJECT_ID: z.string().optional(),
  GCP_REGION: z.string().default("us-central1"),
  VERTEX_MODEL: z.string().default("gemini-2.0-flash-001"),
  AUTH_MODE: z.enum(["adc", "service_account"]).default("adc"),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Gemini API Key (AI Studio) Configuration
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),

  // Drive Configuration
  GOOGLE_SHARED_DRIVE_ID: z.string().optional(),
  CANON_ROOT_NAME: z.string().optional(),

  // reCAPTCHA v3
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Server Configuration
  PORT: z.string().default("3002").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ALLOWED_ORIGINS: z.string().optional().transform((val) =>
    val ? val.split(",").map((origin) => origin.trim()) : []
  ),
});

export type Config = z.infer<typeof envSchema>;

let _globalConfig: Config | null = null;
const _ventureConfigs = new Map<string, Config>();

export function getConfig(): Config {
  const context = getRequestContext();
  const ventureId = context.ventureId;

  if (!ventureId) {
    if (!_globalConfig) _globalConfig = parseEnv(process.env);
    return _globalConfig;
  }

  if (_ventureConfigs.has(ventureId)) return _ventureConfigs.get(ventureId)!;

  // Venture-Scoped Proxy
  const ventureEnv = new Proxy(process.env, {
    get(target, prop: string) {
      if (typeof prop !== 'string') return target[prop];
      const ventureKey = `${ventureId.toUpperCase()}_${prop}`;
      return target[ventureKey] || target[prop];
    }
  });

  const config = parseEnv(ventureEnv);
  _ventureConfigs.set(ventureId, config);
  return config;
}

function parseEnv(envSource: any): Config {
  const source = { ...envSource };
  if (source.GOOGLE_SERVICE_ACCOUNT_KEY_PATH && !source.GOOGLE_APPLICATION_CREDENTIALS) {
    source.GOOGLE_APPLICATION_CREDENTIALS = source.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  }
  if (!source.NOTION_API_KEY) {
    source.NOTION_API_KEY = source.NOTION_TOKEN || source.NOTION_SECRET;
  }

  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  const config = result.data;
  const mutableConfig = config as any;

  // --- Canonical Aliasing Logic ---
  if (mutableConfig.NOTION_DB_BUILD_TASKS && !mutableConfig.NOTION_DB_BUILD) {
    mutableConfig.NOTION_DB_BUILD = mutableConfig.NOTION_DB_BUILD_TASKS;
  }
  
  // Apply Epoch 0 Mapping
  const mapping = {
    NOTION_MISSIONS_DB_ID: "NOTION_DB_MISSIONS",
    NOTION_MISSION_RUNS_DB_ID: "NOTION_DB_RUNS_AARS",
    NOTION_TIMELINE_DB_ID: "NOTION_DB_TIMELINE",
    NOTION_IDENTITY_DB_ID: "NOTION_DB_AGENTS",
    NOTION_CANON_REGISTRY_DB_ID: "NOTION_DB_ARK_REGISTRY",
    NOTION_KNOWLEDGE_ARTICLES_DB_ID: "NOTION_DB_CLASS_KB",
    NOTION_POLICIES_DB_ID: "NOTION_DB_LAW_DOCS",
    NOTION_CAPABILITY_REGISTRY_DB_ID: "NOTION_DB_CAPABILITY_REGISTRY"
  };

  Object.entries(mapping).forEach(([canonical, legacy]) => {
     if (mutableConfig[canonical]) mutableConfig[legacy] = mutableConfig[canonical];
     else if (mutableConfig[legacy]) mutableConfig[canonical] = mutableConfig[legacy];
  });

  // Preserve a distinct AAR target when explicitly configured.
  // Only fall back to the legacy combined surface if no dedicated AAR DB exists.
  if (!mutableConfig.NOTION_AAR_DB_ID && mutableConfig.NOTION_DB_RUNS_AARS) {
    mutableConfig.NOTION_AAR_DB_ID = mutableConfig.NOTION_DB_RUNS_AARS;
  }

  return config;
}

export function validateConfig(): void {
  getConfig();
}
