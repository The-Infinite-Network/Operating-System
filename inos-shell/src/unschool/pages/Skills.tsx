import { useEffect, useState } from "react";
import { skillRepo } from "../data/repositories";
import type { SkillNode } from "../domain/models";

export default function Skills() {
  const [skills, setSkills] = useState<SkillNode[]>([]);

  useEffect(() => {
    skillRepo.list().then(setSkills);
  }, []);

  const grouped = skills.reduce<Record<string, SkillNode[]>>((acc, skill) => {
    if (!acc[skill.domain]) acc[skill.domain] = [];
    acc[skill.domain].push(skill);
    return acc;
  }, {});

  return (
    <div className="ops-page">
      {Object.entries(grouped).map(([domain, domainSkills]) => (
        <div key={domain} className="ops-card ops-stack">
          <h2>{domain}</h2>
          <div className="ops-grid">
            {domainSkills.map((skill) => (
              <div key={skill.id} className="ops-skill-card">
                <div className="ops-label">{skill.label}</div>
                <div className="ops-metric">L{skill.level}</div>
                <div className="ops-muted">Mastery: {skill.mastery}%</div>
                <div className="ops-muted">
                  Next due: {skill.nextDueAt ? skill.nextDueAt.slice(0, 10) : "now"}
                </div>
                <div className="ops-muted">Evidence: {skill.evidenceCount}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
