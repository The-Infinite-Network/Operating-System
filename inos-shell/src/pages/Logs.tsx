import { mockTimeline } from "../data/mock/timeline";

export default function Logs() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-inos-muted">
          Event Logs
          <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-amber-300/70 border border-amber-300/30 bg-amber-300/5 px-1.5 py-0.5 rounded-sm">
            Sample
          </span>
        </div>
        <p className="mt-2 mb-4 text-xs text-[#777]">
          This surface is still rendering seeded mock timeline rows. Use it as a placeholder until the
          live log route is wired or replaced.
        </p>
        <div className="table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>Occurred</th>
                <th>Type</th>
                <th>Title</th>
                <th>Entity</th>
                <th>Mission</th>
              </tr>
            </thead>
            <tbody>
              {mockTimeline.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.occurred_at).toLocaleString()}</td>
                  <td>{entry.type}</td>
                  <td>{entry.title}</td>
                  <td>{entry.entity}</td>
                  <td>{entry.mission || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
