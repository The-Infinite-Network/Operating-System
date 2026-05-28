
import { useState, useEffect } from "react";
import { ForgeAPI } from "../forge_api";
import { AgentForgeThread, ForgeArtifact, AgentForgeRun } from "../types/forge";
import { ForgeWizard } from "../components/forge/ForgeWizard";
import { ForgeThreadCard } from "../components/forge/ForgeThreadCard";
import { ArtifactLibrary } from "../components/forge/ArtifactLibrary";
import { RunsLog } from "../components/forge/RunsLog";

export default function TeamAIHQ() {
    const [activeTab, setActiveTab] = useState<"forge" | "artifacts" | "runs">("forge");
    const [threads, setThreads] = useState<AgentForgeThread[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

    // Sub-view filters
    const [forgeFilter, setForgeFilter] = useState<"Active" | "Awaiting" | "Finalized">("Active");

    const loadData = async () => {
        setLoading(true);
        try {
            const t = await ForgeAPI.listThreads();
            setThreads(t);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredThreads = threads.filter(t => {
        if (forgeFilter === "Active") return t.status !== "Archived" && t.status !== "Finalized";
        if (forgeFilter === "Awaiting") return t.status === "Awaiting_GREENLIGHT";
        if (forgeFilter === "Finalized") return t.status === "Finalized";
        return true;
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return (
        <div className="spine-page">
            <div className="flex flex-col gap-6">

                {/* Header / Tabs */}
                <div className="card p-4 flex items-center justify-between border-inos-accent/20">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("forge")}
                            className={`tab-pill ${activeTab === "forge" ? "active" : ""}`}
                        >
                            Agent Forge
                        </button>
                        <button
                            onClick={() => setActiveTab("artifacts")}
                            className={`tab-pill ${activeTab === "artifacts" ? "active" : ""}`}
                        >
                            Forge Artifacts
                        </button>
                        <button
                            onClick={() => setActiveTab("runs")}
                            className={`tab-pill ${activeTab === "runs" ? "active" : ""}`}
                        >
                            Forge Runs
                        </button>
                    </div>

                    <button
                        onClick={() => setShowWizard(true)}
                        className="btn-primary"
                    >
                        Create Agent (Wizard)
                    </button>
                </div>

                {loading ? (
                    <div className="card p-12 text-center text-inos-muted animate-pulse border-white/5">
                        SYNCING TEAM AI HQ...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === "forge" && (
                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <button onClick={() => setForgeFilter("Active")} className={`btn-pill-sm ${forgeFilter === "Active" ? "active" : ""}`}>Active Threads</button>
                                    <button onClick={() => setForgeFilter("Awaiting")} className={`btn-pill-sm ${forgeFilter === "Awaiting" ? "active" : ""}`}>Awaiting GREENLIGHT</button>
                                    <button onClick={() => setForgeFilter("Finalized")} className={`btn-pill-sm ${forgeFilter === "Finalized" ? "active" : ""}`}>Finalized</button>
                                </div>

                                <section className="card p-4">
                                    <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-4">
                                        {forgeFilter.replace(/([A-Z])/g, ' $1').trim()} Threads
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredThreads.map(t => (
                                            <ForgeThreadCard key={t.id} thread={t} onUpdate={loadData} />
                                        ))}
                                        {filteredThreads.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-inos-muted border-2 border-dashed border-white/5 rounded-2xl">
                                                No threads found in this view.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "artifacts" && (
                            <ArtifactLibrary />
                        )}

                        {activeTab === "runs" && (
                            <RunsLog />
                        )}
                    </div>
                )}
            </div>

            {showWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl h-[90vh] overflow-hidden">
                        <ForgeWizard onComplete={() => { setShowWizard(false); loadData(); }} onCancel={() => setShowWizard(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
