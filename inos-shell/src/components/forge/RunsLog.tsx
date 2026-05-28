
import React, { useState, useEffect } from "react";
import { ForgeAPI } from "../../forge_api";
import { AgentForgeRun } from "../../types/forge";

export const RunsLog: React.FC = () => {
    const [runs, setRuns] = useState<AgentForgeRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"Open" | "Completed" | "ALL">("ALL");

    useEffect(() => {
        const loadRuns = async () => {
            const all = await ForgeAPI.runs.list();
            setRuns(all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setLoading(false);
        };
        loadRuns();
    }, []);

    const filtered = runs.filter(r => {
        if (filter === "Open") return r.status === "Open";
        if (filter === "Completed") return r.status === "Completed";
        return true;
    });

    return (
        <div className="card p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">History</div>
                    <h2 className="text-lg font-semibold">Forge Execution Log</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilter("Open")} className={`btn-pill-sm ${filter === "Open" ? "active" : ""}`}>Open Runs</button>
                    <button onClick={() => setFilter("Completed")} className={`btn-pill-sm ${filter === "Completed" ? "active" : ""}`}>Completed</button>
                    <button onClick={() => setFilter("ALL")} className={`btn-pill-sm ${filter === "ALL" ? "active" : ""}`}>All</button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center animate-pulse text-inos-muted">Accessing Logs...</div>
            ) : (
                <div className="border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-inos-muted font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Run Type</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">System Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map(run => (
                                <tr key={run.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-inos-muted font-mono">{new Date(run.created_at).toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className="font-bold text-inos-accent">{run.run_type}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full border border-white/10 ${run.status === 'Completed' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-amber-400 border-amber-500/30 bg-amber-500/5'}`}>
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-inos-text italic">{run.notes}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-inos-muted">
                                        No runs found in this view.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
