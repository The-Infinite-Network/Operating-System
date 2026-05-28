import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import { activityRepo, evidenceRepo, lifeSkillRepo, proofRepo, sessionRepo, settingsRepo, skillRepo } from "../data/repositories";
import { applyEvidenceToSkill } from "../domain/mastery";
import type { Evidence, LifeSkillTemplate, Session, SkillNode } from "../domain/models";
import { enqueuePOLEEvent, processOutbox } from "../services/outbox";
import { useUnschoolStore } from "../store";
import { generateDailyBlock } from "../domain/generators";

const SESSION_TYPES = [
  { value: "daily", label: "Daily Block" },
  { value: "skill_build", label: "Skill Build" },
  { value: "life_skill", label: "Life Skill" },
  { value: "field_trip", label: "Field Trip" },
  { value: "baseline", label: "Baseline Sprint" },
];

export default function SessionRunner() {
  const navigate = useNavigate();
  const { currentStudentId, bumpRefresh } = useUnschoolStore();
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [lifeTemplates, setLifeTemplates] = useState<LifeSkillTemplate[]>([]);
  const [recommendedActivities, setRecommendedActivities] = useState<string[]>([]);
  const [title, setTitle] = useState("Daily Block");
  const [type, setType] = useState("daily");
  const [duration, setDuration] = useState(20);
  const [endedEarly, setEndedEarly] = useState(false);
  const [fatigueNote, setFatigueNote] = useState("");
  const [tone, setTone] = useState<Session["emotionalTone"]>("neutral");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState({
    wins: "",
    misses: "",
    notes: "",
    nextMove: "",
  });
  const [selectedSkills, setSelectedSkills] = useState<
    Record<string, Evidence["rating"]>
  >({});
  const [lifeTemplateId, setLifeTemplateId] = useState("");
  const [lifeChecks, setLifeChecks] = useState<Record<string, boolean>>({});
  const [rubric, setRubric] = useState({ safety: 0, independence: 0, followThrough: 0 });

  useEffect(() => {
    skillRepo.list().then(setSkills);
    lifeSkillRepo.list().then(setLifeTemplates);
  }, []);

  useEffect(() => {
    if (!currentStudentId) return;
    if (type !== "daily") return;
    Promise.all([activityRepo.list(), sessionRepo.list(currentStudentId)]).then(
      ([templates, sessions]) => {
        const block = generateDailyBlock({
          studentId: currentStudentId,
          skills,
          activityTemplates: templates,
          recentSessions: sessions,
        });
        setRecommendedActivities(block.activities.map((activity) => activity.id));
      }
    );
  }, [type, currentStudentId, skills]);

  useEffect(() => {
    if (type === "life_skill" && lifeTemplates.length > 0) {
      setLifeTemplateId(lifeTemplates[0].id);
    }
  }, [type, lifeTemplates]);

  const lifeTemplate = lifeTemplates.find((t) => t.id === lifeTemplateId);

  const handleToggleCheck = (key: string) => {
    setLifeChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedEvidence = useMemo(() => {
    if (!currentStudentId) return [];
    return Object.entries(selectedSkills)
      .filter(([, rating]) => rating)
      .map(([skillId, rating]) => ({
        id: uuidv4(),
        sessionId: "pending",
        studentId: currentStudentId,
        skillId,
        rating,
        createdAt: new Date().toISOString(),
      }));
  }, [selectedSkills, currentStudentId]);

  const handleSave = async () => {
    if (!currentStudentId) return;
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    const session: Session = {
      id: sessionId,
      studentId: currentStudentId,
      title,
      type: type as Session["type"],
      startedAt: now,
      durationMinutesPlanned: duration,
      durationMinutesActual: endedEarly ? Math.max(5, duration - 5) : duration,
      endedEarly,
      fatiguePointNote: endedEarly ? fatigueNote : undefined,
      emotionalTone: tone,
      notes,
      activityIds:
        type === "daily"
          ? recommendedActivities
          : lifeTemplate
            ? [lifeTemplate.id]
            : undefined,
    };
    await sessionRepo.create(session);
    await proofRepo.create({
      id: uuidv4(),
      sessionId,
      wins: proof.wins,
      misses: proof.misses,
      notes: proof.notes,
      nextMove: proof.nextMove,
      createdAt: now,
    });

    const evidences = selectedEvidence.map((evidence) => ({
      ...evidence,
      sessionId,
    }));
    await evidenceRepo.createMany(evidences);

    for (const evidence of evidences) {
      const skill = await skillRepo.get(evidence.skillId);
      if (!skill) continue;
      const updated = applyEvidenceToSkill(skill, evidence, {
        endedEarly: session.endedEarly,
      });
      await skillRepo.update(updated);
    }

    const settings = await settingsRepo.get();
    if (settings.syncEnabled) {
      await sessionRepo.update({ ...session, syncStatus: "pending" });
      const payload = {
        title: `UNSCHOOL_OPS · ${session.title}`,
        summary: `Session ${session.type} for student ${session.studentId}`,
        source: "INOS",
        syncKey: session.id,
        type: "UNSCHOOL_SESSION",
        startedAt: session.startedAt,
        structured: {
          sessionId: session.id,
          sessionType: session.type,
          duration: session.durationMinutesActual,
          tone: session.emotionalTone,
          skillsUpdated: evidences.map((e) => ({
            skillId: e.skillId,
            rating: e.rating,
          })),
          teacherNotes: session.notes,
          lifeSkillRubric: lifeTemplate ? rubric : undefined,
        },
        notes: JSON.stringify(
          {
            app: "UNSCHOOL_OPS",
            childId: session.studentId,
            timestamp: session.startedAt,
            raw: `${session.title} · ${session.durationMinutesActual}m`,
            structured: {
              sessionId: session.id,
              sessionType: session.type,
              duration: session.durationMinutesActual,
              tone: session.emotionalTone,
              skillsUpdated: evidences.map((e) => ({
                skillId: e.skillId,
                rating: e.rating,
              })),
              teacherNotes: session.notes,
              lifeSkillRubric: lifeTemplate ? rubric : undefined,
            },
          },
          null,
          2
        ),
      };
      await enqueuePOLEEvent(payload);
      await processOutbox();
    }

    bumpRefresh();
    navigate("/unschool/sessions");
  };

  if (!currentStudentId) {
    return (
      <div className="ops-card">
        <h2>Select a student to start a session.</h2>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <div className="ops-card ops-stack">
        <div className="ops-eyebrow">Session Runner</div>
        <label>
          Session Type
          <select
            className="ops-select"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {SESSION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            className="ops-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Duration (15–30)
          <input
            className="ops-input"
            type="number"
            min={15}
            max={30}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
        </label>
        <Timer minutes={duration} />
        <label className="ops-toggle">
          <input
            type="checkbox"
            checked={endedEarly}
            onChange={(event) => setEndedEarly(event.target.checked)}
          />
          Stop early (frustration)
        </label>
        {endedEarly ? (
          <input
            className="ops-input"
            placeholder="Fatigue point note"
            value={fatigueNote}
            onChange={(event) => setFatigueNote(event.target.value)}
          />
        ) : null}
        <label>
          Emotional tone
          <select
            className="ops-select"
            value={tone}
            onChange={(event) => setTone(event.target.value as Session["emotionalTone"])}
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="frustrated">Frustrated</option>
            <option value="meltdown">Meltdown</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label>
          Notes
          <textarea
            className="ops-input"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        {type === "daily" && recommendedActivities.length > 0 ? (
          <div className="ops-muted">
            Recommended activities: {recommendedActivities.join(", ")}
          </div>
        ) : null}
      </div>

      {type === "life_skill" && lifeTemplate ? (
        <div className="ops-card ops-stack">
          <h3>Life Skill: {lifeTemplate.title}</h3>
          <label>
            Template
            <select
              className="ops-select"
              value={lifeTemplateId}
              onChange={(event) => setLifeTemplateId(event.target.value)}
            >
              {lifeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </label>
          <div className="ops-grid">
            {[
              { title: "Safety", items: lifeTemplate.safetyChecklist },
              { title: "Mise en place", items: lifeTemplate.miseChecklist },
              { title: "Steps", items: lifeTemplate.stepsChecklist },
              { title: "Cleanup", items: lifeTemplate.cleanupChecklist },
            ].map((section) => (
              <div key={section.title} className="ops-card ops-stack">
                <div className="ops-label">{section.title}</div>
                {section.items.map((item) => (
                  <label key={item} className="ops-toggle">
                    <input
                      type="checkbox"
                      checked={!!lifeChecks[item]}
                      onChange={() => handleToggleCheck(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="ops-form-grid">
            {(["safety", "independence", "followThrough"] as const).map((key) => (
              <label key={key}>
                {key}
                <input
                  className="ops-input"
                  type="number"
                  min={0}
                  max={3}
                  value={rubric[key]}
                  onChange={(event) =>
                    setRubric((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ops-card ops-stack">
        <h3>Skill Evidence</h3>
        <div className="ops-grid">
          {skills.map((skill) => (
            <label key={skill.id} className="ops-skill-pick">
              <span>{skill.label}</span>
              <select
                className="ops-select"
                value={selectedSkills[skill.id] || ""}
                onChange={(event) =>
                  setSelectedSkills((prev) => ({
                    ...prev,
                    [skill.id]: event.target.value as Evidence["rating"],
                  }))
                }
              >
                <option value="">—</option>
                <option value="independent">Independent</option>
                <option value="with_help">With help</option>
                <option value="not_yet">Not yet</option>
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="ops-card ops-stack">
        <h3>Proof Log (2 minutes)</h3>
        <label>
          Wins
          <textarea
            className="ops-input"
            rows={2}
            value={proof.wins}
            onChange={(event) =>
              setProof((prev) => ({ ...prev, wins: event.target.value }))
            }
          />
        </label>
        <label>
          Misses
          <textarea
            className="ops-input"
            rows={2}
            value={proof.misses}
            onChange={(event) =>
              setProof((prev) => ({ ...prev, misses: event.target.value }))
            }
          />
        </label>
        <label>
          Notes
          <textarea
            className="ops-input"
            rows={2}
            value={proof.notes}
            onChange={(event) =>
              setProof((prev) => ({ ...prev, notes: event.target.value }))
            }
          />
        </label>
        <label>
          Next Move
          <input
            className="ops-input"
            value={proof.nextMove}
            onChange={(event) =>
              setProof((prev) => ({ ...prev, nextMove: event.target.value }))
            }
          />
        </label>
        <button className="ops-btn" onClick={handleSave}>
          Save Session + Proof
        </button>
      </div>
    </div>
  );
}
