
import React, { useState, useEffect } from "react";
import { api } from "../api";
import { CoreDirective, CORE_DIRECTIVE_STATUS, CORE_DIRECTIVE_PRIORITY } from "../api";
import { LaneComplianceTool } from "./LaneComplianceTool";

const DIRECTIVE_STATUSES: CORE_DIRECTIVE_STATUS[] = ["DRAFT", "ISSUED", "ACTIVE", "COMPLETE", "HALTED"];
const PRIORITIES: CORE_DIRECTIVE_PRIORITY[] = ["P0", "P1", "P2"];
const EXECUTION_LANES = ["WAR", "GEM", "EYE"]; // Valid execution lanes

export const CoreDirectiveBoard: React.FC = () => {
    const [directives, setDirectives] = useState<CoreDirective[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<CORE_DIRECTIVE_STATUS | "ALL">("ALL");
    const [activeRootTab, setActiveRootTab] = useState<"DIRECTIVES" | "COMPLIANCE">("DIRECTIVES");

    // Form State
    const [form, setForm] = useState({
        summary: "",
        type: "MANDATE", // Default
        priority: "P1" as CORE_DIRECTIVE_PRIORITY,
        owner_execution: "WAR",
        acceptance_tests: "",
    });

    useEffect(() => {
        loadDirectives();
    }, [filterStatus]);

    const loadDirectives = async () => {
        setLoading(true);
        try {
            const status = filterStatus === "ALL" ? undefined : filterStatus;
            const res = await api.listDirectives(status);
            setDirectives(res.directives);
        } catch (err) {
            console.error("Failed to load directives", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.createDirective({
                summary: form.summary,
                directive_type: form.type,
                priority: form.priority,
                owner_execution: form.owner_execution,
                acceptance_tests: form.acceptance_tests.split("\n").filter(l => l.trim().length > 0),
            });
            setForm({
                summary: "",
                type: "MANDATE",
                priority: "P1",
                owner_execution: "WAR",
                acceptance_tests: "",
            });
            await loadDirectives(); // Refresh
        } catch (err: any) {
            console.error("Failed to create directive", err);
            alert(`Error: ${err.message || "Failed to create directive"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] h-full">
            {/* Left: Directive List */}
            <div className="card p-4 space-y-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                            CORE · Command & Control
                        </p>
                        <div className="flex items-center gap-6 mt-1">
                            <button 
                                onClick={() => setActiveRootTab("DIRECTIVES")}
                                className={`text-lg font-semibold transition-all border-b-2 pb-1 ${activeRootTab === "DIRECTIVES" ? "border-inos-accent text-white" : "border-transparent text-inos-muted hover:text-white"}`}
                            >
                                Active Protocols
                            </button>
                            <button 
                                onClick={() => setActiveRootTab("COMPLIANCE")}
                                className={`text-lg font-semibold transition-all border-b-2 pb-1 ${activeRootTab === "COMPLIANCE" ? "border-inos-accent text-white" : "border-transparent text-inos-muted hover:text-white"}`}
                            >
                                Lane Compliance
                            </button>
                        </div>
                    </div>
                    {activeRootTab === "DIRECTIVES" && (
                        <select
                            className="rounded-md border border-inos-border bg-[#020617] px-2 py-1 text-xs outline-none focus:border-inos-accent"
                            value={filterStatus}
                            title="Filter by Status"
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="ALL">All Statuses</option>
                            {DIRECTIVE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                {activeRootTab === "DIRECTIVES" ? (
                    <div className="flex-1 overflow-y-auto min-h-[300px] border border-inos-border/50 rounded-xl">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[#0f172a] text-inos-muted sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left">ID</th>
                                <th className="px-3 py-2 text-left">Summary</th>
                                <th className="px-3 py-2 text-left">Lane</th>
                                <th className="px-3 py-2 text-left">Pri</th>
                                <th className="px-3 py-2 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {directives.map((d) => (
                                <tr key={d.id} className="border-t border-inos-border/30 hover:bg-white/5">
                                    <td className="px-3 py-2 font-mono text-xs text-inos-muted">{d.id.slice(-6)}</td>
                                    <td className="px-3 py-2 font-medium">{d.summary}</td>
                                    <td className="px-3 py-2 text-xs">{d.owner_execution}</td>
                                    <td className="px-3 py-2 text-xs">
                                        <span className={`px-1.5 py-0.5 rounded ${d.priority === 'P0' ? 'bg-red-900/40 text-red-200' : 'bg-slate-800 text-slate-300'}`}>
                                            {d.priority}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full border ${d.status === 'ACTIVE' ? 'bg-blue-900/30 border-blue-700/50 text-blue-200' :
                                            d.status === 'ISSUED' ? 'bg-purple-900/30 border-purple-700/50 text-purple-200' :
                                                'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {directives.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-inos-muted">No directives found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-[400px]">
                        <LaneComplianceTool />
                    </div>
                )}
            </div>

            {/* Right: Create Directive */}
            <div className="card p-4 space-y-4 h-fit">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                        Command
                    </p>
                    <h3 className="text-lg font-semibold">Issue Directive</h3>
                </div>

                <form className="space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-xs text-inos-muted">Summary</label>
                        <textarea
                            className="w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent min-h-[60px]"
                            value={form.summary}
                            onChange={e => setForm({ ...form, summary: e.target.value })}
                            required
                            placeholder="Directive summary..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-inos-muted">Type</label>
                            <input
                                className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm text-inos-muted outline-none"
                                value={form.type}
                                title="Directive Type"
                                readOnly // Fixed for now
                            />
                        </div>
                        <div>
                            <label className="text-xs text-inos-muted">Priority</label>
                            <select
                                className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent"
                                value={form.priority}
                                title="Priority"
                                onChange={e => setForm({ ...form, priority: e.target.value as any })}
                            >
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-inos-muted">Execution Lane</label>
                        <select
                            className="w-full rounded-lg border border-inos-border bg-[#020617] px-3 py-2 text-sm outline-none focus:border-inos-accent"
                            value={form.owner_execution}
                            title="Execution Lane"
                            onChange={e => setForm({ ...form, owner_execution: e.target.value })}
                        >
                            {EXECUTION_LANES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <p className="text-[10px] text-inos-muted mt-1">
                            Only execution lanes (WAR, GEM, EYE) can receive directives.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs text-inos-muted">Acceptance Tests (One per line)</label>
                        <textarea
                            className="w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent min-h-[80px]"
                            value={form.acceptance_tests}
                            onChange={e => setForm({ ...form, acceptance_tests: e.target.value })}
                            placeholder="- Verify X\n- Ensure Y"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-primary py-2"
                        disabled={loading}
                    >
                        {loading ? "Issuing..." : "Issue Directive"}
                    </button>
                </form>
            </div>
        </div>
    );
};
