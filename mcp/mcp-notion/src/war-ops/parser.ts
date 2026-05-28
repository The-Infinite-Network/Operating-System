/**
 * WAR Ops Mission Brief Parser
 * 
 * Parses raw mission briefs and determines mission type based on field presence.
 * Enforces "no mission without acceptance tests" rule.
 */

import { z } from "zod";

export type MissionType = "quick_task" | "standard" | "project_brief";

export interface ParsedMissionBrief {
  // Core fields
  mission_title: string;
  mission_description?: string;
  mission_objective?: string;
  mission_code?: string;
  
  // Metadata
  status?: string;
  priority?: "P0" | "P1" | "P2" | "P3";
  entity?: string;
  room?: string;
  owner?: string;
  assigned_to?: string[];
  
  // Dates
  start_date?: string;
  due_date?: string;
  
  // Requirements
  acceptance_tests?: string[];
  objectives?: string[];
  
  // Classification
  mission_type: MissionType;
  
  // Additional
  tags?: string[];
  source_system?: string;
  sync_key?: string;
  external_refs?: string;
  brief_raw?: string;
  
  // Warnings
  warnings: string[];
}

/**
 * Parse a raw mission brief string into structured fields.
 * 
 * Supports multiple formats:
 * - Markdown-style with headers (## Mission Title, ## Objective, etc.)
 * - Key-value pairs (Mission Title:, Objective:, etc.)
 * - Free-form with field detection
 */
export function parseMissionBrief(rawBrief: string): ParsedMissionBrief {
  const warnings: string[] = [];
  const result: Partial<ParsedMissionBrief> = {
    warnings: [],
    mission_type: "standard",
  };

  // Extract mission type if explicitly specified
  const missionTypeMatch = rawBrief.match(/Mission Type:\s*(\w+)/i);
  if (missionTypeMatch) {
    const type = missionTypeMatch[1].toLowerCase();
    if (type === "quick_task" || type === "standard" || type === "project_brief") {
      result.mission_type = type as MissionType;
    }
  }

  // Extract fields using regex patterns
  const fieldPatterns: Record<string, RegExp> = {
    mission_title: /(?:Mission Title|Title|Name):\s*(.+?)(?:\n|$)/i,
    mission_description: /(?:Mission Description|Description):\s*(.+?)(?:\n|$)/i,
    mission_objective: /(?:Mission Objective|Objective|Goal):\s*(.+?)(?:\n|$)/i,
    mission_code: /(?:Mission Code|Code):\s*(.+?)(?:\n|$)/i,
    status: /Status:\s*(.+?)(?:\n|$)/i,
    priority: /Priority:\s*(P[0-3]|\d+)/i,
    entity: /Entity:\s*(.+?)(?:\n|$)/i,
    room: /(?:Room|Pod):\s*(.+?)(?:\n|$)/i,
    owner: /Owner:\s*(.+?)(?:\n|$)/i,
    start_date: /(?:Start Date|Start):\s*(.+?)(?:\n|$)/i,
    due_date: /(?:Due Date|Due|Deadline):\s*(.+?)(?:\n|$)/i,
    sync_key: /(?:SYNC_KEY|Sync Key):\s*(.+?)(?:\n|$)/i,
    source_system: /(?:Source System|Source):\s*(.+?)(?:\n|$)/i,
    external_refs: /(?:External Refs|External References|Refs):\s*(.+?)(?:\n|$)/i,
  };

  // Extract simple fields
  for (const [key, pattern] of Object.entries(fieldPatterns)) {
    const match = rawBrief.match(pattern);
    if (match) {
      const value = match[1].trim();
      if (key === "priority") {
        // Normalize priority
        if (value.startsWith("P")) {
          result.priority = value as "P0" | "P1" | "P2" | "P3";
        } else {
          const num = parseInt(value, 10);
          if (num >= 0 && num <= 3) {
            result.priority = `P${num}` as "P0" | "P1" | "P2" | "P3";
          }
        }
      } else {
        (result as any)[key] = value;
      }
    }
  }

  // Extract assigned_to (can be comma-separated)
  const assignedMatch = rawBrief.match(/(?:Assigned To|Assigned|Assignees):\s*(.+?)(?:\n|$)/i);
  if (assignedMatch) {
    result.assigned_to = assignedMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Extract tags (can be comma-separated or space-separated)
  const tagsMatch = rawBrief.match(/(?:Tags|Tag):\s*(.+?)(?:\n|$)/i);
  if (tagsMatch) {
    result.tags = tagsMatch[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Extract acceptance tests (multi-line list)
  const acceptanceTestsMatch = rawBrief.match(
    /(?:Acceptance Tests|Acceptance|Tests):\s*\n((?:[-*]\s*.+\n?)+)/i
  );
  if (acceptanceTestsMatch) {
    result.acceptance_tests = acceptanceTestsMatch[1]
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  } else {
    // Try single-line format
    const singleLineTests = rawBrief.match(
      /(?:Acceptance Tests|Acceptance|Tests):\s*(.+?)(?:\n|$)/i
    );
    if (singleLineTests) {
      result.acceptance_tests = singleLineTests[1]
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Extract objectives (multi-line list)
  const objectivesMatch = rawBrief.match(
    /(?:Objectives|Objective List):\s*\n((?:[-*]\s*.+\n?)+)/i
  );
  if (objectivesMatch) {
    result.objectives = objectivesMatch[1]
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  } else if (result.mission_objective) {
    // If single objective provided, use it
    result.objectives = [result.mission_objective];
  }

  // If no mission title found, try to extract from first line
  if (!result.mission_title) {
    const firstLine = rawBrief.split("\n")[0].trim();
    if (firstLine && !firstLine.includes(":")) {
      result.mission_title = firstLine;
    } else {
      warnings.push("No mission title found - using 'Untitled Mission'");
      result.mission_title = "Untitled Mission";
    }
  }

  // Determine mission type if not explicitly set
  if (!missionTypeMatch) {
    result.mission_type = determineMissionType(result);
  }

  // Validate required fields based on mission type
  validateMissionType(result, warnings);

  // Enforce "no mission without acceptance tests"
  if (!result.acceptance_tests || result.acceptance_tests.length === 0) {
    warnings.push(
      "WARNING: No acceptance tests specified. WAR Ops requires acceptance tests for all missions."
    );
  }

  // Store raw brief
  result.brief_raw = rawBrief;

  return {
    ...result,
    warnings,
  } as ParsedMissionBrief;
}

/**
 * Determine mission type based on field presence.
 */
function determineMissionType(
  parsed: Partial<ParsedMissionBrief>
): MissionType {
  // quick_task requires: Assigned To + Start Date + Objective + Due Date
  if (
    parsed.assigned_to &&
    parsed.assigned_to.length > 0 &&
    parsed.start_date &&
    parsed.mission_objective &&
    parsed.due_date
  ) {
    return "quick_task";
  }

  // standard and project_brief both require: Objectives + Acceptance Tests
  if (parsed.objectives && parsed.objectives.length > 0) {
    if (parsed.acceptance_tests && parsed.acceptance_tests.length > 0) {
      // Heuristic: project_brief if more than 3 objectives or explicit indicators
      if (
        parsed.objectives.length > 3 ||
        parsed.brief_raw?.toLowerCase().includes("project") ||
        parsed.brief_raw?.toLowerCase().includes("brief")
      ) {
        return "project_brief";
      }
      return "standard";
    }
  }

  // Default to standard if we can't determine
  return "standard";
}

/**
 * Validate mission has required fields for its type.
 */
function validateMissionType(
  parsed: Partial<ParsedMissionBrief>,
  warnings: string[]
): void {
  switch (parsed.mission_type) {
    case "quick_task":
      if (!parsed.assigned_to || parsed.assigned_to.length === 0) {
        warnings.push("quick_task requires 'Assigned To' field");
      }
      if (!parsed.start_date) {
        warnings.push("quick_task requires 'Start Date' field");
      }
      if (!parsed.mission_objective) {
        warnings.push("quick_task requires 'Objective' field");
      }
      if (!parsed.due_date) {
        warnings.push("quick_task requires 'Due Date' field");
      }
      break;

    case "standard":
    case "project_brief":
      if (!parsed.objectives || parsed.objectives.length === 0) {
        warnings.push(
          `${parsed.mission_type} requires 'Objectives' list field`
        );
      }
      if (!parsed.acceptance_tests || parsed.acceptance_tests.length === 0) {
        warnings.push(
          `${parsed.mission_type} requires 'Acceptance Tests' list field`
        );
      }
      break;
  }
}

