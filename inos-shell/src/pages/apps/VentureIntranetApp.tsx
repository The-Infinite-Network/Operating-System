import { useEffect, useRef, useState } from "react";
import { getVenture } from "../../inosMap";

type VentureId = "IE" | "FFC" | "CNGI" | "GGP";

type ToPlugin =
  | { type: "INOS_CONTEXT"; payload: { sessionId: string; entity: string; apiEndpoint: string } }
  | { type: "INOS_COMMAND"; payload: { command: "navigate"; target: string } }
  | { type: "INOS_THEME"; payload: { accent: string; mode: "dark" | "light" } };

type FromPlugin =
  | { type: "GGP_READY"; payload: { version: string; pluginId: string } }
  | { type: "GGP_NAV"; payload: { route: string; title: string } }
  | { type: "GGP_RESIZE"; payload: { height: number } }
  | { type: "GGP_ERROR"; payload: { code: string; message: string } }
  | { type: "PLUGIN_READY"; payload: { version: string; pluginId: string } }
  | { type: "PLUGIN_NAV"; payload: { route: string; title: string } }
  | { type: "PLUGIN_RESIZE"; payload: { height: number } }
  | { type: "PLUGIN_ERROR"; payload: { code: string; message: string } };

function postToPlugin(iframe: React.RefObject<HTMLIFrameElement | null>, msg: ToPlugin) {
  iframe.current?.contentWindow?.postMessage(msg, "*");
}

export default function VentureIntranetApp({ ventureId }: { ventureId: VentureId }) {
  const venture = getVenture(ventureId)!;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pluginReady, setPluginReady] = useState(false);
  const [pluginVersion, setPluginVersion] = useState<string | null>(null);
  const [pluginRoute, setPluginRoute] = useState("—");
  const [iframeHeight, setIframeHeight] = useState(680);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [pluginUrl, setPluginUrl] = useState(venture.pluginUrl ?? "");
  const [draftUrl, setDraftUrl] = useState(venture.pluginUrl ?? "");
  const [editingUrl, setEditingUrl] = useState(false);

  const apiEndpoint =
    (import.meta.env.VITE_INOS_API_ENDPOINT as string | undefined) ||
    (import.meta.env.VITE_MCP_BASE_URL as string | undefined) ||
    "/mcp";

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      try {
        if (pluginUrl && event.origin !== new URL(pluginUrl).origin) return;
      } catch {
        return;
      }
      const msg = event.data as FromPlugin;
      switch (msg?.type) {
        case "GGP_READY":
        case "PLUGIN_READY":
          setPluginReady(true);
          setPluginVersion(msg.payload.version);
          setBridgeError(null);
          postToPlugin(iframeRef, {
            type: "INOS_CONTEXT",
            payload: { sessionId: crypto.randomUUID(), entity: ventureId, apiEndpoint },
          });
          postToPlugin(iframeRef, {
            type: "INOS_THEME",
            payload: { accent: "#00d9ff", mode: "dark" },
          });
          break;
        case "GGP_NAV":
        case "PLUGIN_NAV":
          setPluginRoute(msg.payload.title || msg.payload.route);
          break;
        case "GGP_RESIZE":
        case "PLUGIN_RESIZE":
          if (msg.payload.height > 200) setIframeHeight(msg.payload.height);
          break;
        case "GGP_ERROR":
        case "PLUGIN_ERROR":
          setBridgeError(`[${msg.payload.code}] ${msg.payload.message}`);
          break;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pluginUrl, apiEndpoint, ventureId]);

  function applyUrl() {
    setPluginUrl(draftUrl);
    setPluginReady(false);
    setPluginVersion(null);
    setPluginRoute("—");
    setBridgeError(null);
    setEditingUrl(false);
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-inos-muted">
            Venture · {venture.pod} Pod
          </p>
          <h2 className="text-2xl font-semibold">{venture.name}</h2>
          <p className="text-sm text-inos-muted mt-0.5">{venture.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="pill">
            Status:{" "}
            <span className="text-emerald-300 ml-1 capitalize">
              {venture.status}
            </span>
          </span>
          <span className="pill">
            Plugin:{" "}
            <span
              className={`font-mono ml-1 ${
                pluginReady ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {pluginReady ? `v${pluginVersion} · ready` : "connecting…"}
            </span>
          </span>
          {pluginReady && (
            <span className="pill">
              Route:{" "}
              <span className="ml-1 text-inos-muted">{pluginRoute}</span>
            </span>
          )}
        </div>
      </div>

      {bridgeError && (
        <div className="rounded-xl border border-rose-500/60 bg-rose-900/40 px-4 py-2 text-sm text-rose-200">
          Bridge error: {bridgeError}
        </div>
      )}

      <div className="card p-3 flex items-center gap-3 text-xs">
        <span className="text-inos-muted shrink-0">Plugin URL:</span>
        {editingUrl ? (
          <>
            <input
              className="flex-1 rounded-lg border border-inos-border bg-[#0f172a] px-2 py-1 text-xs outline-none focus:border-inos-accent font-mono"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://ggp.theinfinitenetwork.com/"
            />
            <button
              onClick={applyUrl}
              className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Apply
            </button>
            <button
              onClick={() => setEditingUrl(false)}
              className="rounded-lg border border-inos-border px-2 py-1 text-xs text-inos-muted hover:text-white"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="font-mono text-sky-300 flex-1 truncate">
              {pluginUrl || "(not set)"}
            </span>
            <button
              onClick={() => setEditingUrl(true)}
              className="rounded-lg border border-inos-border px-2 py-1 text-xs text-inos-muted hover:text-white"
            >
              Edit
            </button>
          </>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-inos-border/60 bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-inos-muted">
              {venture.name}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                pluginReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
          </div>
          {pluginUrl && (
            <a
              href={pluginUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-inos-muted hover:text-white transition"
            >
              Open standalone ↗
            </a>
          )}
        </div>
        {pluginUrl ? (
          <iframe
            ref={iframeRef}
            src={pluginUrl}
            title={`${venture.name} Intranet`}
            style={{ height: iframeHeight }}
            className="w-full border-0 bg-[#050816]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-inos-muted">
            <p className="text-sm">No plugin URL configured.</p>
            <p className="text-xs mt-1">
              Set the plugin URL in <span className="font-mono text-sky-300">.env.local</span>{" "}
              or use Edit above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
