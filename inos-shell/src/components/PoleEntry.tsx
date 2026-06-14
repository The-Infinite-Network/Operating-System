import React, { useState } from "react";
import { POLEPayload } from "../types";

interface POLEEntryProps {
    activeMissionId?: string;
    activeMissionTitle?: string;
    onPOLESubmit: (data: POLEPayload) => Promise<void>;
    isLoading?: boolean;
}

async function generateSyncKey(summary: string): Promise<string> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
    const raw = `${timestamp}-${summary}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `POLE-${timestamp}-${hashHex.slice(0, 8)}`;
}

export const POLEEntry: React.FC<POLEEntryProps> = ({
    activeMissionId,
    activeMissionTitle,
    onPOLESubmit,
    isLoading = false,
}) => {
    const [content, setContent] = useState("");
    const [entity, setEntity] = useState("");
    const [missionIdOverride, setMissionIdOverride] = useState("");
    const [POLEType, setPOLEType] = useState<POLEPayload["type"]>("POLE");
    const [duration, setDuration] = useState<number>(60);
    const [valueLevel, setValueLevel] = useState<POLEPayload["value_level"]>("Medium");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        await onPOLESubmit({
            type: POLEType,
            summary: content,
            linkedMissionId: missionIdOverride || activeMissionId,
            duration_minutes: duration,
            value_level: valueLevel,
            entity: entity,
        } as any);

        setContent("");
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                        Live Feed
                    </p>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        Quick POLE Entry
                        <div className="animate-pulse w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    </h3>
                </div>
                {activeMissionTitle && (
                    <span className="text-[10px] font-mono border border-inos-accent/30 text-inos-accent px-2 py-1 rounded-full bg-inos-accent/5">
                        Target: {activeMissionTitle}
                    </span>
                )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                    <label htmlFor="pole-summary" className="block text-[10px] uppercase text-inos-muted font-bold tracking-widest">Event Label / Summary</label>
                    <div className="relative group">
                        <textarea
                            id="pole-summary"
                            className="w-full min-h-[80px] rounded-xl border border-inos-border bg-[#0f172a]/50 px-4 py-3 text-sm outline-none
                           focus:border-inos-accent focus:bg-[#0f172a] focus:shadow-[0_0_20px_rgba(255,255,255,0.03)]
                           transition-all resize-y placeholder:text-inos-muted/50"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="e.g. System Refactor, Meeting, Research..."
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="pole-duration" className="block text-[10px] uppercase text-inos-muted font-bold tracking-widest">Minutes</label>
                        <input
                            id="pole-duration"
                            aria-label="Duration in minutes"
                            type="number"
                            className="w-full h-9 rounded-lg border border-inos-border bg-[#020617] px-3 text-xs outline-none focus:border-inos-accent"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="pole-value-level" className="block text-[10px] uppercase text-inos-muted font-bold tracking-widest">Value Level</label>
                        <select
                            id="pole-value-level"
                            aria-label="Value level"
                            className="w-full h-9 rounded-lg border border-inos-border bg-[#020617] px-2 text-xs text-inos-muted outline-none focus:border-inos-accent"
                            value={valueLevel}
                            onChange={(e) => setValueLevel(e.target.value as any)}
                            disabled={isLoading}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="pole-entity" className="block text-[10px] uppercase text-inos-muted font-bold tracking-widest">Entity</label>
                        <input
                            id="pole-entity"
                            className="w-full h-9 rounded-lg border border-inos-border bg-[#020617] px-3 text-xs outline-none focus:border-inos-accent placeholder:text-inos-muted/50"
                            placeholder="e.g. IE, FFC"
                            value={entity}
                            onChange={(e) => setEntity(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="pole-type" className="block text-[10px] uppercase text-inos-muted font-bold tracking-widest">Type</label>
                        <select
                            id="pole-type"
                            aria-label="POLE entry type"
                            className="w-full h-9 rounded-lg border border-inos-border bg-[#020617] px-2 text-xs text-inos-muted outline-none focus:border-inos-accent"
                            value={POLEType}
                            onChange={(e) => setPOLEType(e.target.value as any)}
                            disabled={isLoading}
                        >
                            <option value="POLE">POLE</option>
                            <option value="milestone">Milestone</option>
                            <option value="incident">Incident</option>
                            <option value="note">Note</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!activeMissionId && (
                        <div className="flex-1">
                            <input
                                id="pole-mission-id"
                                aria-label="Link to Mission ID (Optional)"
                                className="w-full h-9 rounded-lg border border-inos-border bg-[#020617] px-3 text-xs outline-none focus:border-inos-accent placeholder:text-inos-muted/50"
                                placeholder="Link to Mission ID (Optional)"
                                value={missionIdOverride}
                                onChange={(e) => setMissionIdOverride(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="h-10 px-8 rounded-lg bg-gradient-to-r from-inos-accent to-indigo-600 text-white text-xs font-bold uppercase tracking-widest
                        shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-95 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        disabled={isLoading}
                    >
                        {isLoading ? "TRANSMITTING..." : "LOG EVENT"}
                    </button>
                </div>
            </form>
        </div>
    );
};
