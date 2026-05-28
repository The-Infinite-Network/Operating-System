export type SessionType =
  | "daily"
  | "skill_build"
  | "life_skill"
  | "field_trip"
  | "baseline"
  | "weekly_review";

export type EmotionalTone =
  | "positive"
  | "neutral"
  | "frustrated"
  | "meltdown"
  | "unknown";

export interface StudentProfile {
  id: string;
  name: string;
  ageYears?: number;
  dob?: string;
  notes?: string;
  constraints?: string;
  createdAt: string;
}

export interface SkillNode {
  id: string;
  domain: string;
  label: string;
  level: number;
  mastery: number;
  evidenceCount: number;
  lastPracticedAt?: string;
  nextDueAt?: string;
  notes?: string;
}

export interface Evidence {
  id: string;
  sessionId: string;
  studentId: string;
  skillId: string;
  rating: "independent" | "with_help" | "not_yet";
  note?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  studentId: string;
  title: string;
  type: SessionType;
  startedAt: string;
  endedAt?: string;
  durationMinutesPlanned: number;
  durationMinutesActual: number;
  endedEarly: boolean;
  fatiguePointNote?: string;
  emotionalTone: EmotionalTone;
  notes?: string;
  activityIds?: string[];
  POLEId?: string;
  syncStatus?: "pending" | "sent" | "error";
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

export interface ActivityTemplate {
  id: string;
  domain: string;
  skillIds: string[];
  title: string;
  durationMin: number;
  materials: string[];
  steps: string[];
  scoringType: "markSet" | "numericCount" | "checklist" | "rubric";
  variants?: { easy?: string; hard?: string };
  safetyFlags?: string[];
}

export interface LifeSkillTemplate {
  id: string;
  title: string;
  environment: "kitchen" | "store" | "bedroom" | "outside";
  safetyChecklist: string[];
  miseChecklist: string[];
  stepsChecklist: string[];
  cleanupChecklist: string[];
  rubric: { safety: number; independence: number; followThrough: number };
  skillIds: string[];
}

export interface OutboxItem {
  id: string;
  clientEventId: string;
  type: "session" | "weekly_summary" | "proof_log";
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "error";
  attempts: number;
  lastError?: string;
  POLEId?: string;
  createdAt: string;
}

export interface SyncSettings {
  id: string;
  mcpBaseUrl: string;
  syncEnabled: boolean;
  lastHealthCheck?: string;
  lastHealthOk?: boolean;
}

export interface DailyBlock {
  id: string;
  studentId: string;
  dateISO: string;
  totalMinutes: number;
  activities: ActivityTemplate[];
  warmWin: string;
}
