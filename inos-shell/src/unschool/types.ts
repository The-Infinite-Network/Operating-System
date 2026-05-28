export type SessionType =
  | "baseline"
  | "daily"
  | "skill_reading"
  | "skill_math"
  | "field_trip"
  | "weekly_review";

export type EmotionalTone =
  | "positive"
  | "neutral"
  | "frustrated"
  | "meltdown"
  | "unknown";

export interface ChildProfile {
  id: string;
  name: string;
  dob?: string;
  ageYears?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  childId: string;
  date: string;
  type: SessionType;
  durationMinutesPlanned: number;
  durationMinutesActual: number;
  endedEarly: boolean;
  fatiguePointNote?: string;
  emotionalTone: EmotionalTone;
  notes?: string;
  baselineDay?: 1 | 2 | 3;
}

export interface ProofLog {
  id: string;
  sessionId: string;
  wins: string;
  misses: string;
  notes: string;
  nextMove: string;
  whatWasEasy?: string;
  whatWasHard?: string;
  createdAt: string;
}

export interface WordMark {
  word: string;
  mark: "R" | "S" | "H" | "N";
}

export interface EncodingMark {
  word: string;
  mark: "C" | "H" | "N";
  errorPattern?: string;
}

export interface AddSubMark {
  expr: string;
  mark: "M" | "O" | "N";
}

export interface BaselineDay1LiteracyResult {
  sessionId: string;
  childId: string;
  letterNamesCorrect: number;
  letterSoundsCorrect: number;
  wordReadEasy: WordMark[];
  wordReadHard: WordMark[];
  encoding: EncodingMark[];
  comprehensionCorrect: number;
  confusionNotes: string;
  createdAt: string;
}

export interface BaselineDay2MathResult {
  sessionId: string;
  childId: string;
  numberIdCorrect: number;
  numberIdMisses: number[];
  maxStableCount: number;
  oneToOne: "C" | "H" | "N";
  addSub: AddSubMark[];
  patternsCorrect: number;
  notes: string;
  createdAt: string;
}

export interface BaselineDay3ReadinessResult {
  sessionId: string;
  childId: string;
  stamina5: boolean;
  stamina10: boolean;
  fineMotorName: "C" | "H" | "N";
  shapesCorrect: number;
  drawPersonScore: number;
  directions1step: number;
  directions2step: number;
  directions3step: number;
  notes: string;
  createdAt: string;
}

export interface FocusPlan {
  childId: string;
  weekStartISO: string;
  readingFocus: string;
  mathFocus: string;
  readinessConstraint?: string;
  createdAt: string;
}

export interface DailyActivity {
  id: string;
  label: string;
  durationMinutes: number;
  domain: "reading" | "math" | "readiness";
  notes?: string;
}

export interface DailyPlan {
  childId: string;
  dateISO: string;
  totalMinutes: number;
  activities: DailyActivity[];
}

export interface ScoringPreference {
  key: string;
  value: string;
}
