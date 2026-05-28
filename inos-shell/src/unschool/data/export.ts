import { unschoolDb } from "./db";

export async function exportAll(redactNames: boolean) {
  const [
    students,
    sessions,
    proofLogs,
    skills,
    evidences,
    activityTemplates,
    lifeSkillTemplates,
    outbox,
    settings,
  ] = await Promise.all([
    unschoolDb.students.toArray(),
    unschoolDb.sessions.toArray(),
    unschoolDb.proofLogs.toArray(),
    unschoolDb.skills.toArray(),
    unschoolDb.evidences.toArray(),
    unschoolDb.activityTemplates.toArray(),
    unschoolDb.lifeSkillTemplates.toArray(),
    unschoolDb.outbox.toArray(),
    unschoolDb.settings.toArray(),
  ]);

  const safeStudents = redactNames
    ? students.map((s) => ({ ...s, name: "REDACTED" }))
    : students;

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    students: safeStudents,
    sessions,
    proofLogs,
    skills,
    evidences,
    activityTemplates,
    lifeSkillTemplates,
    outbox,
    settings,
  };
}

export async function importAll(payload: any) {
  await unschoolDb.transaction(
    "rw",
    [
      unschoolDb.students,
      unschoolDb.sessions,
      unschoolDb.proofLogs,
      unschoolDb.skills,
      unschoolDb.evidences,
      unschoolDb.activityTemplates,
      unschoolDb.lifeSkillTemplates,
      unschoolDb.outbox,
      unschoolDb.settings,
    ],
    async () => {
      await Promise.all([
        unschoolDb.students.clear(),
        unschoolDb.sessions.clear(),
        unschoolDb.proofLogs.clear(),
        unschoolDb.skills.clear(),
        unschoolDb.evidences.clear(),
        unschoolDb.activityTemplates.clear(),
        unschoolDb.lifeSkillTemplates.clear(),
        unschoolDb.outbox.clear(),
        unschoolDb.settings.clear(),
      ]);

      await unschoolDb.students.bulkPut(payload.students || []);
      await unschoolDb.sessions.bulkPut(payload.sessions || []);
      await unschoolDb.proofLogs.bulkPut(payload.proofLogs || []);
      await unschoolDb.skills.bulkPut(payload.skills || []);
      await unschoolDb.evidences.bulkPut(payload.evidences || []);
      await unschoolDb.activityTemplates.bulkPut(payload.activityTemplates || []);
      await unschoolDb.lifeSkillTemplates.bulkPut(payload.lifeSkillTemplates || []);
      await unschoolDb.outbox.bulkPut(payload.outbox || []);
      await unschoolDb.settings.bulkPut(payload.settings || []);
    }
  );
}
