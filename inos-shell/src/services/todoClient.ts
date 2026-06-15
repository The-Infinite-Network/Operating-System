import { API_BASE, api } from "../api";

export type TodoList = {
  id: string;
  displayName: string;
};

export type TodoTask = {
  id: string;
  title: string;
  status: string;
  importance: "high" | "normal" | "low";
  dueDateTime?: {
    dateTime?: string;
  } | null;
};

type TodoOk<T> = { ok: true; data: T };
type TodoErr = { ok: false; reason: string };
type TodoResult<T> = Promise<TodoOk<T> | TodoErr>;

function mapTaskStatus(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("done")) return "completed";
  if (normalized.includes("progress") || normalized.includes("active")) return "inProgress";
  if (normalized.includes("wait")) return "waitingOnOthers";
  if (normalized.includes("defer") || normalized.includes("park")) return "deferred";
  return "notStarted";
}

function mapTask(task: {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
}): TodoTask {
  return {
    id: task.id,
    title: task.title,
    status: mapTaskStatus(task.status),
    importance: "normal",
    dueDateTime: task.due_date ? { dateTime: task.due_date } : null,
  };
}

export async function checkTodoHealth(): TodoResult<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, reason: data?.error?.message || "MCP health check failed" };
    }
    return { ok: true, data: { status: data.status || "ok" } };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "MCP health check failed" };
  }
}

export async function fetchTodoLists(): TodoResult<{ lists: TodoList[] }> {
  try {
    const { missions } = await api.missions.list(50);
    const lists = missions.map((mission) => ({
      id: mission.id,
      displayName: mission.title,
    }));
    return { ok: true, data: { lists } };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "Failed to load mission lists" };
  }
}

export async function fetchTodoTasks(listId: string): TodoResult<{ tasks: TodoTask[] }> {
  try {
    const { tasks } = await api.tasks.list(listId);
    return { ok: true, data: { tasks: tasks.map(mapTask) } };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "Failed to load tasks" };
  }
}

export async function createTodoTask(
  listId: string,
  title: string
): TodoResult<{ task: TodoTask }> {
  try {
    const created = await api.tasks.create({ missionId: listId, title, status: "Todo" });
    const { tasks } = await api.tasks.list(listId);
    const task = tasks.find((item) => item.id === created.task_id) || tasks[0];
    if (!task) return { ok: false, reason: "Task created but could not be reloaded" };
    return { ok: true, data: { task: mapTask(task) } };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "Failed to create task" };
  }
}

export async function completeTodoTask(
  listId: string,
  taskId: string
): TodoResult<{ task: TodoTask }> {
  try {
    const res = await fetch(`${API_BASE}/tool/tasks.update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        params: {
          taskId,
          missionId: listId,
          status: "Done",
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, reason: data?.error?.message || "Failed to complete task" };
    }

    const { tasks } = await api.tasks.list(listId);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return { ok: false, reason: "Task updated but could not be reloaded" };
    return { ok: true, data: { task: mapTask(task) } };
  } catch (error: any) {
    return { ok: false, reason: error?.message || "Failed to complete task" };
  }
}

export async function deleteTodoTask(
  _listId: string,
  _taskId: string
): TodoResult<{ deleted: true }> {
  return {
    ok: false,
    reason: "Task deletion is not enabled on the canonical runtime.",
  };
}
