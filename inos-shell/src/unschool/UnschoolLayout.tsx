import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { seedUnschoolV2 } from "./data/seed";
import { studentRepo } from "./data/repositories";
import { useUnschoolStore } from "./store";
import type { StudentProfile } from "./domain/models";

export default function UnschoolLayout() {
  const { currentStudentId, setCurrentStudentId, refreshToken } =
    useUnschoolStore();
  const [students, setStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    let mounted = true;
    seedUnschoolV2().then(() => {
      studentRepo.list().then((rows) => {
        if (mounted) setStudents(rows);
      });
    });
    return () => {
      mounted = false;
    };
  }, [refreshToken]);

  return (
    <div className="unschool-shell">
      <header className="unschool-header">
        <div className="unschool-brand">
          <div className="unschool-logo">UO</div>
          <div>
            <div className="ops-eyebrow">Unschool Ops</div>
            <div className="ops-title">Local-first learning ops</div>
          </div>
        </div>
        <div className="unschool-controls">
          <label className="ops-label" htmlFor="child-select">
            Active Student
          </label>
          <select
            id="child-select"
            className="ops-select"
            value={currentStudentId || ""}
            onChange={(event) =>
              setCurrentStudentId(event.target.value || null)
            }
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      </header>
      <nav className="unschool-nav">
        <NavLink to="/unschool" end>
          Operator
        </NavLink>
        <NavLink to="/unschool/students">Students</NavLink>
        <NavLink to="/unschool/skills">Skill Map</NavLink>
        <NavLink to="/unschool/sessions">Sessions</NavLink>
        <NavLink to="/unschool/session/new">Session Runner</NavLink>
        <NavLink to="/unschool/baseline">Baseline Sprint</NavLink>
        <NavLink to="/unschool/weekly">Weekly Review</NavLink>
        <NavLink to="/unschool/teacher">Teacher Console</NavLink>
        <NavLink to="/unschool/settings">Settings</NavLink>
      </nav>
      <main className="unschool-main">
        <Outlet />
      </main>
    </div>
  );
}
