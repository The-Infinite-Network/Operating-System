import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { activityRepo, outboxRepo, sessionRepo, settingsRepo, studentRepo, skillRepo } from "../data/repositories";
import { generateDailyBlock } from "../domain/generators";
import { useUnschoolStore } from "../store";
import type { DailyBlock, Session, SkillNode, StudentProfile } from "../domain/models";
import { processOutbox } from "../services/outbox";

export default function OperatorDashboard() {
  const { currentStudentId, refreshToken, bumpRefresh } = useUnschoolStore();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [block, setBlock] = useState<DailyBlock | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [health, setHealth] = useState<string>("unknown");

  useEffect(() => {
    studentRepo.list().then(setStudents);
  }, [refreshToken]);

  useEffect(() => {
    if (!currentStudentId) return;
    Promise.all([
      skillRepo.list(),
      sessionRepo.list(currentStudentId),
      activityRepo.list(),
    ]).then(([skillsAll, sessionsAll, templates]) => {
      setSkills(skillsAll);
      setSessions(sessionsAll);
      const block = generateDailyBlock({
        studentId: currentStudentId,
        skills: skillsAll,
        activityTemplates: templates,
        recentSessions: sessionsAll,
      });
      setBlock(block);
    });
  }, [currentStudentId, refreshToken]);

  useEffect(() => {
    settingsRepo.get().then((settings) => {
      setSyncEnabled(settings.syncEnabled);
    });
    outboxRepo.countPending().then(setPendingCount);
  }, [refreshToken]);

  const lastSession = sessions[0];
  const recommended = useMemo(() => {
    if (!block) return [];
    return block.activities.map((activity) => activity.title);
  }, [block]);

  const handleSyncCheck = async () => {
    const result = await processOutbox();
    setHealth(result.ok ? "ok" : result.reason || "offline");
    outboxRepo.countPending().then(setPendingCount);
    bumpRefresh();
  };

  return (
    <div className="ops-page">
      <div className="ops-grid">
        <div className="ops-card ops-stack">
          <div className="ops-eyebrow">Today</div>
          <h2>Recommended block</h2>
          {currentStudentId ? (
            <>
              <div className="ops-muted">Warm win: {block?.warmWin}</div>
              <ul className="ops-list-plain">
                {recommended.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="ops-actions">
                <Link className="ops-btn" to="/unschool/session/new">
                  Start Session
                </Link>
                <Link className="ops-btn ops-btn-secondary" to="/unschool/teacher">
                  Log Proof
                </Link>
              </div>
            </>
          ) : (
            <p className="ops-muted">Select a student to generate today’s plan.</p>
          )}
        </div>
        <div className="ops-card ops-stack">
          <div className="ops-eyebrow">Sync Status</div>
          <h2>{syncEnabled ? "Timeline sync on" : "Sync off"}</h2>
          <div className="ops-muted">MCP health: {health}</div>
          <div className="ops-muted">Pending events: {pendingCount}</div>
          <div className="ops-actions">
            <button className="ops-btn" onClick={handleSyncCheck} type="button">
              Run Sync + Health Check
            </button>
            <Link className="ops-btn ops-btn-ghost" to="/unschool/settings">
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="ops-card ops-stack">
        <div className="ops-eyebrow">Quick Actions</div>
        <div className="ops-actions">
          <Link className="ops-btn" to="/unschool/baseline">
            Baseline Sprint
          </Link>
          <Link className="ops-btn ops-btn-secondary" to="/unschool/weekly">
            Weekly Review
          </Link>
          <Link className="ops-btn" to="/unschool/session/new">
            Add Life Skill
          </Link>
          <Link className="ops-btn ops-btn-ghost" to="/unschool/sessions">
            Session History
          </Link>
        </div>
        <div className="ops-muted">
          Last session: {lastSession ? `${lastSession.title} · ${lastSession.startedAt.slice(0, 10)}` : "None"}
        </div>
        <div className="ops-muted">Students: {students.length}</div>
      </div>
    </div>
  );
}
