import { useMemo, useState, type FormEvent } from "react";
import { api, type VertexGenerateResponse, type VertexHealthResponse } from "./api";

const DEFAULT_MODEL =
  import.meta.env.VITE_VERTEX_MODEL ||
  import.meta.env.VITE_VERTEX_DEFAULT_MODEL ||
  "gemini-2.0-flash-001";

export default function VertexConsolePanel() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [requestIdInput, setRequestIdInput] = useState("");
  const [jsonOnly, setJsonOnly] = useState(true);
  const [temperature, setTemperature] = useState(0.5);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<VertexGenerateResponse | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const [health, setHealth] = useState<VertexHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const responseJson = useMemo(() => {
    if (!lastResponse) return "";
    return JSON.stringify(lastResponse, null, 2);
  }, [lastResponse]);

  const submitPrompt = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorDetails(null);
    setLatencyMs(null);

    const startedAt = performance.now();
    try {
      const result = await api.vertexGenerate({
        prompt: prompt.trim(),
        system: system.trim() || undefined,
        max_output_tokens: maxTokens,
        temperature,
        json_only: jsonOnly,
        model: model.trim() || undefined,
        request_id: requestIdInput.trim() || undefined,
      });

      const elapsed = performance.now() - startedAt;
      setLatencyMs(Math.round(elapsed));

      if (result.ok === false || result.error) {
        setErrorDetails({
          code: result.error?.code,
          message: result.error?.message || "Vertex request failed",
          details: result.error?.details,
        });
        return;
      }

      setRequestId(result.request_id ?? null);
      setLastResponse(result);
    } catch (error: any) {
      const elapsed = performance.now() - startedAt;
      setLatencyMs(Math.round(elapsed));
      setErrorDetails({
        code: "UNEXPECTED_ERROR",
        message: error?.message || "Vertex request failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const runHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const result = await api.vertexHealth();
      if (result.ok === false || result.error) {
        setHealthError(result.error?.message || "Vertex health failed");
        return;
      }
      setHealth(result);
    } catch (error: any) {
      setHealthError(error?.message || "Vertex health failed");
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <section className="mt-2 space-y-4 pb-12">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Vertex Console
          </p>
          <h2 className="text-lg font-semibold">Vertex AI Gemini Bridge</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-inos-muted">
          <span className="pill">v2 Contract</span>
          <span className="pill">No persistence</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-inos-muted">Configuration</h3>
              <button
                type="button"
                className="btn-secondary py-1 px-3 text-[10px]"
                onClick={runHealth}
                disabled={healthLoading}
              >
                {healthLoading ? "Checking..." : "Verify Connection"}
              </button>
            </div>

            {health && (
              <div className="flex flex-wrap gap-2">
                <span className="pill border-emerald-500/30 text-emerald-400">Project: {health.project_id}</span>
                <span className="pill">Region: {health.region}</span>
                <span className="pill">Model: {health.model}</span>
                {health.auth && <span className="pill">Auth: {health.auth}</span>}
                {typeof health.timing_ms === "number" && (
                  <span className="pill">Health: {health.timing_ms}ms</span>
                )}
              </div>
            )}

            {healthError && (
              <div className="rounded-md border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-100">
                {healthError}
              </div>
            )}

            <form className="space-y-4" onSubmit={submitPrompt}>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-inos-muted ml-1" htmlFor="vertex-model">Model</label>
                <input
                  id="vertex-model"
                  className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent transition-all"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gemini-2.0-flash-001"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-inos-muted ml-1" htmlFor="vertex-request-id">request_id (optional)</label>
                <input
                  id="vertex-request-id"
                  className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent transition-all font-mono"
                  value={requestIdInput}
                  onChange={(e) => setRequestIdInput(e.target.value)}
                  placeholder="Leave blank for auto-generated"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-inos-muted ml-1" htmlFor="vertex-system">System Instruction</label>
                <textarea
                  id="vertex-system"
                  className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent transition-all font-mono"
                  rows={3}
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  placeholder="You are an AI assistant..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-inos-muted ml-1" htmlFor="vertex-prompt">User Prompt</label>
                <textarea
                  id="vertex-prompt"
                  className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent transition-all font-mono"
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What is the current status of the network?"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-inos-muted">
                    <input
                      type="checkbox"
                      id="json-mode"
                      checked={jsonOnly}
                      onChange={(e) => setJsonOnly(e.target.checked)}
                      className="rounded border-inos-border bg-[#020617] text-inos-accent focus:ring-inos-accent"
                    />
                    <label htmlFor="json-mode" className="cursor-pointer">Force JSON Output</label>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-inos-muted">
                      <label htmlFor="vertex-temperature">Temperature</label>
                      <span>{temperature}</span>
                    </div>
                    <input
                      id="vertex-temperature"
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#020617] rounded-lg appearance-none cursor-pointer accent-inos-accent"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-inos-muted" htmlFor="max-tokens">Max Tokens</label>
                    <input
                      id="max-tokens"
                      type="number"
                      className="w-full rounded-md border border-inos-border bg-[#020617] px-2 py-1 text-xs outline-none focus:border-inos-accent"
                      min={1}
                      max={8192}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                    {loading ? "GENERATING..." : "RUN INFERENCE"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          {/* Main Output View */}
          <div className="card p-4 space-y-4 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between border-b border-inos-border/30 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-inos-muted">Output</h3>
              <div className="flex gap-3 text-[10px]">
                {latencyMs !== null && (
                  <span className="text-inos-accent">{latencyMs}ms</span>
                )}
                {requestId && (
                  <span className="text-inos-muted font-mono">{requestId.slice(0, 8)}...</span>
                )}
              </div>
            </div>

            {errorDetails && (
              <div className="rounded-md border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-xs text-rose-100 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  ERROR: {errorDetails.code}
                </div>
                <div>{errorDetails.message}</div>
                {errorDetails.details && (
                  <details className="rounded border border-white/10 bg-black/30 p-2">
                    <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-rose-200">details</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px]">
                      {JSON.stringify(errorDetails.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex-1 overflow-auto py-2">
              {lastResponse?.text ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-inos-text font-sans">
                  {lastResponse.text}
                </div>
              ) : !loading && !errorDetails ? (
                <div className="flex flex-col items-center justify-center h-full text-inos-muted/40 space-y-2">
                  <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="font-mono text-[10px] tracking-widest">AWAITING INPUT</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="h-6 w-6 border-2 border-inos-accent border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-[10px] text-inos-accent tracking-[0.3em] animate-pulse">THINKING...</p>
                </div>
              ) : null}
            </div>

            {lastResponse?.usage && (
              <div className="border-t border-inos-border/30 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-inos-muted">
                <span>Prompt: {String((lastResponse.usage as any).prompt_tokens || 0)}</span>
                <span>Output: {String((lastResponse.usage as any).output_tokens || 0)}</span>
                <span>Total: {String((lastResponse.usage as any).total_tokens || 0)}</span>
              </div>
            )}
          </div>

          {/* Raw JSON View */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-inos-muted">Raw JSON Stream</h3>
              <button
                type="button"
                className="text-[10px] text-inos-muted underline underline-offset-2 hover:text-inos-accent transition-colors"
                onClick={() => {
                  if (!responseJson) return;
                  void navigator.clipboard.writeText(responseJson);
                }}
                disabled={!responseJson}
              >
                Copy Bridge Data
              </button>
            </div>
            <div className="max-h-[200px] overflow-auto rounded-lg border border-inos-border/50 bg-[#010409] p-3">
              <pre className="font-mono text-[11px] leading-relaxed">
                {responseJson || "// No data available"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
