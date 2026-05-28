import type { Evidence, SkillNode } from "./models";

const LEVEL_THRESHOLDS = [
  { level: 0, min: 0, max: 19 },
  { level: 1, min: 20, max: 39 },
  { level: 2, min: 40, max: 59 },
  { level: 3, min: 60, max: 79 },
  { level: 4, min: 80, max: 94 },
  { level: 5, min: 95, max: 100 },
];

const LEVEL_SPACING_DAYS: Record<number, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 7,
  4: 14,
  5: 30,
};

export function computeLevel(mastery: number) {
  const level =
    LEVEL_THRESHOLDS.find((entry) => mastery >= entry.min && mastery <= entry.max)
      ?.level ?? 0;
  return level;
}

export function nextDueAtForLevel(level: number, now = new Date()) {
  const days = LEVEL_SPACING_DAYS[level] ?? 1;
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function applyEvidenceToSkill(
  skill: SkillNode,
  evidence: Evidence,
  options?: { endedEarly?: boolean }
) {
  const rawDelta =
    evidence.rating === "independent"
      ? 8
      : evidence.rating === "with_help"
        ? 4
        : -2;
  const delta =
    options?.endedEarly && rawDelta < 0 ? 0 : rawDelta;

  const nextMastery = Math.max(0, Math.min(100, skill.mastery + delta));
  const nextLevel = computeLevel(nextMastery);
  const nextDueAt = options?.endedEarly
    ? nextDueAtForLevel(0, new Date())
    : nextDueAtForLevel(nextLevel, new Date());

  return {
    ...skill,
    mastery: nextMastery,
    level: nextLevel,
    evidenceCount: skill.evidenceCount + 1,
    lastPracticedAt: evidence.createdAt,
    nextDueAt,
  };
}
