import { existsSync, promises as fs } from "fs";
import path from "path";
import { Logger } from "./errors.js";

const logger = new Logger("ASMP");

export type AsmpPriority = "INFO" | "SIGNIFICANT_DECISION" | "BLOCKER";

export interface AsmpEvent {
  id: string;
  timestamp: string;
  event_type: string;
  priority: AsmpPriority;
  summary: string;
  tool_name?: string;
  file_path?: string;
  command?: string;
  payload?: Record<string, unknown>;
}

export interface AsmpContradiction {
  surface: string;
  previous_state: string;
  new_state: string;
  reason: string;
}

export interface AsmpKnowledgeCandidate {
  article_title: string;
  article_type?: string;
  summary: string;
  body?: string;
  entity?: string[];
  pod_owner?: string;
  version?: string;
  tags?: string[];
}

export interface AsmpSessionRecord {
  session_id: string;
  parent_mission_id: string | null;
  current_agent: string;
  timestamp_start: string;
  timestamp_end: string | null;
  execution_status: string | null;
  root_context: {
    workspace_root: string;
    agents_md: { found: boolean; path: string; content: string | null };
    claude_md: { found: boolean; path: string; content: string | null };
  };
  loaded_context: {
    active_missions: Array<Record<string, unknown>>;
    related_identities: Array<Record<string, unknown>>;
    mission_tags: string[];
    immutable_context_block: string;
  };
  events: AsmpEvent[];
  contradiction_flags: AsmpContradiction[];
  knowledge_candidates: AsmpKnowledgeCandidate[];
  write_payloads: {
    runs_and_aars: string | null;
    timeline_updates: string[];
    knowledge_articles: string[];
  };
  exports: {
    summary_markdown_path: string | null;
    handoff_json_path: string | null;
  };
}

interface AsmpState {
  protocol: string;
  workspace_root: string;
  active_session_id: string | null;
  sessions: Record<string, AsmpSessionRecord>;
}

function makeId(prefix: string) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function chunkText(input: string, size = 1800) {
  const chunks: string[] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

export class SessionMemoryManager {
  readonly workspaceRoot: string;
  private readonly nosDir: string;
  private readonly cachePath: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || SessionMemoryManager.findWorkspaceRoot();
    this.nosDir = path.join(this.workspaceRoot, ".nos");
    this.cachePath = path.join(this.nosDir, "session_cache.json");
  }

  static findWorkspaceRoot(start = process.cwd()) {
    const override = process.env.ASMP_WORKSPACE_ROOT;
    if (override) return path.resolve(override);

    let current = path.resolve(start);
    while (true) {
      const claudePath = path.join(current, "CLAUDE.md");
      const operatingSystemPath = path.join(current, "Operating-System");
      try {
        if (existsSync(claudePath) || existsSync(operatingSystemPath)) {
          return current;
        }
      } catch {
        // ignore
      }
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(start);
      current = parent;
    }
  }

  private async ensureStore() {
    await fs.mkdir(this.nosDir, { recursive: true });
    try {
      await fs.access(this.cachePath);
    } catch {
      const initial: AsmpState = {
        protocol: "ASMP v1.0",
        workspace_root: this.workspaceRoot,
        active_session_id: null,
        sessions: {},
      };
      await fs.writeFile(this.cachePath, JSON.stringify(initial, null, 2), "utf8");
    }
  }

  private async readState(): Promise<AsmpState> {
    await this.ensureStore();
    const raw = await fs.readFile(this.cachePath, "utf8");
    return JSON.parse(raw) as AsmpState;
  }

  private async writeState(state: AsmpState) {
    await this.ensureStore();
    await fs.writeFile(this.cachePath, JSON.stringify(state, null, 2), "utf8");
  }

  async readRootDocs() {
    const agentsPath = path.join(this.workspaceRoot, "AGENTS.md");
    const claudePath = path.join(this.workspaceRoot, "CLAUDE.md");
    const [agents, claude] = await Promise.all([
      this.readMaybe(agentsPath),
      this.readMaybe(claudePath),
    ]);

    return {
      workspace_root: this.workspaceRoot,
      agents_md: { path: agentsPath, ...agents },
      claude_md: { path: claudePath, ...claude },
    };
  }

  private async readMaybe(targetPath: string) {
    try {
      const content = await fs.readFile(targetPath, "utf8");
      return { found: true, content };
    } catch {
      return { found: false, content: null };
    }
  }

  buildImmutableContextBlock(params: {
    current_agent: string;
    docs: Awaited<ReturnType<SessionMemoryManager["readRootDocs"]>>;
    missions: Array<Record<string, unknown>>;
    identities: Array<Record<string, unknown>>;
  }) {
    const missionLines =
      params.missions.length > 0
        ? params.missions
            .map((mission) => {
              const tags = Array.isArray(mission.tags) ? mission.tags.join(", ") : "";
              return `- ${mission.title} | status=${mission.status} | owner=${mission.owner || "unassigned"}${tags ? ` | tags=${tags}` : ""}`;
            })
            .join("\n")
        : "- none";
    const identityLines =
      params.identities.length > 0
        ? params.identities
            .map((identity) => `- ${identity.name} | type=${identity.identity_type || "unknown"} | entity=${Array.isArray(identity.entity) ? identity.entity.join(", ") : ""}`)
            .join("\n")
        : "- none";

    return [
      "ASMP_IMMUTABLE_CONTEXT_BLOCK",
      `current_agent: ${params.current_agent}`,
      `workspace_root: ${params.docs.workspace_root}`,
      `agents_md_found: ${params.docs.agents_md.found}`,
      `claude_md_found: ${params.docs.claude_md.found}`,
      "",
      "[ROOT_DOCS]",
      params.docs.agents_md.content || "AGENTS.md not found at workspace root.",
      "",
      params.docs.claude_md.content || "CLAUDE.md not found at workspace root.",
      "",
      "[ACTIVE_MISSIONS]",
      missionLines,
      "",
      "[RELATED_IDENTITIES]",
      identityLines,
    ].join("\n");
  }

  async createSession(params: {
    current_agent: string;
    parent_mission_id?: string | null;
    missions: Array<Record<string, unknown>>;
    identities: Array<Record<string, unknown>>;
  }) {
    const docs = await this.readRootDocs();
    const missionTags = Array.from(
      new Set(
        params.missions.flatMap((mission) =>
          Array.isArray(mission.tags) ? mission.tags.map((tag) => String(tag)) : []
        )
      )
    );
    const immutableContextBlock = this.buildImmutableContextBlock({
      current_agent: params.current_agent,
      docs,
      missions: params.missions,
      identities: params.identities,
    });

    const session: AsmpSessionRecord = {
      session_id: makeId("ASMP"),
      parent_mission_id: params.parent_mission_id || null,
      current_agent: params.current_agent,
      timestamp_start: new Date().toISOString(),
      timestamp_end: null,
      execution_status: null,
      root_context: docs,
      loaded_context: {
        active_missions: params.missions,
        related_identities: params.identities,
        mission_tags: missionTags,
        immutable_context_block: immutableContextBlock,
      },
      events: [],
      contradiction_flags: [],
      knowledge_candidates: [],
      write_payloads: {
        runs_and_aars: null,
        timeline_updates: [],
        knowledge_articles: [],
      },
      exports: {
        summary_markdown_path: null,
        handoff_json_path: null,
      },
    };

    const state = await this.readState();
    state.active_session_id = session.session_id;
    state.sessions[session.session_id] = session;
    await this.writeState(state);
    return session;
  }

  async getSession(sessionId: string) {
    const state = await this.readState();
    return state.sessions[sessionId] || null;
  }

  async appendEvent(sessionId: string, event: Omit<AsmpEvent, "id" | "timestamp">) {
    const state = await this.readState();
    const session = state.sessions[sessionId];
    if (!session) return null;

    const entry: AsmpEvent = {
      id: makeId("EVT"),
      timestamp: new Date().toISOString(),
      ...event,
    };
    session.events.push(entry);
    state.sessions[sessionId] = session;
    await this.writeState(state);
    return entry;
  }

  async registerKnowledgeCandidates(sessionId: string, candidates: AsmpKnowledgeCandidate[]) {
    const state = await this.readState();
    const session = state.sessions[sessionId];
    if (!session) return null;
    session.knowledge_candidates.push(...candidates);
    state.sessions[sessionId] = session;
    await this.writeState(state);
    return session.knowledge_candidates;
  }

  async registerContradictions(sessionId: string, contradictions: AsmpContradiction[]) {
    const state = await this.readState();
    const session = state.sessions[sessionId];
    if (!session) return null;
    session.contradiction_flags.push(...contradictions);
    state.sessions[sessionId] = session;
    await this.writeState(state);
    return session.contradiction_flags;
  }

  buildRunsAarMarkdown(session: AsmpSessionRecord, summary?: string) {
    const eventLines =
      session.events.length > 0
        ? session.events
            .map(
              (event) =>
                `- ${event.timestamp} | ${event.event_type} | ${event.priority} | ${event.summary}`
            )
            .join("\n")
        : "- none";
    const contradictionLines =
      session.contradiction_flags.length > 0
        ? session.contradiction_flags
            .map(
              (item) =>
                `- ${item.surface}: previous="${item.previous_state}" new="${item.new_state}" reason="${item.reason}"`
            )
            .join("\n")
        : "- none";

    return [
      `# ASMP Session ${session.session_id}`,
      "",
      `- Agent: ${session.current_agent}`,
      `- Mission: ${session.parent_mission_id || "unlinked"}`,
      `- Start: ${session.timestamp_start}`,
      `- End: ${session.timestamp_end || "open"}`,
      `- Status: ${session.execution_status || "open"}`,
      "",
      "## Summary",
      summary || "No explicit summary provided.",
      "",
      "## Immutable Context",
      "```text",
      session.loaded_context.immutable_context_block,
      "```",
      "",
      "## Event Trace",
      eventLines,
      "",
      "## Contradictions",
      contradictionLines,
    ].join("\n");
  }

  buildContradictionReport(session: AsmpSessionRecord) {
    return [
      "CONTRADICTION_BLOCKER_REPORT",
      `session_id: ${session.session_id}`,
      `mission_id: ${session.parent_mission_id || "unlinked"}`,
      ...session.contradiction_flags.map(
        (item, index) =>
          `${index + 1}. surface=${item.surface} previous="${item.previous_state}" new="${item.new_state}" reason="${item.reason}"`
      ),
    ].join("\n");
  }

  async finalizeSession(params: {
    sessionId: string;
    executionStatus: string;
    summary?: string;
    runsAndAarsMarkdown: string;
    timelineUpdates: string[];
    knowledgeArticleTitles: string[];
    contradictionFlags: AsmpContradiction[];
  }) {
    const state = await this.readState();
    const session = state.sessions[params.sessionId];
    if (!session) return null;

    session.timestamp_end = new Date().toISOString();
    session.execution_status = params.executionStatus;
    session.write_payloads.runs_and_aars = params.runsAndAarsMarkdown;
    session.write_payloads.timeline_updates = params.timelineUpdates;
    session.write_payloads.knowledge_articles = params.knowledgeArticleTitles;
    if (params.contradictionFlags.length > 0) {
      session.contradiction_flags = params.contradictionFlags;
    }

    const summaryPath = path.join(this.nosDir, `${session.session_id}-summary.md`);
    const handoffPath = path.join(this.nosDir, `${session.session_id}-handoff.json`);
    const handoff = {
      session_metadata: {
        session_id: session.session_id,
        parent_mission_id: session.parent_mission_id,
        timestamp_start: session.timestamp_start,
        timestamp_end: session.timestamp_end,
      },
      execution_status: session.execution_status,
      write_payloads: session.write_payloads,
      contradiction_flags: session.contradiction_flags,
    };

    await fs.writeFile(summaryPath, params.runsAndAarsMarkdown, "utf8");
    await fs.writeFile(handoffPath, JSON.stringify(handoff, null, 2), "utf8");

    session.exports.summary_markdown_path = summaryPath;
    session.exports.handoff_json_path = handoffPath;
    state.sessions[session.session_id] = session;
    state.active_session_id = state.active_session_id === session.session_id ? null : state.active_session_id;
    await this.writeState(state);
    return { session, handoff, summaryPath, handoffPath };
  }

  async distillMemory(params: {
    sessionId: string;
    verifiedFacts: Array<
      AsmpKnowledgeCandidate & {
        contradictions?: AsmpContradiction[];
      }
    >;
  }) {
    const session = await this.getSession(params.sessionId);
    if (!session) return null;

    const contradictions = params.verifiedFacts.flatMap((fact) => fact.contradictions || []);
    const candidates = params.verifiedFacts.map((fact) => ({
      article_title: fact.article_title,
      article_type: fact.article_type,
      summary: fact.summary,
      body: fact.body,
      entity: fact.entity,
      pod_owner: fact.pod_owner,
      version: fact.version,
      tags: fact.tags,
    }));

    if (candidates.length > 0) {
      await this.registerKnowledgeCandidates(params.sessionId, candidates);
    }
    if (contradictions.length > 0) {
      await this.registerContradictions(params.sessionId, contradictions);
    }

    return {
      session_id: params.sessionId,
      knowledge_articles: candidates,
      contradiction_flags: contradictions,
      contradiction_blocker_report:
        contradictions.length > 0
          ? this.buildContradictionReport({
              ...session,
              contradiction_flags: [...session.contradiction_flags, ...contradictions],
            })
          : null,
    };
  }

  toNotionBlocks(markdownBody: string) {
    return chunkText(markdownBody).map((chunk) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: chunk } }],
      },
    }));
  }
}
