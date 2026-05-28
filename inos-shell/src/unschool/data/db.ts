import Dexie, { Table } from "dexie";
import type {
  ActivityTemplate,
  Evidence,
  LifeSkillTemplate,
  OutboxItem,
  ProofLog,
  Session,
  SkillNode,
  StudentProfile,
  SyncSettings,
} from "../domain/models";

export class UnschoolV2DB extends Dexie {
  students!: Table<StudentProfile, string>;
  sessions!: Table<Session, string>;
  proofLogs!: Table<ProofLog, string>;
  skills!: Table<SkillNode, string>;
  evidences!: Table<Evidence, string>;
  activityTemplates!: Table<ActivityTemplate, string>;
  lifeSkillTemplates!: Table<LifeSkillTemplate, string>;
  outbox!: Table<OutboxItem, string>;
  settings!: Table<SyncSettings, string>;

  constructor() {
    super("unschool_ops_v2");
    this.version(1).stores({
      students: "id, name, createdAt",
      sessions: "id, studentId, startedAt, type",
      proofLogs: "id, sessionId",
      skills: "id, domain, mastery, nextDueAt",
      evidences: "id, sessionId, studentId, skillId",
      activityTemplates: "id, domain",
      lifeSkillTemplates: "id, environment",
      outbox: "id, status, createdAt, clientEventId",
      settings: "id",
    });
  }
}

export const unschoolDb = new UnschoolV2DB();
