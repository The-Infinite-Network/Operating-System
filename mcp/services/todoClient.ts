/**
 * MCP client for mcp-todo (Microsoft To Do via Graph API)
 * Server: http://localhost:3003 (configurable via VITE_TODO_MCP_BASE_URL)
 */

const DEFAULT_BASE_URL = "http://localhost:3004";

function getTodoMcpBaseUrl() {
  const raw = import.meta.env.VITE_TODO_MCP_BASE_URL || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

export type TodoMcpResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; error?: { code?: string; message?: string } };

async function callTodoTool<T>(toolName: string, params: Record<string, unknown>): Promise<TodoMcpResult<T>> {
  const url = `${getTodoMcpBaseUrl()}/tool/${toolName}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    });
    const text = await res.text().catch(() => "");
    const json = text ? JSON.parse(text) : null;

    if (!res.ok || json?.ok === false) {
      const reason =
        json?.error?.message || json?.message || res.statusText || "mcp-todo error";
      return { ok: false, reason, error: json?.error };
    }
    return { ok: true, data: json?.data ?? json };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "mcp-todo request failed" };
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "notStarted" | "inProgress" | "completed" | "waitingOnOthers" | "deferred";
export type TaskImportance = "low" | "normal" | "high";

export interface TodoList {
  id: string;
  displayName: string;
  isOwner: boolean;
  isShared: boolean;
  wellknownListName: string;
}

export interface TodoTask {
  id: string;
  title: string;
  status: TaskStatus;
  importance: TaskImportance;
  isReminderOn: boolean;
  createdDateTime: string;
  lastModifiedDateTime: string;
  completedDateTime?: { dateTime: string; timeZone: string } | null;
  dueDateTime?: { dateTime: string; timeZone: string } | null;
  body?: { content: string; contentType: string } | null;
}

// ── API helpers ──────────────────────────────────────────────────────────────

export function fetchTodoLists() {
  return callTodoTool<{ lists: TodoList[] }>("todo.lists", {});
}

export function fetchTodoTasks(listId: string, filter?: string) {
  return callTodoTool<{ tasks: TodoTask[]; list_id: string }>("todo.tasks", {
    list_id: listId,
    ...(filter ? { filter } : {}),
  });
}

export function createTodoTask(
  listId: string,
  title: string,
  opts?: { status?: TaskStatus; importance?: TaskImportance; due_date?: string; body?: string }
) {
  return callTodoTool<{ task: TodoTask }>("todo.create", {
    list_id: listId,
    title,
    ...opts,
  });
}

export function updateTodoTask(
  listId: string,
  taskId: string,
  updates: {
    title?: string;
    status?: TaskStatus;
    importance?: TaskImportance;
    due_date?: string | null;
    body?: string;
  }
) {
  return callTodoTool<{ task: TodoTask }>("todo.update", {
    list_id: listId,
    task_id: taskId,
    ...updates,
  });
}

export function completeTodoTask(listId: string, taskId: string) {
  return callTodoTool<{ task: TodoTask }>("todo.complete", {
    list_id: listId,
    task_id: taskId,
  });
}

export function deleteTodoTask(listId: string, taskId: string) {
  return callTodoTool<{ ok: boolean }>("todo.delete", {
    list_id: listId,
    task_id: taskId,
  });
}

export async function checkTodoHealth(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`${getTodoMcpBaseUrl()}/health`);
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) {
      return { ok: false, reason: data?.status || "mcp-todo unhealthy" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "mcp-todo unreachable" };
  }
}
