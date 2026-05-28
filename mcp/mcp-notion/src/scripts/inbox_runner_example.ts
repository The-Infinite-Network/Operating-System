import { Tools } from "../tools.js";

async function runInboxExample() {
  const tools = new Tools();
  const request_id = `inbox-example-${Date.now()}`;

  const dedupe = await (tools as any)["inbox.dedupe.find"]({
    request_id,
    time_window_days: 30,
    limit: 10,
  });
  console.log("inbox.dedupe.find:", JSON.stringify(dedupe, null, 2));

  const backfill = await (tools as any)["inbox.backfill.codes"]({
    request_id,
    dry_run: true,
    limit: 50,
    filter: { time_window_days: 30 },
  });
  console.log("inbox.backfill.codes:", JSON.stringify(backfill, null, 2));
}

runInboxExample().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`inbox_runner_example failed: ${message}`);
  process.exit(1);
});
