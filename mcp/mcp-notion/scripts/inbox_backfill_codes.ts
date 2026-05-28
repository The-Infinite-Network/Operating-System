// scripts/inbox_backfill_codes.ts
// Runs the canonical MCP tool `inbox.backfill.codes` against live Notion via the existing Tools client wiring.
//
// Usage examples:
//   npm run inbox:backfill -- --dry-run --limit=200 --days=365
//   npm run inbox:backfill -- --limit=200 --days=365
//
// Env required (canon):
//   NOTION_API_KEY
//   NOTION_VERSION (optional)
//   NOTION_DB_INBOX (or your loader mapping to the INBOX db id)
//
// Notes:
// - This script assumes your existing Tools class knows how to build/configure its Notion client
//   from environment (same way server start does).
// - If Tools currently only gets a client when the MCP server boots, we will refactor Tools to
//   lazily init the client in its constructor (minimal change).

import { Tools } from "../src/tools";

type Args = {
  dryRun: boolean;
  limit?: number;
  days?: number;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (const a of argv) {
    if (a === "--dry-run" || a === "--dry_run") args.dryRun = true;
    else if (a.startsWith("--limit=")) args.limit = Number(a.split("=")[1]);
    else if (a.startsWith("--days=")) args.days = Number(a.split("=")[1]);
  }
  return args;
}

async function main() {
  const { dryRun, limit, days } = parseArgs(process.argv.slice(2));

  if (!process.env.NOTION_API_KEY) {
    throw new Error("Missing env NOTION_API_KEY");
  }
  // If your env loader uses aliases, keep them upstream; this is a hard guard.

  const tools = new Tools();

  // Call the tool
  const res = await (tools as any)["inbox.backfill.codes"]({
    dry_run: dryRun,
    limit,
    days,
  });

  // Print result as JSON for logs
  console.log(JSON.stringify(res, null, 2));

  if (!res?.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
