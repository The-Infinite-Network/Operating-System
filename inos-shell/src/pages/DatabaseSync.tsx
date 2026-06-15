import { useMemo, useState } from "react";
import { mcpClient, MCPHealth } from "../services/mcpClient";

const STORAGE_KEY = "inos_mcp_base_url";

export default function DatabaseSync() {
  const initialUrl = useMemo(() => {
    if (typeof window === "undefined") return mcpClient.baseUrl();
    return window.localStorage.getItem(STORAGE_KEY) || mcpClient.baseUrl();
  }, []);

  const [baseUrl, setBaseUrl] = useState(initialUrl);
  const [health, setHealth] = useState<MCPHealth | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const saveBaseUrl = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, baseUrl.trim());
  };

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mcpClient.health();
      const toolList = await mcpClient.tools();
      let caps: Record<string, unknown> | null = null;
      try {
        const capRes = await mcpClient.capabilities();
        caps = (capRes as any)?.data ?? null;
      } catch {
        caps = null;
      }
      setHealth(res);
      setTools(toolList || []);
      setCapabilities(caps);
    } catch (err: any) {
      setError(err?.message || "Failed to reach MCP server");
      setHealth(null);
      setTools([]);
      setCapabilities(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Database Sync
        </div>
        <div className="text-lg font-semibold mt-2">MCP Server Connection</div>
        <div className="text-[12px] text-inos-muted mt-1">
          Configure the MCP base URL for INOS shell data sync. The backend owns Notion
          DB IDs; the shell only points to the MCP service.
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          MCP Base URL
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <input
            className="rail-select"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="/mcp"
          />
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" type="button" onClick={saveBaseUrl}>
              Save URL
            </button>
            <button className="btn-primary" type="button" onClick={runHealthCheck}>
              {loading ? "Checking..." : "Run Health Check"}
            </button>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          MCP Status
        </div>
        {health ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="inos-card p-3">
              <div className="text-sm font-semibold">Status</div>
              <div className="text-[11px] text-inos-muted mt-1">{health.status || "unknown"}</div>
            </div>
            <div className="inos-card p-3">
              <div className="text-sm font-semibold">Service</div>
              <div className="text-[11px] text-inos-muted mt-1">{health.service || "mcp"}</div>
            </div>
            <div className="inos-card p-3">
              <div className="text-sm font-semibold">Epoch</div>
              <div className="text-[11px] text-inos-muted mt-1">{health.epoch || "Epoch 0"}</div>
            </div>
            <div className="inos-card p-3">
              <div className="text-sm font-semibold">Canon</div>
              <div className="text-[11px] text-inos-muted mt-1">{health.canon || ""}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-inos-muted mt-3">Run a health check to see status.</div>
        )}
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Tools + Capabilities
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Tools</div>
            <ul className="agent-principles mt-2">
              {tools.length === 0 ? (
                <li>Run health check to load tools.</li>
              ) : (
                tools.map((tool) => <li key={tool}>{tool}</li>)
              )}
            </ul>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Capabilities</div>
            <pre className="text-[10px] text-inos-muted mt-2 whitespace-pre-wrap">
              {capabilities ? JSON.stringify(capabilities, null, 2) : "No capability data yet."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
