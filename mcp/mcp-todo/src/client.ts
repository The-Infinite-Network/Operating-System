import axios, { AxiosInstance } from "axios";
import { getConfig } from "./config.js";
import { MCPError, ErrorCodes, Logger } from "./errors.js";

const logger = new Logger("TodoClient");

export interface TaskList {
  id: string;
  displayName: string;
  isOwner: boolean;
  isShared: boolean;
  wellknownListName: string;
}

export interface Task {
  id: string;
  title: string;
  status: "notStarted" | "inProgress" | "completed" | "waitingOnOthers" | "deferred";
  importance: "low" | "normal" | "high";
  isReminderOn: boolean;
  createdDateTime: string;
  lastModifiedDateTime: string;
  completedDateTime?: { dateTime: string; timeZone: string };
  dueDateTime?: { dateTime: string; timeZone: string };
  body?: { content: string; contentType: string };
}

export interface CreateTaskInput {
  title: string;
  status?: Task["status"];
  importance?: Task["importance"];
  dueDateTime?: string; // ISO date string e.g. "2026-03-20"
  body?: string;
}

export interface UpdateTaskInput {
  title?: string;
  status?: Task["status"];
  importance?: Task["importance"];
  dueDateTime?: string | null; // null clears the due date
  body?: string;
}

export class TodoClient {
  private http: AxiosInstance;
  private _tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    const config = getConfig();
    this.http = axios.create({
      baseURL: config.MICROSOFT_GRAPH_ENDPOINT,
      headers: { "Content-Type": "application/json" },
    });

    // Attach auth token to every request
    this.http.interceptors.request.use(async (req) => {
      const token = await this._getToken();
      req.headers["Authorization"] = `Bearer ${token}`;
      return req;
    });
  }

  private async _getToken(): Promise<string> {
    const config = getConfig();

    // Direct token — just use it
    if (config.MS_TODO_ACCESS_TOKEN) {
      return config.MS_TODO_ACCESS_TOKEN;
    }

    // Client credentials — cache the token until 2 min before expiry
    if (this._tokenCache && Date.now() < this._tokenCache.expiresAt) {
      return this._tokenCache.token;
    }

    const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET } = config;
    const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

    try {
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: MICROSOFT_CLIENT_ID!,
        client_secret: MICROSOFT_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
      });

      const res = await axios.post(tokenUrl, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, expires_in } = res.data;
      this._tokenCache = {
        token: access_token,
        expiresAt: Date.now() + (expires_in - 120) * 1000,
      };
      return access_token;
    } catch (err: any) {
      const msg = err?.response?.data?.error_description || err?.message || "Token fetch failed";
      throw new MCPError(ErrorCodes.CONFIG_ERROR, `MS auth failed: ${msg}`);
    }
  }

  private _wrapUpstreamError(err: any, op: string): never {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.error?.message ||
      err?.response?.data?.error?.code ||
      err?.message ||
      "Unknown error";

    logger.error(`${op} failed`, err, { status, msg });

    if (status === 404) {
      throw new MCPError(ErrorCodes.NOT_FOUND, `${op}: not found`, { status, msg });
    }
    if (status === 401 || status === 403) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        `${op}: unauthorized — check MS_TODO_ACCESS_TOKEN scope (needs Tasks.ReadWrite)`,
        { status, msg }
      );
    }
    throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `${op}: ${msg}`, { status });
  }

  // ── Task Lists ──────────────────────────────────────────────

  async listTaskLists(): Promise<TaskList[]> {
    try {
      const res = await this.http.get("/me/todo/lists");
      return res.data.value as TaskList[];
    } catch (err) {
      this._wrapUpstreamError(err, "listTaskLists");
    }
  }

  // ── Tasks ───────────────────────────────────────────────────

  async listTasks(listId: string, filter?: string): Promise<Task[]> {
    try {
      const params: Record<string, string> = { $top: "100" };
      if (filter) params.$filter = filter;
      const res = await this.http.get(`/me/todo/lists/${listId}/tasks`, { params });
      return res.data.value as Task[];
    } catch (err) {
      this._wrapUpstreamError(err, "listTasks");
    }
  }

  async getTask(listId: string, taskId: string): Promise<Task> {
    try {
      const res = await this.http.get(`/me/todo/lists/${listId}/tasks/${taskId}`);
      return res.data as Task;
    } catch (err) {
      this._wrapUpstreamError(err, "getTask");
    }
  }

  async createTask(listId: string, input: CreateTaskInput): Promise<Task> {
    try {
      const body: Record<string, unknown> = { title: input.title };
      if (input.status) body.status = input.status;
      if (input.importance) body.importance = input.importance;
      if (input.dueDateTime) {
        body.dueDateTime = { dateTime: `${input.dueDateTime}T00:00:00`, timeZone: "UTC" };
      }
      if (input.body) {
        body.body = { content: input.body, contentType: "text" };
      }

      const res = await this.http.post(`/me/todo/lists/${listId}/tasks`, body);
      return res.data as Task;
    } catch (err) {
      this._wrapUpstreamError(err, "createTask");
    }
  }

  async updateTask(listId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    try {
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.status !== undefined) body.status = input.status;
      if (input.importance !== undefined) body.importance = input.importance;
      if (input.dueDateTime === null) {
        body.dueDateTime = null;
      } else if (input.dueDateTime) {
        body.dueDateTime = { dateTime: `${input.dueDateTime}T00:00:00`, timeZone: "UTC" };
      }
      if (input.body !== undefined) {
        body.body = { content: input.body, contentType: "text" };
      }

      const res = await this.http.patch(`/me/todo/lists/${listId}/tasks/${taskId}`, body);
      return res.data as Task;
    } catch (err) {
      this._wrapUpstreamError(err, "updateTask");
    }
  }

  async deleteTask(listId: string, taskId: string): Promise<void> {
    try {
      await this.http.delete(`/me/todo/lists/${listId}/tasks/${taskId}`);
    } catch (err) {
      this._wrapUpstreamError(err, "deleteTask");
    }
  }
}
