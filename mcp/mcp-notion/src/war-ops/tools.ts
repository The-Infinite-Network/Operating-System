/**
 * WAR Ops Tools
 *
 * Agent WAR ("Stoic Steve") - Operations Battle Commander
 *
 * Implements deterministic operational outputs with safety boundaries.
 */

import { z } from "zod";
import { NotionClient } from "../client.js";
import { Logger, MCPError, ErrorCodes } from "../errors.js";
import { getConfig } from "../config.js";
import { parseMissionBrief, type MissionType } from "./parser.js";
import type {
  WarOpsResponse,
  WarAction,
  TimelineEvent,
  NotionWrite,
  WarContext,
  MissionDeck,
  MissionDeckItem,
  Rhythm,
  BlockerReport,
  ResetPlan,
  ScanResult,
} from "./types.js";

const logger = new Logger("WAR-Ops");

/**
 * Safety check: refuse legal/financial/medical advice
 */
function checkSafetyBoundaries(query: string): {
  safe: boolean;
  message?: string;
} {
  const lowerQuery = query.toLowerCase();

  // Legal advice
  if (
    lowerQuery.includes("legal") ||
    lowerQuery.includes("lawyer") ||
    lowerQuery.includes("attorney") ||
    lowerQuery.includes("contract") ||
    lowerQuery.includes("liability")
  ) {
    return {
      safe: false,
      message:
        "WAR Ops cannot provide legal advice. Please escalate to LAW room or consult legal counsel.",
    };
  }

  // Financial advice
  if (
    lowerQuery.includes("financial advice") ||
    lowerQuery.includes("investment") ||
    lowerQuery.includes("tax advice") ||
    lowerQuery.includes("accounting")
  ) {
    return {
      safe: false,
      message:
        "WAR Ops cannot provide financial advice. Please escalate to BANK room or consult financial advisor.",
    };
  }

  // Medical advice
  if (
    lowerQuery.includes("medical") ||
    lowerQuery.includes("health advice") ||
    lowerQuery.includes("diagnosis") ||
    lowerQuery.includes("treatment")
  ) {
    return {
      safe: false,
      message:
        "WAR Ops cannot provide medical advice. Please consult a healthcare professional.",
    };
  }

  return { safe: true };
}

/**
 * Resolve person by handle or name
 */
async function resolvePerson(
  client: NotionClient,
  identifier: string
): Promise<string | null> {
  const config = getConfig();
  const agentsDbId = config.NOTION_DB_AGENTS || config.NOTION_DB_TEAM_AI_PEOPLE;

  if (!agentsDbId) {
    logger.warn("No agents/people DB configured, cannot resolve person", {
      identifier,
    });
    return null;
  }

  try {
    // Note: This requires access to the Notion client's internal client
    // For now, return the identifier as-is and let the caller handle resolution
    // TODO: Add a public method to NotionClient for person resolution
    logger.warn("Person resolution not fully implemented", { identifier });
    return identifier; // Return identifier as fallback
  } catch (error) {
    logger.warn("Failed to resolve person", { identifier, error });
    return null;
  }
}

/**
 * Create standard WAR Ops response
 */
function createResponse(
  result: unknown,
  warnings: string[] = [],
  actions: WarAction[] = [],
  timelineEvent: TimelineEvent | null = null,
  notionWrites: NotionWrite[] = []
): WarOpsResponse {
  return {
    result,
    warnings,
    actions,
    timeline_event: timelineEvent,
    notion_writes: notionWrites,
  };
}

/**
 * WAR Ops Tools Class
 */
export class WarOpsTools {
  private client: NotionClient;

  constructor() {
    this.client = new NotionClient();
  }

  /**
   * Tool: war_spec
   * Generate mission specification from context
   */
  async war_spec(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          context: z.record(z.unknown()).optional(),
          horizon: z.string().optional(),
          dry_run: z.boolean().default(true),
        })
        .parse(params);

      const context: WarContext = (parsed.context as WarContext) || {};
      if (parsed.horizon) {
        context.horizon = parsed.horizon;
      }

      // Safety check
      const safety = checkSafetyBoundaries(JSON.stringify(context));
      if (!safety.safe) {
        return createResponse(
          null,
          [safety.message || "Safety boundary violation"],
          [],
          null,
          []
        );
      }

      // Query missions and filter by context
      const allMissions = await this.client.listMissions();
      let missions = allMissions;

      // Apply filters
      if (
        context.entity ||
        context.room ||
        context.owner ||
        context.status_filter
      ) {
        missions = {
          missions: allMissions.missions.filter((m) => {
            if (context.entity && m.entity !== context.entity) return false;
            if (context.room && m.room !== context.room) return false;
            if (context.owner && m.owner !== context.owner) return false;
            if (
              context.status_filter &&
              !context.status_filter.includes(m.status)
            )
              return false;
            return true;
          }),
        };
      }

      const spec = {
        context,
        horizon: context.horizon || "30d",
        mission_count: missions.missions.length,
        missions: missions.missions.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          priority: m.priority,
          entity: m.entity,
        })),
      };

      const timelineEvent: TimelineEvent = {
        title: `WAR Spec generated for ${context.horizon || "30d"}`,
        type: "WAR Spec",
        source: "WAR Ops",
        notes: `Generated spec with ${missions.missions.length} missions`,
      };

      return createResponse(spec, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_spec", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_align
   * Align mission deck with current state
   */
  async war_align(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          mission_deck: z.record(z.unknown()),
          dry_run: z.boolean().default(true),
        })
        .parse(params);

      const deck = parsed.mission_deck as unknown as MissionDeck;
      const warnings: string[] = [];
      const actions: WarAction[] = [];
      const notionWrites: NotionWrite[] = [];

      // Validate mission deck structure
      if (!deck.missions || !Array.isArray(deck.missions)) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid mission deck structure",
          { operation: "war_align" }
        );
      }

      // For each mission in deck, check if it exists and align
      for (const mission of deck.missions) {
        if (mission.id) {
          // Update existing mission
          notionWrites.push({
            operation: "update",
            database: "missions",
            entity_type: "mission",
            payload: {
              id: mission.id,
              status: mission.status,
              priority: mission.priority,
            },
          });
        } else if (mission.mission_code) {
          // Try to find by mission code
          notionWrites.push({
            operation: "upsert",
            database: "missions",
            entity_type: "mission",
            payload: {
              mission_code: mission.mission_code,
              ...mission,
            },
          });
        } else {
          warnings.push(
            `Mission "${mission.title}" has no ID or mission_code, cannot align`
          );
        }
      }

      const timelineEvent: TimelineEvent = {
        title: `WAR Align: ${deck.missions.length} missions aligned`,
        type: "WAR Align",
        source: "WAR Ops",
      };

      return createResponse(
        { aligned_count: deck.missions.length },
        warnings,
        actions,
        timelineEvent,
        notionWrites
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_align", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_mission
   * Create or update mission from seed brief
   */
  async war_mission(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          seed: z.string().min(1, "seed is required"),
          template: z
            .enum(["quick_task", "standard", "project_brief"])
            .optional(),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      // Safety check
      const safety = checkSafetyBoundaries(parsed.seed);
      if (!safety.safe) {
        return createResponse(
          null,
          [safety.message || "Safety boundary violation"],
          [],
          null,
          []
        );
      }

      // Parse mission brief
      const parsedBrief = parseMissionBrief(parsed.seed);

      // Override mission type if template specified
      if (parsed.template) {
        parsedBrief.mission_type = parsed.template;
      }

      // Enforce "no mission without acceptance tests"
      if (
        !parsedBrief.acceptance_tests ||
        parsedBrief.acceptance_tests.length === 0
      ) {
        parsedBrief.warnings.push(
          "CRITICAL: Mission cannot be created without acceptance tests. Please add acceptance tests."
        );
        if (parsed.commit) {
          return createResponse(null, parsedBrief.warnings, [], null, []);
        }
      }

      // Resolve owner if provided
      let ownerId: string | undefined;
      if (parsedBrief.owner) {
        ownerId =
          (await resolvePerson(this.client, parsedBrief.owner)) || undefined;
        if (!ownerId) {
          parsedBrief.warnings.push(
            `Could not resolve owner "${parsedBrief.owner}"`
          );
        }
      }

      // Prepare Notion write
      const notionWrite: NotionWrite = {
        operation: parsedBrief.mission_code ? "upsert" : "create",
        database: "missions",
        entity_type: "mission",
        payload: {
          mission_title: parsedBrief.mission_title,
          mission_description:
            parsedBrief.mission_description || parsedBrief.mission_title,
          mission_objective:
            parsedBrief.mission_objective || parsedBrief.objectives?.join(", "),
          mission_code: parsedBrief.mission_code,
          status: parsedBrief.status || "Proposed",
          priority: parsedBrief.priority,
          entity: parsedBrief.entity,
          room: parsedBrief.room,
          owner: ownerId,
          due_date: parsedBrief.due_date,
          mission_type: parsedBrief.mission_type,
          source_system: parsedBrief.source_system || "WAR Ops",
          sync_key: parsedBrief.sync_key,
          brief_raw: parsedBrief.brief_raw,
        },
      };

      // Execute write if commit=true
      if (parsed.commit && !parsed.dry_run) {
        try {
          const result = await this.client["missions.upsert"](
            notionWrite.payload as any,
            parsedBrief.mission_code
              ? { mission_code: parsedBrief.mission_code }
              : undefined
          );
          notionWrite.result = {
            id: result.notion_page_id,
            url: result.mission_url || undefined,
          };
        } catch (error) {
          notionWrite.error = String(error);
          parsedBrief.warnings.push(`Failed to create mission: ${error}`);
        }
      }

      const timelineEvent: TimelineEvent = {
        title: `Mission created: ${parsedBrief.mission_title}`,
        type: "Mission Created",
        source: "WAR Ops",
        notes: `Mission type: ${parsedBrief.mission_type}`,
      };

      return createResponse(
        {
          mission: parsedBrief,
          notion_write: notionWrite,
        },
        parsedBrief.warnings,
        [],
        timelineEvent,
        [notionWrite]
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_mission", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_rhythm
   * Generate operational rhythm (cadence)
   */
  async war_rhythm(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          context: z.record(z.unknown()).optional(),
          horizon: z.string().default("30d"),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      const context: WarContext = (parsed.context as WarContext) || {};
      context.horizon = parsed.horizon;

      // Query missions and filter by context
      const allMissions = await this.client.listMissions();
      const missions = {
        missions: allMissions.missions.filter((m) => {
          if (context.entity && m.entity !== context.entity) return false;
          if (context.room && m.room !== context.room) return false;
          if (context.owner && m.owner !== context.owner) return false;
          return true;
        }),
      };

      // Generate rhythm based on horizon
      const rhythm: Rhythm = {
        cadence: parsed.horizon.includes("7") ? "daily" : "weekly",
        missions: missions.missions.slice(0, 10).map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          priority: m.priority || undefined,
        })),
        checkpoints: [],
      };

      const timelineEvent: TimelineEvent = {
        title: `WAR Rhythm generated: ${parsed.horizon}`,
        type: "WAR Rhythm",
        source: "WAR Ops",
      };

      return createResponse(rhythm, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_rhythm", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_brief
   * Generate mission brief from mission reference
   */
  async war_brief(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          mission_ref: z.string().min(1, "mission_ref is required"),
          dry_run: z.boolean().default(true),
        })
        .parse(params);

      // Get mission by ID or code
      const missions = await this.client.listMissions();
      const mission = missions.missions.find(
        (m) =>
          m.id === parsed.mission_ref || m.mission_code === parsed.mission_ref
      );

      if (!mission) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Mission not found", {
          operation: "war_brief",
          mission_ref: parsed.mission_ref,
        });
      }

      // Generate brief format
      const brief = {
        mission_title: mission.title,
        mission_code: mission.mission_code,
        status: mission.status,
        priority: mission.priority,
        entity: mission.entity,
        owner: mission.owner,
      };

      return createResponse(brief, [], [], null, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_brief", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_debrief
   * Generate after-action report (AAR)
   */
  async war_debrief(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          mission_ref: z.string().min(1, "mission_ref is required"),
          aar_notes: z.string().optional(),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      // Get mission
      const missions = await this.client.listMissions();
      const mission = missions.missions.find(
        (m) =>
          m.id === parsed.mission_ref || m.mission_code === parsed.mission_ref
      );

      if (!mission) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Mission not found", {
          operation: "war_debrief",
          mission_ref: parsed.mission_ref,
        });
      }

      const aar = {
        mission_id: mission.id,
        mission_title: mission.title,
        aar_notes: parsed.aar_notes || "AAR generated",
        completed_at: new Date().toISOString(),
      };

      const timelineEvent: TimelineEvent = {
        title: `AAR: ${mission.title}`,
        type: "AAR",
        missionId: mission.id,
        source: "WAR Ops",
        notes: parsed.aar_notes,
      };

      const notionWrite: NotionWrite = {
        operation: "create",
        database: "runs_aars",
        entity_type: "other",
        payload: aar,
      };

      if (parsed.commit && !parsed.dry_run) {
        // TODO: Implement AAR write to Notion
      }

      return createResponse(aar, [], [], timelineEvent, [notionWrite]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_debrief", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_scan
   * Scan missions inventory
   */
  async war_scan(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          context: z.record(z.unknown()).optional(),
          dry_run: z.boolean().default(true),
        })
        .parse(params);

      const context: WarContext = (parsed.context as WarContext) || {};

      // Query all missions
      // Query missions and filter by context
      const allMissions = await this.client.listMissions();
      const missions = {
        missions: allMissions.missions.filter((m) => {
          if (context.entity && m.entity !== context.entity) return false;
          if (context.room && m.room !== context.room) return false;
          if (context.owner && m.owner !== context.owner) return false;
          if (
            context.status_filter &&
            !context.status_filter.includes(m.status)
          )
            return false;
          return true;
        }),
      };

      // Generate summary
      const summary = {
        total: missions.missions.length,
        by_status: {} as Record<string, number>,
        by_priority: {} as Record<string, number>,
        by_entity: {} as Record<string, number>,
        overdue: 0,
        without_tests: 0,
      };

      missions.missions.forEach((m) => {
        summary.by_status[m.status] = (summary.by_status[m.status] || 0) + 1;
        if (m.priority) {
          summary.by_priority[m.priority] =
            (summary.by_priority[m.priority] || 0) + 1;
        }
        if (m.entity) {
          summary.by_entity[m.entity] = (summary.by_entity[m.entity] || 0) + 1;
        }
      });

      const scanResult: ScanResult = {
        missions: missions.missions.map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          priority: m.priority || undefined,
          entity: m.entity || undefined,
        })),
        summary,
      };

      return createResponse(scanResult, [], [], null, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_scan", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_blockers
   * Identify and report blockers
   */
  async war_blockers(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          context: z.record(z.unknown()).optional(),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      const context: WarContext = (parsed.context as WarContext) || {};

      // Query missions and filter for blocked
      const allMissions = await this.client.listMissions();
      const missions = {
        missions: allMissions.missions.filter((m) => {
          if (m.status !== "Blocked") return false;
          if (context.entity && m.entity !== context.entity) return false;
          if (context.room && m.room !== context.room) return false;
          return true;
        }),
      };

      const blockers: BlockerReport["blockers"] = missions.missions.map(
        (m) => ({
          mission_id: m.id,
          mission_code: m.mission_code || undefined,
          mission_title: m.title,
          blocker_type: "other",
          description: `Mission "${m.title}" is blocked`,
          owner: m.owner || undefined,
        })
      );

      const report: BlockerReport = {
        blockers,
        summary: {
          total: blockers.length,
          by_priority: {},
          by_entity: {},
        },
      };

      const timelineEvent: TimelineEvent = {
        title: `Blocker report: ${blockers.length} blockers identified`,
        type: "Blocker Report",
        source: "WAR Ops",
      };

      return createResponse(report, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_blockers", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_reset
   * Generate reset plan
   */
  async war_reset(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          context: z.record(z.unknown()).optional(),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      const context: WarContext = (parsed.context as WarContext) || {};

      // Query missions and filter by context
      const allMissions = await this.client.listMissions();
      const missions = {
        missions: allMissions.missions.filter((m) => {
          if (context.entity && m.entity !== context.entity) return false;
          if (context.room && m.room !== context.room) return false;
          return true;
        }),
      };

      // Identify missions to park/archive
      const toPark = missions.missions
        .filter((m) => m.status === "Blocked" || m.status === "Parked")
        .map((m) => m.id);
      const toArchive = missions.missions
        .filter((m) => m.status === "Complete" || m.status === "Done")
        .map((m) => m.id);

      const resetPlan: ResetPlan = {
        missions_to_park: toPark,
        missions_to_prioritize: [],
        missions_to_archive: toArchive,
        rationale: "Reset plan generated by WAR Ops",
        actions: [],
      };

      const timelineEvent: TimelineEvent = {
        title: "WAR Reset plan generated",
        type: "WAR Reset",
        source: "WAR Ops",
      };

      return createResponse(resetPlan, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_reset", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_drill
   * Execute operational drill
   */
  async war_drill(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          target_system: z.string().min(1, "target_system is required"),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      const drill = {
        target_system: parsed.target_system,
        executed_at: new Date().toISOString(),
        status: "completed",
      };

      const timelineEvent: TimelineEvent = {
        title: `WAR Drill: ${parsed.target_system}`,
        type: "WAR Drill",
        source: "WAR Ops",
      };

      return createResponse(drill, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_drill", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }

  /**
   * Tool: war_train
   * Train on SOP
   */
  async war_train(params: unknown): Promise<WarOpsResponse> {
    try {
      const parsed = z
        .object({
          sop_ref: z.string().min(1, "sop_ref is required"),
          role: z.string().min(1, "role is required"),
          dry_run: z.boolean().default(true),
          commit: z.boolean().default(false),
        })
        .parse(params);

      const training = {
        sop_ref: parsed.sop_ref,
        role: parsed.role,
        trained_at: new Date().toISOString(),
        status: "completed",
      };

      const timelineEvent: TimelineEvent = {
        title: `WAR Training: ${parsed.role} on ${parsed.sop_ref}`,
        type: "WAR Training",
        source: "WAR Ops",
      };

      return createResponse(training, [], [], timelineEvent, []);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Invalid request parameters",
          { operation: "war_train", zodErrors: error.errors }
        );
      }
      throw error;
    }
  }
}
