
import React, { useState, useEffect } from "react";
import { MissionList } from "./MissionList";
import { MissionDetail, DetailTab } from "./MissionDetail";
import { POLEEntry } from "./PoleEntry";
import { api } from "../api";
import { Mission, MissionTask, TimelineEvent, MissionRun } from "../types";

// Local constants until we have a shared constants file or API fetch
const MISSION_STATUSES = [
    "Proposed",
    "Intake",
    "Active",
    "Parked",
    "Complete",
    "Canceled",
    "Blocked",
    "Archived",
];

export const MissionBoard = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<MissionTask[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [missionDetailTab, setMissionDetailTab] = useState<DetailTab>("tasks");
    const [taskLoading, setTaskLoading] = useState(false);
    const [POLELoading, setPOLELoading] = useState(false);
    const [showAllMissions, setShowAllMissions] = useState(false);

    // Filter state
    const [missionFilters, setMissionFilters] = useState({
        status: "Active",
        entity: "",
        room: "",
        owner: "",
    });

    // New Mission Form State
    const [missionForm, setMissionForm] = useState({
        title: "",
        status: "Proposed",
        entity: "",
    });

    // Mock Toast - replace with real hook later
    const push = (msg: string, type: "success" | "error" = "success") => {
        console.log(`[TOAST ${type.toUpperCase()}]: ${msg}`);
        // Optionally implement a real toast here or use context
    };

    // Load missions on mount
    useEffect(() => {
        loadMissions();
    }, []);

    // Load details when mission selected
    useEffect(() => {
        if (selectedMissionId) {
            loadMissionDetails(selectedMissionId);
        } else {
            setTasks([]);
            setTimelineEvents([]);
        }
    }, [selectedMissionId]);

    const loadMissions = async () => {
        setLoading(true);
        try {
            const { missions: m } = await api.missions.list(100); // Fetch more to allow client filtering
            setMissions(m);
        } catch (err) {
            console.error("Failed to load missions", err);
            push("Failed to load missions", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadMissionDetails = async (id: string) => {
        setTaskLoading(true);
        try {
            const [tasksRes, timelineRes] = await Promise.all([
                api.tasks.list(id),
                api.timeline.queryByMission(id, 20)
            ]);
            setTasks(tasksRes.tasks);
            setTimelineEvents(timelineRes.events);
        } catch (err) {
            console.error("Failed to load details", err);
            push("Failed to load mission details", "error");
        } finally {
            setTaskLoading(false);
        }
    };

    const submitMission = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.missions.upsert({
                title: missionForm.title,
                status: missionForm.status,
                entity: missionForm.entity || undefined,
            });
            push("Mission Initialized", "success");
            setMissionForm({ title: "", status: "Proposed", entity: "" });
            // Reload
            await loadMissions();
        } catch (err: any) {
            push(err.message || "Failed to create mission", "error");
        } finally {
            setLoading(false);
        }
    };

    // Derived state
    const distinctEntities = Array.from(new Set(missions.map((m) => m.entity).filter(Boolean))) as string[];
    const distinctRooms = Array.from(new Set(missions.map((m) => m.room).filter(Boolean))) as string[];
    const distinctOwners = Array.from(new Set(missions.map((m) => m.owner).filter(Boolean))) as string[];

    const filteredMissions = missions.filter((m) => {
        if (missionFilters.status && m.status !== missionFilters.status) return false;
        if (missionFilters.entity && m.entity !== missionFilters.entity) return false;
        if (missionFilters.room && m.room !== missionFilters.room) return false;
        return true;
    });

    const selectedMission = missions.find((m) => m.id === selectedMissionId) || null;
    const rootView = "missions"; // For now just one view

    return (
        <div className="flex flex-col bg-gray-900 text-white">
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight text-white">WAR ROOM <span className="text-gray-500 font-normal ml-2 text-sm">// MISSION CONTROL</span></h1>
                    <a href="/epoch0/" target="_blank" className="ml-4 px-3 py-1 bg-yellow-600/20 text-yellow-500 text-xs rounded border border-yellow-600/30 hover:bg-yellow-600/30 transition-colors">
                        Launch Layout v2.7 (Epoch 0)
                    </a>
                </div>
            </header>
            {rootView === "missions" && (
                <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] p-4">
                    {/* Left Column: Mission List */}
                    <MissionList
                        missions={filteredMissions}
                        selectedMissionId={selectedMissionId}
                        onSelectMission={setSelectedMissionId}
                        filters={missionFilters}
                        onFilterChange={(key, val) =>
                            setMissionFilters((prev) => ({ ...prev, [key]: val }))
                        }
                        options={{
                            entities: distinctEntities,
                            rooms: distinctRooms,
                            owners: distinctOwners,
                            statuses: MISSION_STATUSES,
                        }}
                        showAll={showAllMissions}
                        onToggleShowAll={() => setShowAllMissions(!showAllMissions)}
                        isLoading={loading}
                    />

                    {/* Right Column: Detail & Actions */}
                    <div className="space-y-4 flex flex-col h-full overflow-hidden">
                        {/* POLE Entry always visible at top of right col */}
                        <div className="card p-4 glass-panel shrink-0">
                            <POLEEntry
                                activeMissionId={selectedMission?.id}
                                activeMissionTitle={selectedMission?.title}
                                isLoading={POLELoading}
                                onPOLESubmit={async (data) => {
                                    setPOLELoading(true);
                                    try {
                                        const result = await api.timeline.logV1({
                                            event_type: "MISSION_UPDATED", // Default or derived
                                            summary: data.summary,
                                            mission_id: data.linkedMissionId || selectedMission?.id,
                                            entity: data.entity || selectedMission?.entity || undefined,
                                            sync_key: `SHELL-${Date.now()}` // Allow server to handle dedup or pass unique key
                                        });

                                        if (selectedMission) {
                                            const { events } = await api.timeline.queryByMission(selectedMission.id, 50);
                                            setTimelineEvents(events);
                                        }

                                        push("POLE Logged Successfully", "success");
                                    } catch (err: any) {
                                        push(err?.message || "POLE Failed", "error");
                                    } finally {
                                        setPOLELoading(false);
                                    }
                                }}
                            />
                        </div>

                        {/* Detail or Create */}
                        {selectedMission ? (
                            <div className="flex-1 overflow-hidden h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <MissionDetail
                                        mission={selectedMission}
                                        tasks={tasks}
                                        timelineEvents={timelineEvents}
                                        activeTab={missionDetailTab}
                                        onTabChange={setMissionDetailTab}
                                        isLoading={taskLoading}
                                        onTaskCreate={async (data) => {
                                            if (!selectedMission) return;
                                            await api.tasks.create({
                                                missionId: selectedMission.id,
                                                title: data.title,
                                                status: data.status,
                                                due_date: data.due_date,
                                            });
                                            // Refresh
                                            const { tasks: t } = await api.tasks.list(selectedMission.id);
                                            setTasks(t);
                                            push("Task created");
                                        }}
                                        onRunStart={async () => {
                                            if (!selectedMission) return;
                                            try {
                                                const { run } = await api.runs.create({
                                                    missionId: selectedMission.id,
                                                    runTitle: selectedMission.title,
                                                    notes: "",
                                                });
                                                push("Run Initialized");
                                                if ((run as any).url)
                                                    window.open((run as any).url, "_blank");
                                            } catch (err: any) {
                                                push(err?.message || "Run failed", "error");
                                            }
                                        }}
                                    />
                                </div>
                                <div className="pt-2 text-right">
                                    <button
                                        onClick={() => setSelectedMissionId(null)}
                                        className="text-xs text-inos-muted hover:text-inos-text underline"
                                    >
                                        Close / Create New
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="card p-4 space-y-3 shrink-0">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                                            Command
                                        </p>
                                        <h3 className="text-lg font-semibold">Create Mission</h3>
                                    </div>
                                    <form className="space-y-3" onSubmit={submitMission}>
                                        <div>
                                            <label className="text-xs text-inos-muted">Title</label>
                                            <input
                                                className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
                                                value={missionForm.title}
                                                onChange={(e) =>
                                                    setMissionForm({ ...missionForm, title: e.target.value })
                                                }
                                                title="Mission Title"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-inos-muted">Status</label>
                                                <select
                                                    className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
                                                    value={missionForm.status}
                                                    title="Mission Status"
                                                    onChange={(e) =>
                                                        setMissionForm({ ...missionForm, status: e.target.value })
                                                    }
                                                >
                                                    {MISSION_STATUSES.map((s) => (
                                                        <option key={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-inos-muted">Entity</label>
                                                <select
                                                    className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
                                                    value={missionForm.entity}
                                                    title="Mission Entity"
                                                    onChange={(e) =>
                                                        setMissionForm({ ...missionForm, entity: e.target.value })
                                                    }
                                                >
                                                    <option value="">Select...</option>
                                                    {distinctEntities.map((e) => (
                                                        <option key={e}>{e}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full btn-primary">
                                            Initialize Mission
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
