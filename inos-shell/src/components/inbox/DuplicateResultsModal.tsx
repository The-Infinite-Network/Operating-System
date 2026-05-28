import { useState } from "react";
import { InboxItem } from "../../types/inbox";
import { api } from "../../api";

interface DuplicateResultsModalProps {
    matches: InboxItem[];
    sourceItem?: InboxItem | null;
    onClose: () => void;
    onRefresh: () => void;
}

export function DuplicateResultsModal({ matches, sourceItem, onClose, onRefresh }: DuplicateResultsModalProps) {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleMarkDuplicate = async (target: InboxItem) => {
        if (!sourceItem) return;
        if (!confirm(`Mark "${sourceItem.item}" as duplicate of "${target.item}"?`)) return;

        setLoading(true);
        try {
            // 1. Mark current item as duplicate
            await api.inboxUpdate({
                request_id: `req_${Date.now()}`,
                actor: 'INOS_SHELL',
                inbox_id: sourceItem.id,
                patch: {
                    // Display label - we use the standard "Duplicate" status
                    status: "Duplicate",
                    // Canon code for routing
                    routing_status_code: "duplicate",
                    // Link to the canonical item
                    duplicate_of: target.id,
                    // Append to move log
                    move_log: `${sourceItem.move_log || ''}\nDUPLICATE ${new Date().toISOString()} INOS_SHELL target=${target.id}`
                }
            });

            setMsg({ type: 'success', text: 'Marked as duplicate successfully' });
            setTimeout(() => {
                onRefresh();
                onClose();
            }, 1500);
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message || "Failed to mark duplicate" });
        } finally {
            setLoading(false);
        }
    };

    // Group matches by "Canonical Target" (using ID for grouping)
    // In a real scenario, we might group by recommended target if the API returned that structure.
    // Here we just list them as potentical targets.

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#0f172a] border border-inos-border rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-inos-border/50 flex items-center justify-between bg-white/5">
                    <h3 className="font-semibold text-white">
                        {sourceItem ? `Duplicates for: ${sourceItem.item}` : `Potential Duplicates (Last 30 Days)`}
                    </h3>
                    <button onClick={onClose} className="text-inos-muted hover:text-white">Close</button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {msg && (
                        <div className={`mb-4 p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200'}`}>
                            {msg.text}
                        </div>
                    )}

                    {matches.length === 0 ? (
                        <div className="text-center py-8 text-inos-muted">No duplicates found with current criteria.</div>
                    ) : (
                        <div className="space-y-4">
                            {matches.map(match => (
                                <div key={match.id} className="border border-inos-border/30 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${match.status === 'Routed' ? 'bg-green-900/40 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                                                    {match.status}
                                                </span>
                                                <span className="text-xs font-mono text-inos-accent">{match.id}</span>
                                                {match.confidence && (
                                                    <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                                                        {Math.round(match.confidence * 100)}% Match
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-medium text-sm text-white mb-1">{match.item}</div>
                                            {match.summary && <div className="text-xs text-inos-muted line-clamp-2 mb-2">{match.summary}</div>}

                                            <div className="flex flex-wrap gap-2 text-[10px] text-inos-muted">
                                                {match.source_url && <span className="text-blue-400">URL Match</span>}
                                                {match.source_ref && <span className="text-purple-400">Ref Match</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 shrink-0">
                                            {match.notion_url || match.target_url ? (
                                                <a
                                                    href={match.notion_url || match.target_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-secondary text-xs px-3 py-1.5 text-center"
                                                >
                                                    Open
                                                </a>
                                            ) : null}

                                            {sourceItem && sourceItem.id !== match.id && (
                                                <button
                                                    onClick={() => handleMarkDuplicate(match)}
                                                    disabled={loading}
                                                    className="btn-primary text-xs px-3 py-1.5"
                                                >
                                                    Mark as Dup
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
