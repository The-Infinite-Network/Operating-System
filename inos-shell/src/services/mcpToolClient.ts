export type MCPToolError = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type MCPToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; POLE_id?: string; error?: MCPToolError };

const DEFAULT_BASE_URL = "http://localhost:3002";

export function getMcpBaseUrl() {
  const raw = import.meta.env.VITE_MCP_BASE_URL || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function getJsonErrorMessage(payload: any, fallback: string) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.error ||
    fallback
  );
}

function getPOLEIdFromPayload(payload: Record<string, unknown>) {
  const direct = (payload as any)?.POLE_id || (payload as any)?.sync_key;
  const nested =
    (payload as any)?.params?.POLE_id || (payload as any)?.params?.sync_key;
  return direct || nested;
}

export async function callTool<T>(
  toolName: string,
  payload: Record<string, unknown>
): Promise<MCPToolResult<T>> {
  const url = `${getMcpBaseUrl()}/tool/${toolName}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });

    const text = await res.text().catch(() => "");
    const json = text ? JSON.parse(text) : null;

    if (!res.ok || json?.ok === false) {
      const reason = getJsonErrorMessage(json, res.statusText || "MCP error");
      console.error("MCP tool error", { toolName, reason, response: json });
      return {
        ok: false,
        reason,
        POLE_id: getPOLEIdFromPayload(payload) || undefined,
        error: json?.error,
      };
    }

    return { ok: true, data: json?.data ?? json };
  } catch (error: any) {
    const reason = error?.message || "MCP request failed";
    console.error("MCP tool request failed", { toolName, reason, error });
    return {
      ok: false,
      reason,
      POLE_id: getPOLEIdFromPayload(payload) || undefined,
    };
  }
}

export async function checkMcpHealth(): Promise<
  { ok: true; data: any } | { ok: false; reason: string }
> {
  const url = `${getMcpBaseUrl()}/health`;
  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const reason = getJsonErrorMessage(data, res.statusText || "MCP health failed");
      return { ok: false, reason };
    }
    if (data?.ok === false || data?.status === "down") {
      return { ok: false, reason: data?.status || "MCP unhealthy" };
    }
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "MCP health failed" };
  }
}
