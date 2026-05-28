export const SOURCE_TYPE_LABEL_TO_CODE: Record<string, string> = {
  Url: "url",
  URL: "url",
  Link: "url",
  Sheet: "sheet",
  "Sheet Row": "sheet",
  Doc: "doc",
  File: "doc",
  Note: "other",
  Scan: "image",
  Pdf: "pdf",
  PDF: "pdf",
  Image: "image",
  Email: "email",
  Chat: "chat",
  Thread: "chat",
  Notion: "notion",
  Other: "other",
};

export const DEST_DB_LABEL_TO_CODE: Record<string, string> = {
  Inbox: "INBOX",
  Tasks: "TASKS",
  Missions: "MISSIONS",
  "Runs AARs": "RUNS_AARS",
  Timeline: "TIMELINE",
  "Ark Assets": "ARK_ASSETS",
  "Law Docs": "LAW_DOCS",
  "Class KB": "CLASS_KB",
  "Air Research": "AIR_RESEARCH",
  "Bob Brand": "BOB_BRAND",
  "Bake RND": "BAKE_RND",
  "Food RND": "BAKE_RND",
  Agents: "AGENTS",
  Entities: "ENTITIES",
  Rooms: "ROOMS",
};

export const ROUTING_STATUS_LABEL_TO_CODE: Record<string, string> = {
  Captured: "new",
  Classified: "triaged",
  New: "new",
  Triaged: "triaged",
  Routed: "routed",
  Blocked: "blocked",
  Duplicate: "duplicate",
  Archived: "archived",
  Verified: "verified",
  Closed: "archived",
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

const buildNormalizedMap = (input: Record<string, string>) =>
  Object.entries(input).reduce<Record<string, string>>((acc, [label, code]) => {
    acc[normalizeKey(label)] = code;
    return acc;
  }, {});

const SOURCE_TYPE_LABEL_TO_CODE_N = buildNormalizedMap(SOURCE_TYPE_LABEL_TO_CODE);
const DEST_DB_LABEL_TO_CODE_N = buildNormalizedMap(DEST_DB_LABEL_TO_CODE);
const ROUTING_STATUS_LABEL_TO_CODE_N = buildNormalizedMap(
  ROUTING_STATUS_LABEL_TO_CODE
);

const invertPreferredLabel = (input: Record<string, string>) =>
  Object.entries(input).reduce<Record<string, string>>((acc, [label, code]) => {
    if (!acc[code]) acc[code] = label;
    return acc;
  }, {});

export const SOURCE_TYPE_CODE_TO_LABEL = invertPreferredLabel(
  SOURCE_TYPE_LABEL_TO_CODE
);
export const DEST_DB_CODE_TO_LABEL = invertPreferredLabel(
  DEST_DB_LABEL_TO_CODE
);
export const ROUTING_STATUS_CODE_TO_LABEL = invertPreferredLabel(
  ROUTING_STATUS_LABEL_TO_CODE
);

export function normalizeSourceType(input: {
  source_type_code?: string | null;
  source_type_select?: string | null;
  source_type?: string | null;
}): { source_type_code: string; source_type_select?: string } | null {
  const direct = input.source_type_code?.trim();
  if (direct) {
    return {
      source_type_code: direct,
      source_type_select: SOURCE_TYPE_CODE_TO_LABEL[direct],
    };
  }
  const label = (input.source_type_select || input.source_type || "").trim();
  if (!label) return null;
  const mapped = SOURCE_TYPE_LABEL_TO_CODE_N[normalizeKey(label)];
  if (!mapped) return null;
  return {
    source_type_code: mapped,
    source_type_select: SOURCE_TYPE_CODE_TO_LABEL[mapped] || label,
  };
}

export function normalizeDestinationDb(input: {
  destination_db_code?: string | null;
  destination_db_select?: string | null;
  destination_db?: string | null;
}): { destination_db_code: string; destination_db_select?: string } | null {
  const direct = input.destination_db_code?.trim();
  if (direct) {
    return {
      destination_db_code: direct,
      destination_db_select: DEST_DB_CODE_TO_LABEL[direct],
    };
  }
  const label = (input.destination_db_select || input.destination_db || "").trim();
  if (!label) return null;
  const mapped = DEST_DB_LABEL_TO_CODE_N[normalizeKey(label)];
  if (!mapped) return null;
  return {
    destination_db_code: mapped,
    destination_db_select: DEST_DB_CODE_TO_LABEL[mapped] || label,
  };
}

export function normalizeRoutingStatus(input: {
  routing_status_code?: string | null;
  routing_status_select?: string | null;
  routing_status?: string | null;
}): { routing_status_code: string; routing_status_select?: string } | null {
  const direct = input.routing_status_code?.trim();
  if (direct) {
    return {
      routing_status_code: direct,
      routing_status_select: ROUTING_STATUS_CODE_TO_LABEL[direct],
    };
  }
  const label = (input.routing_status_select || input.routing_status || "").trim();
  if (!label) return null;
  const mapped = ROUTING_STATUS_LABEL_TO_CODE_N[normalizeKey(label)];
  if (!mapped) return null;
  return {
    routing_status_code: mapped,
    routing_status_select: ROUTING_STATUS_CODE_TO_LABEL[mapped] || label,
  };
}

export function computeRoutingKey(args: {
  lane: string;
  layer: string;
  object_type: string;
  destination_db_code?: string | null;
}): string {
  const dest = (args.destination_db_code || "").trim();
  return `${args.lane}:${args.layer}:${args.object_type}:${dest}`;
}

export function isRoutingKeyValid(key: string): boolean {
  const parts = key.split(":");
  return parts.length === 4;
}
