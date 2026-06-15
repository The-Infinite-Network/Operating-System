import { z } from "zod";
import { randomUUID } from "crypto";
import { NotionClient } from "./client.js";
import { Logger, MCPError, ErrorCodes, MCPResult } from "./errors.js";
import {
  MISSION_STATUS,
  MISSION_STATUS_SCHEMA,
  BUILD_STATUS,
  BUILD_STATUS_SCHEMA,
} from "./constants.js";
import { WarOpsTools } from "./war-ops/tools.js";
import { GoogleDriveClient } from "./drive.js";
import {
  VertexGeminiClient,
  VertexGenerateTextResponse,
  VertexGenerateTextRequest,
  VertexHealthResponse,
} from "./llmClient.js";
import {
  computeRoutingKey as computeInboxRoutingKey,
  normalizeSourceType,
  normalizeDestinationDb,
  normalizeRoutingStatus,
  SOURCE_TYPE_CODE_TO_LABEL,
  DEST_DB_CODE_TO_LABEL,
  ROUTING_STATUS_CODE_TO_LABEL,
  isRoutingKeyValid,
} from "./inbox/normalize.js";
import { INBOX_VIEWS_SPEC } from "./inbox/views.js";

const logger = new Logger("Tools");

export const PUBLIC_TOOL_NAMES = [
  "system.capabilities",
  "databases.list",
  "pages.get",
  "rooms.list",
  "missions.list",
  "missions.create",
  "missions.upsert",
  "missions.updateStatus",
  "missions.tasks.list",
  "tasks.list",
  "tasks.create",
  "tasks.update",
  "guilds.list",
  "agents.list",
  "timeline.log",
  "timeline.list",
  "timeline.logEvent",
  "timeline.queryByMission",
  "runs.create",
  "runs.end",
  "runs.list",
  "aars.update",
  "aars.getByRunId",
  "ark.sealLog",
  "inbox.capture",
  "inbox.list",
  "inbox.get",
  "inbox.create",
  "inbox.update",
  "inbox.validate",
  "inbox.triage",
  "inbox.route",
  "inbox.move",
  "inbox.markDuplicate",
  "inbox.block",
  "inbox.archive",
  "inbox.auditTrail",
  "inbox.normalizeCodes",
  "inbox.backfillRoutingKey",
  "inbox.backfill.codes",
  "inbox.dedupe.find",
  "inbox.views.patch.report",
  "drive.resolveCanonRoot",
  "drive.listChildren",
  "drive.getMetadata",
  "llm.generate",
  "vertex.health",
  "vertex.generateText",
  "identity.list",
  "specs.list",
  "specs.create",
  "canon.list",
  "policies.list",
  "policies.create",
  "approvals.list",
  "approvals.create",
  "artifacts.list",
  "artifacts.create",
  "knowledge.list",
] as const;

// Tool request/response schemas
export const ListDatabasesRequestSchema = z.object({});

export const ListDatabasesResponseSchema = z.object({
  databases: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
    })
  ),
});

export const GetPageRequestSchema = z.object({
  pageId: z.string().min(1, "pageId is required"),
});

export const GetPageResponseSchema = z.object({
  id: z.string(),
  created_time: z.string(),
  last_edited_time: z.string(),
  properties: z.unknown(),
});

export const ListMissionsResponseSchema = z.object({
  missions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z
        .union([z.string(), z.number(), z.null()])
        .nullable()
        .transform((val) => {
          // Coerce numbers to string format (P0, P1, etc.)
          if (val === null || val === undefined) return null;
          if (typeof val === "string") return val;
          if (typeof val === "number") {
            if (val === 0) return "P0";
            if (val === 1) return "P1";
            if (val === 2) return "P2";
            if (val === 3) return "P3";
            return `P${val}`;
          }
          return null;
        }),
      owner: z.string().nullable(),
      due_date: z.string().nullable(),
      last_edited_time: z.string().optional(),
      // Optional Control Tower-aligned fields
      mission_code: z.string().nullable().optional(),
      entity: z.string().nullable().optional(),
      room: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
    })
  ),
});

// Canonical TEAM AI mission payload (client-side contract)
export const CanonicalMissionPayloadSchema = z.object({
  mission_title: z.string().min(1, "mission_title is required"),
  mission_description: z.string().min(1, "mission_description is required"),
  mission_objective: z.string().min(1, "mission_objective is required"),
  mission_code: z.string().optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  status: z
    .enum([
      "Proposed",
      "Intake",
      "Active",
      "Parked",
      "Complete",
      "Canceled",
      "Blocked",
      "Archived",
    ])
    .optional(),
  owner: z.string().optional(),
  entity: z
    .enum(["Global", "IE", "FFC", "CNGI", "RT Resells", "Personal", "Other"])
    .optional(),
  room: z
    .enum([
      "WAR",
      "ARC",
      "LAW",
      "ARK",
      "AIR",
      "BOB",
      "FOOD",
      "CLASS",
      "MIND",
      "BIB",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  mission_type: z
    .enum(["standard", "quick_task", "project_brief", "other"])
    .optional(),
  source_system: z
    .enum(["TEAM AI", "INOS", "MCP", "n8n", "GAS", "Manual", "Other"])
    .optional(),
  created_by: z.string().optional(),
  sync_key: z.string().optional(),
  brief_raw: z.string().optional(),
  external_refs: z.string().optional(),
});

// MissionCreate tool schema (thin wrapper around canonical payload)
export const MissionCreateRequestSchema = CanonicalMissionPayloadSchema.extend({
  existing_page_id: z.string().optional(),
});

// missionUpsert tool schema
export const MissionUpsertRequestSchema = z.object({
  missionData: CanonicalMissionPayloadSchema,
  upsert: z
    .object({
      notion_page_id: z.string().optional(),
      mission_code: z.string().optional(),
    })
    .optional(),
});

export const MissionUpsertResponseSchema = z.object({
  notion_page_id: z.string(),
  mission_url: z.string().optional(),
  mission_title: z.string(),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  created_at: z.string().optional(),
  last_updated_at: z.string().optional(),
});

export const UpsertMissionDocRequestSchema = z.object({
  missionData: z.object({
    id: z.string().optional(),
    title: z.string().min(1, "title is required"),
    status: MISSION_STATUS_SCHEMA,
    priority: z.number().int().optional(),
    due_date: z.string().optional(),
    // allow arbitrary additional fields
  }),
  existingPageId: z.string().optional(),
});

export const UpsertMissionDocResponseSchema = z.object({
  id: z.string(),
  created_time: z.string().optional(),
  last_edited_time: z.string(),
});

// iehq_get_capabilities tool schema
export const GetCapabilitiesRequestSchema = z.object({});

export const GetCapabilitiesResponseSchema = z.object({
  service: z.string(),
  version: z.string(),
  epoch: z.string(),
  canon: z.string(),
  tools: z.array(z.string()),
  databases: z.record(z.string()),
  event_types: z.array(z.string()),
});

export const TimelineLogRequestSchema = z.object({
  title: z.string().min(1, "title is required"),
  type: z.string().optional(),
  missionId: z.string().optional(),
  link: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().min(1, "source is required"),
  durationMinutes: z.number().int().positive().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  sync_key: z.string().min(1, "sync_key is required"),
});

// Canonical Timeline Event Schema (v1.0)
export const TimelineLogEventRequestSchema = z.object({
  event_type: z.enum([
    "MISSION_CREATED",
    "MISSION_UPDATED",
    "TASK_CREATED",
    "TASK_UPDATED",
    "RUN_STARTED",
    "RUN_ENDED",
    "AAR_CREATED",
    "AAR_UPDATED",
  ]),
  timestamp: z.string().min(1, "timestamp is required"),
  entity: z.string().optional(), // Legacy select
  entity_registry_id: z.string().optional(), // Relation to Entity Registry
  room: z.string().optional(),
  mission_id: z.string().optional(),
  task_id: z.string().optional(),
  run_id: z.string().optional(),
  aar_id: z.string().optional(),
  actor_people_id: z.string().optional(), // People relation
  sync_key: z.string().min(1, "sync_key is required"),
  summary: z.string().optional(), // 1-3 lines
  external_refs: z.string().optional(), // Links: notion pages + shell routes
  source: z.string().default("MCP Notion"),
});

export const TimelineLogResponseSchema = z.object({
  id: z.string(),
});

export const TimelineListRequestSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.string().optional(),
  missionId: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const TimelineListResponseSchema = z.object({
  request_id: z.string(),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.string().nullable(),
      event_type: z.string().nullable(),
      missionId: z.string().nullable(),
      tags: z.array(z.string()),
      source: z.string().nullable(),
      notes: z.string().nullable(),
      summary: z.string().nullable(),
      timestamp: z.string().nullable(),
      external_refs: z.string().nullable(),
      actor: z.object({
        id: z.string(),
        name: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
      }).nullable().optional(),
      link: z.string().nullable(),
      date: z.string().nullable(),
      end_date: z.string().nullable(),
      last_edited_time: z.string().optional(),
    })
  ),
});

export const TaskCreateRequestSchema = z.object({
  task_title: z.string().min(1, "task_title is required"),
  mission_id: z.string().min(1, "mission_id is required"),
  status: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  dry_run: z.boolean().default(true),
  commit: z.boolean().default(false),
});

export const TaskCreateResponseSchema = z.object({
  task_id: z.string().optional(),
  url: z.string().optional(),
  dry_run: z.boolean(),
  warnings: z.array(z.string()),
});

export const RoomsListRequestSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const RoomsListResponseSchema = z.object({
  rooms: z.array(z.object({
    id: z.string(),
    room_id: z.string(),
    room_code: z.string().nullable().optional(),
    room_name: z.string(),
    status: z.string().nullable().optional(),
    owner: z.string().nullable().optional(),
    entity_id: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    notion_url: z.string().optional(),
  })),
});

export const TasksListRequestSchema = z.object({
  mission_id: z.string().optional(),
  room_code: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const TasksListResponseSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    task_id: z.string(),
    title: z.string(),
    status: z.string().nullable().optional(),
    owner: z.string().nullable().optional(),
    mission_id: z.string().nullable().optional(),
    entity_id: z.string().nullable().optional(),
    room_code: z.string().nullable().optional(),
    due: z.string().nullable().optional(),
    priority: z.union([z.string(), z.number()]).nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    notion_url: z.string().optional(),
  })),
});

export const MissionsListRequestSchema = z.object({
  query: z.string().optional(),
  room_code: z.string().optional(),
  guild_code: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const GuildsListRequestSchema = z.object({});

export const GuildsListResponseSchema = z.object({
  guilds: z.array(z.object({
    guild_id: z.string(),
    guild_code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    mission_count: z.number().optional(),
  })),
});

export const ListAgentsResponseSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      handle: z.string().nullable(),
      status: z.string().nullable(),
      pod: z.string().nullable(),
    })
  ),
});

// Drive tool schemas
export const DriveResolveCanonRootRequestSchema = z.object({
  driveId: z.string().min(1, "driveId is required"),
  canonRootName: z.string().min(1, "canonRootName is required"),
});

export const DriveListChildrenRequestSchema = z.object({
  driveId: z.string().min(1, "driveId is required"),
  parentId: z.string().nullable(),
  pageToken: z.string().optional().nullable(),
  pageSize: z.number().int().positive().max(200).optional(),
  includeFiles: z.boolean().optional(),
});

export const DriveGetMetadataRequestSchema = z.object({
  driveId: z.string().min(1, "driveId is required"),
  fileId: z.string().min(1, "fileId is required"),
});

const LlmGenerateContentSchema = z
  .object({
    role: z.string().optional(),
    parts: z
      .array(z.object({ text: z.string().min(1) }))
      .optional(),
    text: z.string().min(1).optional(),
  })
  .refine((val) => val.parts || val.text, {
    message: "contents entries must include parts or text",
  });

export const LlmGenerateRequestSchema = z.object({
  model: z.string().min(1, "model is required"),
  contents: z.union([
    z.string().min(1, "contents is required"),
    z.array(LlmGenerateContentSchema),
  ]),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export const LlmGenerateResponseSchema = z.object({
  text: z.string(),
  usage: z
    .object({
      promptTokens: z.number().int().optional(),
      outputTokens: z.number().int().optional(),
      totalTokens: z.number().int().optional(),
    })
    .optional(),
  model: z.string(),
});

export const VertexHealthResponseSchema = z.object({
  ok: z.boolean(),
  project_id: z.string(),
  region: z.string(),
  model: z.string(),
  auth_mode_resolved: z.enum(["adc", "service_account"]),
  timing_ms: z.number(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .nullable()
    .optional(),
});

export const VertexGenerateTextRequestSchema = z.object({
  request_id: z.string().min(1, "request_id is required"),
  prompt: z.string().min(1, "prompt is required"),
  json_only: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_output_tokens: z.number().int().positive().optional(),
  model: z.string().optional(),
  system: z.string().optional(),
});

export const VertexGenerateTextResponseSchema = z.object({
  ok: z.boolean(),
  request_id: z.string(),
  model: z.string(),
  text: z.string().nullable(),
  usage: z
    .object({
      prompt_tokens: z.number().nullable(),
      output_tokens: z.number().nullable(),
      total_tokens: z.number().nullable(),
    })
    .nullable(),
  timing_ms: z.number(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .nullable()
    .optional(),
});

export class Tools {
  private client: NotionClient;
  private warOps: WarOpsTools;
  private driveClient: GoogleDriveClient;
  private llmClient: VertexGeminiClient;

  constructor() {
    this.client = new NotionClient();
    this.warOps = new WarOpsTools();
    this.driveClient = new GoogleDriveClient();
    this.llmClient = new VertexGeminiClient();
  }

  private static INBOX_STATUS = [
    "new",
    "triaged",
    "routed",
    "verified",
    "closed",
    "blocked",
    "duplicate",
    "archived",
  ];

  private buildMoveLogLine(params: {
    actor: string;
    action: string;
    from: string;
    to: string;
    note?: string;
    request_id: string;
  }): string {
    const safeNote = params.note
      ? params.note.replace(/\s+/g, "_").slice(0, 140)
      : "none";
    return `actor=${params.actor} action=${params.action} from=${params.from} to=${params.to} note=${safeNote} request_id=${params.request_id}`;
  }

  private buildMoveLogEntry(params: {
    actor: string;
    action: string;
    from: string;
    to: string;
    note?: string;
    request_id: string;
  }): string {
    return `[${new Date().toISOString()}] ${this.buildMoveLogLine(params)}`;
  }

  private assertStatusTransition(
    from: string,
    to: string,
    context?: { inbox_id?: string }
  ) {
    const allowed: Record<string, string[]> = {
      new: ["triaged", "blocked", "duplicate", "archived"],
      triaged: ["routed", "blocked", "duplicate", "archived"],
      routed: ["verified", "closed", "blocked"],
      verified: ["closed"],
      blocked: ["triaged", "archived"],
      duplicate: ["archived"],
      archived: [],
    };
    if (!allowed[from] || !allowed[from].includes(to)) {
      throw new MCPError("INBOX_E004", "Invalid state transition", {
        from,
        to,
        inbox_id: context?.inbox_id,
      });
    }
  }

  private parseRoutingKey(key: string) {
    const parts = key.split(":");
    if (parts.length !== 4) return null;
    return {
      lane: parts[0],
      layer: parts[1],
      object_type: parts[2],
      destination_db: parts[3],
    };
  }

  private computeRoutingKey(params: {
    lane: string;
    layer: string;
    object_type: string;
    destination_db?: string;
  }) {
    return computeInboxRoutingKey({
      lane: params.lane,
      layer: params.layer,
      object_type: params.object_type,
      destination_db_code: params.destination_db,
    });
  }

  private resolveSourceType(input: {
    source_type_code?: string | null;
    source_type?: string | null;
    source_type_select?: string | null;
  }) {
    const normalized = normalizeSourceType({
      source_type_code: input.source_type_code || undefined,
      source_type: input.source_type || undefined,
      source_type_select: input.source_type_select || undefined,
    });
    if (!normalized) return null;
    return {
      code: normalized.source_type_code,
      label:
        normalized.source_type_select ||
        SOURCE_TYPE_CODE_TO_LABEL[normalized.source_type_code],
    };
  }

  private resolveDestinationDb(input: {
    destination_db_code?: string | null;
    destination_db?: string | null;
    destination_db_select?: string | null;
  }) {
    const normalized = normalizeDestinationDb({
      destination_db_code: input.destination_db_code || undefined,
      destination_db: input.destination_db || undefined,
      destination_db_select: input.destination_db_select || undefined,
    });
    if (!normalized) return null;
    return {
      code: normalized.destination_db_code,
      label:
        normalized.destination_db_select ||
        DEST_DB_CODE_TO_LABEL[normalized.destination_db_code],
    };
  }

  private resolveRoutingStatus(input: {
    routing_status_code?: string | null;
    routing_status?: string | null;
    routing_status_select?: string | null;
  }) {
    const normalized = normalizeRoutingStatus({
      routing_status_code: input.routing_status_code || undefined,
      routing_status: input.routing_status || undefined,
      routing_status_select: input.routing_status_select || undefined,
    });
    if (!normalized) return null;
    return {
      code: normalized.routing_status_code,
      label:
        normalized.routing_status_select ||
        ROUTING_STATUS_CODE_TO_LABEL[normalized.routing_status_code],
    };
  }

  /**
   * Tool: system.capabilities
   * Returns a machine-readable summary of MCP capabilities, tools, and DB bindings.
   */
  async ["system.capabilities"](params: unknown) {
    try {
      logger.info("Calling system.capabilities");
      GetCapabilitiesRequestSchema.parse(params || {});
      const config = (this.client as any).config;

      return {
        service: "mcp-notion",
        version: "0.1.0",
        epoch: "INOS_E0",
        canon: "TEAM AI v1.0",
        tools: [...PUBLIC_TOOL_NAMES],
        databases: {
          missions: config.NOTION_DB_MISSIONS || "MISSING",
          tasks: config.NOTION_DB_TASKS || "MISSING",
          timeline: config.NOTION_DB_TIMELINE || "MISSING",
          mission_runs:
            (config as any).NOTION_MISSION_RUNS_DB_ID ||
            config.NOTION_DB_RUNS_AARS ||
            "MISSING",
          aars:
            (config as any).NOTION_MISSION_RUNS_DB_ID ||
            config.NOTION_DB_RUNS_AARS ||
            "MISSING",
          runs_aars_legacy_alias: config.NOTION_DB_RUNS_AARS || "MISSING",
          inbox: config.NOTION_DB_INBOX || "MISSING",
          rooms: config.NOTION_DB_ROOMS || "MISSING",
          entities: config.NOTION_DB_ENTITIES || "MISSING",
          agents: config.NOTION_DB_TEAM_AI_PEOPLE || (config as any).NOTION_DB_AGENTS || "MISSING",
          food_ingredients: (config as any).NOTION_FOOD_INGREDIENTS_DB_ID || "MISSING",
        },
        database_policies: {
          missions: "active",
          tasks: "active",
          timeline: "active",
          mission_runs: "active_live_target",
          aars: "same_row_on_mission_runs",
          runs_aars_legacy_alias: "compatibility_alias_only",
          inbox: "active_if_configured",
          rooms: "active_if_configured",
          entities: "active_if_configured",
          agents: "active_if_configured",
          food_ingredients: "active_shared_top_level",
          sot: "active_shared_top_level_no_runtime_writer",
        },
        event_types: [
          "MISSION_CREATED",
          "MISSION_UPDATED",
          "TASK_CREATED",
          "TASK_UPDATED",
          "RUN_STARTED",
          "RUN_ENDED",
          "AAR_CREATED",
          "AAR_UPDATED",
          "AAR_COMMITTED",
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid request", {
          operation: "system.capabilities",
          zodErrors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Tool: databases.list
   * List all Notion databases accessible to INOS_E0.
   */
  async ["databases.list"](params: unknown) {
    try {
      logger.info("Calling databases.list");
      ListDatabasesRequestSchema.parse(params);
      const result = await this.client["databases.list"]();
      return ListDatabasesResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Provide BAD_REQUEST with field-level context when possible
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "databases.list", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in databases.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "databases.list",
      });
    }
  }

  /**
   * Tool: pages.get
   * Retrieve a specific Notion page by ID.
   */
  async ["pages.get"](params: unknown) {
    try {
      logger.info("Calling pages.get", { params });
      const { pageId } = GetPageRequestSchema.parse(params);
      const result = await this.client["pages.get"](pageId);
      return GetPageResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "pages.get", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in pages.get", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "pages.get",
      });
    }
  }

  /**
   * Tool: rooms.list
   * Fetch all rooms from the Rooms Registry.
   */
  async["rooms.list"](params: unknown) {
    try {
      logger.info("Calling rooms.list", { params });
      const parsed = RoomsListRequestSchema.parse(params || {});
      const result = await this.client.listRooms(parsed);
      return RoomsListResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid request parameters", {
          operation: "rooms.list",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in rooms.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "rooms.list",
      });
    }
  }

  /**
   * Tool: missions.list
   * Fetch missions from the missions database (with filtering).
   */
  async["missions.list"](params: unknown) {
    try {
      logger.info("Calling missions.list", { params });
      const parsed = MissionsListRequestSchema.parse(params || {});
      const result = await this.client.listMissions(parsed);
      return ListMissionsResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid request parameters", {
          operation: "missions.list",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in missions.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "missions.list",
      });
    }
  }

  /**
   * Tool: tasks.list
   * Fetch tasks from the tasks database (with filtering).
   */
  async["tasks.list"](params: unknown) {
    try {
      logger.info("Calling tasks.list", { params });
      const parsed = TasksListRequestSchema.parse(params || {});
      const result = await this.client.listTasks(parsed);
      return TasksListResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid request parameters", {
          operation: "tasks.list",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in tasks.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "tasks.list",
      });
    }
  }

  /**
   * Tool: guilds.list
   * Returns a list of available guilds (derived from missions).
   */
  async["guilds.list"](params: unknown) {
    try {
      logger.info("Calling guilds.list");
      GuildsListRequestSchema.parse(params || {});

      // For now, return a standardized list of guilds while we implement full derivation
      const guilds = [
        { guild_id: "G1", guild_code: "ENGINEERING", name: "Engineering Guild", description: "Builders and architects of the network.", mission_count: 5 },
        { guild_id: "G2", guild_code: "OPERATIONS", name: "Operations Guild", description: "Ensuring stability and coordination.", mission_count: 3 },
        { guild_id: "G3", guild_code: "RESEARCH", name: "Research Guild", description: "Mapping the unknown and finding new paths.", mission_count: 2 },
        { guild_id: "G4", guild_code: "COMMUNITY", name: "Community Guild", description: "Growing the network and supporting members.", mission_count: 1 },
      ];

      return { guilds };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid request parameters", {
          operation: "guilds.list",
          zodErrors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Tool: tasks.create
   * Create a [WAR] Task linked to a mission.
   */
  async ["tasks.create"](params: unknown) {
    try {
      logger.info("Calling tasks.create", { params });
      const parsed = TaskCreateRequestSchema.parse(params || {});
      const warnings: string[] = [];

      if (!parsed.commit || parsed.dry_run) {
        return TaskCreateResponseSchema.parse({
          task_id: undefined,
          url: undefined,
          dry_run: true,
          warnings,
        });
      }

      const result = await this.client["tasks.create"]({
        missionId: parsed.mission_id,
        taskTitle: parsed.task_title,
        status: parsed.status,
        priority: parsed.priority,
        due_date: parsed.due_date,
        tags: parsed.tags,
        notes: parsed.notes,
        source_system: "INOS",
      });

      return TaskCreateResponseSchema.parse({
        task_id: result.id,
        url: result.url,
        dry_run: false,
        warnings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "tasks.create", zodErrors: error.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in tasks.create", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "tasks.create",
      });
    }
  }

  /**
   * Tool: missions.upsert
   * Create or update a [WAR] Mission using the canonical mission payload.
   */
  async ["missions.upsert"](params: unknown) {
    try {
      logger.info("Calling missions.upsert", { params });
      const parsed = MissionUpsertRequestSchema.parse(params || {});
      const { missionData, upsert } = parsed;
      // Extract userContext from params and pass it through
      const userContext = (params as any)?.userContext;
      const enrichedUpsert = {
        ...upsert,
        userContext,
      };
      const result = await this.client["missions.upsert"](
        missionData,
        enrichedUpsert
      );
      return MissionUpsertResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "mission_upsert", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in missions.upsert", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "mission_upsert",
      });
    }
  }

  /**
   * Tool: missions.create
   * Create or update a [WAR] Mission using the TEAM AI mission brief payload.
   *
   * This is a thin adapter around upsertMissionDoc that:
   * - Accepts mission_title / mission_description / mission_objective plus metadata
   * - Maps external status/priority enums into the internal Notion fields
   * - Preserves the raw brief fields on the missionData payload for future schema evolution
   */
  async ["missions.create"](params: unknown) {
    try {
      logger.info("Calling missions.create", { params });
      const parsed = MissionCreateRequestSchema.parse(params);

      // Map external mission status to internal mission status options
      const statusMap: Record<string, string> = {
        Proposed: "Proposed",
        Intake: "Proposed", // Intake currently maps to Proposed in Notion
        Active: "In Flight",
        Parked: "Parked",
        Complete: "Done",
        Canceled: "Parked",
      };

      const internalStatus =
        (parsed.status && statusMap[parsed.status]) || "Proposed";

      // Map external priority enum into numeric priority
      const priorityMap: Record<string, number> = {
        P0: 0,
        P1: 1,
        P2: 2,
        P3: 3,
      };

      const missionData: Record<string, unknown> = {
        title: parsed.mission_title,
        status: internalStatus,
        mission_title: parsed.mission_title,
        mission_description: parsed.mission_description,
        mission_objective: parsed.mission_objective,
      };

      if (parsed.priority) {
        missionData.priority = priorityMap[parsed.priority];
      }
      if (parsed.due_date) {
        missionData.due_date = parsed.due_date;
      }

      // Pass through metadata for future Notion mapping without losing information
      if (parsed.owner) missionData.owner = parsed.owner;
      if (parsed.entity) missionData.entity = parsed.entity;
      if (parsed.room) missionData.room = parsed.room;
      if (parsed.tags) missionData.tags = parsed.tags;
      if (parsed.start_date) missionData.start_date = parsed.start_date;
      if (parsed.mission_type) missionData.mission_type = parsed.mission_type;

      const result = await this.client["missions.upsert"](missionData, {
        notion_page_id: parsed.existing_page_id || undefined,
      });

      return UpsertMissionDocResponseSchema.parse({
        id: (result as any).notion_page_id,
        created_time: (result as any).created_at,
        last_edited_time: (result as any).last_updated_at,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "mission_create", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in missions.create", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "mission_create",
      });
    }
  }

  /**
   * Tool: upsertMissionDoc
   * Create or update a mission document in the TEAM AI missions database.
   */
  async upsertMissionDoc(params: unknown) {
    try {
      logger.info("Calling upsertMissionDoc", { params });
      const { missionData, existingPageId } =
        UpsertMissionDocRequestSchema.parse(params);
      const result = await this.client.upsertMissionDoc(
        missionData,
        existingPageId
      );
      return UpsertMissionDocResponseSchema.parse({
        id: (result as any).id,
        created_time: (result as any).created_time,
        last_edited_time: (result as any).last_edited_time,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "upsert_mission_doc", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in upsertMissionDoc", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "upsert_mission_doc",
      });
    }
  }

  /**
   * Tool: timeline.log
   * Log a PoLE / timeline event into the configured Timeline DB.
   */
  async ["timeline.log"](params: unknown) {
    try {
      logger.info("Calling timeline.log", { params });
      const parsed = TimelineLogRequestSchema.parse(params);
      const result = await this.client.logTimelineEvent(parsed);
      return TimelineLogResponseSchema.parse({ id: (result as any).id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "timeline.log", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in timeline.log", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "timeline.log",
      });
    }
  }

  /**
   * Tool: timeline.list
   * List timeline events with optional filters (date/type/mission).
   */
  async ["timeline.list"](params: unknown) {
    try {
      const request_id = `tl_${Date.now().toString(36)}`;
      logger.info("Calling timeline.list", { params, request_id });
      const filters = TimelineListRequestSchema.parse(params || {});
      const result = await this.client.listTimelineEvents(filters);
      const response = {
        request_id,
        events: result.events || [],
      };
      return TimelineListResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "timeline.list", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in timeline.list", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "timeline.list",
      });
    }
  }

  /**
   * Tool: timeline.logEvent
   * Canonical Timeline event logging (v1.0)
   * Logs events with full schema support: Event Type enum, relations, actor, etc.
   */
  async ["timeline.logEvent"](params: unknown) {
    try {
      logger.info("Calling timeline.logEvent", { params });
      const parsed = TimelineLogEventRequestSchema.parse(params);

      // Auto-format title if mission_id is provided
      let title: string = parsed.event_type;
      if (parsed.mission_id) {
        try {
          const missions = await this.client.listMissions();
          const mission = missions.missions.find(
            (m) => m.id === parsed.mission_id
          );
          if (mission) {
            const entity = parsed.entity || mission.entity || "";
            title = `[${entity}] ${parsed.event_type} â€” ${mission.title}`;
          }
        } catch (err) {
          logger.warn("Failed to fetch mission for title formatting", { err });
        }
      }

      const result = await this.client.logTimelineEvent({
        title,
        event_type: parsed.event_type,
        timestamp: parsed.timestamp || new Date().toISOString(),
        entity: parsed.entity,
        entity_registry_id: parsed.entity_registry_id,
        room: parsed.room,
        missionId: parsed.mission_id,
        task_id: parsed.task_id,
        run_id: parsed.run_id,
        aar_id: parsed.aar_id,
        actor_people_id: parsed.actor_people_id,
        sync_key: parsed.sync_key,
        summary: parsed.summary,
        external_refs: parsed.external_refs,
        source: "INOS Shell",
      });

      return { id: (result as any).id };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "timeline.logEvent", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in timeline.logEvent", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "timeline.logEvent",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: timeline.queryByMission
   * Query timeline events filtered by mission, sorted by timestamp desc
   */
  async ["timeline.queryByMission"](params: unknown) {
    try {
      const request_id = `tlm_${Date.now().toString(36)}`;
      logger.info("Calling timeline.queryByMission", { params, request_id });
      const parsed = z
        .object({
          mission_id: z.string().min(1, "mission_id is required"),
          limit: z.number().int().positive().max(100).optional().default(50),
        })
        .parse(params);

      const result = await this.client.listTimelineEvents({
        missionId: parsed.mission_id,
        limit: parsed.limit,
      });

      const response = {
        request_id,
        events: result.events || [],
      };

      return TimelineListResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "timeline.queryByMission",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in timeline.queryByMission", error, {
        params,
      });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "timeline.queryByMission",
        originalError: String(error),
      });
    }
  }

  // ----- New small, high-leverage tools -----

  // missions.tasks.list
  public static MissionsTasksListRequestSchema = z.object({
    missionId: z.string().min(1, "missionId is required"),
  });

  async missionsTasksList(params: unknown) {
    try {
      const { missionId } = Tools.MissionsTasksListRequestSchema.parse(params);
      const tasks = await this.client.queryTasksByMission(missionId);
      return { tasks };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "missions.tasks.list",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in missionsTasksList", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "missions.tasks.list",
      });
    }
  }

  // ark.seal.log
  public static ArkSealLogRequestSchema = z.object({
    assetId: z.string().min(1, "assetId is required"),
    assetTitle: z.string().optional(),
    missionId: z.string().optional(),
    notes: z.string().optional(),
  });

  async ["ark.sealLog"](params: unknown) {
    try {
      const { assetId, assetTitle, missionId, notes } =
        Tools.ArkSealLogRequestSchema.parse(params);
      const asset = await this.client.ensureArkAsset(assetId, assetTitle);
      const timeline = await this.client.logTimelineEvent({
        title: `ARK Seal: ${assetTitle || assetId}`,
        type: "asset_sealed",
        missionId,
        link: (asset as any)?.url || undefined,
        notes,
      });
      return {
        asset: { id: (asset as any)?.id || assetId },
        timeline: { id: (timeline as any)?.id },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "ark.seal.log",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in ark.sealLog", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "ark.seal.log",
      });
    }
  }

  async arkSealLog(params: unknown) {
    return this["ark.sealLog"](params);
  }

  // inbox.capture
  public static InboxCaptureRequestSchema = z.object({
    title: z.string().min(1, "title is required"),
    source: z.string().min(1, "source is required"),
    type: z.string().optional(),
    notes: z.string().optional(),
  });

  async ["inbox.capture"](params: unknown) {
    try {
      const { title, source, type, notes } =
        Tools.InboxCaptureRequestSchema.parse(params);
      const created = await this.client.createInboxItem({
        title,
        source,
        type,
        notes,
      });
      return { id: (created as any).id };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "inbox.capture",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in inbox.capture", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "inbox.capture",
      });
    }
  }

  async inboxCapture(params: unknown) {
    return this["inbox.capture"](params);
  }
  // inbox.create
  public static InboxCreateRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    item: z.string().min(1, "item is required"),
    source_type: z.string().optional(),
    source_type_code: z.string().optional(),
    source_url: z.string().optional(),
    source_ref: z.string().optional(),
    captured_at: z.string().optional(),
    captured_by: z.string().optional(),
    summary: z.string().min(1).max(280),
    sensitivity: z.string().optional(),
    sensitivity_code: z.string().optional(),
    entity_name: z.string().optional(),
    entity_id: z.string().optional(),
    room_name: z.string().optional(),
    room_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lane: z.string().optional(),
    lane_code: z.string().optional(),
    layer: z.string().optional(),
    layer_code: z.string().optional(),
    domain: z.string().optional(),
    domain_code: z.string().optional(),
    object_type: z.string().optional(),
    object_type_code: z.string().optional(),
    owner_pod: z.string().optional(),
    owner_pod_code: z.string().optional(),
    destination_db: z.string().optional(),
    destination_db_code: z.string().optional(),
    routing_status: z.string().optional(),
    routing_status_code: z.string().optional(),
    blocker_reason: z.string().optional(),
    duplicate_of: z.string().optional(),
    coerce: z.boolean().optional(),
  });

  async["inbox.create"](params: unknown) {
    try {
      logger.info("Calling inbox.create", { params });
      const parsed = Tools.InboxCreateRequestSchema.parse(params || {});
      const coerce = parsed.coerce === true;
      const sourceTypeResolved = this.resolveSourceType({
        source_type_code: parsed.source_type_code,
        source_type: parsed.source_type,
      });
      if (!sourceTypeResolved) {
        throw new MCPError(
          parsed.source_type || parsed.source_type_code
            ? "E_INBOX_006"
            : "E_INBOX_001",
          "Missing or unmapped source_type",
          { operation: "inbox.create" }
        );
      }

      const destinationResolved = this.resolveDestinationDb({
        destination_db_code: parsed.destination_db_code,
        destination_db: parsed.destination_db,
      });

      const statusResolved =
        this.resolveRoutingStatus({
          routing_status_code: parsed.routing_status_code,
          routing_status: parsed.routing_status,
        }) || { code: "new", label: "New" };

      const laneCode = parsed.lane_code || parsed.lane;
      const layerCode = parsed.layer_code || parsed.layer;
      const objectTypeCode = parsed.object_type_code || parsed.object_type;
      const domainCode = parsed.domain_code || parsed.domain;
      const ownerPodCode = parsed.owner_pod_code || parsed.owner_pod;
      const sensitivityCode = parsed.sensitivity_code || parsed.sensitivity;

      if (!laneCode || !layerCode || !objectTypeCode) {
        if (!coerce) {
          throw new MCPError("E_INBOX_001", "Missing required routing fields", {
            operation: "inbox.create",
            missing: {
              lane: !laneCode,
              layer: !layerCode,
              object_type: !objectTypeCode,
            },
          });
        }
      }

      const laneFinal = laneCode || "execution";
      const layerFinal = layerCode || "L0";
      const objectTypeFinal = objectTypeCode || "note";
      const domainFinal = domainCode || "systems";
      const ownerPodFinal = ownerPodCode || "WAR";
      const sensitivityFinal = sensitivityCode || "internal";

      if (statusResolved.code === "blocked" && !parsed.blocker_reason) {
        throw new MCPError("E_INBOX_005", "blocker_reason required", {
          operation: "inbox.create",
        });
      }
      if (statusResolved.code === "duplicate" && !parsed.duplicate_of) {
        throw new MCPError("E_INBOX_005", "duplicate_of required", {
          operation: "inbox.create",
        });
      }

      const routingKey = computeInboxRoutingKey({
        lane: laneFinal,
        layer: layerFinal,
        object_type: objectTypeFinal,
        destination_db_code: destinationResolved?.code || "",
      });

      const created = await this.client.createInboxEntry({
        item: parsed.item,
        source_type: sourceTypeResolved.label || parsed.source_type,
        source_type_code: sourceTypeResolved.code,
        source_url: parsed.source_url,
        source_ref: parsed.source_ref,
        captured_at: parsed.captured_at || new Date().toISOString(),
        captured_by: parsed.captured_by || parsed.actor,
        summary: parsed.summary,
        sensitivity: parsed.sensitivity || sensitivityFinal,
        sensitivity_code: sensitivityFinal,
        entity_name: parsed.entity_name,
        entity_id: parsed.entity_id,
        room_name: parsed.room_name,
        room_id: parsed.room_id,
        tags: parsed.tags,
        lane: parsed.lane || laneFinal,
        lane_code: laneFinal,
        layer: parsed.layer || layerFinal,
        layer_code: layerFinal,
        domain: parsed.domain || domainFinal,
        domain_code: domainFinal,
        object_type: parsed.object_type || objectTypeFinal,
        object_type_code: objectTypeFinal,
        owner_pod: parsed.owner_pod || ownerPodFinal,
        owner_pod_code: ownerPodFinal,
        destination_db: destinationResolved?.label || parsed.destination_db,
        destination_db_code: destinationResolved?.code,
        routing_key: routingKey,
        routing_status: statusResolved.label || "New",
        routing_status_code: statusResolved.code,
        blocker_reason: parsed.blocker_reason,
        duplicate_of: parsed.duplicate_of,
        move_log: this.buildMoveLogEntry({
          actor: parsed.actor,
          action: "CREATE",
          from: "none",
          to: statusResolved.code || "new",
          note: "created",
          request_id: parsed.request_id,
        }),
        last_move_request_id: parsed.request_id,
      });
      return { ok: true, data: { id: (created as any).id }, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Missing or invalid required fields", {
          operation: "inbox.create",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "Notion write failed", {
        operation: "inbox.create",
      });
    }
  }

  // inbox.update
  public static InboxUpdateRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
    allow_overwrite: z.boolean().optional(),
    patch: z.object({
      lane: z.string().optional(),
      lane_code: z.string().optional(),
      layer: z.string().optional(),
      layer_code: z.string().optional(),
      domain: z.string().optional(),
      domain_code: z.string().optional(),
      object_type: z.string().optional(),
      object_type_code: z.string().optional(),
      owner_pod: z.string().optional(),
      owner_pod_code: z.string().optional(),
      destination_db: z.string().optional(),
      destination_db_code: z.string().optional(),
      summary: z.string().max(280).optional(),
      sensitivity: z.string().optional(),
      sensitivity_code: z.string().optional(),
      entity_name: z.string().optional(),
      entity_id: z.string().optional(),
      room_name: z.string().optional(),
      room_id: z.string().optional(),
      source_type: z.string().optional(),
      source_type_code: z.string().optional(),
      source_url: z.string().optional(),
      source_ref: z.string().optional(),
      routing_status: z.string().optional(),
      routing_status_code: z.string().optional(),
      routing_key: z.string().optional(),
      target_url: z.string().optional(),
      target_notion_id: z.string().optional(),
      blocker_reason: z.string().optional(),
      duplicate_of: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  });

  async["inbox.update"](params: unknown) {
    try {
      logger.info("Calling inbox.update", { params });
      const parsed = Tools.InboxUpdateRequestSchema.parse(params || {});
      const existing = await this.client.getInboxEntry(parsed.inbox_id);
      const patch: any = { ...parsed.patch };
      const allowOverwrite = parsed.allow_overwrite === true;

      const ensureNoOverwrite = (
        field: string,
        incoming?: string | null,
        existingVal?: string | null
      ) => {
        if (!incoming) return;
        if (!existingVal) return;
        if (incoming === existingVal) return;
        if (allowOverwrite) return;
        throw new MCPError("E_INBOX_007", "Attempted overwrite of code field", {
          field,
          existing: existingVal,
          incoming,
          inbox_id: parsed.inbox_id,
        });
      };

      if (patch.source_type || patch.source_type_code) {
        const resolved = this.resolveSourceType({
          source_type_code: patch.source_type_code,
          source_type: patch.source_type,
        });
        if (!resolved) {
          throw new MCPError("E_INBOX_006", "Unknown source_type label", {
            operation: "inbox.update",
            inbox_id: parsed.inbox_id,
          });
        }
        ensureNoOverwrite(
          "source_type_code",
          resolved.code,
          existing.source_type_code || null
        );
        patch.source_type_code = resolved.code;
        patch.source_type = resolved.label || patch.source_type;
      }

      if (patch.destination_db || patch.destination_db_code) {
        const resolved = this.resolveDestinationDb({
          destination_db_code: patch.destination_db_code,
          destination_db: patch.destination_db,
        });
        if (!resolved) {
          throw new MCPError("E_INBOX_006", "Unknown destination_db label", {
            operation: "inbox.update",
            inbox_id: parsed.inbox_id,
          });
        }
        ensureNoOverwrite(
          "destination_db_code",
          resolved.code,
          existing.destination_db_code || null
        );
        patch.destination_db_code = resolved.code;
        patch.destination_db = resolved.label || patch.destination_db;
      }

      if (patch.routing_status || patch.routing_status_code) {
        const resolved = this.resolveRoutingStatus({
          routing_status_code: patch.routing_status_code,
          routing_status: patch.routing_status,
        });
        if (!resolved) {
          throw new MCPError("E_INBOX_006", "Unknown routing_status label", {
            operation: "inbox.update",
            inbox_id: parsed.inbox_id,
          });
        }
        const fromStatus =
          existing.routing_status_code || existing.routing_status || "new";
        this.assertStatusTransition(fromStatus, resolved.code, {
          inbox_id: parsed.inbox_id,
        });
        patch.routing_status_code = resolved.code;
        patch.routing_status = resolved.label || patch.routing_status;
      }

      if (patch.lane_code || patch.lane) {
        const laneCode = patch.lane_code || patch.lane;
        ensureNoOverwrite(
          "lane_code",
          laneCode,
          existing.lane_code || null
        );
        patch.lane_code = laneCode;
      }
      if (patch.layer_code || patch.layer) {
        const layerCode = patch.layer_code || patch.layer;
        ensureNoOverwrite(
          "layer_code",
          layerCode,
          existing.layer_code || null
        );
        patch.layer_code = layerCode;
      }
      if (patch.object_type_code || patch.object_type) {
        const objectTypeCode = patch.object_type_code || patch.object_type;
        ensureNoOverwrite(
          "object_type_code",
          objectTypeCode,
          existing.object_type_code || null
        );
        patch.object_type_code = objectTypeCode;
      }
      if (patch.domain_code || patch.domain) {
        const domainCode = patch.domain_code || patch.domain;
        ensureNoOverwrite(
          "domain_code",
          domainCode,
          existing.domain_code || null
        );
        patch.domain_code = domainCode;
      }
      if (patch.owner_pod_code || patch.owner_pod) {
        const ownerPodCode = patch.owner_pod_code || patch.owner_pod;
        ensureNoOverwrite(
          "owner_pod_code",
          ownerPodCode,
          existing.owner_pod_code || null
        );
        patch.owner_pod_code = ownerPodCode;
      }
      if (patch.sensitivity_code || patch.sensitivity) {
        const sensitivityCode = patch.sensitivity_code || patch.sensitivity;
        ensureNoOverwrite(
          "sensitivity_code",
          sensitivityCode,
          existing.sensitivity_code || null
        );
        patch.sensitivity_code = sensitivityCode;
      }

      const laneFinal =
        patch.lane_code || patch.lane || existing.lane_code || existing.lane;
      const layerFinal =
        patch.layer_code || patch.layer || existing.layer_code || existing.layer;
      const objectTypeFinal =
        patch.object_type_code ||
        patch.object_type ||
        existing.object_type_code ||
        existing.object_type;
      const destinationCodeFinal =
        patch.destination_db_code || existing.destination_db_code || "";

      const shouldRecompute =
        patch.lane_code ||
        patch.lane ||
        patch.layer_code ||
        patch.layer ||
        patch.object_type_code ||
        patch.object_type ||
        patch.destination_db_code ||
        patch.destination_db ||
        !existing.routing_key;

      if (shouldRecompute && laneFinal && layerFinal && objectTypeFinal) {
        patch.routing_key = computeInboxRoutingKey({
          lane: laneFinal,
          layer: layerFinal,
          object_type: objectTypeFinal,
          destination_db_code: destinationCodeFinal,
        });
      }

      if (patch.routing_key && !isRoutingKeyValid(patch.routing_key)) {
        throw new MCPError("E_INBOX_003", "Invalid routing_key format", {
          operation: "inbox.update",
          routing_key: patch.routing_key,
          inbox_id: parsed.inbox_id,
        });
      }

      const nextStatus =
        patch.routing_status_code ||
        patch.routing_status ||
        existing.routing_status_code ||
        existing.routing_status ||
        "new";

      if (
        nextStatus === "blocked" &&
        !(patch.blocker_reason || existing.blocker_reason)
      ) {
        throw new MCPError("E_INBOX_005", "blocker_reason required", {
          operation: "inbox.update",
          inbox_id: parsed.inbox_id,
        });
      }
      if (
        nextStatus === "duplicate" &&
        !(patch.duplicate_of || existing.duplicate_of)
      ) {
        throw new MCPError("E_INBOX_005", "duplicate_of required", {
          operation: "inbox.update",
          inbox_id: parsed.inbox_id,
        });
      }
      if (
        ["routed", "verified", "closed"].includes(nextStatus) &&
        !destinationCodeFinal
      ) {
        throw new MCPError(
          "E_INBOX_005",
          "destination_db_code required for routed/verified/closed",
          { operation: "inbox.update", inbox_id: parsed.inbox_id }
        );
      }

      await this.client.updateInboxEntry(
        parsed.inbox_id,
        patch,
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "UPDATE",
          from: existing.routing_status_code || existing.routing_status || "new",
          to: nextStatus,
          note: "update",
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Missing required fields", {
          operation: "inbox.update",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "Notion write failed", {
        operation: "inbox.update",
      });
    }
  }

  // inbox.list
  public static InboxListRequestSchema = z.object({
    request_id: z.string().optional(),
    status: z.string().optional(),
    entity_id: z.string().optional(),
    room_id: z.string().optional(),
    limit: z.number().int().positive().max(200).optional(),
    cursor: z.string().optional(),
  });

  async["inbox.list"](params: unknown) {
    try {
      logger.info("Calling inbox.list", { params });
      const parsed = Tools.InboxListRequestSchema.parse(params || {});
      const result = await this.client.listInboxEntries(parsed);
      return { ok: true, data: result, request_id: parsed.request_id || "" };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("INBOX_E001", "Invalid request parameters", {
          operation: "inbox.list",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "Notion read failed", {
        operation: "inbox.list",
      });
    }
  }

  // inbox.get
  public static InboxGetRequestSchema = z.object({
    request_id: z.string().optional(),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.get"](params: unknown) {
    try {
      logger.info("Calling inbox.get", { params });
      const parsed = Tools.InboxGetRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      return { ok: true, data: entry, request_id: parsed.request_id || "" };
    } catch (error) {
      throw new MCPError("INBOX_E006", "NotFound", {
        operation: "inbox.get",
      });
    }
  }

  // inbox.validate
  public static InboxValidateRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.validate"](params: unknown) {
    try {
      logger.info("Calling inbox.validate", { params });
      const parsed = Tools.InboxValidateRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      if (!entry.routing_key || !isRoutingKeyValid(entry.routing_key)) {
        throw new MCPError("E_INBOX_003", "InvalidRoutingKeyFormat", {
          routing_key: entry.routing_key,
        });
      }
      if (entry.destination_db_code || entry.destination_db) {
        const parsedKey = this.parseRoutingKey(entry.routing_key);
        const dest = entry.destination_db_code || entry.destination_db;
        if (parsedKey?.destination_db !== dest) {
          throw new MCPError("E_INBOX_005", "DestinationMismatch", {
            routing_key: entry.routing_key,
            destination_db: dest,
          });
        }
      }
      return { ok: true, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("E_INBOX_003", "InvalidRoutingKeyFormat", {
        operation: "inbox.validate",
      });
    }
  }

  // inbox.triage
  public static InboxTriageRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
    lane: z.string().min(1, "lane is required"),
    lane_code: z.string().optional(),
    layer: z.string().min(1, "layer is required"),
    layer_code: z.string().optional(),
    domain: z.string().min(1, "domain is required"),
    domain_code: z.string().optional(),
    object_type: z.string().min(1, "object_type is required"),
    object_type_code: z.string().optional(),
    owner_pod: z.string().min(1, "owner_pod is required"),
    owner_pod_code: z.string().optional(),
    destination_db: z.string().optional(),
    destination_db_code: z.string().optional(),
    tags: z.array(z.string()).optional(),
    sensitivity: z.string().optional(),
    entity_name: z.string().optional(),
    entity_id: z.string().optional(),
    room_name: z.string().optional(),
    room_id: z.string().optional(),
  });

  async["inbox.triage"](params: unknown) {
    try {
      logger.info("Calling inbox.triage", { params });
      const parsed = Tools.InboxTriageRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const fromStatus = entry.routing_status_code || entry.routing_status || "new";
      this.assertStatusTransition(fromStatus, "triaged");

      const destinationResolved = this.resolveDestinationDb({
        destination_db_code: parsed.destination_db_code,
        destination_db: parsed.destination_db,
      });
      if ((parsed.destination_db || parsed.destination_db_code) && !destinationResolved) {
        throw new MCPError("E_INBOX_006", "Unknown destination_db label", {
          operation: "inbox.triage",
        });
      }

      const laneCode = parsed.lane_code || parsed.lane;
      const layerCode = parsed.layer_code || parsed.layer;
      const objectTypeCode = parsed.object_type_code || parsed.object_type;
      const domainCode = parsed.domain_code || parsed.domain;
      const ownerPodCode = parsed.owner_pod_code || parsed.owner_pod;

      const routing_key = computeInboxRoutingKey({
        lane: laneCode,
        layer: layerCode,
        object_type: objectTypeCode,
        destination_db_code: destinationResolved?.code || "",
      });
      await this.client.updateInboxEntry(
        parsed.inbox_id,
        {
          lane: parsed.lane,
          lane_code: laneCode,
          layer: parsed.layer,
          layer_code: layerCode,
          domain: parsed.domain,
          domain_code: domainCode,
          object_type: parsed.object_type,
          object_type_code: objectTypeCode,
          owner_pod: parsed.owner_pod,
          owner_pod_code: ownerPodCode,
          destination_db: destinationResolved?.label || parsed.destination_db,
          destination_db_code: destinationResolved?.code,
          routing_key,
          routing_status: ROUTING_STATUS_CODE_TO_LABEL.triaged || "Triaged",
          routing_status_code: "triaged",
          tags: parsed.tags,
          sensitivity: parsed.sensitivity,
          entity_name: parsed.entity_name,
          entity_id: parsed.entity_id,
          room_name: parsed.room_name,
          room_id: parsed.room_id,
        },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "TRIAGE",
          from: fromStatus,
          to: "triaged",
          note: "triaged",
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id, data: { routing_key } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "MissingRequiredField", {
          operation: "inbox.triage",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.triage",
      });
    }
  }

  // inbox.route
  public static InboxRouteRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
    destination_db: z.string().optional(),
    destination_db_code: z.string().optional(),
  });

  async["inbox.route"](params: unknown) {
    try {
      logger.info("Calling inbox.route", { params });
      const parsed = Tools.InboxRouteRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const object_type =
        entry.object_type_code || entry.object_type || "item";
      const domain = entry.domain_code || entry.domain || "general";

      let destination_db =
        parsed.destination_db_code ||
        parsed.destination_db ||
        (object_type === "task"
          ? "TASKS"
          : object_type === "mission"
            ? "MISSIONS"
            : object_type === "run" || object_type === "aar"
              ? "RUNS_AARS"
              : object_type === "timeline_event"
                ? "TIMELINE"
                : object_type === "asset"
                  ? "ARK_ASSETS"
                  : (object_type === "policy" ||
                    object_type === "doc" ||
                    object_type === "template") &&
                    domain === "legal"
                    ? "LAW_DOCS"
                    : (object_type === "template" || object_type === "doc") &&
                      domain === "training"
                      ? "CLASS_KB"
                      : domain === "brand"
                        ? "BOB_BRAND"
                        : domain === "research"
                          ? "AIR_RESEARCH"
                          : "INBOX");

      const destinationResolved = this.resolveDestinationDb({
        destination_db_code: destination_db,
        destination_db: destination_db,
      });

      if (!destinationResolved || destinationResolved.code === "INBOX") {
        await this.client.updateInboxEntry(
          parsed.inbox_id,
          {
            routing_status: ROUTING_STATUS_CODE_TO_LABEL.blocked || "Blocked",
            routing_status_code: "blocked",
            blocker_reason:
              "No deterministic destination_db mapping; requires manual route override.",
          },
          this.buildMoveLogLine({
            actor: parsed.actor,
            action: "ROUTE",
            from: entry.routing_status_code || entry.routing_status || "triaged",
            to: "blocked",
            note: "no mapping",
            request_id: parsed.request_id,
          })
        );
        return {
          ok: false,
          request_id: parsed.request_id,
          error: {
            code: "E_INBOX_005",
            message:
              "No deterministic destination_db mapping; requires manual route override.",
          },
        };
      }

      const routing_key = this.computeRoutingKey({
        lane: entry.lane_code || entry.lane || "execution",
        layer: entry.layer_code || entry.layer || "L0",
        object_type,
        destination_db: destinationResolved.code,
      });

      if (entry.routing_key && isRoutingKeyValid(entry.routing_key)) {
        const parsedKey = this.parseRoutingKey(entry.routing_key);
        if (
          parsedKey?.destination_db &&
          parsedKey.destination_db !== destinationResolved.code
        ) {
          throw new MCPError("E_INBOX_005", "DestinationMismatch", {
            routing_key: entry.routing_key,
            destination_db: destinationResolved.code,
          });
        }
      }

      this.assertStatusTransition(
        entry.routing_status_code || entry.routing_status || "triaged",
        "routed"
      );

      await this.client.updateInboxEntry(
        parsed.inbox_id,
        {
          destination_db: destinationResolved.label,
          destination_db_code: destinationResolved.code,
          routing_key,
          routing_status: ROUTING_STATUS_CODE_TO_LABEL.routed || "Routed",
          routing_status_code: "routed",
        },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "ROUTE",
          from: entry.routing_status_code || entry.routing_status || "triaged",
          to: "routed",
          note: destinationResolved.code,
          request_id: parsed.request_id,
        })
      );

      return {
        ok: true,
        request_id: parsed.request_id,
        data: { destination_db: destinationResolved.code, routing_key },
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.route",
      });
    }
  }

  // inbox.move
  public static InboxMoveRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.move"](params: unknown) {
    try {
      logger.info("Calling inbox.move", { params });
      const parsed = Tools.InboxMoveRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      if (entry.move_log && entry.move_log.includes(`request_id=${parsed.request_id}`)) {
        if (entry.target_notion_id) {
          return {
            ok: true,
            request_id: parsed.request_id,
            data: {
              target_notion_id: entry.target_notion_id,
              target_url: entry.target_url,
            },
          };
        }
        throw new MCPError("INBOX_E008", "IdempotencyConflict", {
          request_id: parsed.request_id,
        });
      }
      if (entry.last_move_request_id === parsed.request_id && entry.target_notion_id) {
        return {
          ok: true,
          request_id: parsed.request_id,
          data: {
            target_notion_id: entry.target_notion_id,
            target_url: entry.target_url,
          },
        };
      }
      const entryStatus = entry.routing_status_code || entry.routing_status;
      if (entry.last_move_request_id && entry.last_move_request_id !== parsed.request_id && entry.target_notion_id && entryStatus === "routed") {
        // Allow new move only if idempotency key differs; otherwise continue
      }
      const status = entry.routing_status_code || entry.routing_status;
      if (!entry.destination_db || status !== "routed") {
        throw new MCPError("E_INBOX_004", "InvalidStateTransition", {
          from: status,
          to: "routed",
        });
      }
      const result = await this.client.routeInboxEntry(parsed.inbox_id);
      await this.client.updateInboxEntry(
        parsed.inbox_id,
        { last_move_request_id: parsed.request_id },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "MOVE",
          from: "routed",
          to: "routed",
          note: "destination created",
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id, data: result };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.move",
      });
    }
  }

  // inbox.markDuplicate
  public static InboxDuplicateRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
    duplicate_of: z.string().min(1, "duplicate_of is required"),
  });

  async["inbox.markDuplicate"](params: unknown) {
    try {
      logger.info("Calling inbox.markDuplicate", { params });
      const parsed = Tools.InboxDuplicateRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const fromStatus =
        entry.routing_status_code || entry.routing_status || "new";
      this.assertStatusTransition(fromStatus, "duplicate");
      await this.client.updateInboxEntry(
        parsed.inbox_id,
        {
          routing_status: ROUTING_STATUS_CODE_TO_LABEL.duplicate || "Duplicate",
          routing_status_code: "duplicate",
          duplicate_of: parsed.duplicate_of,
        },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "DUPLICATE",
          from: fromStatus,
          to: "duplicate",
          note: parsed.duplicate_of,
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.markDuplicate",
      });
    }
  }

  // inbox.block
  public static InboxBlockRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
    blocker_reason: z.string().min(1, "blocker_reason is required"),
  });

  async["inbox.block"](params: unknown) {
    try {
      logger.info("Calling inbox.block", { params });
      const parsed = Tools.InboxBlockRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const fromStatus =
        entry.routing_status_code || entry.routing_status || "new";
      this.assertStatusTransition(fromStatus, "blocked");
      await this.client.updateInboxEntry(
        parsed.inbox_id,
        {
          routing_status: ROUTING_STATUS_CODE_TO_LABEL.blocked || "Blocked",
          routing_status_code: "blocked",
          blocker_reason: parsed.blocker_reason,
        },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "BLOCK",
          from: fromStatus,
          to: "blocked",
          note: parsed.blocker_reason,
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.block",
      });
    }
  }

  // inbox.archive
  public static InboxArchiveRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.archive"](params: unknown) {
    try {
      logger.info("Calling inbox.archive", { params });
      const parsed = Tools.InboxArchiveRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const fromStatus =
        entry.routing_status_code || entry.routing_status || "new";
      this.assertStatusTransition(fromStatus, "archived");
      await this.client.updateInboxEntry(
        parsed.inbox_id,
        {
          routing_status: ROUTING_STATUS_CODE_TO_LABEL.archived || "Archived",
          routing_status_code: "archived",
        },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "ARCHIVE",
          from: fromStatus,
          to: "archived",
          note: "archived",
          request_id: parsed.request_id,
        })
      );
      return { ok: true, request_id: parsed.request_id };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.archive",
      });
    }
  }

  // inbox.auditTrail
  public static InboxAuditTrailRequestSchema = z.object({
    request_id: z.string().optional(),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.auditTrail"](params: unknown) {
    try {
      logger.info("Calling inbox.auditTrail", { params });
      const parsed = Tools.InboxAuditTrailRequestSchema.parse(params || {});
      const entry = await this.client.getInboxEntry(parsed.inbox_id);
      const moveLog = entry.move_log || "";
      const events = moveLog
        .split("\n")
        .map((line: string) => {
          const match = line.match(/^\[([^\]]+)\]\s+(.*)$/);
          const timestamp = match ? match[1] : "";
          const rest = match ? match[2] : line;
          const kv: Record<string, string> = {};
          rest.split(" ").forEach((chunk) => {
            const idx = chunk.indexOf("=");
            if (idx > -1) {
              const key = chunk.slice(0, idx);
              const value = chunk.slice(idx + 1);
              kv[key] = value;
            }
          });
          return {
            timestamp,
            actor: kv.actor || "",
            action: kv.action || "",
            from: kv.from || "",
            to: kv.to || "",
            note: kv.note ? kv.note.replace(/_/g, " ") : "",
            request_id: kv.request_id || "",
          };
        })
        .filter((e: any) => e.timestamp);
      return { ok: true, request_id: parsed.request_id || "", data: events };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E006", "NotFound", {
        operation: "inbox.auditTrail",
      });
    }
  }

  // inboxBackfillCodes
  public static InboxBackfillCodesRequestSchema = z.object({
    request_id: z.string().optional(),
    limit: z.number().int().positive().max(500).optional(),
    dry_run: z.boolean().optional(),
    cursor: z.string().optional(),
    only_missing: z.boolean().optional(),
    filter: z
      .object({
        time_window_days: z.number().int().positive().optional(),
        routing_status_codes: z.array(z.string()).optional(),
      })
      .optional(),
  });

  async inboxBackfillCodes(params: unknown) {
    try {
      logger.info("Calling inboxBackfillCodes", { params });
      const parsed = Tools.InboxBackfillCodesRequestSchema.parse(params || {});
      const limit = parsed.limit || 200;
      const dryRun = parsed.dry_run !== false;
      const onlyMissing = parsed.only_missing !== false;
      const timeWindowDays = parsed.filter?.time_window_days;
      const routingStatusCodes = parsed.filter?.routing_status_codes || null;

      const res = await this.client.listInboxEntries({
        limit,
        cursor: parsed.cursor,
      });

      const updates: any[] = [];
      const skipped: any[] = [];

      const now = new Date();
      const cutoff =
        timeWindowDays && timeWindowDays > 0
          ? new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000)
          : null;

      for (const item of res.items || []) {
        if (cutoff && item.captured_at) {
          const captured = new Date(item.captured_at);
          if (!isNaN(captured.getTime()) && captured < cutoff) continue;
        }
        if (
          routingStatusCodes &&
          routingStatusCodes.length > 0 &&
          (() => {
            const resolved =
              item.routing_status_code ||
              this.resolveRoutingStatus({
                routing_status_code: item.routing_status_code,
                routing_status: item.routing_status,
              })?.code;
            return !resolved || !routingStatusCodes.includes(resolved);
          })()
        ) {
          continue;
        }
        const missingSource = !item.source_type_code;
        const routingKeyInvalid =
          item.routing_key && !isRoutingKeyValid(item.routing_key);
        const missingRouting = !item.routing_key || routingKeyInvalid;
        const missingRoutingStatus = !item.routing_status_code;
        if (
          onlyMissing &&
          !missingSource &&
          !missingRouting &&
          !missingRoutingStatus
        ) {
          continue;
        }

        const sourceResolved = missingSource
          ? this.resolveSourceType({
            source_type_code: item.source_type_code,
            source_type: item.source_type,
          })
          : null;

        if (missingSource && !sourceResolved) {
          skipped.push({
            id: item.id,
            reason: "missing_source_type_mapping",
          });
          continue;
        }

        const destinationResolved =
          !item.destination_db_code && item.destination_db
            ? this.resolveDestinationDb({
              destination_db_code: item.destination_db_code,
              destination_db: item.destination_db,
            })
            : null;
        const routingStatusResolved = missingRoutingStatus
          ? this.resolveRoutingStatus({
            routing_status_code: item.routing_status_code,
            routing_status: item.routing_status,
          })
          : null;

        const laneCode = item.lane_code || item.lane;
        const layerCode = item.layer_code || item.layer;
        const objectTypeCode = item.object_type_code || item.object_type;

        if (!laneCode || !layerCode || !objectTypeCode) {
          skipped.push({
            id: item.id,
            reason: "missing_lane_layer_object_type",
          });
          continue;
        }

        const destCode =
          destinationResolved?.code || item.destination_db_code || "";
        const routing_key = computeInboxRoutingKey({
          lane: laneCode,
          layer: layerCode,
          object_type: objectTypeCode,
          destination_db_code: destCode,
        });

        if (!isRoutingKeyValid(routing_key)) {
          skipped.push({
            id: item.id,
            reason: "invalid_routing_key_computed",
          });
          continue;
        }

        const patch: any = {};
        if (sourceResolved && !item.source_type_code) {
          patch.source_type_code = sourceResolved.code;
        }
        if (destinationResolved && !item.destination_db_code) {
          patch.destination_db_code = destinationResolved.code;
        }
        if (routingStatusResolved && !item.routing_status_code) {
          patch.routing_status_code = routingStatusResolved.code;
        }
        if (!item.routing_key || routingKeyInvalid) {
          patch.routing_key = routing_key;
        }

        if (Object.keys(patch).length === 0) {
          skipped.push({ id: item.id, reason: "no_changes" });
          continue;
        }

        if (!dryRun) {
          await this.client.updateInboxEntry(
            item.id,
            patch,
            this.buildMoveLogLine({
              actor: "system",
              action: "BACKFILL",
              from:
                item.routing_status_code || item.routing_status || "unknown",
              to: item.routing_status_code || item.routing_status || "unknown",
              note: "codes_backfill",
              request_id: parsed.request_id || "backfill",
            })
          );
        }

        updates.push({ id: item.id, patch });
      }

      return {
        ok: true,
        request_id: parsed.request_id || "",
        data: {
          dry_run: dryRun,
          updated: updates.length,
          skipped: skipped.length,
          updates,
          skipped_items: skipped,
          next_cursor: res.next_cursor,
          has_more: res.has_more,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Invalid request parameters", {
          operation: "inboxBackfillCodes",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inboxBackfillCodes",
      });
    }
  }

  // inbox.backfillRoutingKey
  public static InboxBackfillRoutingKeySchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.backfillRoutingKey"](params: unknown) {
    try {
      logger.info("Calling inbox.backfillRoutingKey", { params });
      const parsed = Tools.InboxBackfillRoutingKeySchema.parse(params || {});
      const existing = await this.client.getInboxEntry(parsed.inbox_id);
      if (!existing) {
        throw new MCPError("INBOX_E006", "NotFound", {
          operation: "inbox.backfillRoutingKey",
        });
      }

      const laneCode = existing.lane_code || existing.lane;
      const layerCode = existing.layer_code || existing.layer;
      const objectTypeCode = existing.object_type_code || existing.object_type;
      const destCode = existing.destination_db_code || existing.destination_db || "";

      if (!laneCode || !layerCode || !objectTypeCode) {
        throw new MCPError("INBOX_E001", "MissingRequiredField", {
          operation: "inbox.backfillRoutingKey",
          missing: ["lane", "layer", "object_type"],
        });
      }

      const routing_key = computeInboxRoutingKey({
        lane: laneCode,
        layer: layerCode,
        object_type: objectTypeCode,
        destination_db_code: destCode,
      });

      if (!isRoutingKeyValid(routing_key)) {
        throw new MCPError("INBOX_E003", "InvalidRoutingKeyFormat", {
          operation: "inbox.backfillRoutingKey",
        });
      }

      if (existing.routing_key && existing.routing_key === routing_key) {
        return {
          ok: true,
          request_id: parsed.request_id,
          data: { updated: false, routing_key },
        };
      }

      await this.client.updateInboxEntry(
        parsed.inbox_id,
        { routing_key },
        this.buildMoveLogLine({
          actor: parsed.actor,
          action: "backfill_routing_key",
          from: existing.routing_status_code || existing.routing_status || "unknown",
          to: existing.routing_status_code || existing.routing_status || "unknown",
          note: "recomputed routing_key",
          request_id: parsed.request_id,
        })
      );

      return {
        ok: true,
        request_id: parsed.request_id,
        data: { updated: true, routing_key },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Invalid request parameters", {
          operation: "inbox.backfillRoutingKey",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.backfillRoutingKey",
      });
    }
  }

  // inbox.dedupeFind
  public static InboxDedupeFindSchema = z.object({
    request_id: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    time_window_days: z.number().int().positive().optional(),
    inbox_id: z.string().optional(),
    query: z.string().optional(),
    same_source_url: z.boolean().optional(),
    same_source_ref: z.boolean().optional(),
    fuzzy_title: z.boolean().optional(),
    fuzzy_summary: z.boolean().optional(),
  });

  async["inbox.dedupeFind"](params: unknown) {
    try {
      logger.info("Calling inbox.dedupeFind", { params });
      const parsed = Tools.InboxDedupeFindSchema.parse(params || {});
      const limit = parsed.limit || 20;

      // If inbox_id is provided, we want to find duplicates for that specific item.
      // Otherwise we do a global scan of recent items.

      const res = await this.client.listInboxEntries({ limit: 500 });
      const now = new Date();
      const cutoff =
        parsed.time_window_days && parsed.time_window_days > 0
          ? new Date(now.getTime() - parsed.time_window_days * 24 * 60 * 60 * 1000)
          : null;

      const normalizeText = (val: string) =>
        (val || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const tokenize = (val: string) =>
        normalizeText(val)
          .split(" ")
          .filter(Boolean);

      const tokenOverlap = (a: string, b: string) => {
        const ta = tokenize(a);
        const tb = tokenize(b);
        if (ta.length === 0 || tb.length === 0) return 0;
        const setB = new Set(tb);
        const hits = ta.filter((t) => setB.has(t)).length;
        return hits / Math.max(ta.length, tb.length);
      };

      const rawItems = res.items || [];
      const items = rawItems.filter((item: any) => {
        if (!cutoff || !item.captured_at) return true;
        const captured = new Date(item.captured_at);
        if (isNaN(captured.getTime())) return true;
        return captured >= cutoff;
      });

      // Special case: If targeted item is older than window, ensure it's included in the set
      if (parsed.inbox_id) {
        const targetInSet = items.find((i: any) => i.id === parsed.inbox_id);
        if (!targetInSet) {
          const targetFromRaw = rawItems.find((i: any) => i.id === parsed.inbox_id);
          if (targetFromRaw) {
            items.push(targetFromRaw);
          } else {
            // If not in the last 500, we might need to fetch it individually? 
            // For now assume it's in the list or we can't weak-ref it.
            // (In a real impl we'd fetch it, but let's rely on list for now)
          }
        }
      }

      const groups: any[] = [];
      const seen = new Set<string>();

      const pickCanonical = (members: any[]) => {
        const sorted = [...members].sort((a, b) => {
          const aTime = a.captured_at ? Date.parse(a.captured_at) : NaN;
          const bTime = b.captured_at ? Date.parse(b.captured_at) : NaN;
          if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
            return aTime - bTime;
          }
          return String(a.id).localeCompare(String(b.id));
        });
        return sorted[0];
      };

      const pushGroup = (members: any[], confidence: number) => {
        if (members.length < 2) return;
        const canonical = pickCanonical(members);
        if (!canonical) return;

        // Dedup key: sorted IDs
        const groupKey = members.map((m) => m.id).sort().join("|");
        if (seen.has(groupKey)) return;
        seen.add(groupKey);

        groups.push({
          canonical_target_id: canonical.id,
          canonical_target_url: canonical.url,
          confidence,
          members: members.map((m) => ({
            id: m.id,
            url: m.url,
            item: m.item,
            source_url: m.source_url,
            source_ref: m.source_ref,
            captured_at: m.captured_at,
            status: m.routing_status || m.routing_status_code,
            summary: m.summary,
            notion_url: m.url,
            target_url: m.target_url
          })),
        });
      };

      // 1) exact match on source_url
      if (parsed.same_source_url !== false) {
        const bySourceUrl: Record<string, any[]> = {};
        for (const item of items) {
          if (!item.source_url) continue;
          const key = item.source_url.trim().toLowerCase();
          if (!bySourceUrl[key]) bySourceUrl[key] = [];
          bySourceUrl[key].push(item);
        }
        Object.values(bySourceUrl).forEach((members) => pushGroup(members, 0.95));
      }

      // 2) exact match on source_ref
      if (parsed.same_source_ref !== false) {
        const bySourceRef: Record<string, any[]> = {};
        for (const item of items) {
          if (!item.source_ref) continue;
          const key = item.source_ref.trim().toLowerCase();
          if (!bySourceRef[key]) bySourceRef[key] = [];
          bySourceRef[key].push(item);
        }
        Object.values(bySourceRef).forEach((members) => pushGroup(members, 0.85));
      }

      // 3/4) fuzzy title + summary overlap
      // Only runs if explicitly requested or defaults (for now defaults are implicit in UI)
      // The original code ran it always. We'll make it conditional if params are passed, else default true?
      // Actually standardizing: if fuzzy_title is undefined, we assume true for global scan? 
      // Let's keep logic simple: run it unless explicitly disabled or if we are in a tight loop.
      const doFuzzy = parsed.fuzzy_title !== false || parsed.fuzzy_summary !== false;

      if (doFuzzy) {
        const fuzzyThresholdTitle = 0.7;
        const fuzzyThresholdSummary = 0.6;
        const parents = new Map<string, string>();
        const find = (id: string): string => {
          const parent = parents.get(id);
          if (!parent || parent === id) return id;
          const root = find(parent);
          parents.set(id, root);
          return root;
        };
        const union = (a: string, b: string) => {
          const ra = find(a);
          const rb = find(b);
          if (ra !== rb) parents.set(rb, ra);
        };

        const confidenceMap = new Map<string, number>();
        for (const item of items) {
          if (!parents.has(item.id)) parents.set(item.id, item.id);
        }

        // Optimisation: if inbox_id is set, only compare against that item
        if (parsed.inbox_id) {
          const target = items.find((i: any) => i.id === parsed.inbox_id);
          if (target) {
            for (const other of items) {
              if (other.id === target.id) continue;
              const titleOverlap = tokenOverlap(target.item || "", other.item || "");
              const summaryOverlap = tokenOverlap(target.summary || "", other.summary || "");
              const confidence = Math.max(titleOverlap, summaryOverlap);

              if (titleOverlap >= fuzzyThresholdTitle || summaryOverlap >= fuzzyThresholdSummary) {
                union(target.id, other.id);
                const key = [target.id, other.id].sort().join("|");
                confidenceMap.set(key, confidence);
              }
            }
          }
        } else {
          // All-pairs (limited by 500 items, n^2 is ~250k ops, acceptable for nodejs)
          for (let i = 0; i < items.length; i++) {
            const a = items[i];
            for (let j = i + 1; j < items.length; j++) {
              const b = items[j];
              const titleOverlap = tokenOverlap(a.item || "", b.item || "");
              const summaryOverlap = tokenOverlap(a.summary || "", b.summary || "");
              const confidence = Math.max(titleOverlap, summaryOverlap);
              if (
                titleOverlap >= fuzzyThresholdTitle ||
                summaryOverlap >= fuzzyThresholdSummary
              ) {
                union(a.id, b.id);
                const key = [a.id, b.id].sort().join("|");
                confidenceMap.set(key, confidence);
              }
            }
          }
        }

        const components: Record<string, any[]> = {};
        for (const item of items) {
          const root = find(item.id);
          if (!components[root]) components[root] = [];
          components[root].push(item);
        }

        Object.values(components).forEach((members) => {
          if (members.length < 2) return;
          let maxConfidence = 0;
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
              const key = [members[i].id, members[j].id].sort().join("|");
              const conf = confidenceMap.get(key) || 0;
              if (conf > maxConfidence) maxConfidence = conf;
            }
          }
          if (maxConfidence > 0) {
            pushGroup(members, maxConfidence);
          }
        });
      }

      // Post-process groups to generate return matches
      let matches: any[] = [];

      if (parsed.inbox_id) {
        // Targeted mode: Find groups containing the target
        const relevantGroups = groups.filter(g => g.members.some((m: any) => m.id === parsed.inbox_id));
        // Extract OTHER members from these groups
        const uniqueOthers = new Map<string, any>();
        relevantGroups.forEach(g => {
          g.members.forEach((m: any) => {
            if (m.id !== parsed.inbox_id) {
              // Add confidence from group
              const existing = uniqueOthers.get(m.id);
              if (!existing || existing.confidence < g.confidence) {
                uniqueOthers.set(m.id, { ...m, confidence: g.confidence });
              }
            }
          });
        });
        matches = Array.from(uniqueOthers.values());
      } else {
        // Global mode: Flatten all members of all groups
        const unique = new Map<string, any>();
        groups.forEach(g => {
          g.members.forEach((m: any) => {
            const existing = unique.get(m.id);
            if (!existing || existing.confidence < g.confidence) {
              unique.set(m.id, { ...m, confidence: g.confidence });
            }
          });
        });
        matches = Array.from(unique.values());
      }

      return {
        ok: true,
        request_id: parsed.request_id || "",
        data: {
          groups: groups.slice(0, limit),
          matches: matches.slice(0, limit)
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Invalid request parameters", {
          operation: "inbox.dedupeFind",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionReadFailed", {
        operation: "inbox.dedupeFind",
      });
    }
  }

  // inbox.views.patch.report
  public static InboxViewsPatchReportSchema = z.object({
    request_id: z.string().optional(),
  });

  async["inbox.views.patch.report"](params: unknown) {
    try {
      logger.info("Calling inbox.views.patch.report", { params });
      const parsed = Tools.InboxViewsPatchReportSchema.parse(params || {});
      const schema = await this.client.getInboxSchema();
      const props = (schema as any).properties || {};

      const requiredProps = [
        "Source Type Code",
        "Destination DB Code",
        "Lane Code",
        "Layer Code",
        "Object Type Code",
        "Domain Code",
        "Owner Pod Code",
        "Routing Status Code",
        "Sensitivity Code",
        "Routing Key",
      ];

      const present = requiredProps.filter((p) => props[p]);
      const missing = requiredProps.filter((p) => !props[p]);

      const checklist = INBOX_VIEWS_SPEC.map((view) => ({
        name: view.name,
        filter_preference: props["Routing Status Code"]
          ? view.filter_code
          : view.filter_label,
      }));

      return {
        ok: true,
        request_id: parsed.request_id || "",
        data: {
          properties: { present, missing },
          views: INBOX_VIEWS_SPEC,
          manual_checklist: checklist,
          note:
            "Notion API does not support programmatic view creation. Use manual checklist.",
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError("E_INBOX_001", "Invalid request parameters", {
          operation: "inbox.views.patch.report",
          zodErrors: error.errors,
        });
      }
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionReadFailed", {
        operation: "inbox.views.patch.report",
      });
    }
  }

  // inbox.verify
  public static InboxVerifyRequestSchema = z.object({
    request_id: z.string().min(3, "request_id is required"),
    actor: z.string().min(1, "actor is required"),
    inbox_id: z.string().min(1, "inbox_id is required"),
  });

  async["inbox.verify"](params: unknown) {
    try {
      logger.info("Calling inbox.verify", { params });
      const parsed = Tools.InboxVerifyRequestSchema.parse(params || {});
      const result = await this.client.verifyInboxEntry(
        parsed.inbox_id,
        parsed.actor
      );
      return { ok: true, request_id: parsed.request_id, data: result };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError("INBOX_E007", "NotionWriteFailed", {
        operation: "inbox.verify",
      });
    }
  }

  // Legacy aliases (underscore)
  async inbox_create(params: unknown) {
    return this["inbox.create"](params);
  }

  async inbox_update(params: unknown) {
    return this["inbox.update"](params);
  }

  async inbox_list(params: unknown) {
    return this["inbox.list"](params);
  }

  async inbox_route(params: unknown) {
    return this["inbox.route"](params);
  }

  async inbox_verify(params: unknown) {
    return this["inbox.verify"](params);
  }

  // Canon aliases (INBOX_FINISH_PACK_V1)
  async["inbox.createItem"](params: unknown) {
    return this["inbox.create"](params);
  }

  async["inbox.updateItem"](params: unknown) {
    return this["inbox.update"](params);
  }

  async["inbox.normalizeCodes"](params: unknown) {
    return this.inboxBackfillCodes(params);
  }

  async["inbox.routeItem"](params: unknown) {
    return this["inbox.route"](params);
  }

  async inboxDedupeFind(params: unknown) {
    return this["inbox.dedupeFind"](params);
  }

  // Canonical dot-name aliases
  async ["missions.updateStatus"](params: unknown) {
    return this["missions.updateStatus.internal"](params);
  }

  async ["missions.tasks.list"](params: unknown) {
    return this.listMissionTasks(params);
  }

  async ["inbox.backfill.codes"](params: unknown) {
    return this.inboxBackfillCodes(params);
  }

  async ["inbox.dedupe.find"](params: unknown) {
    return this["inbox.dedupeFind"](params);
  }

  // updateMissionStatus
  public static UpdateMissionStatusRequestSchema = z.object({
    missionId: z.string().min(1, "missionId is required"),
    status: MISSION_STATUS_SCHEMA,
  });

  async ["missions.updateStatus.internal"](params: unknown) {
    try {
      const { missionId, status } =
        Tools.UpdateMissionStatusRequestSchema.parse(params);
      const result = await this.client["missions.updateStatus"](missionId, status);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "update_mission_status",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in missions.updateStatus", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "missions.updateStatus",
      });
    }
  }

  // listBuildItems
  public static ListBuildItemsRequestSchema = z.object({
    status: z.string().optional(),
    missionId: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
  });

  async listBuildItems(params: unknown) {
    try {
      const filters = Tools.ListBuildItemsRequestSchema.parse(params || {});
      const result = await this.client.listBuildItems(filters);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_build_items",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listBuildItems", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_build_items",
      });
    }
  }

  // createBuildItem
  public static CreateBuildItemRequestSchema = z.object({
    name: z.string().min(1, "name is required"),
    missionId: z.string().optional(),
    status: BUILD_STATUS_SCHEMA.optional(),
    notes: z.string().optional(),
  });

  async createBuildItem(params: unknown) {
    try {
      const item = Tools.CreateBuildItemRequestSchema.parse(params);
      const result = await this.client.createBuildItem(item);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_build_item",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createBuildItem", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_build_item",
      });
    }
  }

  // updateBuildItemStatus
  public static UpdateBuildItemStatusRequestSchema = z.object({
    buildId: z.string().min(1, "buildId is required"),
    status: BUILD_STATUS_SCHEMA,
  });

  async updateBuildItemStatus(params: unknown) {
    try {
      const { buildId, status } =
        Tools.UpdateBuildItemStatusRequestSchema.parse(params);
      const result = await this.client.updateBuildItemStatus(buildId, status);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "update_build_item_status",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in updateBuildItemStatus", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "update_build_item_status",
      });
    }
  }

  // listMissionTasks (enhanced wrapper)
  async listMissionTasks(params: unknown) {
    try {
      const { missionId } = Tools.MissionsTasksListRequestSchema.parse(params);
      const tasks = await this.client["missions.tasks.list"](missionId);
      return { tasks };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_mission_tasks",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listMissionTasks", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_mission_tasks",
      });
    }
  }

  // listAgents
  public static ListAgentsRequestSchema = z.object({
    limit: z.number().int().positive().max(100).optional(),
  });

  async listAgents(params: unknown) {
    try {
      const { limit } = Tools.ListAgentsRequestSchema.parse(params || {});
      const result = await this.client.listAgents(limit || undefined);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_agents",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listAgents", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_agents",
      });
    }
  }

  // getAgent
  public static GetAgentRequestSchema = z.object({
    agentId: z.string().min(1, "agentId is required"),
  });

  async getAgent(params: unknown) {
    try {
      const { agentId } = Tools.GetAgentRequestSchema.parse(params);
      const result = await this.client.getAgent(agentId);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "get_agent",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in getAgent", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "get_agent",
      });
    }
  }

  // assignAgent
  public static AssignAgentRequestSchema = z.object({
    agentId: z.string().min(1, "agentId is required"),
    missionId: z.string().min(1, "missionId is required"),
    role: z.string().optional(),
  });

  async assignAgent(params: unknown) {
    try {
      const { agentId, missionId, role } =
        Tools.AssignAgentRequestSchema.parse(params);
      const result = await this.client.assignAgent(agentId, missionId, role);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "assign_agent",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in assignAgent", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "assign_agent",
      });
    }
  }

  // listPoleEvents
  public static ListPoleEventsRequestSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
  });

  async listPoleEvents(params: unknown) {
    try {
      const filters = Tools.ListPoleEventsRequestSchema.parse(params || {});
      const result = await this.client.listPoleEvents(filters);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_pole_events",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listPoleEvents", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_pole_events",
      });
    }
  }

  // recordPoleEvent
  public static RecordPoleEventRequestSchema = z.object({
    title: z.string().min(1, "title is required"),
    eventType: z.string().min(1, "eventType is required"),
    description: z.string().min(1, "description is required"),
    participants: z.array(z.string()).min(1, "participants is required"),
    impactLevel: z.enum(["critical", "major", "minor"]),
    missionId: z.string().optional(),
    buildId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    timestamp: z.string().default(() => new Date().toISOString()),
    source: z.string().default("MCP Notion"),
    sync_key: z.string().min(1, "sync_key is required"),
  });

  async recordPoleEvent(params: unknown) {
    try {
      const event = Tools.RecordPoleEventRequestSchema.parse(params);
      const result = await this.client.recordPoleEvent(event);
      return { id: (result as any).id };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "record_pole_event",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in recordPoleEvent", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "record_pole_event",
      });
    }
  }

  // Knowledge base tools - list
  // Note: type is determined by the specific method (listDraftBlocks, listLawDocs, etc.)
  // so we only need limit parameter here
  public static ListKnowledgeBaseRequestSchema = z.object({
    limit: z.number().int().positive().max(100).optional(),
  });

  async listDraftBlocks(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "draft_blocks",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_draft_blocks",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listDraftBlocks", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_draft_blocks",
      });
    }
  }

  async listLawDocs(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "law_docs",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_law_docs",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listLawDocs", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_law_docs",
      });
    }
  }

  async listClassKb(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "class_kb",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_class_kb",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listClassKb", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_class_kb",
      });
    }
  }

  async listBakeRnd(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "bake_rnd",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_bake_rnd",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listBakeRnd", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_bake_rnd",
      });
    }
  }

  async listBobBrand(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "bob_brand",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_bob_brand",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listBobBrand", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_bob_brand",
      });
    }
  }

  async listAirResearch(params: unknown) {
    try {
      const { limit } = Tools.ListKnowledgeBaseRequestSchema.parse(
        params || {}
      );
      const result = await this.client.listKnowledgeBaseItems(
        "air_research",
        limit
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "list_air_research",
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in listAirResearch", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_air_research",
      });
    }
  }

  // Knowledge base tools - create
  public static CreateKnowledgeBaseRequestSchema = z.object({
    title: z.string().min(1, "title is required"),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  async createDraftBlock(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "draft_blocks",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_draft_block",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createDraftBlock", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_draft_block",
      });
    }
  }

  async createLawDoc(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "law_docs",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_law_doc",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createLawDoc", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_law_doc",
      });
    }
  }

  async createClassKb(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "class_kb",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_class_kb",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createClassKb", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_class_kb",
      });
    }
  }

  async createBakeRnd(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "bake_rnd",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_bake_rnd",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createBakeRnd", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_bake_rnd",
      });
    }
  }

  async createBobBrand(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "bob_brand",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_bob_brand",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createBobBrand", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_bob_brand",
      });
    }
  }

  async createAirResearch(params: unknown) {
    try {
      const item = Tools.CreateKnowledgeBaseRequestSchema.parse(params);
      const result = await this.client.createKnowledgeBaseItem(
        "air_research",
        item
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          {
            operation: "create_air_research",
            field,
            zodErrors: ze.errors,
          }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in createAirResearch", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_air_research",
      });
    }
  }

  /**
   * Tool: agents.list
   * List TEAM AI agents from the configured NOTION_DB_TEAM_AI_PEOPLE database.
   */
  async ["agents.list"](params: unknown) {
    try {
      logger.info("Calling agents.list", { params });
      ListDatabasesRequestSchema.parse(params || {}); // reuse empty validator
      const result = await this.client.listAgents(undefined);
      return ListAgentsResponseSchema.parse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const ze = error as z.ZodError;
        const first = ze.errors && ze.errors[0];
        const field = first && first.path ? first.path.join(".") : undefined;
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "agents.list", field, zodErrors: ze.errors }
        );
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in agents.list", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "agents.list",
      });
    }
  }

  // ============================================================================
  // WAR Ops Tools (Agent WAR - "Stoic Steve")
  // ============================================================================

  /**
   * Tool: war_spec
   * Generate mission specification from context
   */
  async war_spec(params: unknown) {
    try {
      logger.info("Calling war_spec", { params });
      return await this.warOps.war_spec(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_spec", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_spec",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_align
   * Align mission deck with current state
   */
  async war_align(params: unknown) {
    try {
      logger.info("Calling war_align", { params });
      return await this.warOps.war_align(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_align", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_align",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_mission
   * Create or update mission from seed brief
   */
  async war_mission(params: unknown) {
    try {
      logger.info("Calling war_mission", { params });
      return await this.warOps.war_mission(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_mission", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_mission",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_rhythm
   * Generate operational rhythm (cadence)
   */
  async war_rhythm(params: unknown) {
    try {
      logger.info("Calling war_rhythm", { params });
      return await this.warOps.war_rhythm(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_rhythm", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_rhythm",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_brief
   * Generate mission brief from mission reference
   */
  async war_brief(params: unknown) {
    try {
      logger.info("Calling war_brief", { params });
      return await this.warOps.war_brief(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_brief", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_brief",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_debrief
   * Generate after-action report (AAR)
   */
  async war_debrief(params: unknown) {
    try {
      logger.info("Calling war_debrief", { params });
      return await this.warOps.war_debrief(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_debrief", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_debrief",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_scan
   * Scan missions inventory
   */
  async war_scan(params: unknown) {
    try {
      logger.info("Calling war_scan", { params });
      return await this.warOps.war_scan(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_scan", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_scan",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_blockers
   * Identify and report blockers
   */
  async war_blockers(params: unknown) {
    try {
      logger.info("Calling war_blockers", { params });
      return await this.warOps.war_blockers(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_blockers", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_blockers",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_reset
   * Generate reset plan
   */
  async war_reset(params: unknown) {
    try {
      logger.info("Calling war_reset", { params });
      return await this.warOps.war_reset(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_reset", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_reset",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_drill
   * Execute operational drill
   */
  async war_drill(params: unknown) {
    try {
      logger.info("Calling war_drill", { params });
      return await this.warOps.war_drill(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_drill", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_drill",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: war_train
   * Train on SOP
   */
  async war_train(params: unknown) {
    try {
      logger.info("Calling war_train", { params });
      return await this.warOps.war_train(params);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in war_train", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "war_train",
        originalError: String(error),
      });
    }
  }

  // ============================================================================
  // Task Operations (with Timeline Events)
  // ============================================================================

  /**
   * Tool: tasks.create.internal
   * Create a task linked to a mission (emits TASK_CREATED event)
   */
  async ["tasks.create.internal"](params: unknown) {
    try {
      logger.info("Calling tasks.create.internal", { params });
      const result = await this.client["tasks.create"](params as any);
      return { id: result.id, url: result.url };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in tasks.create.internal", error, {
        params,
      });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "tasks.create.internal",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: tasks.update
   * Public alias for task updates.
   */
  async ["tasks.update"](params: unknown) {
    return this["tasks.update.internal"](params);
  }

  /**
   * Tool: tasks.update.internal
   * Update a task (emits TASK_UPDATED event)
   */
  async ["tasks.update.internal"](params: unknown) {
    try {
      logger.info("Calling tasks.update.internal", { params });
      const result = await this.client["tasks.update"](params as any);
      return { id: result.id, url: result.url };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in tasks.update.internal", error, {
        params,
      });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "tasks.update.internal",
        originalError: String(error),
      });
    }
  }

  // ============================================================================
  // Run Operations (with Timeline Events)
  // ============================================================================

  /**
   * Tool: runs.create
   * Create a mission run (emits RUN_STARTED and AAR_CREATED events)
   */
  async ["runs.create"](params: unknown) {
    try {
      logger.info("Calling runs.create", { params });
      const result = await this.client["runs.create"](params as any);
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in runs.create", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "create_run",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: runs.end
   * End a mission run (emits RUN_ENDED event)
   */
  async ["runs.end"](params: unknown) {
    try {
      logger.info("Calling runs.end", { params });
      const result = await this.client["runs.end"](params as any);
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in runs.end", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "end_run",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: aars.update
   * Update an AAR (emits AAR_UPDATED on first save and final save)
   */
  async ["aars.update"](params: unknown) {
    try {
      logger.info("Calling aars.update", { params });
      const result = await this.client["aars.update"](params as any);
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in aars.update", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "update_aar",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: runs.list
   * List runs for a mission (durable query, survives refresh)
   */
  async ["runs.list"](params: unknown) {
    try {
      logger.info("Calling runs.list", { params });
      const result = await this.client["runs.list"](params as any);
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in runs.list", error, {
        params,
      });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "list_runs_for_mission",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: aars.getByRunId
   * Get the paired AAR for a run (durable query)
   */
  async ["aars.getByRunId"](params: unknown) {
    try {
      logger.info("Calling aars.getByRunId", { params });
      const result = await this.client["aars.getByRunId"](params as any);
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in aars.getByRunId", error, { params });
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", {
        operation: "get_aar_by_run_id",
        originalError: String(error),
      });
    }
  }

  /**
   * Tool: drive.resolveCanonRoot
   * Resolves the canonical root folder in a Google Drive.
   */
  async["drive.resolveCanonRoot"](params: unknown) {
    try {
      const { driveId, canonRootName } = DriveResolveCanonRootRequestSchema.parse(params);
      const result = await this.driveClient.resolveCanonRoot(driveId, canonRootName);
      return { ok: true, ...result };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          ok: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid request parameters",
            details: { zodErrors: error.errors },
          },
        };
      }
      if (error instanceof MCPError) {
        return {
          ok: false,
          error: {
            code: error.code || ErrorCodes.INTERNAL_ERROR,
            message: error.message,
            details: error.details,
          },
        };
      }
      logger.error("Unexpected error in drive.resolveCanonRoot", error);
      return {
        ok: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Unexpected error",
        },
      };
    }
  }

  /**
   * Tool: drive.listChildren
   * Lists children of a folder in Google Drive.
   */
  async["drive.listChildren"](params: unknown) {
    try {
      logger.info("Calling drive.listChildren", { params });
      const parsed = DriveListChildrenRequestSchema.parse(params);
      const result = await this.driveClient.listChildren(parsed);
      return { ok: true, ...result };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          ok: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid request parameters",
            details: { zodErrors: error.errors },
          },
        };
      }
      if (error instanceof MCPError) {
        return {
          ok: false,
          error: {
            code: error.code || ErrorCodes.INTERNAL_ERROR,
            message: error.message,
            details: error.details,
          },
        };
      }
      logger.error("Unexpected error in drive.listChildren", error);
      return {
        ok: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Unexpected error",
        },
      };
    }
  }

  /**
   * Tool: drive.getMetadata
   * Gets metadata for a file or folder in Google Drive.
   */
  async["drive.getMetadata"](params: unknown) {
    try {
      logger.info("Calling drive.getMetadata", { params });
      const parsed = DriveGetMetadataRequestSchema.parse(params);
      const result = await this.driveClient.getMetadata(parsed);
      return { ok: true, ...result };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          ok: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid request parameters",
            details: { zodErrors: error.errors },
          },
        };
      }
      if (error instanceof MCPError) {
        return {
          ok: false,
          error: {
            code: error.code || ErrorCodes.INTERNAL_ERROR,
            message: error.message,
            details: error.details,
          },
        };
      }
      logger.error("Unexpected error in drive.getMetadata", error);
      return {
        ok: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Unexpected error",
        },
      };
    }
  }

  /**
   * Tool: llm.generate
   * Generates text using Vertex AI Gemini.
   */
  async["llm.generate"](params: unknown): Promise<VertexGenerateTextResponse> {
    try {
      const parsed = LlmGenerateRequestSchema.parse(params || {});
      const requestId = randomUUID();
      const prompt =
        typeof parsed.contents === "string"
          ? parsed.contents
          : JSON.stringify(parsed.contents);
      const req: VertexGenerateTextRequest = {
        request_id: requestId,
        model: parsed.model,
        prompt,
        temperature: parsed.temperature,
        max_output_tokens: parsed.maxTokens,
      };
      const result = await this.llmClient.generateText(req);
      return VertexGenerateTextResponseSchema.parse(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          ok: false,
          request_id: "error",
          model: "unknown",
          text: null,
          usage: null,
          timing_ms: 0,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid request parameters",
            details: { zodErrors: error.errors },
          },
        };
      }
      if (error instanceof MCPError) {
        return {
          ok: false,
          request_id: "error",
          model: "unknown",
          text: null,
          usage: null,
          timing_ms: 0,
          error: {
            code: error.code || ErrorCodes.INTERNAL_ERROR,
            message: error.message,
            details: error.details,
          },
        };
      }
      return {
        ok: false,
        request_id: "error",
        model: "unknown",
        text: null,
        usage: null,
        timing_ms: 0,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Unexpected error",
        },
      };
    }
  }

  /**
   * Tool: vertex.health
   * Connectivity check for Vertex AI Gemini integration.
   */
  async["vertex.health"](params: unknown): Promise<VertexHealthResponse> {
    try {
      logger.info("Calling vertex.health");
      const result = await this.llmClient.health();
      return VertexHealthResponseSchema.parse(result);
    } catch (error: any) {
      logger.error("Error in vertex.health", error);
      return {
        ok: false,
        project_id: "unknown",
        region: "unknown",
        model: "unknown",
        auth_mode_resolved: "adc",
        timing_ms: 0,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Health check failed",
          details: { operation: "vertex.health" },
        },
      };
    }
  }

  async["vertex.generateText"](params: unknown): Promise<VertexGenerateTextResponse> {
    try {
      const parsed = VertexGenerateTextRequestSchema.parse(params || {});
      logger.info("Calling vertex.generateText", { request_id: parsed.request_id });
      const result = await this.llmClient.generateText(parsed as any);
      return VertexGenerateTextResponseSchema.parse(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          ok: false,
          request_id: (params as any)?.request_id || "error",
          model: "unknown",
          text: null,
          usage: null,
          timing_ms: 0,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid request parameters",
            details: { zodErrors: error.errors },
          },
        };
      }
      logger.error("Unexpected error in vertex.generateText", error);
      return {
        ok: false,
        request_id: (params as any)?.request_id || "error",
        model: "unknown",
        text: null,
        usage: null,
        timing_ms: 0,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || "Generation failed",
          details: { operation: "vertex.generateText" },
        },
      };
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // INOS Epoch 0 â€” Canonical Database Tools
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Tool: identity.list
   * List rows from [IN] Identity.
   */
  async ["identity.list"](params: unknown) {
    try {
      logger.info("Calling identity.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listIdentities({
        identity_type: p.identity_type,
        handle: p.handle,
        status: p.status,
        entity: p.entity,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in identity.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "identity.list" });
    }
  }

  /**
   * Tool: specs.list
   * List rows from [ARK] Specs.
   */
  async ["specs.list"](params: unknown) {
    try {
      logger.info("Calling specs.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listSpecs({
        status: p.status,
        pod_owner: p.pod_owner,
        entity: p.entity,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in specs.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "specs.list" });
    }
  }

  /**
   * Tool: specs.create
   * Create a new spec in [ARK] Specs.
   */
  async ["specs.create"](params: unknown) {
    try {
      logger.info("Calling specs.create", { params });
      const p = z.object({
        spec_title: z.string().min(1),
        version: z.string().min(1),
        status: z.string().optional(),
        pod_owner: z.string().optional(),
        entity: z.array(z.string()).optional(),
        sync_key: z.string().optional(),
        doc_link: z.string().optional(),
        acceptance_tests: z.string().optional(),
      }).parse(params);
      const result = await this.client.createSpec(p);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request parameters", { zodErrors: error.errors });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in specs.create", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "specs.create" });
    }
  }

  /**
   * Tool: canon.list
   * List entries from [ARK] Canon Registry.
   */
  async ["canon.list"](params: unknown) {
    try {
      logger.info("Calling canon.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listCanonRegistry({
        status: p.status,
        entity: p.entity,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in canon.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "canon.list" });
    }
  }

  /**
   * Tool: policies.list
   * List rows from [LAW] Policies.
   */
  async ["policies.list"](params: unknown) {
    try {
      logger.info("Calling policies.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listPolicies({
        status: p.status,
        scope: p.scope,
        type: p.type,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in policies.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "policies.list" });
    }
  }

  /**
   * Tool: policies.create
   * Create a new policy in [LAW] Policies.
   */
  async ["policies.create"](params: unknown) {
    try {
      logger.info("Calling policies.create", { params });
      const p = z.object({
        policy_title: z.string().min(1),
        description: z.string().optional(),
        scope: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        effective_from: z.string().optional(),
      }).parse(params);
      const result = await this.client.createPolicy(p);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request parameters", { zodErrors: error.errors });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in policies.create", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "policies.create" });
    }
  }

  /**
   * Tool: approvals.list
   * List rows from [LAW] Approvals & Decisions.
   */
  async ["approvals.list"](params: unknown) {
    try {
      logger.info("Calling approvals.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listApprovals({
        decision_type: p.decision_type,
        status: p.status,
        entity: p.entity,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in approvals.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "approvals.list" });
    }
  }

  /**
   * Tool: approvals.create
   * Log a new decision in [LAW] Approvals & Decisions.
   */
  async ["approvals.create"](params: unknown) {
    try {
      logger.info("Calling approvals.create", { params });
      const p = z.object({
        decision_title: z.string().min(1),
        decision_type: z.enum(["Approval", "Rejection", "Exception", "Conditional Approval"]),
        target_type: z.string().optional(),
        reason: z.string().min(1),
        conditions: z.string().optional(),
        decision_date: z.string().min(1),
        entity: z.array(z.string()).optional(),
        status: z.string().optional(),
      }).parse(params);
      const result = await this.client.createApproval(p);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request parameters", { zodErrors: error.errors });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in approvals.create", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "approvals.create" });
    }
  }

  /**
   * Tool: artifacts.list
   * List rows from [MIND] Artifact Index.
   */
  async ["artifacts.list"](params: unknown) {
    try {
      logger.info("Calling artifacts.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listArtifactIndex({
        artifact_type: p.artifact_type,
        entity: p.entity,
        status: p.status,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in artifacts.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "artifacts.list" });
    }
  }

  /**
   * Tool: artifacts.create
   * Index a new artifact in [MIND] Artifact Index.
   */
  async ["artifacts.create"](params: unknown) {
    try {
      logger.info("Calling artifacts.create", { params });
      const p = z.object({
        artifact_title: z.string().min(1),
        artifact_type: z.string().min(1),
        entity: z.array(z.string()).optional(),
        pod: z.string().optional(),
        timestamp: z.string().optional(),
        source_id: z.string().optional(),
        location: z.string().optional(),
        summary: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).parse(params);
      const result = await this.client.createArtifactEntry(p);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request parameters", { zodErrors: error.errors });
      }
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in artifacts.create", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "artifacts.create" });
    }
  }

  /**
   * Tool: knowledge.list
   * List rows from [IN] Knowledge Articles.
   */
  async ["knowledge.list"](params: unknown) {
    try {
      logger.info("Calling knowledge.list", { params });
      const p = (params || {}) as any;
      const result = await this.client.listKnowledgeArticles({
        status: p.status,
        article_type: p.article_type,
        entity: p.entity,
        pod_owner: p.pod_owner,
        limit: p.limit,
      });
      return result;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Unexpected error in knowledge.list", error);
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, "Unexpected error", { operation: "knowledge.list" });
    }
  }

      async getToolDefinitions() {
    return [
      {
        name: "missions_list",
        description: "List active missions from Notion",
        inputSchema: { 
          type: "object", 
          properties: { 
            status: { type: "string", description: "Filter by status" } 
          } 
        }
      },
      {
        name: "timeline_log",
        description: "Log an event to the Infinite Network timeline",
        inputSchema: { 
          type: "object", 
          properties: { 
            title: { type: "string", description: "Title of the event" },
            summary: { type: "string", description: "Summary of the event" },
            type: { type: "string", description: "Event type (e.g. Mission, System)" },
            sync_key: { type: "string", description: "Unique sync key" }
          },
          required: ["title", "summary"]
        }
      }
    ];
  }
}
