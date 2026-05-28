import React, { useState } from "react";
import { Mission, MissionTask, TimelineEvent } from "../types";
import { TimelineStream } from "./TimelineStream";

export type DetailTab = "tasks" | "runs" | "aar" | "timeline" | "links";

interface MissionDetailProps {
    mission: Mission | null;
    tasks: MissionTask[];
    timelineEvents?: TimelineEvent[];
    activeTab: DetailTab;
    onTabChange: (tab: DetailTab) => void;
    onTaskCreate: (data: { title: string; status: string; due_date?: string }) => Promise<void>;
    onRunStart: () => Promise<void>;
    isLoading?: boolean;
}

export const MissionDetail: React.FC<MissionDetailProps> = ({
    mission,
    tasks,
    timelineEvents = [],
    activeTab,
    onTabChange,
    onTaskCreate,
    onRunStart,
    isLoading = false,
}) => {
    const [taskForm, setTaskForm] = useState({
        title: "",
        status: "Todo",
        due_date: "",
    });

    const handleTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.title) return;
        await onTaskCreate(taskForm);
        setTaskForm({ title: "", status: "Todo", due_date: "" });
    };

    if (!mission) {
        return (
            <div className="card p-6 flex flex-col items-center justify-center text-inos-muted h-64 border-dashed border-inos-border/50">
                <p className="text-sm">Select a mission to view details</p>
            </div>
        );
    }

    return (
        <div className="card p-4 space-y-3 flex flex-col h-full bg-[#0f172a]/80 backdrop-blur-md">
            {/* Header / Summary */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                        Mission Detail
                    </p>
                    <h3 className="text-lg font-semibold truncate leading-tight mt-1">
                        {mission.title}
                    </h3>
                    <p className="text-xs text-inos-muted mt-1">
                        {mission.entity || "Universal"} · {mission.status}
                    </p>
                </div>
                {mission.mission_code && (
                    <span className="rounded-full border border-inos-border px-2 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-inos-muted bg-[#0f172a]">
                        {mission.mission_code}
                    </span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-inos-border/60 text-xs overflow-x-auto shrink-0">
                {(["tasks", "runs", "aar", "timeline", "links"] as DetailTab[]).map(
                    (tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => onTabChange(tab)}
                            className={`px-3 py-2 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                ? "border-inos-accent text-inos-accent font-medium bg-inos-accent/5"
                                : "border-transparent text-inos-muted hover:text-inos-text hover:bg-white/5"
                                }`}
                        >
                            {tab === "tasks"
                                ? "Tasks"
                                : tab === "runs"
                                    ? "Runs" // Shortened for space
                                    : tab === "aar"
                                        ? "AAR"
                                        : tab === "timeline"
                                            ? "Timeline"
                                            : "Links"}
                        </button>
                    )
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] pt-2 custom-scrollbar">
                {activeTab === "tasks" && (
                    <div className="space-y-4">
                        <form className="bg-[#0f172a]/50 p-3 rounded-xl border border-inos-border/50 space-y-2" onSubmit={handleTaskSubmit}>
                            <div className="space-y-1">
                                <label htmlFor="task-title-input" className="sr-only">Task Title</label>
                                <input
                                    id="task-title-input"
                                    className="w-full bg-transparent border-none text-sm outline-none placeholder:text-inos-muted/50"
                                    placeholder="Add new task..."
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex gap-2">
                                <label htmlFor="task-status-select" className="sr-only">Task Status</label>
                                <select
                                    id="task-status-select"
                                    className="h-7 rounded-lg border border-inos-border bg-[#020617] px-2 text-[10px] outline-none text-inos-text focus:border-inos-accent"
                                    value={taskForm.status}
                                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                    title="Task Status"
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="Doing">Doing</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="Done">Done</option>
                                </select>

                                <label htmlFor="task-due-date-input" className="sr-only">Due Date</label>
                                <input
                                    id="task-due-date-input"
                                    type="date"
                                    className="h-7 rounded-lg border border-inos-border bg-[#020617] px-2 text-[10px] outline-none text-inos-text focus:border-inos-accent"
                                    value={taskForm.due_date}
                                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                    title="Due Date"
                                />
                                <button
                                    type="submit"
                                    className="ml-auto h-7 px-3 rounded-lg bg-inos-accent text-white text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-inos-accent/80 transition"
                                    disabled={!taskForm.title || isLoading}
                                >
                                    Add
                                </button>
                            </div>
                        </form>

                        <div className="space-y-2">
                            {tasks.length === 0 && (
                                <p className="text-center text-xs text-inos-muted py-8">
                                    No tasks active. Break it down.
                                </p>
                            )}
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="group flex items-start gap-3 rounded-lg border border-inos-border/40 bg-[#0f172a]/30 hover:bg-[#0f172a] px-3 py-2.5 transition-all"
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' : task.status === 'Doing' ? 'bg-blue-500' : 'bg-slate-600'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${task.status === 'Done' ? 'text-inos-muted line-through' : 'text-inos-text'}`}>
                                            {task.title}
                                        </p>
                                        <div className="flex gap-2 mt-1 text-[10px] text-inos-muted">
                                            <span>{task.status}</span>
                                            {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                                            {task.owner && <span>{task.owner}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "runs" && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-inos-accent/20 bg-inos-accent/5 text-center space-y-3">
                            <p className="text-xs text-inos-text/80 leading-relaxed">
                                Ready to engage? Launching a Run will initialize a session in Team AI and create a paired AAR.
                            </p>
                            <button
                                onClick={onRunStart}
                                className="btn-primary w-full justify-center"
                                disabled={isLoading}
                            >
                                Initialize Run Protocol
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "timeline" && (
                    <div className="space-y-2 h-full flex flex-col">
                        {timelineEvents.length === 0 ? (
                            <p className="text-center text-xs text-inos-muted py-8">
                                No timeline events recorded.
                            </p>
                        ) : (
                            <TimelineStream events={timelineEvents} className="flex-1" />
                        )}
                    </div>
                )}

                {(activeTab === "aar" || activeTab === "links") && (
                    <div className="p-8 text-center text-xs text-inos-muted border border-dashed border-inos-border/30 rounded-xl">
                        Module {activeTab.toUpperCase()} pending integration.
                    </div>
                )}
            </div>
        </div >
    );
};
