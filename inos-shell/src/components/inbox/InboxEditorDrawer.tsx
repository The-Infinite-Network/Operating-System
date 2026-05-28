import { useState, useEffect, useMemo } from "react";
import { InboxItem } from "../../types/inbox";
import { api } from "../../api";
import { DuplicateResultsModal } from "./DuplicateResultsModal";

interface InboxEditorDrawerProps {
    item: InboxItem | null;
    onUpdate: () => void;
    onClose: () => void;
}

const DEST_DB_OPTIONS = [
    "TIMELINE", "MISSIONS", "TASKS", "RUNS_AARS",
    "ARK_ASSETS", "DRAFT_BLOCKS", "LAW_DOCS", "CLASS_KB", "AGENTS", "OTHER"
];

export function InboxEditorDrawer({ item, onUpdate, onClose }: InboxEditorDrawerProps) {
    const [formData, setFormData] = useState<Partial<InboxItem>>({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDupModal, setShowDupModal] = useState(false);
    const [dupMatches, setDupMatches] = useState<InboxItem[]>([]);

    useEffect(() => {
        if (item) setFormData({ ...item });
        setMsg(null);
    }, [item]);

    const routingKey = useMemo(() => {
        const layer = formData.layer || "unknown";
        const domain = formData.domain || "general";
        const obj = formData.object_type || "item";
        const dest = formData.destination_db || "UNKNOWN";
        return `${layer}:${domain}:${obj}:${dest}`;
    }, [formData]);

    if (!item) return (
        <div className="hidden border-l border-inos-border/30 bg-[#0f172a]/90 backdrop-blur-md p-6 w-[400px] md:block flex items-center justify-center text-inos-muted text-sm z-30">
            Select an item to view details
        </div>
    );

    const handleAction = async (action: 'triage' | 'route' | 'verify' | 'block' | 'duplicate' | 'archive' | 'move') => {
        setLoading(true);
        setMsg(null);
        const reqId = `req_${Date.now()}`;
        try {
            if (action === 'triage') {
                await api.inboxTriage({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id,
                    lane: formData.lane || "",
                    layer: formData.layer || "",
                    domain: formData.domain || "",
                    object_type: formData.object_type || "",
                    owner_pod: formData.owner_pod || "",
                    destination_db: formData.destination_db,
                    sensitivity: formData.sensitivity as any,
                });
                setMsg({ type: 'success', text: 'Triaged successfully' });
            } else if (action === 'route') {
                await api.inboxRoute({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id,
                    destination_db: formData.destination_db
                });
                setMsg({ type: 'success', text: 'Routed successfully' });
            } else if (action === 'verify') {
                await api.inboxVerify({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id
                });
                setMsg({ type: 'success', text: 'Verified successfully' });
            } else if (action === 'block') {
                if (!formData.blocker_reason) throw new Error("Blocker reason required");
                await api.inboxBlock({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id,
                    blocker_reason: formData.blocker_reason
                });
                setMsg({ type: 'success', text: 'Blocked successfully' });
            } else if (action === 'duplicate') {
                if (!formData.duplicate_of) throw new Error("Duplicate ID required");
                await api.inboxDuplicate({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id,
                    duplicate_of: formData.duplicate_of
                });
                setMsg({ type: 'success', text: 'Marked as duplicate' });
            } else if (action === 'archive') {
                await api.inboxArchive({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id
                });
                setMsg({ type: 'success', text: 'Archived successfully' });
            } else if (action === 'move') {
                await api.inboxMove({
                    request_id: reqId,
                    actor: 'INOS_SHELL',
                    inbox_id: item.id
                });
                setMsg({ type: 'success', text: 'Moved successfully' });
            }

            onUpdate();
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message || "Action failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleFindDuplicates = async () => {
        if (!item) return;
        setLoading(true);
        try {
            const res = await api.inboxDedupeFind({
                inbox_id: item.id,
                same_source_url: true,
                same_source_ref: true,
                fuzzy_title: true,
                fuzzy_summary: true,
                time_window_days: 90
            });
            setDupMatches(res.data.matches || []);
            setShowDupModal(true);
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message || "Dedupe scan failed" });
        } finally {
            setLoading(false);
        }
    };

    const Input = ({ label, field, placeholder }: { label: string, field: keyof InboxItem, placeholder?: string }) => (
        <div className="flex flex-col gap-1">
            <label htmlFor={`drawer-input-${field}`} className="text-[10px] uppercase tracking-wider text-inos-muted">{label}</label>
            <input
                id={`drawer-input-${field}`}
                className="bg-[#1e293b] border border-inos-border/50 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-inos-accent outline-none"
                placeholder={placeholder}
                value={formData[field] || ""}
                onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            />
        </div>
    );

    return (
        <div className="border-l border-inos-border/30 bg-[#0f172a]/95 backdrop-blur-md w-full md:w-[400px] flex flex-col h-full overflow-hidden shadow-2xl absolute right-0 top-0 bottom-0 z-30 md:relative md:z-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                <h3 className="font-semibold text-sm text-white">Item Details</h3>
                <button onClick={onClose} className="text-inos-muted hover:text-white md:hidden">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {msg && (
                    <div className={`p-2 rounded text-xs border ${msg.type === 'success' ? 'bg-green-900/20 text-green-200 border-green-800' : 'bg-red-900/20 text-red-200 border-red-800'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-inos-muted">Item Content</label>
                        <div className="bg-[#1e293b] p-3 rounded text-sm mt-1 text-white border border-inos-border/30">{item.item}</div>
                    </div>

                    {item.summary && (
                        <div>
                            <label className="text-[10px] uppercase tracking-wider text-inos-muted">Summary</label>
                            <div className="text-xs text-inos-muted mt-1 p-2 bg-[#1e293b]/50 rounded">{item.summary}</div>
                        </div>
                    )}

                    {item.source_url && (
                        <div className="truncate">
                            <label className="text-[10px] uppercase tracking-wider text-inos-muted">Source</label>
                            <a href={item.source_url} target="_blank" rel="noreferrer" className="text-xs text-inos-accent underline block truncate mt-1">
                                {item.source_url}
                            </a>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-white/90">Classification</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Lane" field="lane" placeholder="L0-L5" />
                        <Input label="Layer" field="layer" placeholder="e.g. core" />
                        <Input label="Domain" field="domain" placeholder="e.g. shell" />
                        <Input label="Object" field="object_type" placeholder="e.g. task" />
                        <Input label="Owner Pod" field="owner_pod" placeholder="e.g. team-ai" />
                        <div className="flex flex-col gap-1">
                            <label htmlFor="drawer-dest-db" className="text-[10px] uppercase tracking-wider text-inos-muted">Dest DB</label>
                            <select
                                id="drawer-dest-db"
                                className="bg-[#1e293b] border border-inos-border/50 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-inos-accent"
                                value={formData.destination_db || ""}
                                onChange={e => setFormData(prev => ({ ...prev, destination_db: e.target.value }))}
                            >
                                <option value="">Select...</option>
                                {DEST_DB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="text-[10px] text-inos-muted mb-1">PROJECTED ROUTING KEY</div>
                        <code className="block bg-black/40 p-2 rounded text-[10px] font-mono text-inos-accent break-all border border-white/5">{routingKey}</code>
                    </div>

                    <div className="flex gap-2">
                        <button
                            disabled={loading}
                            onClick={() => handleAction('triage')}
                            className="flex-1 btn-primary text-xs py-2 disabled:opacity-50"
                        >
                            Save Classification
                        </button>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-white/90">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAction('route')} disabled={loading || !formData.destination_db} className="btn-secondary text-xs py-2 hover:bg-white/10 disabled:opacity-50">Route</button>
                        <button onClick={() => handleAction('move')} disabled={loading} className="btn-secondary text-xs py-2 hover:bg-white/10 disabled:opacity-50">Move</button>
                        <button onClick={() => handleAction('verify')} disabled={loading} className="btn-secondary text-xs py-2 hover:bg-white/10 disabled:opacity-50">Verify</button>
                        <button onClick={() => handleAction('archive')} disabled={loading} className="btn-secondary text-xs py-2 hover:bg-white/10 disabled:opacity-50">Archive</button>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-white/90">Exceptions</h4>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                className="bg-[#1e293b] border border-inos-border/50 rounded px-2 py-1.5 text-xs text-white flex-1 outline-none"
                                placeholder="Reason..."
                                aria-label="Blocker reason"
                                value={formData.blocker_reason || ""}
                                onChange={e => setFormData(prev => ({ ...prev, blocker_reason: e.target.value }))}
                            />
                            <button onClick={() => handleAction('block')} disabled={loading} className="px-3 py-1 bg-red-900/30 text-red-200 text-xs rounded border border-red-900/50 hover:bg-red-900/50 transition-colors">Block</button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="bg-[#1e293b] border border-inos-border/50 rounded px-2 py-1.5 text-xs text-white flex-1 outline-none"
                                placeholder="Duplicate of ID..."
                                aria-label="Duplicate ID"
                                value={formData.duplicate_of || ""}
                                onChange={e => setFormData(prev => ({ ...prev, duplicate_of: e.target.value }))}
                            />
                            <button onClick={handleFindDuplicates} disabled={loading} className="px-3 py-1 bg-blue-900/30 text-blue-200 text-xs rounded border border-blue-900/50 hover:bg-blue-900/50 transition-colors shrink-0">Scan</button>
                            <button onClick={() => handleAction('duplicate')} disabled={loading} className="px-3 py-1 bg-orange-900/30 text-orange-200 text-xs rounded border border-orange-900/50 hover:bg-orange-900/50 transition-colors shrink-0">Mark Dup</button>
                        </div>
                    </div>
                </div>

                {showDupModal && (
                    <DuplicateResultsModal
                        matches={dupMatches}
                        sourceItem={item}
                        onClose={() => setShowDupModal(false)}
                        onRefresh={onUpdate}
                    />
                )}

                {item.target_url && (
                    <div className="p-3 bg-green-900/10 border border-green-900/30 rounded text-center">
                        <a href={item.target_url} target="_blank" rel="noreferrer" className="text-xs text-green-400 underline font-medium hover:text-green-300">Open Routed Item</a>
                    </div>
                )}

            </div>
        </div>
    );
}
