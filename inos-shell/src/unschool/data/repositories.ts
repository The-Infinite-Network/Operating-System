import { v4 as uuidv4 } from "uuid";
import { unschoolDb } from "./db";
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

export const settingsRepo = {
  async get() {
    const existing = await unschoolDb.settings.get("settings");
    if (existing) return existing;
    const defaults: SyncSettings = {
      id: "settings",
      mcpBaseUrl: "/mcp",
      syncEnabled: false,
    };
    await unschoolDb.settings.put(defaults);
    return defaults;
  },
  async update(partial: Partial<SyncSettings>) {
    const current = await settingsRepo.get();
    const next = { ...current, ...partial };
    await unschoolDb.settings.put(next);
    return next;
  },
};

export const studentRepo = {
  async list() {
    return unschoolDb.students.orderBy("createdAt").toArray();
  },
  async create(data: Omit<StudentProfile, "id" | "createdAt">) {
    const student: StudentProfile = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    await unschoolDb.students.put(student);
    return student;
  },
  async update(student: StudentProfile) {
    await unschoolDb.students.put(student);
    return student;
  },
};

export const skillRepo = {
  async list() {
    return unschoolDb.skills.toArray();
  },
  async bulkUpsert(skills: SkillNode[]) {
    await unschoolDb.skills.bulkPut(skills);
  },
  async update(skill: SkillNode) {
    await unschoolDb.skills.put(skill);
  },
  async get(skillId: string) {
    return unschoolDb.skills.get(skillId);
  },
  async byDomain(domain: string) {
    return unschoolDb.skills.where({ domain }).toArray();
  },
};

export const sessionRepo = {
  async list(studentId?: string) {
    if (studentId) {
      const rows = await unschoolDb.sessions
        .where("studentId")
        .equals(studentId)
        .sortBy("startedAt");
      return rows.reverse();
    }
    return unschoolDb.sessions.orderBy("startedAt").reverse().toArray();
  },
  async create(session: Session) {
    await unschoolDb.sessions.put(session);
    return session;
  },
  async update(session: Session) {
    await unschoolDb.sessions.put(session);
    return session;
  },
};

export const proofRepo = {
  async create(log: ProofLog) {
    await unschoolDb.proofLogs.put(log);
    return log;
  },
  async bySession(sessionId: string) {
    return unschoolDb.proofLogs.where({ sessionId }).first();
  },
};

export const evidenceRepo = {
  async createMany(evidences: Evidence[]) {
    await unschoolDb.evidences.bulkPut(evidences);
  },
  async listByStudent(studentId: string) {
    return unschoolDb.evidences.where({ studentId }).toArray();
  },
};

export const activityRepo = {
  async list() {
    return unschoolDb.activityTemplates.toArray();
  },
  async upsertMany(templates: ActivityTemplate[]) {
    await unschoolDb.activityTemplates.bulkPut(templates);
  },
};

export const lifeSkillRepo = {
  async list() {
    return unschoolDb.lifeSkillTemplates.toArray();
  },
  async upsertMany(templates: LifeSkillTemplate[]) {
    await unschoolDb.lifeSkillTemplates.bulkPut(templates);
  },
};

export const outboxRepo = {
  async enqueue(item: Omit<OutboxItem, "id" | "createdAt" | "attempts">) {
    const record: OutboxItem = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      attempts: 0,
      ...item,
    };
    await unschoolDb.outbox.put(record);
    return record;
  },
  async listPending() {
    return unschoolDb.outbox.where("status").equals("pending").toArray();
  },
  async listErrors() {
    return unschoolDb.outbox.where("status").equals("error").toArray();
  },
  async update(item: OutboxItem) {
    await unschoolDb.outbox.put(item);
  },
  async countPending() {
    return unschoolDb.outbox.where("status").equals("pending").count();
  },
};
