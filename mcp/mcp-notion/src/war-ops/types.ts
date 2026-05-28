/**
 * WAR Ops Tool Types
 */

import { z } from "zod";

/**
 * Standard WAR Ops tool response format
 */
export interface WarOpsResponse {
  result: unknown;
  warnings: string[];
  actions: WarAction[];
  timeline_event: TimelineEvent | null;
  notion_writes: NotionWrite[];
}

/**
 * Proposed action with owner and ETA
 */
export interface WarAction {
  type: string;
  description: string;
  owner?: string;
  eta?: string;
  commit_hint?: string;
  dependencies?: string[];
}

/**
 * Timeline event to log
 */
export interface TimelineEvent {
  title: string;
  type?: string;
  missionId?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  date?: string;
}

/**
 * Notion write intent or result
 */
export interface NotionWrite {
  operation: "create" | "update" | "upsert";
  database: string;
  entity_type: "mission" | "task" | "timeline" | "other";
  payload: Record<string, unknown>;
  result?: {
    id: string;
    url?: string;
  };
  error?: string;
}

/**
 * Context for WAR operations
 */
export interface WarContext {
  horizon?: string; // Time horizon (e.g., "7d", "30d", "Q1")
  entity?: string;
  room?: string;
  owner?: string;
  status_filter?: string[];
  priority_filter?: string[];
}

/**
 * Mission deck (collection of missions)
 */
export interface MissionDeck {
  missions: MissionDeckItem[];
  metadata: {
    generated_at: string;
    context: WarContext;
    total_count: number;
  };
}

export interface MissionDeckItem {
  id?: string;
  mission_code?: string;
  title: string;
  status: string;
  priority?: string;
  entity?: string;
  room?: string;
  owner?: string;
  due_date?: string;
  acceptance_tests?: string[];
  objectives?: string[];
  tasks?: TaskItem[];
  blockers?: string[];
}

export interface TaskItem {
  title: string;
  status?: string;
  owner?: string;
  due_date?: string;
  acceptance_check?: string;
}

/**
 * Rhythm (operational cadence)
 */
export interface Rhythm {
  cadence: string; // "daily", "weekly", "biweekly", "monthly"
  missions: MissionDeckItem[];
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  date: string;
  type: "sync" | "review" | "reset";
  missions: string[]; // Mission IDs or codes
}

/**
 * Blocker report
 */
export interface BlockerReport {
  blockers: Blocker[];
  summary: {
    total: number;
    by_priority: Record<string, number>;
    by_entity: Record<string, number>;
  };
}

export interface Blocker {
  mission_id?: string;
  mission_code?: string;
  mission_title: string;
  blocker_type: "dependency" | "resource" | "decision" | "external" | "other";
  description: string;
  owner?: string;
  escalated_to?: string;
  eta?: string;
}

/**
 * Reset plan
 */
export interface ResetPlan {
  missions_to_park: string[];
  missions_to_prioritize: string[];
  missions_to_archive: string[];
  rationale: string;
  actions: WarAction[];
}

/**
 * Scan result (mission inventory)
 */
export interface ScanResult {
  missions: MissionDeckItem[];
  summary: {
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_entity: Record<string, number>;
    overdue: number;
    without_tests: number;
  };
}

/**
 * Schema validators
 */
export const WarContextSchema = z.object({
  horizon: z.string().optional(),
  entity: z.string().optional(),
  room: z.string().optional(),
  owner: z.string().optional(),
  status_filter: z.array(z.string()).optional(),
  priority_filter: z.array(z.string()).optional(),
});

export const WarOpsResponseSchema = z.object({
  result: z.unknown(),
  warnings: z.array(z.string()),
  actions: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      owner: z.string().optional(),
      eta: z.string().optional(),
      commit_hint: z.string().optional(),
      dependencies: z.array(z.string()).optional(),
    })
  ),
  timeline_event: z
    .object({
      title: z.string(),
      type: z.string().optional(),
      missionId: z.string().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      date: z.string().optional(),
    })
    .nullable(),
  notion_writes: z.array(
    z.object({
      operation: z.enum(["create", "update", "upsert"]),
      database: z.string(),
      entity_type: z.enum(["mission", "task", "timeline", "other"]),
      payload: z.record(z.unknown()),
      result: z
        .object({
          id: z.string(),
          url: z.string().optional(),
        })
        .optional(),
      error: z.string().optional(),
    })
  ),
});

