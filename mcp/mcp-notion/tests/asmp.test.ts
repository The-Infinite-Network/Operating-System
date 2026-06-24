import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { Tools } from "../src/tools.js";

describe("ASMP tools", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(path.join(os.tmpdir(), "asmp-test-"));
    writeFileSync(path.join(tempRoot, "AGENTS.md"), "# AGENTS\nAgent root");
    writeFileSync(path.join(tempRoot, "CLAUDE.md"), "# CLAUDE\nClaude root");

    process.env.ASMP_WORKSPACE_ROOT = tempRoot;
    process.env.NOTION_API_KEY = "test-api-key";
    process.env.NOTION_DB_MISSIONS = "test-missions-db";
    process.env.NOTION_DB_TIMELINE = "test-timeline-db";
    process.env.NOTION_DB_RUNS_AARS = "test-runs-db";
    process.env.NOTION_KNOWLEDGE_ARTICLES_DB_ID = "test-knowledge-db";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.ASMP_WORKSPACE_ROOT;
    rmSync(tempRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("starts a session and returns immutable context", async () => {
    const tools = new Tools();
    (tools as any).client.listMissions = vi.fn().mockResolvedValue({
      missions: [
        {
          id: "mission-1",
          title: "Persistent Memory",
          status: "Active",
          owner: "Codex",
          tags: ["memory", "notion"],
        },
      ],
    });
    (tools as any).client.listIdentities = vi.fn().mockResolvedValue({
      identities: [
        { id: "identity-1", name: "Codex", identity_type: "Agent", entity: ["memory"] },
      ],
    });

    const result = await tools["asmp.sessionStart"]({ current_agent: "Codex" });

    expect(result.session_id).toMatch(/^ASMP-/);
    expect(result.parent_mission_id).toBe("mission-1");
    expect(result.root_context.agents_md.found).toBe(true);
    expect(result.loaded_context.immutable_context_block).toContain("ASMP_IMMUTABLE_CONTEXT_BLOCK");
    expect(result.loaded_context.immutable_context_block).toContain("Persistent Memory");
  });

  it("distills facts into knowledge candidates and contradiction report", async () => {
    const tools = new Tools();
    (tools as any).client.listMissions = vi.fn().mockResolvedValue({ missions: [] });
    (tools as any).client.listIdentities = vi.fn().mockResolvedValue({ identities: [] });

    const start = await tools["asmp.sessionStart"]({ current_agent: "Codex" });
    const result = await tools["asmp.distillMemory"]({
      session_id: start.session_id,
      verified_facts: [
        {
          article_title: "ASMP Hook",
          summary: "The runtime now writes append-only session cache entries.",
          body: "Verified against implementation.",
          contradictions: [
            {
              surface: "AGENTS.md",
              previous_state: "No session hook",
              new_state: "Session hook enforced",
              reason: "Runtime behavior changed",
            },
          ],
        },
      ],
    });

    expect(result?.knowledge_articles).toHaveLength(1);
    expect(result?.contradiction_flags).toHaveLength(1);
    expect(result?.contradiction_blocker_report).toContain("CONTRADICTION_BLOCKER_REPORT");
  });

  it("halts autonomous updates on contradiction during session end", async () => {
    const tools = new Tools();
    (tools as any).client.listMissions = vi.fn().mockResolvedValue({
      missions: [{ id: "mission-1", title: "Persistent Memory", status: "Active", owner: "Codex", tags: [] }],
    });
    (tools as any).client.listIdentities = vi.fn().mockResolvedValue({ identities: [] });
    (tools as any).client.exportSessionRun = vi.fn().mockResolvedValue({ id: "run-1" });
    (tools as any).client.logTimelineEvent = vi.fn().mockResolvedValue({ id: "timeline-1" });
    (tools as any).client.createKnowledgeArticle = vi.fn().mockResolvedValue({ id: "kb-1" });

    const start = await tools["asmp.sessionStart"]({ current_agent: "Codex" });
    const result = await tools["asmp.sessionEnd"]({
      session_id: start.session_id,
      execution_status: "COMPLETED_SUCCESS",
      summary: "Finished the memory protocol build.",
      contradictions: [
        {
          surface: "Notion Canon",
          previous_state: "Old deployment step",
          new_state: "New deployment step",
          reason: "Operator review required before promotion",
        },
      ],
      knowledge_articles: [
        {
          article_title: "Deployment Step",
          summary: "Candidate only until contradiction is resolved.",
        },
      ],
    });

    expect(result.halted_autonomous_memory_updates).toBe(true);
    expect(result.contradiction_blocker_report).toContain("CONTRADICTION_BLOCKER_REPORT");
    expect((tools as any).client.exportSessionRun).toHaveBeenCalledOnce();
    expect((tools as any).client.logTimelineEvent).not.toHaveBeenCalled();
    expect((tools as any).client.createKnowledgeArticle).not.toHaveBeenCalled();
  });
});
