import React from "react";
import { TimelineEvent } from "../types";

interface TimelineStreamProps {
    events: TimelineEvent[];
    className?: string;
    isLoading?: boolean;
}

export const TimelineStream: React.FC<TimelineStreamProps> = ({
    events,
    className = "",
    isLoading = false,
}) => {
    const getVariantStyles = (type: string | undefined): string => {
        const t = (type || "").toLowerCase();
        if (t.includes("mission") || t.includes("milestone")) return "border-l-amber-500/50 bg-amber-500/5"; // Mission/Gold
        if (t.includes("POLE") || t.includes("note")) return "border-l-cyan-500/50 bg-cyan-500/5";     // POLE/Cyan
        if (t.includes("alert") || t.includes("incident")) return "border-l-red-500/50 bg-red-500/5";   // Alert/Red
        return "border-l-slate-500/50 bg-slate-500/5"; // Default
    };

    if (isLoading) {
        return (
            <div className={`p-4 text-center text-xs text-inos-muted animate-pulse ${className}`}>
                Loading feed...
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className={`p-8 text-center flex flex-col items-center gap-2 ${className}`}>
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-2xl">
                    📡
                </div>
                <div className="text-sm text-inos-muted">No events logged yet</div>
            </div>
        );
    }

    return (
        <ul className={`space-y-3 overflow-y-auto pr-1 ${className}`}>
            {events.map((evt) => (
                <li
                    key={evt.id}
                    className={`relative rounded-lg border border-inos-border/40 pl-3 pr-3 py-3 transition-all duration-200 hover:bg-[#0f172a]/80 border-l-[3px] ${getVariantStyles(
                        evt.uiType || evt.type || evt.event_type || "note"
                    )}`}
                >
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 space-y-1">
                            {/* Header */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-inos-text/80 opacity-70">
                                    {evt.uiType || evt.type || evt.event_type || "LOG"}
                                </span>
                                {evt.actor && (
                                    <span className="text-[10px] text-inos-muted">
                                        by {evt.actor.name || "System"}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="text-sm text-inos-text/90 leading-relaxed font-light">
                                {evt.summary || evt.title}
                            </div>

                            {/* Footer / Meta */}
                            {(evt.syncKey || evt.id) && (
                                <div className="pt-1 flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-inos-muted/50">
                                        {evt.syncKey || `ID: ${evt.id.slice(0, 8)}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right: Timestamp */}
                        {/* Right: Timestamp */}
                        <div className="text-right shrink-0">
                            <div className="font-mono text-[10px] text-inos-accent">
                                {(evt.timestamp || evt.date)
                                    ? new Date(evt.timestamp || evt.date || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : "--:--"}
                            </div>
                            <div className="text-[9px] text-inos-muted/50 uppercase">
                                {(evt.timestamp || evt.date)
                                    ? new Date(evt.timestamp || evt.date || "").toLocaleDateString([], { month: 'short', day: 'numeric' })
                                    : ""}
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};
