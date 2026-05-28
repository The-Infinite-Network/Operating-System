export default function CoreConsole() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          CORE CONSOLE
        </div>
        <div className="spine-grid mt-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Top 5 Priorities</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Priorities surface from WAR room ordering.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Bottlenecks</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Blocked items grouped by ARC/LAW/MCP gate.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Cadence</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Runs per day + overdue tasks overview.
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Decision Log</div>
            <div className="text-[11px] text-inos-muted mt-2">
              CORE decisions write to Timeline.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
