import { createHash } from "crypto";
import { Logger } from "./errors.js";
import { getConfig, Config } from "./config.js";
import { getGoogleAuth } from "./auth.js";

const logger = new Logger("VertexBridge");

export type VertexGenerateTextRequest = {
  request_id: string;
  model?: string;
  prompt: string;
  contents?: any[];
  system?: string | null;
  max_output_tokens?: number;
  temperature?: number;
  json_only?: boolean;
};

export type VertexGenerateTextResponse = {
  ok: boolean;
  request_id: string;
  model: string;
  text: string | null;
  usage: {
    prompt_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
  } | null;
  timing_ms: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
};

export type VertexHealthResponse = {
  ok: boolean;
  project_id: string;
  region: string;
  model: string;
  auth_mode_resolved: "adc" | "service_account" | "api_key";
  timing_ms: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
};

function maskContent(content: string): string {
  if (!content) return "empty";
  const hash = createHash("sha256").update(content).digest("hex");
  return `len:${content.length}, sha256:${hash}`;
}

export class VertexGeminiClient {
  private auth: any;
  private resolvedAuthMode: "service_account" | "adc" | "api_key";
  private config: Config;
  private geminiApiKey: string | null;

  constructor() {
    this.config = getConfig();
    this.geminiApiKey = this.config.GEMINI_API_KEY || null;
    if (this.geminiApiKey) {
      this.auth = null;
      this.resolvedAuthMode = "api_key";
    } else {
      const authBundle = getGoogleAuth(this.config, [
        "https://www.googleapis.com/auth/cloud-platform",
      ]);
      this.auth = authBundle.auth;
      this.resolvedAuthMode = authBundle.resolved_auth_mode as
        | "service_account"
        | "adc";
    }
  }

  getAuthMode() {
    return this.resolvedAuthMode;
  }

  getResolvedModel() {
    return this.geminiApiKey ? this.config.GEMINI_MODEL : this.config.VERTEX_MODEL;
  }

  async health(): Promise<VertexHealthResponse> {
    const start = Date.now();
    const projectId = this.config.GCP_PROJECT_ID || "api-key";
    const region = this.config.GCP_REGION;
    const model = this.geminiApiKey
      ? this.config.GEMINI_MODEL
      : this.config.VERTEX_MODEL;
    const authMode = this.resolvedAuthMode;

    try {
      if (this.geminiApiKey) {
        return {
          ok: true,
          project_id: projectId,
          region: region,
          model: model,
          auth_mode_resolved: authMode,
          timing_ms: Date.now() - start,
        };
      }

      // Basic connectivity check: try to get a client
      await this.auth.getClient();

      return {
        ok: true,
        project_id: projectId,
        region: region,
        model: model,
        auth_mode_resolved: authMode,
        timing_ms: Date.now() - start
      };
    } catch (error: any) {
      return {
        ok: false,
        project_id: projectId,
        region: region,
        model: model,
        auth_mode_resolved: authMode,
        timing_ms: Date.now() - start,
        error: {
          code: "AUTH_HYGIENE_ERROR",
          message: error.message || "Failed to initialize Vertex AI client",
          details: { originalError: String(error) }
        }
      };
    }
  }

  async generateText(req: VertexGenerateTextRequest): Promise<VertexGenerateTextResponse> {
    const start = Date.now();
    const requestId = req.request_id;
    const model = req.model || (this.geminiApiKey ? this.config.GEMINI_MODEL : this.config.VERTEX_MODEL);
    const projectId = this.config.GCP_PROJECT_ID || "api-key";
    const region = this.config.GCP_REGION;

    logger.info(`[${requestId}] generateText start`, {
      model,
      prompt_fingerprint: maskContent(req.prompt || ""),
    });

    try {
      const contents = req.contents || [
        {
          role: "user",
          parts: [{ text: req.prompt || "" }]
        }
      ];

      const body: any = {
        contents,
        generationConfig: {
          temperature: req.temperature ?? 0.2,
          maxOutputTokens: req.max_output_tokens ?? 512,
        },
      };

      if (req.system) {
        body.systemInstruction = {
          parts: [{ text: req.system }]
        };
      }

      if (req.json_only) {
        body.generationConfig.responseMimeType = "application/json";
      }

      if (this.geminiApiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data: any = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw { response: { status: response.status, data } };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        const usage = data.usageMetadata
          ? {
            prompt_tokens: data.usageMetadata.promptTokenCount,
            output_tokens: data.usageMetadata.candidatesTokenCount,
            total_tokens: data.usageMetadata.totalTokenCount,
          }
          : null;

        const duration = Date.now() - start;
        logger.info(`[${requestId}] generateText completed`, {
          duration_ms: duration,
          total_tokens: usage?.total_tokens || 0,
        });

        return {
          ok: true,
          request_id: requestId,
          model: model,
          text,
          usage,
          timing_ms: duration,
          error: null
        };
      }

      const client = await this.auth.getClient();
      const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

      const maxAttempts = 4;
      let attempt = 0;

      while (attempt < maxAttempts) {
        try {
          const response = (await client.request({
            url,
            // @ts-ignore - types in googleapis can be picky about method strings
            method: "POST",
            data: body,
            headers: { "Content-Type": "application/json" },
          })) as any;

          const data = response.data || {};
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
          const usage = data.usageMetadata
            ? {
              prompt_tokens: data.usageMetadata.promptTokenCount,
              output_tokens: data.usageMetadata.candidatesTokenCount,
              total_tokens: data.usageMetadata.totalTokenCount,
            }
            : null;

          const duration = Date.now() - start;
          logger.info(`[${requestId}] generateText completed`, {
            duration_ms: duration,
            total_tokens: usage?.total_tokens || 0,
          });

          return {
            ok: true,
            request_id: requestId,
            model: model,
            text,
            usage,
            timing_ms: duration,
            error: null
          };
        } catch (error: any) {
          const status = error?.response?.status;
          const isRetryable = status === 429 || status >= 500;

          if (!isRetryable || attempt === maxAttempts - 1) {
            throw error;
          }

          const delay = Math.min(8000, 500 * Math.pow(2, attempt));
          logger.warn(`[${requestId}] retryable error`, {
            status,
            attempt,
            delay_ms: delay,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        }
      }

      throw new Error("Maximum retries reached");

    } catch (error: any) {
      const duration = Date.now() - start;
      const status = error?.response?.status;
      let code = "UPSTREAM_ERROR";
      let message = error.message || "Vertex AI request failed";

      if (status === 404) {
        code = "MODEL_NOT_FOUND";
        message = `Model '${model}' not found in region '${region}'`;
      } else if (status === 403 || status === 401) {
        code = status === 401 ? "UNAUTHENTICATED" : "PERMISSION_DENIED";
      } else if (status === 400) {
        code = "INVALID_ARGUMENT";
      } else if (status === 429) {
        code = "QUOTA_EXCEEDED";
      }

      logger.error(`[${requestId}] generateText error`, {
        code,
        message,
        duration_ms: duration,
      });

      return {
        ok: false,
        request_id: requestId,
        model: model,
        text: null,
        usage: null,
        timing_ms: duration,
        error: {
          code,
          message,
          details: error.response?.data?.error || { status }
        }
      };
    }
  }
}
