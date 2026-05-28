import { describe, it, expect, vi, beforeEach } from "vitest";
import { Tools } from "../src/tools.js";
import { MCPError } from "../src/errors.js";

// Hoist mock instance so vi.mock factory can reference it
const mockClientInstance = vi.hoisted(() => ({
  listTaskLists: vi.fn(),
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("../src/client.js", () => {
  class TodoClient {
    listTaskLists = mockClientInstance.listTaskLists;
    listTasks = mockClientInstance.listTasks;
    createTask = mockClientInstance.createTask;
    updateTask = mockClientInstance.updateTask;
    deleteTask = mockClientInstance.deleteTask;
  }
  return { TodoClient };
});

// Mock config so we don't need real env vars
vi.mock("../src/config.js", () => ({
  getConfig: vi.fn(() => ({
    MS_TODO_ACCESS_TOKEN: "test-token",
    MICROSOFT_GRAPH_ENDPOINT: "https://graph.microsoft.com/v1.0",
    PORT: 3003,
    NODE_ENV: "test",
    CORS_ALLOWED_ORIGINS: [],
  })),
  validateConfig: vi.fn(),
}));

const MOCK_LIST = {
  id: "list-1",
  displayName: "My Tasks",
  isOwner: true,
  isShared: false,
  wellknownListName: "defaultList",
};

const MOCK_TASK = {
  id: "task-1",
  title: "Test task",
  status: "notStarted" as const,
  importance: "normal" as const,
  isReminderOn: false,
  createdDateTime: "2026-03-16T00:00:00Z",
  lastModifiedDateTime: "2026-03-16T00:00:00Z",
};

describe("todo.lists", () => {
  it("returns lists on success", async () => {
    const tools = new Tools();
    (tools as any).client.listTaskLists.mockResolvedValue([MOCK_LIST]);

    const result = await tools["todo.lists"]({});
    expect(result.lists).toHaveLength(1);
    expect(result.lists[0].id).toBe("list-1");
  });
});

describe("todo.tasks", () => {
  it("returns tasks for a list", async () => {
    const tools = new Tools();
    (tools as any).client.listTasks.mockResolvedValue([MOCK_TASK]);

    const result = await tools["todo.tasks"]({ list_id: "list-1" });
    expect(result.tasks).toHaveLength(1);
    expect(result.list_id).toBe("list-1");
  });

  it("throws VALIDATION_ERROR when list_id is missing", async () => {
    const tools = new Tools();
    await expect(tools["todo.tasks"]({})).rejects.toBeInstanceOf(MCPError);
  });
});

describe("todo.create", () => {
  it("creates a task", async () => {
    const tools = new Tools();
    (tools as any).client.createTask.mockResolvedValue(MOCK_TASK);

    const result = await tools["todo.create"]({ list_id: "list-1", title: "Test task" });
    expect(result.task.id).toBe("task-1");
  });

  it("throws VALIDATION_ERROR when title is missing", async () => {
    const tools = new Tools();
    await expect(tools["todo.create"]({ list_id: "list-1" })).rejects.toBeInstanceOf(MCPError);
  });
});

describe("todo.complete", () => {
  it("marks a task completed", async () => {
    const tools = new Tools();
    const completedTask = { ...MOCK_TASK, status: "completed" as const };
    (tools as any).client.updateTask.mockResolvedValue(completedTask);

    const result = await tools["todo.complete"]({ list_id: "list-1", task_id: "task-1" });
    expect(result.task.status).toBe("completed");
  });
});

describe("todo.delete", () => {
  it("deletes a task", async () => {
    const tools = new Tools();
    (tools as any).client.deleteTask.mockResolvedValue(undefined);

    const result = await tools["todo.delete"]({ list_id: "list-1", task_id: "task-1" });
    expect(result.ok).toBe(true);
  });
});
