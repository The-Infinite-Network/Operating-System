import { useEffect, useMemo, useState } from "react";
import { evidenceRepo, sessionRepo, settingsRepo, skillRepo } from "../data/repositories";
import type { Evidence, SkillNode } from "../domain/models";
import { enqueuePOLEEvent, processOutbox } from "../services/outbox";
import { useUnschoolStore } from "../store";

function summarizeDomain(skills: SkillNode[], domain: string) {
  const domainSkills = skills.filter((skill) => skill.domain === domain);
  const weakest = domainSkills.sort((a, b) => a.mastery - b.mastery)[0];
  return weakest ? `${weakest.label} (${weakest.mastery}%)` : "—";
}

export default function WeeklyReviewV2() {
  const { currentStudentId, refreshToken, bumpRefresh } = useUnschoolStore();
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [summary, setSummary] = useState("");
  const [weeklySessions, setWeeklySessions] = useState(0);

  useEffect(() => {
    if (!currentStudentId) return;
    Promise.all([
      skillRepo.list(),
      evidenceRepo.listByStudent(currentStudentId),
      sessionRepo.list(currentStudentId),
    ]).then(([skillsAll, evidenceAll, sessions]) => {
      setSkills(skillsAll);
      setEvidence(evidenceAll);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const weekly = sessions.filter(
        (session) => new Date(session.startedAt) >= cutoff
      );
      setWeeklySessions(weekly.length);
    });
  }, [currentStudentId, refreshToken]);

  const readingFocus = useMemo(() => summarizeDomain(skills, "Literacy"), [skills]);
  const mathFocus = useMemo(() => summarizeDomain(skills, "Math"), [skills]);
  const lifeFocus = useMemo(() => summarizeDomain(skills, "Life Skills"), [skills]);

  const totalEvidence = evidence.length;

  const handleWriteback = async () => {
    if (!currentStudentId) return;
    const settings = await settingsRepo.get();
    if (!settings.syncEnabled) return;
    const payload = {
      title: "UNSCHOOL_OPS · Weekly Review",
      summary: `Weekly review for student ${currentStudentId}`,
      source: "INOS",
      syncKey: `weekly-${currentStudentId}-${new Date().toISOString()}`,
      type: "UNSCHOOL_WEEKLY",
      structured: {
        studentId: currentStudentId,
        readingFocus,
        mathFocus,
        lifeFocus,
        evidenceCount: totalEvidence,
      },
      notes: JSON.stringify(
        {
          app: "UNSCHOOL_OPS",
          childId: currentStudentId,
          timestamp: new Date().toISOString(),
          raw: summary || "Weekly review complete.",
          structured: {
            readingFocus,
            mathFocus,
            lifeFocus,
            evidenceCount: totalEvidence,
          },
        },
        null,
        2
      ),
    };
    await enqueuePOLEEvent(payload, "weekly_summary");
    await processOutbox();
    bumpRefresh();
  };

  if (!currentStudentId) {
    return (
      <div className="ops-card">
        <h2>Select a student to run weekly review.</h2>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <div className="ops-card">
        <div className="ops-eyebrow">Weekly Review</div>
        <h2>Baseline vs last 7 days</h2>
        <p className="ops-muted">
          Evidence logged this week: {totalEvidence}. Sessions in last 7 days: {weeklySessions}.
        </p>
      </div>
      <div className="ops-grid">
        <div className="ops-card">
          <h3>Reading</h3>
          <div className="ops-muted">Next focus: {readingFocus}</div>
        </div>
        <div className="ops-card">
          <h3>Math</h3>
          <div className="ops-muted">Next focus: {mathFocus}</div>
        </div>
        <div className="ops-card">
          <h3>Life Skills</h3>
          <div className="ops-muted">Next focus: {lifeFocus}</div>
        </div>
      </div>
      <div className="ops-card ops-stack">
        <label>
          Weekly summary
          <textarea
            className="ops-input"
            rows={3}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </label>
        <button className="ops-btn" onClick={handleWriteback}>
          Write Weekly Summary to Timeline
        </button>
      </div>
    </div>
  );
}
