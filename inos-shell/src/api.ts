import {
  DatabaseItem,
  Mission,
  MissionTask,
  TimelineEvent,
  DriveCanonListing,
  Agent,
  Room,
  Guild,
} from "./types";
import { InboxItem, InboxStatus } from "./types/inbox";
import { mockAgents } from "./data/mock/agents";

// Canonical IEHQ Notion HTTP server (Epoch 0 spine)
export const API_BASE =
  import.meta.env.VITE_INOS_API_ENDPOINT ||
  import.meta.env.VITE_NOTION_API_ENDPOINT ||
  import.meta.env.VITE_MCP_BASE_URL ||
  "/mcp";

// New Node.js/TypeScript API layer
export const NODE_API_BASE = "/api";

export type VertexGenerateResponse = {
  ok?: boolean;
  request_id?: string;
  text?: string;
  usage?: Record<string, unknown>;
  model?: string;
  timing_ms?: number;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export type VertexHealthResponse = {
  ok?: boolean;
  project_id?: string;
  region?: string;
  model?: string;
  auth?: string;
  timing_ms?: number;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

// Map shell-facing mission statuses to canonical MCP enum
const STATUS_MAP: Record<string, string> = {
  Proposed: "Proposed",
  Planning: "Intake",
  "In Flight": "Active",
  Blocked: "Blocked",
  Done: "Complete",
  Parked: "Parked",
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request GET ${path} failed with status ${res.status}: ${text || res.statusText
      }`
    );
  }

  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    const error = data.error || {};
    throw new Error(
      error.message || `Request POST ${path} failed with status ${res.status}`
    );
  }

  return data as T;
}

export type CORE_DIRECTIVE_STATUS = "DRAFT" | "ISSUED" | "ACTIVE" | "NEXT" | "PARKED" | "HALTED" | "VOID" | "COMPLETE";
export type CORE_DIRECTIVE_PRIORITY = "P0" | "P1" | "P2" | "P3";

export interface CoreDirective {
  id: string;
  summary: string;
  status: CORE_DIRECTIVE_STATUS;
  priority: CORE_DIRECTIVE_PRIORITY;
  type: string;
  owner_execution: string;
  date: string;
}

export type FulcrumEnvelope = {
  current_coordinate: {
    move: string;
    stage: string;
    status: string;
    confidence: string;
    evidence: string[];
  };
  diagnosis: {
    what_is_true: string[];
    what_is_missing: string[];
    what_is_blocked: string[];
    what_is_assumed: string[];
  };
  next_move: {
    action: string;
    owner: string;
    eta: string;
    acceptance: {
      pass: string[];
      fail: string[];
    };
  };
  artifact_check: Array<{
    artifact: string;
    required: boolean;
    present: boolean;
    status: string;
    notes: string;
  }>;
  review_promotion_gate: {
    gate: string;
    blockers: string[];
    warnings: string[];
    promotion_rule: string;
  };
  routing: Record<string, string>;
  json_state: Record<string, unknown>;
};

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request PATCH ${path} failed with status ${res.status}: ${text || res.statusText
      }`
    );
  }

  return (await res.json()) as T;
}

// Canon rule: keep the public shell API grouped by domain.
// Do not reintroduce flat top-level wrappers here; extend api.missions/api.tasks/api.timeline/api.runs/api.aars instead.
export const api = {
  // Shell-level DB awareness: treat [WAR] Missions as the primary missions DB
  listDatabases: async (): Promise<{ databases: DatabaseItem[] }> => {
    const databases: DatabaseItem[] = [
      {
        id: "WAR_MISSIONS",
        title: "[WAR] Missions (canonical)",
      },
    ];
    return { databases };
  },

  // Entities from IEHQ Notion MCP tool (entities.list)
  listEntities: async (): Promise<{ entities: any[] }> => {
    // TODO: Strict typing for entities once backend is live
    const data = await postJson<{
      data: {
        entities: any[];
      };
    }>("/tool/entities.list", {});

    return { entities: data.data?.entities || [] };
  },

  // Rooms from IEHQ Notion MCP tool (rooms.list)
  listRooms: async (): Promise<{ rooms: any[] }> => {
    const data = await postJson<{
      data: {
        rooms: any[];
      };
    }>("/tool/rooms.list", { params: { limit: 100 } });
    return { rooms: data.data?.rooms || [] };
  },

  // Guilds from IEHQ Notion MCP tool (guilds.list)
  listGuilds: async (): Promise<{ guilds: any[] }> => {
    const data = await postJson<{
      data: {
        guilds: any[];
      };
    }>("/tool/guilds.list", {});
    return { guilds: data.data?.guilds || [] };
  },

  // Agents from IEHQ Notion MCP tool (agents.list)
  listAgents: async (limit: number = 50): Promise<{ agents: Agent[]; source: "mcp" | "mock" }> => {
    try {
      const data = await postJson<{
        data: {
          agents: any[];
        };
      }>("/tool/agents.list", { params: { limit } });

      const agents: Agent[] = (data.data?.agents || []).map((a: any) => ({
        id: a.id,
        name: a.name || "Unknown Agent",
        code: a.code || "N/A",
        roleSummary: a.role_summary || a.role || "",
        lane: a.lane || "General",
        status: a.status || "Inactive",
        principles: Array.isArray(a.principles) ? a.principles : [],
        can: Array.isArray(a.can) ? a.can : [],
        cannot: Array.isArray(a.cannot) ? a.cannot : [],
      }));

      if (agents.length > 0) return { agents, source: "mcp" };
    } catch (err) {
      console.warn("MCP agents.list failed, falling back to mock roster", err);
    }

    return { agents: mockAgents.slice(0, limit), source: "mock" };
  },

  // Python AI Service via Node.js Proxy
  pythonAiGenerate: async (params: {
    prompt: string;
    context?: any;
    model?: string;
  }): Promise<any> => {
    const res = await fetch(`${NODE_API_BASE}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to call Python AI service via Node proxy");
    return res.json();
  },

  // Vertex AI: Generate Text (Legacy/Direct)
  vertexGenerate: async (params: {
    prompt: string;
    system?: string;
    model?: string;
    request_id?: string;
    temperature?: number;
    max_output_tokens?: number;
    json_only?: boolean;
  }): Promise<VertexGenerateResponse> => {
    const data = await postJson<{
      data?: VertexGenerateResponse;
      ok?: boolean;
      error?: any;
    }>("/tool/vertex.generateText", { params });

    if (data.ok === false || data.error) {
      return {
        ok: false,
        error: data.error || { message: "Unknown error from Vertex tool" },
      };
    }

    return data.data || { ok: false, error: { message: "No data returned" } };
  },

  // Vertex AI: Health Check
  vertexHealth: async (): Promise<VertexHealthResponse> => {
    const data = await postJson<{
      data?: VertexHealthResponse;
      ok?: boolean;
      error?: any;
    }>("/tool/vertex.health", { params: {} });

    if (data.ok === false || data.error) {
      return {
        ok: false,
        error: data.error || { message: "Health check failed" },
      };
    }
    return data.data || { ok: false, error: { message: "No data returned" } };
  },

  // Drive Canon: List Children
  driveList: async (params: {
    driveId: string;
    parentId: string | null;
    pageToken?: string | null;
  }): Promise<{ listing: DriveCanonListing; source: "mcp" | "mock" }> => {
    try {
      const data = await postJson<{ data?: DriveCanonListing; ok?: boolean }>(
        "/tool/drive.listChildren",
        {
          params: {
            driveId: params.driveId,
            parentId: params.parentId,
            pageToken: params.pageToken,
          },
        }
      );
      if (data.data) {
        return { listing: data.data, source: "mcp" };
      }
    } catch (e) {
      console.warn("MCP Drive list failed, falling back to mock if needed", e);
    }
    throw new Error("Failed to fetch from MCP Drive");
  },

  // ARK seal log via /tool/ark.sealLog
  arkSealLog: (payload: {
    assetId: string;
    assetTitle?: string;
    missionId?: string;
    notes?: string;
  }) => {
    const body = {
      assetTitle: payload.assetTitle || payload.assetId,
      arkCode: payload.assetId,
      missionId: payload.missionId,
      notes: payload.notes,
    };
    return postJson<{ ok: boolean; data: { id: string } }>("/tool/ark.sealLog", { params: body }).then(res => res.data);
  },

  // Inbox capture via /inbox/capture
  inboxCapture: (payload: {
    title: string;
    source: string;
    type?: string;
    notes?: string;
  }) => {
    const body = {
      title: payload.title,
      source: payload.source,
      proposedHome: payload.type,
      notes: payload.notes,
    };
    return postJson<{ id: string }>("/inbox/capture", body);
  },

  inboxCreate: (payload: {
    request_id: string;
    actor: string;
    item: string;
    source_type: string;
    source_url?: string;
    source_ref?: string;
    summary: string;
    sensitivity: string;
    entity_name?: string;
    entity_id?: string;
    room_name?: string;
    room_id?: string;
    tags?: string[];
  }) => {
    return postJson<{ ok: boolean; data: { id: string }; request_id: string }>(
      "/tool/inbox.create",
      { params: payload }
    );
  },

  inboxList: (payload: {
    request_id?: string;
    status?: string;
    entity_id?: string;
    room_id?: string;
    limit?: number;
    cursor?: string;
  }) => {
    return postJson<{
      ok: boolean;
      data: { items: any[]; next_cursor?: string | null; has_more?: boolean };
      request_id: string;
    }>("/tool/inbox.list", { params: payload });
  },

  inboxUpdate: (payload: {
    request_id: string;
    actor: string;
    inbox_id: string;
    patch: Record<string, any>;
  }) => {
    return postJson<{ ok: boolean; request_id: string }>(
      "/tool/inbox.update",
      { params: payload }
    );
  },

  inboxTriage: (payload: {
    request_id: string;
    actor: string;
    inbox_id: string;
    lane: string;
    layer: string;
    domain: string;
    object_type: string;
    owner_pod: string;
    destination_db?: string;
    tags?: string[];
    sensitivity?: string;
    entity_name?: string;
    entity_id?: string;
    room_name?: string;
    room_id?: string;
  }) => {
    return postJson<{ ok: boolean; request_id: string; data?: { routing_key: string } }>(
      "/tool/inbox.triage",
      { params: payload }
    );
  },

  inboxRoute: (payload: {
    request_id: string;
    actor: string;
    inbox_id: string;
    destination_db?: string;
  }) => {
    return postJson<{
      ok: boolean;
      request_id: string;
      data?: { destination_db: string; routing_key: string };
      error?: { code: string; message: string };
    }>("/tool/inbox.route", { params: payload });
  },

  inboxMove: (payload: { request_id: string; actor: string; inbox_id: string }) => {
    return postJson<{
      ok: boolean;
      request_id: string;
      data?: { target_notion_id?: string; target_url?: string };
    }>("/tool/inbox.move", { params: payload });
  },

  inboxVerify: (payload: { request_id: string; actor: string; inbox_id: string }) => {
    return postJson<{ ok: boolean; request_id: string; data?: { ok: boolean } }>(
      "/tool/inbox.verify",
      { params: payload }
    );
  },

  inboxBlock: (payload: {
    request_id: string;
    actor: string;
    inbox_id: string;
    blocker_reason: string;
  }) => {
    return postJson<{ ok: boolean; request_id: string }>(
      "/tool/inbox.block",
      { params: payload }
    );
  },

  inboxDuplicate: (payload: {
    request_id: string;
    actor: string;
    inbox_id: string;
    duplicate_of: string;
  }) => {
    return postJson<{ ok: boolean; request_id: string }>(
      "/tool/inbox.markDuplicate",
      { params: payload }
    );
  },

  inboxArchive: (payload: { request_id: string; actor: string; inbox_id: string }) => {
    return postJson<{ ok: boolean; request_id: string }>(
      "/tool/inbox.archive",
      { params: payload }
    );
  },

  inboxAuditTrail: (payload: { request_id?: string; inbox_id: string }) => {
    return postJson<{ ok: boolean; request_id: string; data: any[] }>(
      "/tool/inbox.auditTrail",
      { params: payload }
    );
  },

  inboxNormalizeCodes: (payload: { dryRun?: boolean }) => {
    return postJson<{ ok: boolean; data: { updated: number; dryRun: boolean } }>(
      "/tool/inbox.normalizeCodes",
      { params: payload }
    );
  },

  inboxBackfillRoutingKey: (payload: { inbox_id: string }) => {
    return postJson<{ ok: boolean; data: { routing_key: string } }>(
      "/tool/inbox.backfillRoutingKey",
      { params: payload }
    );
  },

  inboxBackfillCodes: (payload: { dry_run: boolean; limit: number; filter: any }) => {
    return postJson<{ ok: boolean; data: { scanned: number; changed: number; unchanged: number; errors: any[] } }>(
      "/tool/inbox.backfill.codes",
      { params: payload }
    );
  },

  inboxDedupeFind: (payload: {
    query?: string;
    limit?: number;
    inbox_id?: string;
    same_source_url?: boolean;
    same_source_ref?: boolean;
    fuzzy_title?: boolean;
    fuzzy_summary?: boolean;
    time_window_days?: number;
  }) => {
    return postJson<{ ok: boolean; data: { matches: InboxItem[]; groups?: any[] } }>(
      "/tool/inbox.dedupe.find",
      { params: payload }
    );
  },



  inboxViewsPatchReport: (payload: { request_id?: string }) => {
    return postJson<{ ok: boolean; request_id: string; data: any }>(
      "/tool/inbox.views.patch.report",
      { params: payload }
    );
  },



  // Timeline list for a specific mission via /tool/timeline.list
  listTimelineForMission: async (
    missionId: string
  ): Promise<{ events: TimelineEvent[] }> => {
    const response = await postJson<{
      data: {
        events: {
          id: string;
          title: string;
          type?: string | null;
          event_type?: string | null;
          missionId?: string | null;
          source?: string | null;
          notes?: string | null;
          summary?: string | null;
          timestamp?: string | null;
          external_refs?: string | null;
          actor?: { id: string; name?: string; avatar_url?: string } | null;
          date?: string | null;
          end_date?: string | null;
          last_edited_time?: string;
        }[];
      };
    }>("/tool/timeline.list", {
      params: { missionId, limit: 8 },
    });

    const data = response.data || { events: [] };
    const events: TimelineEvent[] = (data.events || []).map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type || "note",
      event_type: e.event_type ?? null,
      missionId: e.missionId || undefined,
      source: e.source ?? null,
      notes: e.notes ?? null,
      summary: e.summary || "No summary",
      timestamp: e.timestamp || e.date || new Date().toISOString(),
      actor: e.actor ?? null,
      external_refs: e.external_refs ?? null,
      date: e.date || undefined,
      last_edited_time: e.last_edited_time,
    }));

    return { events };
  },

  logTimelineEvent: (payload: {
    title: string;
    type?: string;
    missionId: string;
  }) => {
    const body = {
      params: {
        title: payload.title,
        type: payload.type,
        missionId: payload.missionId,
        source: "INOS Shell React",
      },
    };
    return postJson<{ ok: boolean; data: { id: string } }>("/tool/timeline.log", body).then(res => res.data);
  },

  logTimelineEventV1: (payload: {
    event_type:
    | "MISSION_CREATED"
    | "MISSION_UPDATED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "RUN_STARTED"
    | "RUN_ENDED"
    | "AAR_CREATED"
    | "AAR_UPDATED"
    | "POLE"
    | "LOG"
    | "INCIDENT"
    | "MILESTONE";
    timestamp?: string;
    entity?: string;
    entity_registry_id?: string;
    room?: string;
    mission_id?: string;
    task_id?: string;
    run_id?: string;
    aar_id?: string;
    actor_people_id?: string;
    sync_key?: string;
    summary?: string;
    external_refs?: string;
  }) => {
    return postJson<{ ok: boolean; data: { id: string } }>("/tool/timeline.logEvent", {
      params: payload,
    }).then(res => res.data);
  },

  // Check lane compliance via /tool/core.check_lane
  checkLaneCompliance: async (payload: {
    agent_id: string;
    action_type: string;
  }): Promise<{ pass: boolean; reason?: string }> => {
    return postJson<{ pass: boolean; reason?: string }>("/tool/core.check_lane", {
      params: payload,
    });
  },

  missions: {
    list: async (limit: number = 50, statusFilter?: string): Promise<{ missions: Mission[] }> => {
      const data = await postJson<{
        data: {
          missions: {
            id: string;
            title?: string;
            name?: string;
            status: string;
            priority?: string;
            owner?: string;
            due?: string | null;
            last_edited_time?: string;
            mission_code?: string | null;
            entity?: string | null;
            room?: string | null;
            tags?: string[];
          }[];
        };
      }>("/tool/missions.list", {
        params: {
          limit,
          status: statusFilter
        }
      });

      const missions: Mission[] = (data.data?.missions || []).map((m) => {
        const title = m.title || m.name || m.mission_code || "Untitled";

        let priority: number | null = null;
        if (m.priority) {
          if (m.priority.startsWith("P0")) priority = 0;
          else if (m.priority.startsWith("P1")) priority = 1;
          else if (m.priority.startsWith("P2")) priority = 2;
          else if (m.priority.startsWith("P3")) priority = 3;
        }

        return {
          id: m.id,
          title,
          status: m.status,
          priority,
          owner: m.owner || null,
          due_date: m.due || null,
          last_edited_time: m.last_edited_time,
          mission_code: m.mission_code ?? null,
          entity: m.entity ?? null,
          room: m.room ?? null,
          tags: Array.isArray(m.tags) ? m.tags : [],
        };
      });

      return { missions };
    },
    upsert: async (
      missionData: Partial<Mission> & { title: string; status: string }
    ): Promise<{ id: string }> => {
      let priorityCode: string | undefined;
      if (typeof missionData.priority === "number") {
        const map = ["P0", "P1", "P2", "P3"] as const;
        priorityCode = map[missionData.priority] || undefined;
      }

      const canonicalStatus =
        STATUS_MAP[missionData.status] || missionData.status;

      const body = {
        params: {
          missionData: {
            mission_title: missionData.title,
            mission_description: missionData.title,
            mission_objective: missionData.title,
            status: canonicalStatus,
            priority: priorityCode,
            entity: missionData.entity || undefined,
            due_date: missionData.due_date || undefined,
            source_system: "INOS",
            mission_type: "quick_task",
          },
        },
      };

      const res = await postJson<{
        ok: boolean;
        data: { notion_page_id: string };
      }>("/tool/missions.upsert", body);

      return { id: res.data.notion_page_id };
    },
  },

  tasks: {
    list: async (missionId: string): Promise<{ tasks: MissionTask[] }> => {
      const data = await postJson<{
        data: {
          tasks: {
            id: string;
            title: string;
            status: string | null;
            owner: string | null;
            due_date: string | null;
          }[];
        };
      }>("/tool/tasks.list", {
        params: {
          mission_id: missionId,
          limit: 50
        }
      });

      const tasks: MissionTask[] = (data.data?.tasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        owner: t.owner,
        due_date: t.due_date,
      }));

      return { tasks };
    },
    create: async (payload: {
      missionId: string;
      title: string;
      status?: string;
      due_date?: string;
    }): Promise<{ task_id?: string }> => {
      const body = {
        params: {
          task_title: payload.title,
          mission_id: payload.missionId,
          status: payload.status,
          due_date: payload.due_date,
          dry_run: false,
          commit: true,
        },
      };

      const res = await postJson<{
        ok: boolean;
        data: { task_id?: string };
      }>("/tool/tasks.create", body);

      return res.data;
    },
    update: async (payload: {
      missionId: string;
      taskId: string;
      status?: string;
      title?: string;
      due_date?: string;
    }): Promise<{ ok?: boolean; task_id?: string }> => {
      const body = {
        params: {
          taskId: payload.taskId,
          missionId: payload.missionId,
          status: payload.status,
          title: payload.title,
          due_date: payload.due_date,
        },
      };

      const res = await postJson<{ ok: boolean; data: { ok?: boolean; task_id?: string } }>("/tool/tasks.update", body);
      return res.data;
    },
  },

  timeline: {
    queryByMission: async (
      missionId: string,
      limit: number = 50
    ): Promise<{ events: TimelineEvent[] }> => {
      const response = await postJson<{
        data: {
          events: {
            id: string;
            title: string;
            type?: string | null;
            event_type?: string | null;
            missionId?: string | null;
            source?: string | null;
            notes?: string | null;
            summary?: string | null;
            timestamp?: string | null;
            external_refs?: string | null;
            actor?: { id: string; name?: string; avatar_url?: string } | null;
            date?: string | null;
            end_date?: string | null;
            last_edited_time?: string;
          }[];
        };
      }>("/tool/timeline.queryByMission", {
        params: { mission_id: missionId, limit },
      });

      const data = response.data || { events: [] };
      const events: TimelineEvent[] = (data.events || []).map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type || "note",
        event_type: e.event_type ?? null,
        missionId: e.missionId || undefined,
        source: e.source ?? null,
        notes: e.notes ?? null,
        summary: e.summary || "No summary",
        timestamp: e.timestamp || e.date || new Date().toISOString(),
        actor: e.actor ?? null,
        external_refs: e.external_refs ?? null,
        date: e.date || undefined,
        last_edited_time: e.last_edited_time,
      }));

      return { events };
    },
    logV1: (payload: {
      event_type:
      | "MISSION_CREATED"
      | "MISSION_UPDATED"
      | "TASK_CREATED"
      | "TASK_UPDATED"
      | "RUN_STARTED"
      | "RUN_ENDED"
      | "AAR_CREATED"
      | "AAR_UPDATED"
      | "POLE"
      | "LOG"
      | "INCIDENT"
      | "MILESTONE";
      timestamp?: string;
      entity?: string;
      entity_registry_id?: string;
      room?: string;
      mission_id?: string;
      task_id?: string;
      run_id?: string;
      aar_id?: string;
      actor_people_id?: string;
      sync_key?: string;
      summary?: string;
      external_refs?: string;
    }) => {
      return postJson<{ ok: boolean; data: { id: string } }>("/tool/timeline.logEvent", {
        params: payload,
      }).then(res => res.data);
    },
  },

  runs: {
    create: async (payload: {
      missionId: string;
      runTitle?: string;
      notes?: string;
    }): Promise<{
      run: { id: string; url: string };
      aar: { id: string; url: string };
    }> => {
      const response = await postJson<{
        data: {
          run: { id: string; url: string };
          aar: { id: string; url: string };
        };
      }>("/tool/runs.create", {
        params: {
          missionId: payload.missionId,
          runTitle: payload.runTitle,
          notes: payload.notes,
        },
      });
      return response.data;
    },
    end: async (payload: {
      runId: string;
      endNotes?: string;
    }): Promise<{ id: string; url?: string }> => {
      const res = await postJson<{
        ok: boolean;
        data: { id: string; url?: string };
      }>("/tool/runs.end", {
        params: {
          runId: payload.runId,
          endNotes: payload.endNotes,
        },
      });
      return res.data;
    },
  },

  aars: {
    update: async (payload: {
      aarId: string;
      title?: string;
      summary?: string;
      outcomes?: string;
      lessons?: string;
      status?: string;
    }): Promise<{ id: string; url?: string }> => {
      const res = await postJson<{
        ok: boolean;
        data: { id: string; url?: string };
      }>("/tool/aars.update", {
        params: {
          aarId: payload.aarId,
          title: payload.title,
          summary: payload.summary,
          outcomes: payload.outcomes,
          lessons: payload.lessons,
          status: payload.status,
        },
      });
      return res.data;
    },
  },

  // CORE: Create Directive
  createDirective: async (payload: {
    summary: string;
    directive_type: string;
    priority: string;
    owner_execution: string;
    acceptance_tests: string[];
    mission_id?: string;
  }): Promise<{ directive: CoreDirective }> => {
    const data = await postJson<{
      ok: boolean;
      data: { directive: CoreDirective };
      error?: string;
    }>("/tool/core.create_directive", { params: payload });

    if (!data.ok) throw new Error(data.error || "Failed to create directive");
    return data.data;
  },

  // CORE: List Directives
  listDirectives: async (status?: string): Promise<{ directives: CoreDirective[] }> => {
    const data = await postJson<{
      ok: boolean;
      data: { directives: CoreDirective[] };
    }>("/tool/core.list_directives", { params: { status } });

    return { directives: data.data?.directives || [] };
  },

  fulcrum: {
    intakeDocument: async (file: File): Promise<{
      intake_id: string;
      intake_mode: string;
      status: string;
      compatibility_alias?: string;
    } & FulcrumEnvelope> => {
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch(`${API_BASE}/api/v1/fulcrum/intake`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error?.message || "FULCRUM intake failed");
      }
      return data.data;
    },

    intakeDialogue: async (raw_dialogue: string, user_id: string): Promise<{
      intake_id: string;
      intake_mode: string;
      status: string;
    } & FulcrumEnvelope> => {
      const data = await postJson<{ ok: boolean; data: any }>(
        "/api/v1/fulcrum/intake",
        { raw_dialogue, user_id }
      );
      return data.data;
    },

    coordinate: async (): Promise<FulcrumEnvelope> => {
      const data = await postJson<{ ok: boolean; data: FulcrumEnvelope }>(
        "/api/v1/fulcrum/coordinate",
        {}
      );
      return data.data;
    },

    artifactCheck: async (): Promise<{
      artifact_check: FulcrumEnvelope["artifact_check"];
      review_promotion_gate: FulcrumEnvelope["review_promotion_gate"];
      json_state: FulcrumEnvelope["json_state"];
    }> => {
      const data = await postJson<{ ok: boolean; data: any }>(
        "/api/v1/fulcrum/artifact-check",
        {}
      );
      return data.data;
    },

    nextMove: async (): Promise<{
      current_coordinate: FulcrumEnvelope["current_coordinate"];
      diagnosis: FulcrumEnvelope["diagnosis"];
      next_move: FulcrumEnvelope["next_move"];
      routing: FulcrumEnvelope["routing"];
      json_state: FulcrumEnvelope["json_state"];
    }> => {
      const data = await postJson<{ ok: boolean; data: any }>(
        "/api/v1/fulcrum/next-move",
        {}
      );
      return data.data;
    },
  },
};
