import { Link } from "react-router-dom";
import { useUnschoolStore } from "../store";

export default function BaselineV2() {
  const { currentStudentId } = useUnschoolStore();

  if (!currentStudentId) {
    return (
      <div className="ops-card">
        <h2>Select a student to start baseline.</h2>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <div className="ops-card">
        <h2>Baseline Sprint v2</h2>
        <p className="ops-muted">
          Day 0 Life Skills + Day 1 Literacy + Day 2 Math + Day 3 Readiness.
          Each session runs 10–15 minutes.
        </p>
      </div>
      <div className="ops-grid">
        <div className="ops-card">
          <div className="ops-eyebrow">Day 0</div>
          <h3>Life Skills Mini-Baseline</h3>
          <p className="ops-muted">
            Belongs-where sorting, kitchen safety recognition, cleanup routine.
          </p>
          <Link className="ops-btn" to="/unschool/session/new">
            Start Day 0
          </Link>
        </div>
        <div className="ops-card">
          <div className="ops-eyebrow">Day 1</div>
          <h3>Literacy</h3>
          <p className="ops-muted">
            Letter names/sounds + decoding snapshot.
          </p>
          <Link className="ops-btn" to="/unschool/session/new">
            Start Day 1
          </Link>
        </div>
        <div className="ops-card">
          <div className="ops-eyebrow">Day 2</div>
          <h3>Math</h3>
          <p className="ops-muted">
            Number ID + counting stability + add/sub strategy.
          </p>
          <Link className="ops-btn" to="/unschool/session/new">
            Start Day 2
          </Link>
        </div>
        <div className="ops-card">
          <div className="ops-eyebrow">Day 3</div>
          <h3>Readiness</h3>
          <p className="ops-muted">Stamina + directions + fine motor.</p>
          <Link className="ops-btn" to="/unschool/session/new">
            Start Day 3
          </Link>
        </div>
      </div>
    </div>
  );
}
