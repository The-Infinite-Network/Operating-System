export default function Constraints() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          CONSTRAINTS
        </div>
        <div className="spine-grid mt-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">ARC Standards</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Read-only index of ARC gates.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">LAW Policies</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Read-only policy checklist.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">MCP Constraints</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Protocol guardrails and rate limits.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Request Gate</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Gate requests log to Timeline; no direct execution.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
