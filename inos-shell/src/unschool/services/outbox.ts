import { v4 as uuidv4 } from "uuid";
import type { OutboxItem } from "../domain/models";
import { appendPOLE, healthCheck } from "./mcpClient";
import { outboxRepo, settingsRepo, sessionRepo } from "../data/repositories";

export async function enqueuePOLEEvent(
  payload: Record<string, unknown>,
  type: OutboxItem["type"] = "session"
) {
  const clientEventId = uuidv4();
  return outboxRepo.enqueue({
    clientEventId,
    payload,
    status: "pending",
    type,
  });
}

export async function processOutbox() {
  const settings = await settingsRepo.get();
  if (!settings.syncEnabled) return { ok: false, reason: "Sync disabled" };
  const health = await healthCheck(settings);
  await settingsRepo.update({
    lastHealthCheck: new Date().toISOString(),
    lastHealthOk: health.ok,
  });
  if (!health.ok) return { ok: false, reason: health.reason };

  const pending = await outboxRepo.listPending();
  for (const item of pending) {
    const result = await appendPOLE(settings, item.payload as any);
    if (result.ok) {
      const sessionId = (item.payload as any)?.structured?.sessionId;
      if (sessionId) {
        const sessions = await sessionRepo.list();
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          await sessionRepo.update({
            ...session,
            POLEId: (result.data as any)?.id,
            syncStatus: "sent",
          });
        }
      }
      await outboxRepo.update({
        ...item,
        status: "sent",
        POLEId: (result.data as any)?.id,
      });
    } else {
      const sessionId = (item.payload as any)?.structured?.sessionId;
      if (sessionId) {
        const sessions = await sessionRepo.list();
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          await sessionRepo.update({
            ...session,
            syncStatus: "error",
          });
        }
      }
      await outboxRepo.update({
        ...item,
        status: "error",
        attempts: item.attempts + 1,
        lastError: result.reason,
      });
    }
  }
  return { ok: true };
}

export async function retryOutboxErrors() {
  const errors = await outboxRepo.listErrors();
  for (const item of errors) {
    await outboxRepo.update({ ...item, status: "pending" });
  }
  return processOutbox();
}
