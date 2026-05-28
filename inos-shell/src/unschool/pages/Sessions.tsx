import { useEffect, useState } from "react";
import { sessionRepo } from "../data/repositories";
import { useUnschoolStore } from "../store";
import type { Session } from "../domain/models";

export default function Sessions() {
  const { currentStudentId } = useUnschoolStore();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!currentStudentId) return;
    sessionRepo.list(currentStudentId).then(setSessions);
  }, [currentStudentId]);

  if (!currentStudentId) {
    return (
      <div className="ops-card">
        <h2>Select a student to view sessions.</h2>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <div className="ops-card">
        <h2>Session History</h2>
        <div className="ops-list">
          {sessions.map((session) => (
            <div key={session.id} className="ops-list-item">
              <div>
                <div className="ops-list-title">{session.title}</div>
                <div className="ops-muted">
                  {session.type} · {session.startedAt.slice(0, 10)}
                </div>
              </div>
              <div className="ops-muted">
                {session.durationMinutesActual} min{" "}
                {session.syncStatus ? `· ${session.syncStatus}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
