import { useState, useEffect } from "react";
import { POLEEntry } from "./PoleEntry";
import { api } from "../api";
import { Mission } from "../types";

export function GlobalPOLELogger({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadActiveMissions();
        }
    }, [isOpen]);

    const loadActiveMissions = async () => {
        try {
            const { missions: m } = await api.missions.list(50);
            setMissions(m.filter(mission => mission.status === "Active" || mission.status === "In Flight"));
        } catch (err) {
            console.error("Failed to load missions for logger", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="card w-full max-w-xl bg-[#050816] border-inos-accent/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-inos-border/30">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">POLE TRANSMISSION</h2>
                        <p className="text-xs text-inos-muted uppercase tracking-widest mt-1">Proof of Life Event // Global Capture</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-inos-muted hover:text-white"
                        title="Close Logger"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label id="mission-select-label" className="text-[10px] uppercase tracking-widest text-inos-muted font-bold">Context: Active Mission</label>
                        <select 
                            aria-labelledby="mission-select-label"
                            title="Select active mission context"
                            className="w-full bg-black/40 border border-inos-border/50 rounded-lg p-2 text-sm text-white focus:border-inos-accent outline-none transition-all"
                            value={selectedMission?.id || ""}
                            onChange={(e) => setSelectedMission(missions.find(m => m.id === e.target.value) || null)}
                        >
                            <option value="">No specific mission (Global Log)</option>
                            {missions.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>

                    <POLEEntry 
                        activeMissionId={selectedMission?.id}
                        activeMissionTitle={selectedMission?.title}
                        isLoading={loading}
                        onPOLESubmit={async (data) => {
                            setLoading(true);
                            try {
                                await api.timeline.logV1({
                                    event_type: "POLE", 
                                    summary: data.summary,
                                    mission_id: data.linkedMissionId || selectedMission?.id,
                                    entity: data.entity || selectedMission?.entity || undefined,
                                    sync_key: `SHELL-${Date.now()}`
                                });
                                onClose();
                            } catch (err) {
                                console.error("POLE Transmission Failed", err);
                                alert("Failed to log POLE");
                            } finally {
                                setLoading(false);
                            }
                        }}
                    />
                </div>
                <div className="px-6 py-4 bg-black/20 text-[10px] text-inos-muted flex justify-between items-center">
                    <span>TRANSMITTING VIA MCP_NOTION_v2</span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        OS-TX SECURE
                    </span>
                </div>
            </div>
        </div>
    );
}
