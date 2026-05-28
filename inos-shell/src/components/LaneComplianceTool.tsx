import React, { useState } from "react";
import { api } from "../api";

const AGENT_LIST = [
    { id: "WAR", lane: "Execution", description: "Mission Operations & Tactical Control" },
    { id: "GEM", lane: "Execution", description: "Generation & Content Production" },
    { id: "EYE", lane: "Execution", description: "Surveillance & Monitoring" },
    { id: "BOB", lane: "Execution", description: "Brand & Outbound Marketing" },
    { id: "BUILD", lane: "Execution", description: "Construction & Development" },
    { id: "CLASS", lane: "Execution", description: "Training & Education" },
    { id: "MIND", lane: "Execution", description: "Analysis & Synthesis" },
    { id: "CORE", lane: "Command", description: "Central Directive Control (READ-ONLY EXECUTION)" },
    { id: "LAW", lane: "Constraint", description: "Legal & Regulatory Guardrails" },
    { id: "ARC", lane: "Constraint", description: "Architecture & Structural Integrity" },
    { id: "AIM", lane: "Command", description: "Strategic Routing & Objective Alignment" },
    { id: "TWIN", lane: "Constraint", description: "Identity & Personal Continuity" },
];

export const LaneComplianceTool: React.FC = () => {
    const [agentId, setAgentId] = useState("WAR");
    const [actionType, setActionType] = useState("EXECUTE_WORK");
    const [report, setReport] = useState<{ pass: boolean; reason: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const checkCompliance = async () => {
        setLoading(true);
        try {
            const res = await api.checkLaneCompliance({ agent_id: agentId, action_type: actionType });
            setReport({ pass: res.pass, reason: res.reason || "Authorized" });
        } catch (err: any) {
            console.error("Compliance Check Failed", err);
            setReport({ pass: false, reason: err.message || "Connection Error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl border border-inos-border/30 bg-black/20">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inos-accent"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Lane Compliance Enforcer
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-[10px] text-inos-muted uppercase font-bold">Target Agent/Pod</label>
                        <select 
                            className="w-full bg-[#0f172a] border border-inos-border rounded-lg p-2 text-sm text-white focus:border-inos-accent outline-none"
                            value={agentId}
                            title="Select agent to check"
                            onChange={(e) => setAgentId(e.target.value)}
                        >
                            {AGENT_LIST.map(a => (
                                <option key={a.id} value={a.id}>{a.id} - {a.lane}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-inos-muted italic">
                            {AGENT_LIST.find(a => a.id === agentId)?.description}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-inos-muted uppercase font-bold">Planned Action Type</label>
                        <select 
                            className="w-full bg-[#0f172a] border border-inos-border rounded-lg p-2 text-sm text-white focus:border-inos-accent outline-none"
                            value={actionType}
                            title="Select action type to verify"
                            onChange={(e) => setActionType(e.target.value)}
                        >
                            <option value="EXECUTE_WORK">Execute Work Order</option>
                            <option value="ISSUE_MANDATE">Issue Mandate (CORE ONLY)</option>
                            <option value="DEFINE_LAW">Define Policy (LAW ONLY)</option>
                            <option value="ACCESS_TREASURY">Access Treasury (BANK ONLY)</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={checkCompliance}
                    disabled={loading}
                    className="mt-6 w-full py-2 bg-inos-accent/10 border border-inos-accent/30 hover:bg-inos-accent/20 text-inos-accent text-xs font-bold rounded-lg transition-all"
                >
                    {loading ? "CHECKING PROTOCOL..." : "VERIFY COMPLIANCE"}
                </button>
            </div>

            {report && (
                <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${report.pass ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${report.pass ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                            {report.pass ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            )}
                        </div>
                        <div>
                            <h4 className={`text-sm font-bold ${report.pass ? 'text-green-400' : 'text-red-400'}`}>
                                {report.pass ? 'COMPLIANCE PASSED' : 'LANE VIOLATION DETECTED'}
                            </h4>
                            <p className="text-xs text-white/70 mt-1 leading-relaxed">
                                {report.reason}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
