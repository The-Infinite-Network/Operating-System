
import React, { useState } from "react";
import { ForgeAPI } from "../../forge_api";
import { FORGE_TEMPLATES } from "../../data/forge_templates";

interface Props {
    onComplete: () => void;
    onCancel: () => void;
}

export const ForgeWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [threadId, setThreadId] = useState<string>("");

    // Form State
    const [formData, setFormData] = useState({
        handle: "",
        title: "",
        pod: "WAR",
        sync_key: `LDRP-1.0-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-`,
    });

    const [artifacts, setArtifacts] = useState<any[]>([]);

    const handleCreateThread = async () => {
        setLoading(true);
        try {
            const thread = await ForgeAPI.createThread({
                ...formData,
                sync_key: formData.sync_key + formData.handle
            });
            setThreadId(thread.id);
            setStep(2);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadThreadArtifacts = async () => {
        if (threadId) {
            const arts = await ForgeAPI.listArtifacts(threadId);
            setArtifacts(arts);
        }
    };

    const handleEmitTurn1 = async () => {
        setLoading(true);
        try {
            await ForgeAPI.emitTurn1(threadId);
            await loadThreadArtifacts();
            setStep(3);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTurn2 = async () => {
        setLoading(true);
        try {
            await ForgeAPI.generateTurn2(threadId);
            await loadThreadArtifacts();
            setStep(4);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetGreenlight = async () => {
        setLoading(true);
        try {
            await ForgeAPI.setGreenlightReady(threadId);
            await loadThreadArtifacts();
            // Stay on step or move? Spec says review/edit -> click GL -> click AG T3.
            // We'll keep them on a review step.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTurn3 = async () => {
        setLoading(true);
        try {
            await ForgeAPI.generateTurn3(threadId);
            await loadThreadArtifacts();
            setStep(5);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkExport = async (artId: string, dest: any) => {
        try {
            await ForgeAPI.exportMarkers(artId, dest);
            await loadThreadArtifacts();
        } catch (err) {
            console.error(err);
        }
    };

    const getArtifact = (type: string) => artifacts.find(a => a.artifact_type === type);
    const getArtifactContent = (type: string) => getArtifact(type)?.content || "[Artifact Not Generated]";

    return (
        <div className="card h-full flex flex-col p-8 glass-panel border-inos-accent/20">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <div className="text-inos-accent text-xs font-bold uppercase tracking-widest">TEAM AI // Forge</div>
                    <h2 className="text-2xl font-bold tracking-tight">Agent Creation Wizard</h2>
                </div>
                <button onClick={onCancel} className="text-inos-muted hover:text-white transition-colors">
                    ESC TO EXIT
                </button>
            </div>

            <div className="flex gap-4 mb-8 shrink-0">
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className="flex-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? "bg-inos-accent text-black" : "bg-white/5 text-inos-muted border border-white/10"}`}>
                            {s}
                        </div>
                        {s < 5 && <div className={`flex-1 h-[1px] ${step > s ? "bg-inos-accent" : "bg-white/5"}`} />}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs text-inos-muted uppercase font-bold">Handle (e.g. BANK)</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-inos-accent transition-all"
                                    value={formData.handle}
                                    title="Agent Handle"
                                    placeholder="AGENT_ID"
                                    onChange={e => setFormData({ ...formData, handle: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-inos-muted uppercase font-bold">Calculated Sync Key</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-inos-accent transition-all opacity-70"
                                    value={formData.sync_key + formData.handle}
                                    readOnly
                                    title="Final Sync Key"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-inos-muted uppercase font-bold">Working Title</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-inos-accent transition-all"
                                value={formData.title}
                                placeholder="e.g. ARK Knowledge Librarian v1.0"
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-inos-muted uppercase font-bold">Target Pod</label>
                            <select
                                className="w-full bg-[#0b0e11] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-inos-accent transition-all"
                                value={formData.pod}
                                title="Target Pod"
                                onChange={e => setFormData({ ...formData, pod: e.target.value })}
                            >
                                <option value="WAR">WAR (Operations)</option>
                                <option value="ARK">ARK (Canon/Library)</option>
                                <option value="LAW">LAW (Governance)</option>
                                <option value="ARC">ARC (Architecture)</option>
                                <option value="MIND">MIND (Memory)</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <div className="inos-card p-4 bg-blue-500/5 border-blue-500/20">
                            <p className="text-sm">
                                <strong>Turn 1: Request & Intake.</strong> Emitting Intake Form, Notion Prompt, and Install Checklist.
                            </p>
                        </div>
                        <div className="bg-black/40 p-6 rounded-2xl font-mono text-[10px] whitespace-pre border border-white/5 text-inos-muted h-64 overflow-y-auto">
                            {FORGE_TEMPLATES.INTAKE_FORM}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <h3 className="text-lg font-bold">Step 3: Intelligence Generation</h3>
                        <div className="inos-card p-4 bg-purple-500/5 border-purple-500/20">
                            <p className="text-sm"><strong>AUTOGEN Turn 2.</strong> Use the button below to generate Personality Card, Brief, and Outline from the Intake context.</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="text-xs font-bold uppercase tracking-widest text-inos-muted mb-2">AUTOGEN Controls</div>
                            <p className="text-[10px] text-inos-muted mb-4 opacity-70">
                                Review intake status. If complete, click AUTO-GEN Turn 2.
                            </p>
                            <button onClick={handleGenerateTurn2} className="btn-primary w-full py-3" disabled={loading}>
                                AUTO-GEN Turn 2 (Card + Brief + Outline)
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <h3 className="text-lg font-bold text-amber-400">Step 4: Await GREENLIGHT</h3>
                        <div className="inos-card p-4 bg-emerald-500/5 border-emerald-500/20">
                            <p className="text-sm"><strong>Review & Finalize.</strong> Review Turn 2 outputs. If approved, set to Awaiting GREENLIGHT then generate the final package.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 h-48">
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-[9px] font-mono overflow-y-auto opacity-70">
                                {getArtifactContent("PersonalityCard")}
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-[9px] font-mono overflow-y-auto opacity-70">
                                {getArtifactContent("OnePageBrief")}
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex gap-4">
                            <button onClick={handleSetGreenlight} className="btn-secondary flex-1" disabled={loading}>GREENLIGHT (Set Awaiting)</button>
                            <button onClick={handleGenerateTurn3} className="btn-primary flex-1" disabled={loading}>AUTO-GEN Turn 3 (Full Package)</button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <h3 className="text-lg font-bold border-b border-white/10 pb-2">Export Blocks</h3>
                        <div className="grid grid-cols-1 gap-6 pb-8">
                            {[
                                { label: "Intake Form", type: "IntakeForm" },
                                { label: "Personality Card", type: "PersonalityCard" },
                                { label: "One-Page Brief", type: "OnePageBrief" },
                                { label: "Full Dossier", type: "FullDossier" },
                                { label: "Agent Spec", type: "AgentSpec" },
                                { label: "Roster Brief", type: "RosterBrief" },
                                { label: "Timeline Event", type: "TimelineEvent" }
                            ].map(artConfig => {
                                const art = getArtifact(artConfig.type);
                                return (
                                    <div key={artConfig.type} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-inos-accent">{artConfig.label}</label>
                                                {art?.exported_to !== "None" && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">EXPORTED: {art?.exported_to}</span>}
                                            </div>
                                            <div className="flex gap-1">
                                                {["ARK", "Roster", "Timeline", "Notion"].map(dest => (
                                                    <button
                                                        key={dest}
                                                        onClick={() => art && handleMarkExport(art.id, dest)}
                                                        className={`text-[8px] uppercase px-1.5 py-0.5 rounded border transition-all ${art?.exported_to === dest ? 'bg-inos-accent text-black border-inos-accent' : 'bg-white/5 border-white/10 text-inos-muted hover:text-white'}`}
                                                    >
                                                        {dest}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(getArtifactContent(artConfig.type))}
                                                    className="ml-2 text-[9px] uppercase tracking-wider bg-white/5 hover:bg-inos-accent hover:text-black px-2 py-1 rounded transition-all"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] font-mono text-inos-muted h-24 outline-none resize-none"
                                            readOnly
                                            title={`Export block for ${artConfig.label}`}
                                            placeholder={`Content for ${artConfig.label} will appear here...`}
                                            value={getArtifactContent(artConfig.type)}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 shrink-0 flex justify-between items-center">
                <div className="text-xs text-inos-muted">
                    STEP {step} OF 5
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="btn-secondary">{step === 5 ? "Close" : "Cancel"}</button>
                    {step === 1 && <button onClick={handleCreateThread} className="btn-primary" disabled={loading || !formData.handle}>Create Thread</button>}
                    {step === 2 && <button onClick={handleEmitTurn1} className="btn-primary" disabled={loading}>Emit Turn 1</button>}
                    {step === 3 && <button onClick={() => setStep(4)} className="btn-secondary" disabled={loading}>Skip to Review</button>}
                    {step === 4 && <button onClick={() => setStep(5)} className="btn-secondary" disabled={loading}>Skip to Export</button>}
                    {step === 5 && <button onClick={onComplete} className="btn-primary">Finish & Roster</button>}
                </div>
            </div>
        </div>
    );
};
