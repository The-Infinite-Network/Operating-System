import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import type { Mission, Task } from "../../types/operations";

const MISSION_COLUMNS = ["Planning", "Active", "Blocked", "Complete"] as const;

function mapMissionStatus(status?: string | null) {
  if (!status) return "Planning";
  const normalized = status.toLowerCase();
  if (["active", "in flight"].includes(normalized)) return "Active";
  if (["blocked"].includes(normalized)) return "Blocked";
  if (["complete", "done"].includes(normalized)) return "Complete";
  return "Planning";
}

function mapPriority(priority?: number | string | null) {
  if (typeof priority === "number") return `P${priority}`;
  return priority || "P2";
}

export default function WarRoom() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createMission, setCreateMission] = useState({
    title: "",
    status: "Planning",
  });
  const [createTask, setCreateTask] = useState({
    missionId: "",
    title: "",
    status: "Backlog",
  });

  async function loadMissions() {
    try {
      setError(null);
      const response = await api.missions.list(100);
      setMissions(response.missions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load missions");
    }
  }

  async function loadTasks(missionId: string) {
    if (!missionId) {
      setTasks([]);
      return;
    }
    try {
      setLoadingTasks(true);
      const response = await api.tasks.list(missionId);
      setTasks(
        response.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          owner: task.owner,
          dueDate: task.due_date,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    if (!selectedMissionId && missions.length > 0) {
      const firstMission = missions[0].id;
      setSelectedMissionId(firstMission);
      setCreateTask((prev) => ({ ...prev, missionId: firstMission }));
      return;
    }
    if (selectedMissionId) {
      loadTasks(selectedMissionId);
    }
  }, [selectedMissionId, missions]);

  const missionBoard = useMemo(() => {
    return MISSION_COLUMNS.map((column) => ({
      column,
      items: missions.filter((mission) => mapMissionStatus(mission.status) === column),
    }));
  }, [missions]);

  const handleCreateMission = async () => {
    if (!createMission.title.trim()) return;
    try {
      await api.missions.upsert({
        title: createMission.title.trim(),
        status: createMission.status,
      });
      setCreateMission({ title: "", status: "Planning" });
      await loadMissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mission");
    }
  };

  const handleCreateTask = async () => {
    if (!createTask.missionId || !createTask.title.trim()) return;
    try {
      await api.tasks.create({
        missionId: createTask.missionId,
        title: createTask.title.trim(),
        status: createTask.status,
      });
      setCreateTask((prev) => ({ ...prev, title: "" }));
      if (createTask.missionId === selectedMissionId) {
        await loadTasks(selectedMissionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleStartRun = async (missionId: string) => {
    try {
      await api.runs.create({ missionId, runTitle: "WAR Run" });
      await loadTasks(selectedMissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    }
  };

  return (
    <div className="spine-page space-y-4">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">WAR Room</div>
        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Mission and task control surface</h2>
            <p className="mt-1 text-[12px] leading-5 text-inos-muted">
              Single-shell operations view for live mission intake, task creation, and run start
              against the current MCP runtime.
            </p>
          </div>
          {error && (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Create mission</div>
          <input
            className="inos-input mt-3"
            placeholder="Mission title"
            value={createMission.title}
            onChange={(event) =>
              setCreateMission((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <select
            className="inos-input mt-2"
            value={createMission.status}
            onChange={(event) =>
              setCreateMission((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            {MISSION_COLUMNS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button className="btn-primary mt-3" onClick={handleCreateMission}>
            Create mission
          </button>
        </div>

        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Create task</div>
          <select
            className="inos-input mt-3"
            value={createTask.missionId}
            onChange={(event) =>
              setCreateTask((prev) => ({ ...prev, missionId: event.target.value }))
            }
          >
            <option value="">Select mission</option>
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title}
              </option>
            ))}
          </select>
          <input
            className="inos-input mt-2"
            placeholder="Task title"
            value={createTask.title}
            onChange={(event) =>
              setCreateTask((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <select
            className="inos-input mt-2"
            value={createTask.status}
            onChange={(event) =>
              setCreateTask((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            <option value="Backlog">Backlog</option>
            <option value="Next">Next</option>
            <option value="Doing">Doing</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
          </select>
          <button className="btn-primary mt-3" onClick={handleCreateTask}>
            Create task
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Mission board</div>
          <button className="btn-secondary" onClick={loadMissions}>
            Refresh
          </button>
        </div>
        <div className="lane-grid mt-4">
          {missionBoard.map(({ column, items }) => (
            <div key={column} className="inos-card p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">{column}</div>
              <div className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <div className="text-[11px] text-inos-muted">No missions</div>
                ) : (
                  items.map((mission) => (
                    <div key={mission.id} className="rounded-md border border-inos-border/70 bg-[#0f172a] p-3">
                      <div className="text-sm font-semibold text-white">{mission.title}</div>
                      <div className="mt-1 text-[11px] text-inos-muted">
                        {mapPriority(mission.priority)} · {mission.owner || "Unassigned"}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setSelectedMissionId(mission.id);
                            setCreateTask((prev) => ({ ...prev, missionId: mission.id }));
                          }}
                        >
                          View tasks
                        </button>
                        <button className="btn-secondary" onClick={() => handleStartRun(mission.id)}>
                          Start run
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Mission tasks</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {missions.find((mission) => mission.id === selectedMissionId)?.title || "Select a mission"}
            </div>
          </div>
          <select
            className="inos-input max-w-[320px]"
            value={selectedMissionId}
            onChange={(event) => setSelectedMissionId(event.target.value)}
          >
            <option value="">Select mission</option>
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 space-y-2">
          {loadingTasks ? (
            <div className="text-[11px] text-inos-muted">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="text-[11px] text-inos-muted">No tasks for this mission.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="rounded-md border border-inos-border/70 bg-[#0f172a] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{task.title}</div>
                    <div className="mt-1 text-[11px] text-inos-muted">
                      {task.status || "Backlog"} · {task.owner || "Unassigned"}
                    </div>
                  </div>
                  {task.dueDate && <div className="text-[11px] text-inos-muted">{task.dueDate}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
