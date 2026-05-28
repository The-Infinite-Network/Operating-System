import type { SyncSettings } from "../domain/models";

export interface POLEPayload {
  title: string;
  summary: string;
  source: string;
  syncKey: string;
  notes?: string;
  tags?: string[];
  type?: string;
  startedAt?: string;
  endedAt?: string;
}

export async function healthCheck(settings: SyncSettings) {
  const url = `${settings.mcpBaseUrl.replace(/\/+$/, "")}/health`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) {
      return { ok: false, reason: data?.message || res.statusText };
    }
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "MCP health failed" };
  }
}

export async function appendPOLE(
  settings: SyncSettings,
  payload: POLEPayload
) {
  const toolName = "timeline.log";
  const url = `${settings.mcpBaseUrl.replace(/\/+$/, "")}/tool/${toolName}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        params: {
          title: payload.title,
          notes: payload.notes,
          source: payload.source,
          tags: payload.tags,
          type: payload.type,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
          sync_key: payload.syncKey,
          summary: payload.summary,
        },
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) {
      return { ok: false as const, reason: json?.message || res.statusText };
    }
    return { ok: true as const, data: json?.data ?? json };
  } catch (error: any) {
    return { ok: false as const, reason: error?.message || "MCP request failed" };
  }
}
