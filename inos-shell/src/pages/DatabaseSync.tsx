import { useState } from "react";
import { mcpClient, MCPHealth } from "../services/mcpClient";

export default function DatabaseSync() {
  const [health, setHealth] = useState<MCPHealth | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [toolsUnsupported, setToolsUnsupported] = useState(false);
  const [capabilities, setCapabilities] = useState<Record<string, unknown> | null>(null);
  const [capsUnsupported, setCapsUnsupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      // Health is the canonical live signal. Tool/capability discovery endpoints
      // are optional and not exposed on every MCP build, so they are best-effort
      // and must not mask a healthy runtime.
      const res = await mcpClient.health();
      setHealth(res);

      try {
        const toolList = await mcpClient.tools();
        setTools(toolList || []);
        setToolsUnsupported(false);
      } catch {
        setTools([]);
        setToolsUnsupported(true);
      }

      try {
        const capRes = await mcpClient.capabilities();
        setCapabilities((capRes as any)?.data ?? null);
        setCapsUnsupported(false);
      } catch {
        setCapabilities(null);
        setCapsUnsupported(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach MCP server");
      setHealth(null);
      setTools([]);
      setToolsUnsupported(false);
      setCapabilities(null);
      setCapsUnsupported(false);
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
          Canonical MCP routing is fixed to the shell proxy. The backend owns Notion
          DB IDs; the shell does not override adapter targets from the browser.
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Route Contract</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Shell MCP Proxy</div>
            <div className="text-[11px] text-inos-muted mt-1">/mcp</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Browser-side base URL override is disabled on the canonical runtime.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Canonical Target</div>
            <div className="text-[11px] text-inos-muted mt-1">localhost:3002</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Launcher-owned MCP root for the active INOS shell stack.
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className="btn-primary" type="button" onClick={runHealthCheck}>
            {loading ? "Checking..." : "Run Health Check"}
          </button>
          <div className="text-[11px] text-inos-muted self-center">
            Current shell route: {mcpClient.baseUrl()}
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
              {toolsUnsupported ? (
                <li className="text-amber-300">
                  Tool discovery endpoint not exposed on this MCP build. Canonical tool calls use POST /tool/&#123;name&#125;.
                </li>
              ) : tools.length === 0 ? (
                <li>Run health check to load tools.</li>
              ) : (
                tools.map((tool) => <li key={tool}>{tool}</li>)
              )}
            </ul>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Capabilities</div>
            {capsUnsupported ? (
              <div className="text-[11px] text-amber-300 mt-2">
                Capability discovery endpoint not exposed on this MCP build.
              </div>
            ) : (
              <pre className="text-[10px] text-inos-muted mt-2 whitespace-pre-wrap">
                {capabilities ? JSON.stringify(capabilities, null, 2) : "No capability data yet."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
