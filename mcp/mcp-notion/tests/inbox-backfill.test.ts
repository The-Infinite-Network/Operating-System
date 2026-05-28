import { describe, it, expect, vi } from "vitest";
import { Tools } from "../src/tools";

const makeTools = () => {
  const tools = new Tools();
  const mock = {
    listInboxEntries: vi.fn(async () => ({
      items: [
        {
          id: "inbox-1",
          source_type: "Url",
          source_type_code: null,
          destination_db: "Runs AARs",
          destination_db_code: null,
          lane: "execution",
          lane_code: null,
          layer: "L1",
          layer_code: null,
          object_type: "task",
          object_type_code: null,
          routing_key: null,
        },
        {
          id: "inbox-2",
          source_type: "Other",
          source_type_code: null,
          lane: null,
          layer: null,
          object_type: null,
          routing_key: null,
        },
      ],
      next_cursor: null,
      has_more: false,
    })),
    updateInboxEntry: vi.fn(async () => ({ id: "inbox-1" })),
  };
  (tools as any).client = mock;
  return { tools, mock };
};

describe("inboxBackfillCodes", () => {
  it("computes codes and routing_key (dry_run)", async () => {
    const { tools, mock } = makeTools();
    const res = await (tools as any).inboxBackfillCodes({ dry_run: true });
    expect(res.ok).toBe(true);
    expect(res.data.updated).toBe(1);
    expect(res.data.skipped).toBe(1);
    expect(mock.updateInboxEntry).not.toHaveBeenCalled();
  });

  it("writes updates when dry_run=false", async () => {
    const { tools, mock } = makeTools();
    const res = await (tools as any).inboxBackfillCodes({ dry_run: false });
    expect(res.ok).toBe(true);
    expect(mock.updateInboxEntry).toHaveBeenCalledTimes(1);
    const patch = mock.updateInboxEntry.mock.calls[0][1];
    expect(patch.source_type_code).toBe("url");
    expect(patch.destination_db_code).toBe("RUNS_AARS");
    expect(patch.routing_key).toBe("execution:L1:task:RUNS_AARS");
  });
});
