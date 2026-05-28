import { useEffect, useState } from "react";
import { mcpClient, MCPHealth, MCPError } from "../services/mcpClient";

export default function DevConnectionPanel() {
  const [health, setHealth] = useState<MCPHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mcpClient.health();
      setHealth(res);
      setLastRequestId((res as any)?.request_id || null);
    } catch (err: any) {
      const msg = err instanceof MCPError ? err.message : err?.message || "MCP health failed";
      setError(msg);
      setLastRequestId(err?.request_id || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const llm = (health as any)?.llm || {};

  return (
    <div className="card p-3 mt-3 border border-inos-border/40">
      <div className="text-[10px] uppercase tracking-[0.2em] text-inos-muted">
        Dev Connection Panel
      </div>
      <div className="text-[11px] text-inos-muted mt-1">
        MCP Base: {mcpClient.baseUrl()}
      </div>
      <div className="text-[11px] text-inos-muted">
        Port: {(health as any)?.port || "—"} · Status: {health?.status || "—"}
      </div>
      <div className="text-[11px] text-inos-muted">
        Auth Mode: {llm.auth_mode_resolved || "unknown"}
      </div>
      <div className="text-[11px] text-inos-muted">
        Model: {llm.model || ""}
      </div>
      <div className="text-[11px] text-inos-muted">
        Last request_id: {lastRequestId || "—"}
      </div>
      {error && <div className="text-[11px] text-red-400">{error}</div>}
      <div className="mt-2">
        <button className="btn-secondary" type="button" onClick={load}>
          {loading ? "Checking..." : "Refresh Health"}
        </button>
      </div>
    </div>
  );
}
