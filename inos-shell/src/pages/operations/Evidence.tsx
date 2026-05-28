export default function Evidence() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          EVIDENCE
        </div>
        <div className="spine-grid mt-3">
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">MIND Timeline</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Timeline explorer (read-only).
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="text-sm font-semibold">ARK Archive</div>
            <div className="text-[11px] text-inos-muted mt-2">
              Artifact register + linkouts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
