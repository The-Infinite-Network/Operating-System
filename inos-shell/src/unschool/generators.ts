import { addDays, formatISO, startOfWeek } from "date-fns";
import {
  BaselineDay1LiteracyResult,
  BaselineDay2MathResult,
  BaselineDay3ReadinessResult,
  DailyPlan,
  FocusPlan,
  Session,
} from "./types";
import { READING_DRILLS, MATH_DRILLS, READINESS_DRILLS } from "./data/drills";

export function pickReadingTrack(day1?: BaselineDay1LiteracyResult) {
  if (!day1) {
    return {
      label: "Warm start: letter sounds + quick reads",
      drills: [READING_DRILLS[0], READING_DRILLS[2]],
    };
  }

  const easyNs = day1.wordReadEasy.filter((w) => w.mark === "N").length;
  const hardNs = day1.wordReadHard.filter((w) => w.mark === "N").length;
  const encodingCorrect = day1.encoding.filter((w) => w.mark === "C").length;

  if (day1.letterSoundsCorrect < 6 || easyNs >= 2) {
    return {
      label: "Phonemic awareness + CVC blends",
      drills: [READING_DRILLS[0], READING_DRILLS[1], READING_DRILLS[6]],
    };
  }

  if (hardNs >= 3) {
    return {
      label: "Blends & digraphs + fluency reps",
      drills: [READING_DRILLS[3], READING_DRILLS[4], READING_DRILLS[2]],
    };
  }

  if (encodingCorrect < 3) {
    return {
      label: "Encoding focus + quick reads",
      drills: [READING_DRILLS[6], READING_DRILLS[2]],
    };
  }

  return {
    label: "Fluency & comprehension",
    drills: [READING_DRILLS[4], READING_DRILLS[2]],
  };
}

export function pickMathTrack(day2?: BaselineDay2MathResult) {
  if (!day2) {
    return {
      label: "Number sense + counting on",
      drills: [MATH_DRILLS[0], MATH_DRILLS[3]],
    };
  }

  const mentalCount = day2.addSub.filter((m) => m.mark === "M").length;
  const objectCount = day2.addSub.filter((m) => m.mark === "O").length;

  if (day2.numberIdCorrect < 16 || day2.maxStableCount < 20) {
    return {
      label: "Number sense + teens + one-to-one",
      drills: [MATH_DRILLS[0], MATH_DRILLS[1], MATH_DRILLS[2]],
    };
  }

  if (mentalCount < 4 && objectCount >= 6) {
    return {
      label: "Counting-on strategies + fact families",
      drills: [MATH_DRILLS[3], MATH_DRILLS[4]],
    };
  }

  return {
    label: "2-digit + place value",
    drills: [MATH_DRILLS[5], MATH_DRILLS[6]],
  };
}

export function generateDailyPlan(options: {
  childId: string;
  baselineDay1?: BaselineDay1LiteracyResult;
  baselineDay2?: BaselineDay2MathResult;
  baselineDay3?: BaselineDay3ReadinessResult;
  recentSessions: Session[];
}): DailyPlan {
  const { childId, baselineDay1, baselineDay2, baselineDay3, recentSessions } =
    options;
  const readingTrack = pickReadingTrack(baselineDay1);
  const mathTrack = pickMathTrack(baselineDay2);
  const includeReadiness =
    baselineDay3 && (!baselineDay3.stamina10 || baselineDay3.directions3step < 3);

  const fatigueSessions = recentSessions.filter((s) => s.endedEarly).length;
  const baseMinutes = fatigueSessions >= 2 ? 15 : 25;

  const activities: DailyPlan["activities"] = [
    {
      id: "reading",
      label: `Reading: ${readingTrack.label}`,
      durationMinutes: 11,
      domain: "reading" as const,
      notes: readingTrack.drills.slice(0, 2).join(" · "),
    },
    {
      id: "math",
      label: `Math: ${mathTrack.label}`,
      durationMinutes: 11,
      domain: "math" as const,
      notes: mathTrack.drills.slice(0, 2).join(" · "),
    },
  ];

  if (includeReadiness && baseMinutes >= 20) {
    activities.push({
      id: "readiness",
      label: "Readiness: fine motor + direction game",
      durationMinutes: 5,
      domain: "readiness",
      notes: READINESS_DRILLS[0],
    });
  }

  const totalMinutes = activities.reduce((sum, act) => sum + act.durationMinutes, 0);
  return {
    childId,
    dateISO: new Date().toISOString(),
    totalMinutes,
    activities,
  };
}

export function generateWeeklyFocusPlan(options: {
  childId: string;
  baselineDay1?: BaselineDay1LiteracyResult;
  baselineDay2?: BaselineDay2MathResult;
  baselineDay3?: BaselineDay3ReadinessResult;
  recentSessions: Session[];
}): FocusPlan {
  const { childId, baselineDay1, baselineDay2, baselineDay3, recentSessions } =
    options;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const readingTrack = pickReadingTrack(baselineDay1);
  const mathTrack = pickMathTrack(baselineDay2);
  const endedEarly = recentSessions.some((s) => s.endedEarly);

  const readinessConstraint =
    baselineDay3 && (!baselineDay3.stamina10 || baselineDay3.directions3step < 3)
      ? "Keep sessions under 20 min; add movement breaks."
      : endedEarly
        ? "Watch for fatigue; end early when frustration spikes."
        : undefined;

  return {
    childId,
    weekStartISO: formatISO(weekStart, { representation: "date" }),
    readingFocus: readingTrack.label,
    mathFocus: mathTrack.label,
    readinessConstraint,
    createdAt: new Date().toISOString(),
  };
}

export function getRecentSessions(allSessions: Session[], days = 7) {
  const cutoff = addDays(new Date(), -days).toISOString();
  return allSessions.filter((s) => s.date >= cutoff);
}
