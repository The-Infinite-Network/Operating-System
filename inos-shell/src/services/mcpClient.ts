import { API_BASE } from "../api";
import type { TimelineEvent as MCPTimelineEvent } from "../types/timeline";

export type MCPHealth = {
  ok?: boolean;
  status?: string;
  service?: string;
  epoch?: string;
  canon?: string;
  port?: number | string;
  llm?: Record<string, unknown>;
  request_id?: string;
};

export class MCPError extends Error {
  code?: string;
  request_id?: string;

  constructor(message: string, options?: { code?: string; request_id?: string }) {
    super(message);
    this.name = "MCPError";
    this.code = options?.code;
    this.request_id = options?.request_id;
  }
}

function resolveBaseUrl() {
  return API_BASE.replace(/\/+$/, "");
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok || (data as any)?.ok === false) {
    const error = (data as any)?.error || {};
    throw new MCPError(
      error.message || `MCP request failed with status ${res.status}`,
      {
        code: error.code,
        request_id: (data as any)?.request_id,
      }
    );
  }

  return data as T;
}

export const mcpClient = {
  baseUrl() {
    return resolveBaseUrl();
  },

  async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${resolveBaseUrl()}${path}`, init);
    return parseResponse<T>(res);
  },

  async health(): Promise<MCPHealth> {
    const res = await fetch(`${resolveBaseUrl()}/health`, { method: "GET" });
    return parseResponse<MCPHealth>(res);
  },

  async tools(): Promise<string[]> {
    const data = await this.fetchJson<{ tools?: string[]; data?: { tools?: string[] } }>(
      "/tools",
      { method: "GET" }
    );
    return data.tools || data.data?.tools || [];
  },

  async capabilities(): Promise<Record<string, unknown>> {
    return this.fetchJson<Record<string, unknown>>("/capabilities", {
      method: "GET",
    });
  },

  timeline: {
    async list(params: { limit?: number }) {
      const res = await fetch(`${resolveBaseUrl()}/tool/timeline.list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });

      const data = await parseResponse<{
        request_id?: string;
        data?: { events?: MCPTimelineEvent[] };
      }>(res);

      return {
        request_id: data.request_id,
        events: data.data?.events || [],
      };
    },
  },
};

export type { MCPTimelineEvent };
