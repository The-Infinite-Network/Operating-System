export type MCPErrorDetails = {
  status?: number;
  code?: string;
  path?: string;
  message: string;
  request_id?: string;
  raw?: unknown;
};

export class MCPError extends Error {
  status?: number;
  code?: string;
  path?: string;
  request_id?: string;
  raw?: unknown;

  constructor(details: MCPErrorDetails) {
    super(details.message);
    this.name = "MCPError";
    this.status = details.status;
    this.code = details.code;
    this.path = details.path;
    this.request_id = details.request_id;
    this.raw = details.raw;
  }
}

export type MCPHealth = {
  status?: string;
  service?: string;
  version?: string;
  epoch?: string;
  canon?: string;
  [key: string]: unknown;
};

export type MCPToolResponse<T> = {
  data?: T;
  request_id?: string;
  [key: string]: unknown;
};

export type MCPMission = {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  priority?: string | null;
  owner?: string | null;
  due?: string | null;
  last_edited_time?: string;
  mission_code?: string | null;
  entity?: string | null;
  room?: string | null;
  guild?: string | null;
};

export type MCPTask = {
  id: string;
  title?: string;
  status?: string | null;
  owner?: string | null;
  due_date?: string | null;
  priority?: string | number | null;
  entity?: string | null;
  room?: string | null;
  mission_id?: string | null;
};

export type MCPRoom = {
  room_code?: string | null;
  room_name?: string | null;
  entity?: string | null;
  owner?: string | null;
  status?: string | null;
};

export type MCPGuild = {
  guild_code?: string | null;
  guild_name?: string | null;
  entity?: string | null;
  status?: string | null;
};

export type MCPTimelineEvent = {
  id: string;
  title: string;
  type?: string | null;
  event_type?: string | null;
  missionId?: string | null;
  tags?: string[];
  source?: string | null;
  notes?: string | null;
  summary?: string | null;
  timestamp?: string | null;
  external_refs?: string | null;
  actor?: { id: string; name?: string | null; avatar_url?: string | null } | null;
  link?: string | null;
};

const DEFAULT_BASE_URL = "http://localhost:3002";
const STORAGE_KEY = "inos_mcp_base_url";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  return import.meta.env.VITE_MCP_BASE_URL || DEFAULT_BASE_URL;
}

async function fetchJson<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 7000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    const json = text ? JSON.parse(text) : null;

    if (!res.ok || json?.ok === false) {
      const errorObj = json?.error || {};
      const message =
        errorObj.message ||
        json?.message ||
        json?.error ||
        res.statusText ||
        "MCP request failed";

      throw new MCPError({
        status: res.status,
        code: errorObj.code || json?.code,
        path,
        message,
        request_id: json?.request_id || json?.data?.request_id,
        raw: json ?? text,
      });
    }

    return json as T;
  } catch (error: any) {
    if (error instanceof MCPError) throw error;
    if (error?.name === "AbortError") {
      throw new MCPError({
        code: "TIMEOUT",
        message: "MCP request timed out",
        path,
      });
    }
    throw new MCPError({
      message: error?.message || "MCP request failed",
      path,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function postTool<T>(toolName: string, params: Record<string, unknown>) {
  return fetchJson<MCPToolResponse<T>>(`/tool/${toolName}`, {
    method: "POST",
    body: JSON.stringify({ params }),
  });
}

const missionsList = async (filters: { status?: string; limit?: number } = {}) => {
  const response = await postTool<{ missions?: MCPMission[] }>(
    "missions.list",
    {
      status: filters.status,
      limit: filters.limit ?? 50
    }
  );
  return response.data?.missions || [];
};

const tasksList = async (filter: { missionId?: string; status?: string; owner?: string; limit?: number } = {}) => {
  const response = await postTool<{ tasks?: MCPTask[] }>(
    "tasks.list",
    {
      mission_id: filter.missionId,
      status: filter.status,
      owner: filter.owner,
      limit: filter.limit ?? 100,
    }
  );
  return response.data?.tasks || [];
};

const timelineList = async (
  filters: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    missionId?: string;
    limit?: number;
  } = {}
) => {
  const response = await postTool<{ events?: MCPTimelineEvent[]; request_id?: string }>(
    "timeline.list",
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      type: filters.type,
      missionId: filters.missionId,
      limit: filters.limit ?? 50,
    }
  );
  return {
    events: response.data?.events || [],
    request_id: response.data?.request_id || response.request_id,
  };
};

const missionsCreate = async (payload: {
  mission_title: string;
  mission_description: string;
  mission_objective: string;
  priority?: string;
  status?: string;
  owner?: string;
  entity?: string;
  room?: string;
  tags?: string[];
}) => {
  return postTool<{ id?: string }>("missions.create", payload);
};

const missionsUpdateStatus = async (payload: { missionId: string; status: string }) => {
  return postTool<{ id?: string }>("missions.updateStatus", payload);
};

const tasksCreate = async (payload: {
  missionId: string;
  taskTitle: string;
  status?: string;
  priority?: string;
  due_date?: string;
  notes?: string;
  source_system?: string;
}) => {
  return postTool<{ id?: string; url?: string }>("tasks.create", payload);
};

const tasksUpdate = async (payload: {
  taskId: string;
  missionId?: string;
  taskTitle?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  notes?: string;
}) => {
  return postTool<{ id?: string; url?: string }>("tasks.update", payload);
};

const runsCreate = async (payload: {
  missionId: string;
  runTitle?: string;
  notes?: string;
}) => {
  return postTool<Record<string, unknown>>("runs.create", payload);
};

const runsList = async (payload: { missionId: string }) => {
  return postTool<{ runs?: Record<string, unknown>[] }>("runs.list", payload);
};

const timelineLog = async (payload: {
  title: string;
  source: string;
  type?: string;
  notes?: string;
  tags?: string[];
  sync_key: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
}) => {
  return postTool<{ id?: string }>("timeline.log", payload);
};

// Canon rule: keep the public MCP client grouped by domain.
// Do not add flat top-level wrappers here; extend mcpClient.missions/tasks/timeline/runs instead.
export const mcpClient = {
  baseUrl: getBaseUrl,
  fetchJson,
  health: () => fetchJson<MCPHealth>("/health", { method: "GET" }),
  tools: () => fetchJson<string[]>("/tools", { method: "GET" }),
  capabilities: () => postTool<Record<string, unknown>>("system.capabilities", {}),
  missions: {
    list: missionsList,
    create: missionsCreate,
    updateStatus: missionsUpdateStatus,
  },
  tasks: {
    list: tasksList,
    create: tasksCreate,
    update: tasksUpdate,
  },
  timeline: {
    list: timelineList,
    log: timelineLog,
  },
  runs: {
    create: runsCreate,
    list: runsList,
  },
  roomsList: async () => {
    const response = await postTool<{ rooms?: MCPRoom[] }>("rooms.list", { limit: 100 });
    return response.data?.rooms || [];
  },
  guildsList: async () => {
    const response = await postTool<{ guilds?: MCPGuild[] }>("guilds.list", {});
    return response.data?.guilds || [];
  },
};
