
import React, { useState, useEffect } from "react";
import { ForgeAPI } from "../../forge_api";
import { ForgeArtifact } from "../../types/forge";

export const ArtifactLibrary: React.FC = () => {
    const [artifacts, setArtifacts] = useState<ForgeArtifact[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("ALL");

    const loadArtifacts = async () => {
        setLoading(true);
        const all = await ForgeAPI.listArtifacts();
        setArtifacts(all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        loadArtifacts();
    }, []);

    const handleFinalize = async (id: string) => {
        await ForgeAPI.markArtifactFinal(id);
        await loadArtifacts();
    };

    const handleExport = async (id: string, dest: any) => {
        await ForgeAPI.exportMarkers(id, dest);
        await loadArtifacts();
    };

    const filtered = filterType === "ALL"
        ? artifacts
        : artifacts.filter(a => a.artifact_type === filterType);

    return (
        <div className="card p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">Archive</div>
                    <h2 className="text-lg font-semibold">Artifacts Library</h2>
                </div>
                <select
                    className="bg-[#0b0e11] border border-white/10 rounded-lg px-3 py-1 text-xs outline-none focus:border-inos-accent"
                    value={filterType}
                    title="Filter by Type"
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="ALL">All Artifacts</option>
                    <option value="IntakeForm">Intake Forms</option>
                    <option value="PersonalityCard">Personality Cards</option>
                    <option value="OnePageBrief">One-Page Briefs</option>
                    <option value="FullDossier">Full Dossiers</option>
                    <option value="AgentSpec">Agent Specs</option>
                    <option value="RosterBrief">Roster Briefs</option>
                    <option value="TimelineEvent">Timeline Events</option>
                </select>
            </div>

            {loading ? (
                <div className="py-12 text-center animate-pulse text-inos-muted">Syncing Artifacts...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(art => (
                        <div key={art.id} className="inos-card p-3 flex flex-col gap-2 hover:border-inos-accent/40 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-inos-accent font-mono uppercase font-bold">{art.artifact_type}</span>
                                    {art.exported_to !== "None" && (
                                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/30 w-fit">TO: {art.exported_to}</span>
                                    )}
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${art.status === 'Final' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-inos-muted'}`}>
                                    {art.status}
                                </span>
                            </div>

                            <div className="mt-2 p-2 bg-black/20 rounded border border-white/5 text-[9px] text-inos-muted font-mono h-20 overflow-hidden line-clamp-4">
                                {art.content}
                            </div>

                            <div className="mt-auto pt-3 flex flex-wrap gap-1">
                                {art.status === "Draft" && (
                                    <button onClick={() => handleFinalize(art.id)} className="btn-pill-sm !text-[8px] !px-2">Mark Final</button>
                                )}
                                {["ARK", "Roster", "Timeline"].map(dest => (
                                    <button
                                        key={dest}
                                        onClick={() => handleExport(art.id, dest as any)}
                                        className={`text-[8px] px-1.5 py-0.5 rounded border ${art.exported_to === dest ? 'bg-inos-accent text-black border-inos-accent' : 'border-white/10 text-inos-muted hover:text-white'}`}
                                    >
                                        → {dest}
                                    </button>
                                ))}
                                <button
                                    onClick={() => navigator.clipboard.writeText(art.content)}
                                    className="ml-auto btn-pill-sm !text-[8px] !px-2 opacity-50 hover:opacity-100"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center text-inos-muted border-2 border-dashed border-white/5 rounded-2xl">
                            No artifacts found for this filter.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
