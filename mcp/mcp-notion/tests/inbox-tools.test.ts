import { describe, it, expect, vi } from "vitest";
import { Tools } from "../src/tools";

const makeTools = () => {
  const tools = new Tools();
  const mock = {
    createInboxEntry: vi.fn(async (payload: any) => ({ id: "inbox-1", payload })),
    updateInboxEntry: vi.fn(async () => ({ id: "inbox-1" })),
    listInboxEntries: vi.fn(async () => ({ items: [], next_cursor: null, has_more: false })),
    getInboxEntry: vi.fn(async () => ({
      id: "inbox-1",
      routing_status: "new",
      lane: "intent",
      layer: "L1",
      domain: "general",
      object_type: "task",
      owner_pod: "ARC",
      destination_db: "TASKS",
      routing_key: "intent:L1:task:TASKS",
      target_notion_id: null,
      target_url: null,
      move_log: "",
      last_move_request_id: null,
    })),
    routeInboxEntry: vi.fn(async () => ({ target_notion_id: "dest-1", target_url: "http://notion" })),
    verifyInboxEntry: vi.fn(async () => ({ ok: true })),
  };
  (tools as any).client = mock;
  return { tools, mock };
};

describe("inbox tools", () => {
  it("create sets new status and move_log", async () => {
    const { tools, mock } = makeTools();
    const res = await (tools as any)["inbox.create"]({
      request_id: "req-1",
      actor: "ARC",
      item: "Test",
      source_type: "Url",
      summary: "hello",
      sensitivity: "internal",
      coerce: true,
    });
    expect(res.ok).toBe(true);
    expect(mock.createInboxEntry).toHaveBeenCalled();
    const payload = mock.createInboxEntry.mock.calls[0][0];
    expect(payload.routing_status_code).toBe("new");
    expect(payload.captured_by).toBe("ARC");
    expect(payload.move_log).toMatch(/actor=ARC/);
    expect(payload.last_move_request_id).toBe("req-1");
    expect(payload.source_type).toBe("Url");
    expect(payload.source_type_code).toBe("url");
    expect(payload.summary).toBe("hello");
  });

  it("triage computes routing_key and sets triaged", async () => {
    const { tools, mock } = makeTools();
    await (tools as any)["inbox.triage"]({
      request_id: "req-2",
      actor: "WAR",
      inbox_id: "inbox-1",
      lane: "intent",
      layer: "L2",
      domain: "ops",
      object_type: "task",
      owner_pod: "WAR",
      destination_db: "TASKS",
    });
    expect(mock.updateInboxEntry).toHaveBeenCalled();
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.routing_status_code).toBe("triaged");
    expect(patch.routing_key).toBe("intent:L2:task:TASKS");
    expect(patch.owner_pod).toBe("WAR");
  });

  it("validate rejects bad routing key", async () => {
    const { tools, mock } = makeTools();
    mock.getInboxEntry.mockResolvedValueOnce({ routing_key: "bad", destination_db: "TASKS" });
    await expect(
      (tools as any)["inbox.validate"]({
        request_id: "req-3",
        actor: "WAR",
        inbox_id: "inbox-1",
      })
    ).rejects.toMatchObject({ code: "E_INBOX_003" });
  });

  it("route applies deterministic mapping", async () => {
    const { tools, mock } = makeTools();
    mock.getInboxEntry.mockResolvedValueOnce({
      id: "inbox-1",
      routing_status: "triaged",
      lane: "intent",
      layer: "L1",
      domain: "general",
      object_type: "task",
      routing_key: "intent:L1:task:TASKS",
    });
    const res = await (tools as any)["inbox.route"]({
      request_id: "req-4",
      actor: "WAR",
      inbox_id: "inbox-1",
    });
    expect(res.ok).toBe(true);
    expect(mock.updateInboxEntry).toHaveBeenCalled();
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.destination_db_code).toBe("TASKS");
    expect(patch.routing_status_code).toBe("routed");
    expect(patch.routing_key).toBe("intent:L1:task:TASKS");
  });

  it("move is idempotent on request_id", async () => {
    const { tools, mock } = makeTools();
    mock.getInboxEntry.mockResolvedValueOnce({
      id: "inbox-1",
      routing_status: "routed",
      destination_db: "TASKS",
      target_notion_id: "dest-1",
      target_url: "http://notion",
      last_move_request_id: "req-5",
    });
    const res = await (tools as any)["inbox.move"]({
      request_id: "req-5",
      actor: "WAR",
      inbox_id: "inbox-1",
    });
    expect(res.ok).toBe(true);
    expect(mock.routeInboxEntry).not.toHaveBeenCalled();
    expect(res.data?.target_notion_id).toBe("dest-1");
  });

  it("block sets blocked status", async () => {
    const { tools, mock } = makeTools();
    await (tools as any)["inbox.block"]({
      request_id: "req-6",
      actor: "LAW",
      inbox_id: "inbox-1",
      blocker_reason: "invalid",
    });
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.routing_status_code).toBe("blocked");
    expect(patch.blocker_reason).toBe("invalid");
  });

  it("duplicate sets duplicate status", async () => {
    const { tools, mock } = makeTools();
    await (tools as any)["inbox.markDuplicate"]({
      request_id: "req-7",
      actor: "LAW",
      inbox_id: "inbox-1",
      duplicate_of: "inbox-0",
    });
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.routing_status_code).toBe("duplicate");
    expect(patch.duplicate_of).toBe("inbox-0");
  });

  it("archive sets archived status", async () => {
    const { tools, mock } = makeTools();
    await (tools as any)["inbox.archive"]({
      request_id: "req-8",
      actor: "LAW",
      inbox_id: "inbox-1",
    });
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.routing_status_code).toBe("archived");
  });

  it("auditTrail parses move_log", async () => {
    const { tools, mock } = makeTools();
    mock.getInboxEntry.mockResolvedValueOnce({
      move_log: "[2026-02-07T00:00:00.000Z] actor=ARC action=CREATE from=none to=new note=created request_id=req-9",
    });
    const res = await (tools as any)["inbox.auditTrail"]({
      request_id: "req-9",
      inbox_id: "inbox-1",
    });
    expect(res.ok).toBe(true);
    expect(res.data.length).toBe(1);
    expect(res.data[0].actor).toBe("ARC");
    expect(res.data[0].action).toBe("CREATE");
  });
});
