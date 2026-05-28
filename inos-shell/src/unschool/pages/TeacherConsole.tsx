import { useEffect, useState } from "react";
import CommandPalette from "../ui/CommandPalette";
import { activityRepo, evidenceRepo, lifeSkillRepo, proofRepo, sessionRepo, skillRepo } from "../data/repositories";
import type { ActivityTemplate, Evidence, LifeSkillTemplate, Session } from "../domain/models";
import { applyEvidenceToSkill } from "../domain/mastery";
import { parseCommand } from "../domain/commands";
import { v4 as uuidv4 } from "uuid";
import { useUnschoolStore } from "../store";

export default function TeacherConsole() {
  const { currentStudentId, bumpRefresh } = useUnschoolStore();
  const [activities, setActivities] = useState<ActivityTemplate[]>([]);
  const [lifeSkills, setLifeSkills] = useState<LifeSkillTemplate[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    activityRepo.list().then(setActivities);
    lifeSkillRepo.list().then(setLifeSkills);
  }, []);

  const handleCommit = async (command: ReturnType<typeof parseCommand>) => {
    if (!command || !currentStudentId) return;
    if (command.type === "start") {
      const session: Session = {
        id: uuidv4(),
        studentId: currentStudentId,
        title: command.title || `Session ${command.sessionType}`,
        type: command.sessionType as Session["type"],
        startedAt: new Date().toISOString(),
        durationMinutesPlanned: command.duration,
        durationMinutesActual: command.duration,
        endedEarly: false,
        emotionalTone: "neutral",
      };
      await sessionRepo.create(session);
      setStatus(`Session created: ${session.title}`);
      bumpRefresh();
    }
    if (command.type === "assign_quest") {
      setStatus(`Quest assigned: ${command.title}`);
    }
    if (command.type === "skill_bump") {
      const skill = await skillRepo.get(command.skillId);
      if (!skill) {
        setStatus(`Skill not found: ${command.skillId}`);
        return;
      }
      const rating: Evidence["rating"] = command.delta >= 1 ? "independent" : "not_yet";
      const evidence: Evidence = {
        id: uuidv4(),
        sessionId: "command",
        studentId: currentStudentId,
        skillId: command.skillId,
        rating,
        note: command.reason,
        createdAt: new Date().toISOString(),
      };
      await evidenceRepo.createMany([evidence]);
      const updated = applyEvidenceToSkill(skill, evidence, { endedEarly: false });
      await skillRepo.update(updated);
      setStatus(`Skill bumped: ${command.skillId} (${rating})`);
    }
    if (command.type === "log") {
      const sessions = await sessionRepo.list(currentStudentId);
      const latest = sessions[0];
      if (!latest) {
        setStatus("No session available to log.");
        return;
      }
      await proofRepo.create({
        id: uuidv4(),
        sessionId: latest.id,
        wins: command.wins || "",
        misses: command.misses || "",
        notes: command.note || "",
        nextMove: "",
        createdAt: new Date().toISOString(),
      });
      setStatus(`Proof log saved for ${latest.title}`);
    }
  };

  return (
    <div className="ops-page">
      <CommandPalette onCommit={handleCommit} />
      {status ? <div className="ops-card">{status}</div> : null}
      <div className="ops-grid">
        <div className="ops-card">
          <h3>Activity Templates</h3>
          <ul className="ops-list-plain">
            {activities.map((activity) => (
              <li key={activity.id}>{activity.title}</li>
            ))}
          </ul>
        </div>
        <div className="ops-card">
          <h3>Life Skill Templates</h3>
          <ul className="ops-list-plain">
            {lifeSkills.map((skill) => (
              <li key={skill.id}>{skill.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
