
import React from "react";
import { AgentForgeThread } from "../../types/forge";
import { ForgeAPI } from "../../forge_api";

interface Props {
    thread: AgentForgeThread;
    onUpdate: () => void;
}

export const ForgeThreadCard: React.FC<Props> = ({ thread, onUpdate }) => {
    const handleAction = async (action: string) => {
        try {
            if (action === "Turn1") await ForgeAPI.emitTurn1(thread.id);
            if (action === "Turn2_Gen") await ForgeAPI.generateTurn2(thread.id);
            if (action === "Greenlight") await ForgeAPI.setGreenlightReady(thread.id);
            if (action === "Turn3_Gen") await ForgeAPI.generateTurn3(thread.id);
            if (action === "Archive") await ForgeAPI.updateThread(thread.id, { status: "Archived" });
            onUpdate();
        } catch (err) {
            console.error(err);
            alert("Failed to execute lifecycle action.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Finalized": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
            case "Awaiting_GREENLIGHT": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
            case "Turn1_Issued": return "text-blue-400 border-blue-500/30 bg-blue-500/10";
            case "Turn2_Drafted": return "text-purple-400 border-purple-500/30 bg-purple-500/10";
            case "Archived": return "text-red-400 border-red-500/30 bg-red-500/10";
            default: return "text-slate-400 border-slate-500/30 bg-slate-500/10";
        }
    };

    return (
        <div className="inos-card p-4 flex flex-col gap-3 group">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-inos-accent font-mono text-xs font-bold">{thread.handle}</div>
                        {thread.autogen_mode !== "Off" && (
                            <div className="text-[8px] bg-inos-accent/20 text-inos-accent px-1 rounded border border-inos-accent/30 font-bold">AG:{thread.autogen_mode}</div>
                        )}
                    </div>
                    <h3 className="text-sm font-semibold mt-1">{thread.working_title}</h3>
                </div>
                <span className={`inos-pill text-[10px] ${getStatusColor(thread.status)}`}>
                    {thread.status.replace("_", " ")}
                </span>
            </div>

            <div className="flex gap-2 text-[10px] text-inos-muted">
                <span>Pod: {thread.pod}</span>
                <span>•</span>
                <span>Key: {thread.sync_key}</span>
            </div>

            <div className="mt-2 space-y-1">
                <p className="text-[11px] text-inos-muted line-clamp-2 italic">
                    {thread.challenge_pattern || "No challenge pattern defined."}
                </p>
                {thread.last_autogen_at && (
                    <div className="text-[8px] text-inos-muted opacity-60">
                        LAST AG: {new Date(thread.last_autogen_at).toLocaleString()} BY {thread.last_autogen_by}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                {thread.status === "Draft" && (
                    <button onClick={() => handleAction("Turn1")} className="btn-secondary text-[9px] py-1">Emit Turn 1 Intake</button>
                )}
                {thread.status === "Turn1_Issued" && (
                    <button onClick={() => handleAction("Turn2_Gen")} className="btn-primary text-[9px] py-1">AUTO-GEN Turn 2</button>
                )}
                {thread.status === "Turn2_Drafted" && (
                    <button onClick={() => handleAction("Greenlight")} className="btn-secondary text-[9px] py-1">Set Awaiting GL</button>
                )}
                {thread.status === "Awaiting_GREENLIGHT" && (
                    <button onClick={() => handleAction("Turn3_Gen")} className="btn-primary text-[9px] py-1 px-1">AUTO-GEN Turn 3</button>
                )}
                <button onClick={() => handleAction("Archive")} className="btn-secondary text-[9px] py-1 opacity-50 hover:opacity-100 col-span-2">Archive Thread</button>
            </div>
        </div>
    );
};
