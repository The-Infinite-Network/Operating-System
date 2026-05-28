import Dexie, { Table } from "dexie";
import {
  BaselineDay1LiteracyResult,
  BaselineDay2MathResult,
  BaselineDay3ReadinessResult,
  ChildProfile,
  FocusPlan,
  ProofLog,
  ScoringPreference,
  Session,
} from "./types";

class UnschoolDB extends Dexie {
  children!: Table<ChildProfile, string>;
  sessions!: Table<Session, string>;
  proofLogs!: Table<ProofLog, string>;
  baselineDay1!: Table<BaselineDay1LiteracyResult, string>;
  baselineDay2!: Table<BaselineDay2MathResult, string>;
  baselineDay3!: Table<BaselineDay3ReadinessResult, string>;
  focusPlans!: Table<FocusPlan, string>;
  preferences!: Table<ScoringPreference, string>;

  constructor() {
    super("unschool_ops_v1");
    this.version(1).stores({
      children: "id, name, createdAt",
      sessions: "id, childId, date, type",
      proofLogs: "id, sessionId",
      baselineDay1: "sessionId, childId, createdAt",
      baselineDay2: "sessionId, childId, createdAt",
      baselineDay3: "sessionId, childId, createdAt",
      focusPlans: "[childId+weekStartISO], childId, createdAt",
      preferences: "key",
    });
  }
}

const db = new UnschoolDB();

export const storage = {
  db,
  async addChild(profile: ChildProfile) {
    await db.children.put(profile);
  },
  async updateChild(profile: ChildProfile) {
    await db.children.put(profile);
  },
  async deleteChild(childId: string) {
    const sessions = await db.sessions.where({ childId }).toArray();
    const sessionIds = sessions.map((s) => s.id);
    await db.children.delete(childId);
    await db.sessions.bulkDelete(sessionIds);
    await db.proofLogs.where("sessionId").anyOf(sessionIds).delete();
    await db.baselineDay1.where("childId").equals(childId).delete();
    await db.baselineDay2.where("childId").equals(childId).delete();
    await db.baselineDay3.where("childId").equals(childId).delete();
    await db.focusPlans.where("childId").equals(childId).delete();
  },
  async listChildren() {
    return db.children.orderBy("createdAt").toArray();
  },
  async createSession(session: Session) {
    await db.sessions.put(session);
  },
  async updateSession(session: Session) {
    await db.sessions.put(session);
  },
  async listSessions(childId: string) {
    const rows = await db.sessions.where("childId").equals(childId).sortBy("date");
    return rows.reverse();
  },
  async getSession(sessionId: string) {
    return db.sessions.get(sessionId);
  },
  async getLastSession(childId: string) {
    const sessions = await db.sessions.where("childId").equals(childId).sortBy("date");
    return sessions[sessions.length - 1] || null;
  },
  async addProofLog(log: ProofLog) {
    await db.proofLogs.put(log);
  },
  async getProofLogBySession(sessionId: string) {
    return db.proofLogs.where({ sessionId }).first();
  },
  async saveBaselineDay1(result: BaselineDay1LiteracyResult) {
    await db.baselineDay1.put(result);
  },
  async saveBaselineDay2(result: BaselineDay2MathResult) {
    await db.baselineDay2.put(result);
  },
  async saveBaselineDay3(result: BaselineDay3ReadinessResult) {
    await db.baselineDay3.put(result);
  },
  async getLatestBaselineDay1(childId: string) {
    return db.baselineDay1
      .where({ childId })
      .sortBy("createdAt")
      .then((rows) => rows[rows.length - 1]);
  },
  async getLatestBaselineDay2(childId: string) {
    return db.baselineDay2
      .where({ childId })
      .sortBy("createdAt")
      .then((rows) => rows[rows.length - 1]);
  },
  async getLatestBaselineDay3(childId: string) {
    return db.baselineDay3
      .where({ childId })
      .sortBy("createdAt")
      .then((rows) => rows[rows.length - 1]);
  },
  async listBaselineDay1(childId: string) {
    return db.baselineDay1.where({ childId }).reverse().sortBy("createdAt");
  },
  async listBaselineDay2(childId: string) {
    return db.baselineDay2.where({ childId }).reverse().sortBy("createdAt");
  },
  async listBaselineDay3(childId: string) {
    return db.baselineDay3.where({ childId }).reverse().sortBy("createdAt");
  },
  async saveFocusPlan(plan: FocusPlan) {
    await db.focusPlans.put(plan);
  },
  async getLatestFocusPlan(childId: string) {
    return db.focusPlans
      .where({ childId })
      .sortBy("createdAt")
      .then((rows) => rows[rows.length - 1]);
  },
  async savePreference(pref: ScoringPreference) {
    await db.preferences.put(pref);
  },
  async listPreferences() {
    return db.preferences.toArray();
  },
  async exportAll() {
    const [
      children,
      sessions,
      proofLogs,
      baselineDay1,
      baselineDay2,
      baselineDay3,
      focusPlans,
      preferences,
    ] = await Promise.all([
      db.children.toArray(),
      db.sessions.toArray(),
      db.proofLogs.toArray(),
      db.baselineDay1.toArray(),
      db.baselineDay2.toArray(),
      db.baselineDay3.toArray(),
      db.focusPlans.toArray(),
      db.preferences.toArray(),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      children,
      sessions,
      proofLogs,
      baselineDay1,
      baselineDay2,
      baselineDay3,
      focusPlans,
      preferences,
    };
  },
  async importAll(payload: {
    children: ChildProfile[];
    sessions: Session[];
    proofLogs: ProofLog[];
    baselineDay1: BaselineDay1LiteracyResult[];
    baselineDay2: BaselineDay2MathResult[];
    baselineDay3: BaselineDay3ReadinessResult[];
    focusPlans: FocusPlan[];
    preferences: ScoringPreference[];
  }) {
    await db.transaction(
      "rw",
      [
        db.children,
        db.sessions,
        db.proofLogs,
        db.baselineDay1,
        db.baselineDay2,
        db.baselineDay3,
        db.focusPlans,
        db.preferences,
      ],
      async () => {
        await db.children.clear();
        await db.sessions.clear();
        await db.proofLogs.clear();
        await db.baselineDay1.clear();
        await db.baselineDay2.clear();
        await db.baselineDay3.clear();
        await db.focusPlans.clear();
        await db.preferences.clear();

        await db.children.bulkPut(payload.children || []);
        await db.sessions.bulkPut(payload.sessions || []);
        await db.proofLogs.bulkPut(payload.proofLogs || []);
        await db.baselineDay1.bulkPut(payload.baselineDay1 || []);
        await db.baselineDay2.bulkPut(payload.baselineDay2 || []);
        await db.baselineDay3.bulkPut(payload.baselineDay3 || []);
        await db.focusPlans.bulkPut(payload.focusPlans || []);
        await db.preferences.bulkPut(payload.preferences || []);
      }
    );
  },
  async resetAll() {
    await db.delete();
  },
};
