import { mockTimeline } from "../data/mock/timeline";

export default function Logs() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Event Logs
        </div>
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
