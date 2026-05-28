import { InboxItem } from "../../types/inbox";

interface InboxTableProps {
    items: InboxItem[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function InboxTable({ items, loading, selectedId, onSelect }: InboxTableProps) {
    if (loading) return <div className="p-8 text-center text-inos-muted animate-pulse">Loading inbox...</div>;
    if (items.length === 0) return <div className="p-8 text-center text-inos-muted">No items found.</div>;

    return (
        <div className="rounded-xl border border-inos-border/60 overflow-hidden bg-black/20 backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-inos-muted text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 font-medium min-w-[200px]">Item</th>
                            <th className="px-4 py-3 font-medium w-[120px]">Status</th>
                            <th className="px-4 py-3 font-medium w-[150px]">Routing Key</th>
                            <th className="px-4 py-3 font-medium w-[120px]">Dest</th>
                            <th className="px-4 py-3 font-medium w-[120px]">Captured</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map(item => (
                            <tr
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`cursor-pointer transition-colors hover:bg-white/5 ${selectedId === item.id ? "bg-inos-accent/20 border-l-2 border-inos-accent" : "border-l-2 border-transparent"}`}
                            >
                                <td className="px-4 py-3">
                                    <div className="font-medium text-white truncate max-w-[300px]" title={item.item || ""}>{item.item}</div>
                                    <div className="text-xs text-inos-muted truncate max-w-[300px]" title={item.summary || ""}>{item.summary}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                     ${item.status === 'Blocked' ? 'bg-red-900/40 text-red-200' :
                                            item.status === 'Classified' ? 'bg-blue-900/40 text-blue-200' :
                                                item.status === 'Captured' ? 'bg-yellow-900/40 text-yellow-200' :
                                                    item.status === 'Routed' ? 'bg-green-900/40 text-green-200' :
                                                        item.status === 'Duplicate' ? 'bg-orange-900/40 text-orange-200' :
                                                            'bg-gray-800 text-gray-400'}`}>
                                        {item.status}
                                    </span>
                                    {item.sensitivity && item.sensitivity !== 'Internal' && (
                                        <span className={`ml-2 inline-flex px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold tracking-wider border
                                            ${item.sensitivity === 'Secret' ? 'bg-red-950 text-red-500 border-red-900' :
                                                item.sensitivity === 'Confidential' ? 'bg-orange-950 text-orange-500 border-orange-900' :
                                                    'bg-blue-950 text-blue-500 border-blue-900'}`}>
                                            {item.sensitivity}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-inos-muted truncate max-w-[150px]" title={item.routing_key}>{item.routing_key || "—"}</td>
                                <td className="px-4 py-3 text-xs">{item.destination_db || "—"}</td>
                                <td className="px-4 py-3 text-xs text-inos-muted">
                                    {item.captured_at ? new Date(item.captured_at).toLocaleDateString() : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
