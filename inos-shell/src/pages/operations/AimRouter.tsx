export default function AimRouter() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          AIM ROUTER
        </div>
        <div className="spine-grid mt-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Queue</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Intake · Routed · In Progress · Returned
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">Handoff Log</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Routing changes write to Timeline as handoff events.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
