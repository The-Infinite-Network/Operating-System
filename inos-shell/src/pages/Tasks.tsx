import { useEffect, useState, useCallback } from "react";
import {
  fetchTodoLists,
  fetchTodoTasks,
  createTodoTask,
  completeTodoTask,
  deleteTodoTask,
  checkTodoHealth,
  type TodoList,
  type TodoTask,
} from "../services/todoClient";

const STATUS_LABEL: Record<string, string> = {
  notStarted: "Not Started",
  inProgress: "In Progress",
  completed: "Done",
  waitingOnOthers: "Waiting",
  deferred: "Deferred",
};

const IMPORTANCE_COLOR: Record<string, string> = {
  high: "var(--accent-secondary, #f0f)",
  normal: "var(--accent-primary, #0ff)",
  low: "#666",
};

export default function Tasks() {
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Check health on mount
  useEffect(() => {
    checkTodoHealth().then((res) => setHealth(res.ok ? "ok" : "down"));
  }, []);

  // Load lists on mount
  useEffect(() => {
    setListsLoading(true);
    setError(null);
    fetchTodoLists().then((res) => {
      setListsLoading(false);
      if (res.ok) {
        setLists(res.data.lists);
        if (res.data.lists.length > 0 && !selectedListId) {
          setSelectedListId(res.data.lists[0].id);
        }
      } else {
        setError(res.reason);
      }
    });
  }, []);

  // Load tasks when selected list changes
  const loadTasks = useCallback(
    (listId: string) => {
      setTasksLoading(true);
      fetchTodoTasks(listId).then((res) => {
        setTasksLoading(false);
        if (res.ok) {
          setTasks(res.data.tasks);
        } else {
          setError(res.reason);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (selectedListId) loadTasks(selectedListId);
  }, [selectedListId, loadTasks]);

  const handleComplete = async (task: TodoTask) => {
    if (!selectedListId || task.status === "completed") return;
    const res = await completeTodoTask(selectedListId, task.id);
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? res.data.task : t))
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!selectedListId) return;
    const res = await deleteTodoTask(selectedListId, taskId);
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !newTitle.trim()) return;
    setCreating(true);
    const res = await createTodoTask(selectedListId, newTitle.trim());
    setCreating(false);
    if (res.ok) {
      setTasks((prev) => [res.data.task, ...prev]);
      setNewTitle("");
    } else {
      setError(res.reason);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const doneTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="page-root" style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Left: list rail */}
      <aside
        style={{
          width: 220,
          minWidth: 180,
          borderRight: "1px solid #1e2e2e",
          padding: "1rem 0",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "0 1rem 0.75rem",
            fontSize: "0.7rem",
            letterSpacing: 2,
            color: "var(--accent-primary, #0ff)",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          MS To Do
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                health === "ok"
                  ? "#0f0"
                  : health === "down"
                  ? "var(--accent-secondary, #f0f)"
                  : "#666",
            }}
          />
        </div>

        {listsLoading && (
          <div style={{ padding: "0 1rem", color: "#666", fontSize: "0.75rem" }}>
            Loading lists…
          </div>
        )}

        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.5rem 1rem",
              background: selectedListId === list.id ? "rgba(0,255,255,0.07)" : "transparent",
              border: "none",
              borderLeft:
                selectedListId === list.id
                  ? "2px solid var(--accent-primary, #0ff)"
                  : "2px solid transparent",
              color: selectedListId === list.id ? "var(--accent-primary, #0ff)" : "#ccc",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {list.displayName}
          </button>
        ))}

        {health === "down" && (
          <div
            style={{
              margin: "1rem",
              padding: "0.5rem",
              background: "rgba(255,0,255,0.08)",
              border: "1px solid var(--accent-secondary, #f0f)",
              borderRadius: 4,
              fontSize: "0.7rem",
              color: "#ccc",
            }}
          >
            mcp-todo offline
            <br />
            <span style={{ color: "#666" }}>start: cd mcp/mcp-todo && npm run dev</span>
          </div>
        )}
      </aside>

      {/* Right: task panel */}
      <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.5rem 1rem",
              background: "rgba(255,0,255,0.08)",
              border: "1px solid var(--accent-secondary, #f0f)",
              borderRadius: 4,
              color: "#ccc",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        {selectedListId && (
          <>
            {/* New task input */}
            <form
              onSubmit={handleCreate}
              style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}
            >
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New task…"
                disabled={creating}
                style={{
                  flex: 1,
                  background: "#0a1a1a",
                  border: "1px solid #1e2e2e",
                  borderRadius: 4,
                  padding: "0.5rem 0.75rem",
                  color: "#e0e0e0",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  background: "transparent",
                  border: "1px solid var(--accent-primary, #0ff)",
                  borderRadius: 4,
                  color: "var(--accent-primary, #0ff)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  opacity: creating || !newTitle.trim() ? 0.4 : 1,
                }}
              >
                {creating ? "Adding…" : "+ Add"}
              </button>
            </form>

            {tasksLoading ? (
              <div style={{ color: "#666", fontSize: "0.8rem" }}>Loading tasks…</div>
            ) : (
              <>
                {/* Active tasks */}
                {activeTasks.length === 0 && doneTasks.length === 0 && (
                  <div style={{ color: "#444", fontSize: "0.8rem" }}>No tasks. Add one above.</div>
                )}

                {activeTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={() => handleComplete(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}

                {/* Done section */}
                {doneTasks.length > 0 && (
                  <>
                    <div
                      style={{
                        marginTop: "1.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "0.7rem",
                        letterSpacing: 1,
                        color: "#555",
                        textTransform: "uppercase",
                      }}
                    >
                      Completed ({doneTasks.length})
                    </div>
                    {doneTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onComplete={() => {}}
                        onDelete={() => handleDelete(task.id)}
                        dim
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {!selectedListId && !listsLoading && (
          <div style={{ color: "#444", fontSize: "0.8rem" }}>Select a list to get started.</div>
        )}
      </main>
    </div>
  );
}

function TaskRow({
  task,
  onComplete,
  onDelete,
  dim = false,
}: {
  task: TodoTask;
  onComplete: () => void;
  onDelete: () => void;
  dim?: boolean;
}) {
  const dueStr = task.dueDateTime?.dateTime
    ? task.dueDateTime.dateTime.split("T")[0]
    : null;

  const isOverdue =
    dueStr && task.status !== "completed" && new Date(dueStr) < new Date();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "0.6rem 0",
        borderBottom: "1px solid #111",
        opacity: dim ? 0.45 : 1,
      }}
    >
      {/* Complete checkbox */}
      <button
        onClick={onComplete}
        title="Mark complete"
        style={{
          width: 18,
          height: 18,
          marginTop: 2,
          flexShrink: 0,
          background: task.status === "completed" ? "var(--accent-primary, #0ff)" : "transparent",
          border: `1px solid ${task.status === "completed" ? "var(--accent-primary, #0ff)" : "#333"}`,
          borderRadius: 3,
          cursor: task.status === "completed" ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          color: "#000",
        }}
      >
        {task.status === "completed" ? "✓" : ""}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.875rem",
            color: task.status === "completed" ? "#555" : "#ddd",
            textDecoration: task.status === "completed" ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {task.title}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", color: "#555" }}>
            {STATUS_LABEL[task.status] || task.status}
          </span>

          {task.importance !== "normal" && (
            <span
              style={{
                fontSize: "0.65rem",
                color: IMPORTANCE_COLOR[task.importance],
                textTransform: "uppercase",
              }}
            >
              {task.importance}
            </span>
          )}

          {dueStr && (
            <span
              style={{
                fontSize: "0.7rem",
                color: isOverdue ? "var(--accent-secondary, #f0f)" : "#666",
              }}
            >
              due {dueStr}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        title="Delete task"
        style={{
          background: "transparent",
          border: "none",
          color: "#333",
          cursor: "pointer",
          fontSize: "0.85rem",
          padding: "0 4px",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--accent-secondary, #f0f)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#333";
        }}
      >
        ×
      </button>
    </div>
  );
}
