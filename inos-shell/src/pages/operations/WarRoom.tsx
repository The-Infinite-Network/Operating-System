import { useEffect, useMemo, useState } from "react";
import { mcpClient, MCPMission, MCPTask } from "../../services/mcpClient";
import type { Mission, Task } from "../../types/operations";

const MISSION_COLUMNS = ["Planning", "Active", "Blocked", "Complete"];
const TASK_COLUMNS = ["Backlog", "Next", "Doing", "Blocked", "Done"];

function mapMissionStatus(status?: string | null) {
  if (!status) return "Planning";
  const normalized = status.toLowerCase();
  if (["active", "in flight"].includes(normalized)) return "Active";
  if (["blocked"].includes(normalized)) return "Blocked";
  if (["complete", "done"].includes(normalized)) return "Complete";
  return "Planning";
}

function mapTaskStatus(status?: string | null) {
  if (!status) return "Backlog";
  const normalized = status.toLowerCase();
  if (["doing", "in progress", "active"].includes(normalized)) return "Doing";
  if (["blocked"].includes(normalized)) return "Blocked";
  if (["done", "complete"].includes(normalized)) return "Done";
  if (["next"].includes(normalized)) return "Next";
  return "Backlog";
}

export default function WarRoom() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    entity: "",
    owner: "",
    priority: "",
    status: "",
    tag: "",
    needsGate: false,
  });
  const [createMission, setCreateMission] = useState({
    title: "",
    description: "",
    objective: "",
    priority: "P2",
  });
  const [createTask, setCreateTask] = useState({
    title: "",
    missionId: "",
  });
  const [logUpdate, setLogUpdate] = useState({
    missionId: "",
    taskId: "",
    runId: "",
    note: "",
  });
  const [blocked, setBlocked] = useState({
    missionId: "",
    taskId: "",
    reason: "",
    gate: "",
  });
  const [runMissionId, setRunMissionId] = useState("");

  const loadData = async () => {
    const missionRows = await mcpClient.missions.list({ limit: 100 });
    const taskRows = await mcpClient.tasks.list({ limit: 150 });
    setMissions(
      missionRows.map((m: MCPMission) => ({
        id: m.id,
        title: m.title || m.name || "Untitled",
        status: m.status || "Planning",
        priority: m.priority,
        owner: m.owner,
        entityId: m.entity,
        tags: m.guild ? [m.guild] : [],
        updatedAt: m.last_edited_time,
      }))
    );
    setTasks(
      taskRows.map((t: MCPTask) => ({
        id: t.id,
        title: t.title || "Untitled",
        status: t.status ?? null,
        priority: t.priority,
        owner: t.owner,
        missionId: t.mission_id,
        entityId: t.entity,
        dueDate: t.due_date,
        updatedAt: undefined,
      }))
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!runMissionId) return;
    mcpClient
      .runs.list({ missionId: runMissionId })
      .then((res) => {
        setRuns(res.data?.runs || (res as any)?.runs || []);
      })
      .catch(() => setRuns([]));
  }, [runMissionId]);

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      if (filter.entity && mission.entityId !== filter.entity) return false;
      if (filter.owner && mission.owner !== filter.owner) return false;
      if (filter.priority && mission.priority !== filter.priority) return false;
      if (filter.status && mapMissionStatus(mission.status) !== filter.status)
        return false;
      if (filter.tag && !(mission.tags || []).includes(filter.tag)) return false;
      return true;
    });
  }, [missions, filter]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter.owner && task.owner !== filter.owner) return false;
      if (filter.priority && `${task.priority}` !== filter.priority) return false;
      if (filter.status && mapTaskStatus(task.status) !== filter.status)
        return false;
      return true;
    });
  }, [tasks, filter]);

  const handleCreateMission = async () => {
    if (!createMission.title.trim()) return;
    await mcpClient.missions.create({
      mission_title: createMission.title,
      mission_description: createMission.description || createMission.title,
      mission_objective: createMission.objective || createMission.title,
      priority: createMission.priority,
      status: "Active",
      source_system: "INOS",
    } as any);
    setCreateMission({ title: "", description: "", objective: "", priority: "P2" });
    await loadData();
  };

  const handleCreateTask = async () => {
    if (!createTask.title.trim() || !createTask.missionId) return;
    await mcpClient.tasks.create({
      missionId: createTask.missionId,
      taskTitle: createTask.title,
      status: "Next",
      source_system: "INOS",
    });
    setCreateTask({ title: "", missionId: "" });
    await loadData();
  };

  const handleStartRun = async (missionId: string) => {
    await mcpClient.runs.create({ missionId, runTitle: "Run Start" });
    setRunMissionId(missionId);
  };

  const handleLogUpdate = async () => {
    if (!logUpdate.note.trim()) return;
    const syncKey = `war-update-${Date.now()}`;
    await mcpClient.timeline.log({
      title: "WAR Update",
      source: "INOS",
      notes: logUpdate.note,
      sync_key: syncKey,
      type: "WAR_UPDATE",
    });
    setLogUpdate({ missionId: "", taskId: "", runId: "", note: "" });
  };

  const handleBlocked = async () => {
    if (!blocked.reason.trim()) return;
    if (blocked.missionId) {
      await mcpClient.missions.updateStatus({
        missionId: blocked.missionId,
        status: "Blocked",
      });
    }
    if (blocked.taskId) {
      await mcpClient.tasks.update({
        taskId: blocked.taskId,
        status: "Blocked",
        notes: blocked.reason,
      });
    }
    await mcpClient.timeline.log({
      title: "BLOCKED",
      source: "INOS",
      notes: `${blocked.reason}${blocked.gate ? ` | Gate: ${blocked.gate}` : ""}`,
      sync_key: `blocked-${Date.now()}`,
      type: "BLOCKED",
    });
    setBlocked({ missionId: "", taskId: "", reason: "", gate: "" });
    await loadData();
  };

  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Filters
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mt-3">
          <input
            className="inos-input"
            placeholder="Entity"
            value={filter.entity}
            onChange={(event) =>
              setFilter((prev) => ({ ...prev, entity: event.target.value }))
            }
          />
          <input
            className="inos-input"
            placeholder="Owner"
            value={filter.owner}
            onChange={(event) =>
              setFilter((prev) => ({ ...prev, owner: event.target.value }))
            }
          />
          <input
            className="inos-input"
            placeholder="Priority"
            value={filter.priority}
            onChange={(event) =>
              setFilter((prev) => ({ ...prev, priority: event.target.value }))
            }
          />
          <input
            className="inos-input"
            placeholder="Status"
            value={filter.status}
            onChange={(event) =>
              setFilter((prev) => ({ ...prev, status: event.target.value }))
            }
          />
          <input
            className="inos-input"
            placeholder="Tag"
            value={filter.tag}
            onChange={(event) =>
              setFilter((prev) => ({ ...prev, tag: event.target.value }))
            }
          />
          <label className="inos-chip flex items-center gap-2">
            <input
              type="checkbox"
              checked={filter.needsGate}
              onChange={(event) =>
                setFilter((prev) => ({ ...prev, needsGate: event.target.checked }))
              }
            />
            Needs Gate
          </label>
        </div>
      </div>

      <div className="spine-grid mt-4">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Create Mission
          </div>
          <input
            className="inos-input mt-2"
            placeholder="Mission title"
            value={createMission.title}
            onChange={(event) =>
              setCreateMission((prev) => ({ ...prev, title: event.target.value }))
            }
          />
          <input
            className="inos-input mt-2"
            placeholder="Description"
            value={createMission.description}
            onChange={(event) =>
              setCreateMission((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
          <input
            className="inos-input mt-2"
            placeholder="Objective"
            value={createMission.objective}
            onChange={(event) =>
              setCreateMission((prev) => ({
                ...prev,
                objective: event.target.value,
              }))
            }
          />
          <button className="btn-primary mt-3" onClick={handleCreateMission}>
            Create Mission
          </button>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Create Task
          </div>
          <select
            className="inos-input mt-2"
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
          <button className="btn-primary mt-3" onClick={handleCreateTask}>
            Create Task
          </button>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Log Update
          </div>
          <textarea
            className="inos-input mt-2"
            rows={3}
            placeholder="Update note"
            value={logUpdate.note}
            onChange={(event) =>
              setLogUpdate((prev) => ({ ...prev, note: event.target.value }))
            }
          />
          <button className="btn-secondary mt-3" onClick={handleLogUpdate}>
            Write Timeline Update
          </button>
        </div>
      </div>

      <div className="spine-grid mt-4">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Mission Board
          </div>
          <div className="lane-grid">
            {MISSION_COLUMNS.map((column) => (
              <div key={column} className="inos-card p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                  {column}
                </div>
                {filteredMissions
                  .filter((mission) => mapMissionStatus(mission.status) === column)
                  .map((mission) => (
                    <div key={mission.id} className="inos-card p-3 mt-2">
                      <div className="text-sm font-semibold">{mission.title}</div>
                      <div className="text-[11px] text-inos-muted">
                        {mission.priority || "P2"} · {mission.owner || "Unassigned"}
                      </div>
                      <button
                        className="btn-secondary mt-2"
                        onClick={() => handleStartRun(mission.id)}
                      >
                        Start Run
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Task Board
          </div>
          <div className="lane-grid">
            {TASK_COLUMNS.map((column) => (
              <div key={column} className="inos-card p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                  {column}
                </div>
                {filteredTasks
                  .filter((task) => mapTaskStatus(task.status) === column)
                  .map((task) => (
                    <div key={task.id} className="inos-card p-3 mt-2">
                      <div className="text-sm font-semibold">{task.title}</div>
                      <div className="text-[11px] text-inos-muted">
                        {task.owner || "Unassigned"}
                      </div>
                      {task.missionId ? (
                        <button
                          className="btn-secondary mt-2"
                          onClick={() => handleStartRun(task.missionId!)}
                        >
                          Start Run
                        </button>
                      ) : null}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="spine-grid mt-4">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Runs Feed
          </div>
          <select
            className="inos-input mt-2"
            value={runMissionId}
            onChange={(event) => setRunMissionId(event.target.value)}
          >
            <option value="">Select mission</option>
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title}
              </option>
            ))}
          </select>
          <div className="mt-3 space-y-2">
            {runs.map((run: any) => (
              <div key={run.id || run.runId} className="inos-card p-3">
                <div className="text-sm font-semibold">
                  {run.title || run.runTitle || "Run"}
                </div>
                <div className="text-[11px] text-inos-muted">
                  {run.startedAt || run.start_time || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Mark Blocked
          </div>
          <select
            className="inos-input mt-2"
            value={blocked.missionId}
            onChange={(event) =>
              setBlocked((prev) => ({ ...prev, missionId: event.target.value }))
            }
          >
            <option value="">Mission</option>
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title}
              </option>
            ))}
          </select>
          <select
            className="inos-input mt-2"
            value={blocked.taskId}
            onChange={(event) =>
              setBlocked((prev) => ({ ...prev, taskId: event.target.value }))
            }
          >
            <option value="">Task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <input
            className="inos-input mt-2"
            placeholder="Blocker reason"
            value={blocked.reason}
            onChange={(event) =>
              setBlocked((prev) => ({ ...prev, reason: event.target.value }))
            }
          />
          <input
            className="inos-input mt-2"
            placeholder="Gate type (ARC/LAW/MCP)"
            value={blocked.gate}
            onChange={(event) =>
              setBlocked((prev) => ({ ...prev, gate: event.target.value }))
            }
          />
          <button className="btn-secondary mt-3" onClick={handleBlocked}>
            Mark Blocked
          </button>
        </div>
      </div>
    </div>
  );
}
