import { addDays, isBefore } from "date-fns";
import type {
  ActivityTemplate,
  DailyBlock,
  Session,
  SkillNode,
} from "./models";

export function selectDueOrWeakSkills(
  skills: SkillNode[],
  domain: string
) {
  const now = new Date();
  const inDomain = skills.filter((skill) => skill.domain === domain);
  const due = inDomain.filter(
    (skill) => !skill.nextDueAt || isBefore(new Date(skill.nextDueAt), now)
  );
  if (due.length > 0) {
    return due.sort((a, b) => a.mastery - b.mastery).slice(0, 2);
  }
  return inDomain.sort((a, b) => a.mastery - b.mastery).slice(0, 2);
}

export function generateDailyBlock(params: {
  studentId: string;
  skills: SkillNode[];
  activityTemplates: ActivityTemplate[];
  recentSessions: Session[];
}) {
  const { studentId, skills, activityTemplates, recentSessions } = params;
  const lastSession = recentSessions[0];
  const avoidActivityIds = lastSession?.activityIds || [];
  const frustrated =
    lastSession?.emotionalTone === "frustrated" ||
    lastSession?.emotionalTone === "meltdown";

  const literacySkills = selectDueOrWeakSkills(skills, "Literacy");
  const mathSkills = selectDueOrWeakSkills(skills, "Math");
  const lifeSkills = selectDueOrWeakSkills(skills, "Life Skills");

  const pickActivity = (domain: string, fallbackSkillIds: string[]) => {
    const options = activityTemplates.filter(
      (template) =>
        template.domain === domain &&
        !avoidActivityIds.includes(template.id)
    );
    return (
      options.find((opt) =>
        opt.skillIds.some((skillId) => fallbackSkillIds.includes(skillId))
      ) || options[0]
    );
  };

  const literacyActivity = pickActivity(
    "Literacy",
    literacySkills.map((skill) => skill.id)
  );
  const mathActivity = pickActivity("Math", mathSkills.map((skill) => skill.id));
  const lifeActivity = pickActivity(
    "Life Skills",
    lifeSkills.map((skill) => skill.id)
  );

  const activities = [literacyActivity, mathActivity].filter(
    (activity): activity is ActivityTemplate => !!activity
  );
  if (lifeActivity) activities.push(lifeActivity);

  const warmWin = frustrated
    ? "Warm win: repeat an easy favorite for 60 seconds."
    : "Warm win: 60-second easy success (high-five).";

  const totalMinutes = activities.reduce(
    (sum, activity) => sum + activity.durationMin,
    0
  );

  const block: DailyBlock = {
    id: `${studentId}-${new Date().toISOString()}`,
    studentId,
    dateISO: new Date().toISOString(),
    totalMinutes: Math.min(30, Math.max(15, totalMinutes)),
    activities,
    warmWin,
  };

  return block;
}

export function buildNextDueAt(level: number) {
  const offsets = [1, 2, 4, 7, 14, 30];
  const days = offsets[level] ?? 1;
  return addDays(new Date(), days).toISOString();
}
