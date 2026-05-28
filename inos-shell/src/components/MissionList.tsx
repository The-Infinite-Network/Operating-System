import React from "react";
import { Mission } from "../types";

interface MissionListProps {
    missions: Mission[];
    selectedMissionId: string | null;
    onSelectMission: (id: string) => void;
    filters: {
        status: string;
        entity: string;
        room: string;
        owner: string;
    };
    onFilterChange: (key: string, value: string) => void;
    options: {
        entities: string[];
        rooms: string[];
        owners: string[];
        statuses: string[];
    };
    showAll: boolean;
    onToggleShowAll: () => void;
    isLoading?: boolean;
}

export const MissionList: React.FC<MissionListProps> = ({
    missions,
    selectedMissionId,
    onSelectMission,
    filters,
    onFilterChange,
    options,
    showAll,
    onToggleShowAll,
    isLoading = false,
}) => {
    const badgeClasses = (status: string) => {
        switch (status) {
            case "Done":
            case "Completed":
                return "bg-emerald-900/30 text-emerald-200 border-emerald-700/50";
            case "Doing":
            case "In Progress":
            case "Active":
                return "bg-blue-900/30 text-blue-200 border-blue-700/50";
            case "Blocked":
                return "bg-rose-900/30 text-rose-200 border-rose-700/50";
            case "Planning":
                return "bg-amber-900/30 text-amber-200 border-amber-700/50";
            default:
                return "bg-slate-800 text-slate-300 border-slate-700";
        }
    };

    const displayMissions = showAll ? missions : missions.slice(0, 20);

    return (
        <div className="card p-4 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                        WAR Room · Missions
                    </p>
                    <h2 className="text-lg font-semibold">Live from Notion</h2>
                </div>
                {isLoading && <span className="text-xs text-inos-muted">Loading…</span>}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-inos-muted">
                <div className="flex items-center gap-1">
                    <span>Status</span>
                    <select
                        className="rounded-md border border-inos-border bg-[#020617] px-2 py-1 text-[11px] outline-none focus:border-inos-accent"
                        value={filters.status}
                        onChange={(e) => onFilterChange("status", e.target.value)}
                        title="Filter by Status"
                    >
                        <option value="">All</option>
                        {options.statuses.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <span>Entity</span>
                    <select
                        className="rounded-md border border-inos-border bg-[#020617] px-2 py-1 text-[11px] outline-none focus:border-inos-accent"
                        value={filters.entity}
                        onChange={(e) => onFilterChange("entity", e.target.value)}
                        title="Filter by Entity"
                    >
                        <option value="">All</option>
                        {options.entities.map((ent) => (
                            <option key={ent} value={ent}>
                                {ent}
                            </option>
                        ))}
                    </select>
                </div>
                {/* Additional filters can be added here following the pattern */}
                <div className="flex items-center gap-1">
                    <span>Owner</span>
                    <select
                        className="rounded-md border border-inos-border bg-[#020617] px-2 py-1 text-[11px] outline-none focus:border-inos-accent"
                        value={filters.owner}
                        onChange={(e) => onFilterChange("owner", e.target.value)}
                        title="Filter by Owner"
                    >
                        <option value="">All</option>
                        {options.owners.map((owner) => (
                            <option key={owner} value={owner}>
                                {owner}
                            </option>
                        ))}
                    </select>
                </div>

                <span className="ml-auto text-[11px]">
                    Showing {displayMissions.length} / {missions.length} filtered
                </span>
                {missions.length > 20 && (
                    <button
                        type="button"
                        onClick={onToggleShowAll}
                        className="text-[11px] underline underline-offset-2 hover:text-inos-text"
                    >
                        {showAll ? "Show top 20" : "Show all"}
                    </button>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-inos-border/70 flex-1 overflow-y-auto min-h-[400px]">
                <table className="min-w-full text-sm">
                    <thead className="bg-[#0f172a] text-inos-muted sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 text-left bg-[#0f172a]">Mission</th>
                            <th className="px-3 py-2 text-left bg-[#0f172a]">Status</th>
                            <th className="px-3 py-2 text-left bg-[#0f172a]">Priority</th>
                            <th className="px-3 py-2 text-left bg-[#0f172a]">Entity</th>
                            <th className="px-3 py-2 text-left bg-[#0f172a]">Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayMissions.map((m) => (
                            <tr
                                key={m.id}
                                className={`cursor-pointer border-t border-inos-border/60 hover:bg-white/5 transition-colors ${selectedMissionId === m.id ? "bg-white/5" : ""
                                    }`}
                                onClick={() => onSelectMission(m.id)}
                            >
                                <td className="px-3 py-3">
                                    {m.mission_code && (
                                        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-inos-muted mb-0.5">
                                            {m.mission_code}
                                        </div>
                                    )}
                                    <div className="font-medium">{m.title}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <span
                                        className={`rounded-full border px-2 py-1 text-xs whitespace-nowrap ${badgeClasses(
                                            m.status
                                        )}`}
                                    >
                                        {m.status}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-inos-muted">
                                    {m.priority ?? "—"}
                                </td>
                                <td className="px-3 py-3 text-inos-muted">
                                    {m.entity || "—"}
                                </td>
                                <td className="px-3 py-3 text-inos-muted whitespace-nowrap">
                                    {m.due_date
                                        ? new Date(m.due_date).toLocaleDateString()
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                        {!missions.length && (
                            <tr>
                                <td
                                    className="px-3 py-12 text-center text-inos-muted"
                                    colSpan={5}
                                >
                                    No missions found matching filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
