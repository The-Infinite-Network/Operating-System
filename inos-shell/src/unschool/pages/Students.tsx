import { useEffect, useState } from "react";
import { studentRepo } from "../data/repositories";
import { useUnschoolStore } from "../store";
import type { StudentProfile } from "../domain/models";

export default function Students() {
  const { currentStudentId, setCurrentStudentId, refreshToken, bumpRefresh } =
    useUnschoolStore();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [form, setForm] = useState({
    name: "",
    ageYears: "",
    dob: "",
    notes: "",
    constraints: "",
  });

  useEffect(() => {
    studentRepo.list().then(setStudents);
  }, [refreshToken]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const student = await studentRepo.create({
      name: form.name.trim(),
      ageYears: form.ageYears ? Number(form.ageYears) : undefined,
      dob: form.dob || undefined,
      notes: form.notes || undefined,
      constraints: form.constraints || undefined,
    });
    setForm({ name: "", ageYears: "", dob: "", notes: "", constraints: "" });
    setCurrentStudentId(student.id);
    bumpRefresh();
  };

  return (
    <div className="ops-page">
      <div className="ops-card ops-stack">
        <h2>Add Student</h2>
        <div className="ops-form-grid">
          <label>
            Name
            <input
              className="ops-input"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label>
            Age
            <input
              className="ops-input"
              type="number"
              value={form.ageYears}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ageYears: event.target.value }))
              }
            />
          </label>
          <label>
            DOB
            <input
              className="ops-input"
              type="date"
              value={form.dob}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dob: event.target.value }))
              }
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            className="ops-input"
            rows={2}
            value={form.notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
          />
        </label>
        <label>
          Constraints
          <textarea
            className="ops-input"
            rows={2}
            value={form.constraints}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, constraints: event.target.value }))
            }
          />
        </label>
        <button className="ops-btn" onClick={handleCreate}>
          Save Student
        </button>
      </div>

      <div className="ops-card">
        <h2>Profiles</h2>
        <div className="ops-list">
          {students.map((student) => (
            <div className="ops-list-item" key={student.id}>
              <div>
                <div className="ops-list-title">{student.name}</div>
                <div className="ops-muted">
                  {student.ageYears ? `${student.ageYears} years` : "Age unknown"}
                </div>
              </div>
              <div className="ops-actions">
                <button
                  className="ops-btn ops-btn-secondary"
                  onClick={() => setCurrentStudentId(student.id)}
                >
                  {currentStudentId === student.id ? "Active" : "Set Active"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
