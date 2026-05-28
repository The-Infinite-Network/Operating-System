import { useEffect, useState } from "react";
import { InboxStatus } from "../../types/inbox";

interface InboxFiltersProps {
    onFilterChange: (filters: { status?: InboxStatus; entity?: string; room?: string; search?: string }) => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TABS = [
    { id: "triage", label: "Triage", status: "Captured" },
    { id: "route", label: "Route", status: "Classified" },
    { id: "verify", label: "Verify", status: "Routed" },
    { id: "blocked", label: "Blocked", status: "Blocked" },
    { id: "duplicates", label: "Duplicates", status: "Duplicate" },
    { id: "closed", label: "Closed", status: "Closed" },
    { id: "all", label: "All", status: undefined },
];

export function InboxFilters({ onFilterChange, activeTab, onTabChange }: InboxFiltersProps) {
    const [entity, setEntity] = useState<string>("");
    const [room, setRoom] = useState<string>("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent).detail || {};
            if (detail.entity !== undefined) setEntity(detail.entity || "");
            if (detail.room !== undefined) setRoom(detail.room || "");
        };
        window.addEventListener("inos-context-change", handler as EventListener);

        const storedEntity = localStorage.getItem("inos_entity_context_v1");
        const storedRoom = localStorage.getItem("inos_room_context_v1");
        if (storedEntity) setEntity(storedEntity);
        if (storedRoom) setRoom(storedRoom);

        return () => window.removeEventListener("inos-context-change", handler as EventListener);
    }, []);

    useEffect(() => {
        const tab = TABS.find(t => t.id === activeTab);
        onFilterChange({
            status: (tab?.status as InboxStatus) || undefined,
            entity: entity || undefined,
            room: room || undefined,
            search: search || undefined
        });
    }, [activeTab, entity, room, search, onFilterChange]);

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-[#0f172a] rounded-lg p-1 border border-inos-border/50 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-inos-accent text-white shadow-sm"
                                    : "text-inos-muted hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 shrink-0">
                    {entity && <span className="px-2 py-1 bg-blue-900/30 text-blue-200 text-xs rounded border border-blue-800">Entity: {entity}</span>}
                    {room && <span className="px-2 py-1 bg-purple-900/30 text-purple-200 text-xs rounded border border-purple-800">Room: {room}</span>}
                </div>
            </div>
            <div>
                <input
                    placeholder="Search inbox..."
                    className="w-full bg-[#0f172a] border border-inos-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-inos-accent outline-none placeholder:text-gray-600"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>
    );
}
