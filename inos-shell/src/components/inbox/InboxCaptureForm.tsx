import { useState, useEffect } from "react";
import { api } from "../../api";

export function InboxCaptureForm({ onCapture }: { onCapture: () => void }) {
    const [form, setForm] = useState({
        item: "",
        source_type: "manual",
        source_url: "",
        source_ref: "",
        summary: "",
        sensitivity: "internal",
        entity_id: "",
        room_id: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const entity = localStorage.getItem("inos_entity_context_v1") || "";
        const room = localStorage.getItem("inos_room_context_v1") || "";
        setForm(prev => ({ ...prev, entity_id: entity, room_id: room }));

        const handler = (event: Event) => {
            const detail = (event as CustomEvent).detail || {};
            if (detail.entity !== undefined) setForm(prev => ({ ...prev, entity_id: detail.entity || "" }));
            if (detail.room !== undefined) setForm(prev => ({ ...prev, room_id: detail.room || "" }));
        };
        window.addEventListener("inos-context-change", handler as EventListener);
        return () => window.removeEventListener("inos-context-change", handler as EventListener);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.item.trim()) return;
        setLoading(true);
        try {
            await api.inboxCreate({
                request_id: `req_${Date.now()}`,
                actor: 'INOS_SHELL',
                item: form.item,
                source_type: form.source_type,
                source_url: form.source_url || undefined,
                source_ref: form.source_ref || undefined,
                summary: form.summary,
                sensitivity: form.sensitivity,
                entity_id: form.entity_id || undefined,
                room_id: form.room_id || undefined
            });
            // Reset core fields but keep context
            setForm(prev => ({ ...prev, item: "", summary: "", source_url: "", source_ref: "" }));
            onCapture();
        } catch (err) {
            console.error("Capture failed", err);
            alert("Capture failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card p-5 h-full flex flex-col bg-[#0f172a]/50 backdrop-blur-sm border-inos-border/50">
            <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-1">Inbox Capture</div>
            <h2 className="text-lg font-semibold mb-4 text-white">New Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto">
                <div>
                    <label htmlFor="capture-content" className="text-xs text-inos-muted uppercase tracking-wider">Content</label>
                    <textarea
                        id="capture-content"
                        className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm text-white focus:ring-1 focus:ring-inos-accent outline-none min-h-[80px]"
                        rows={3}
                        placeholder="What's this about?"
                        value={form.item}
                        onChange={(e) => setForm(prev => ({ ...prev, item: e.target.value }))}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="capture-source" className="text-xs text-inos-muted uppercase tracking-wider">Source</label>
                        <select
                            id="capture-source"
                            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-2 py-2 text-sm text-white outline-none"
                            value={form.source_type}
                            onChange={(e) => setForm(prev => ({ ...prev, source_type: e.target.value }))}
                        >
                            <option value="manual">Manual</option>
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="web">Web</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="capture-sensitivity" className="text-xs text-inos-muted uppercase tracking-wider">Sensitivity</label>
                        <select
                            id="capture-sensitivity"
                            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-2 py-2 text-sm text-white outline-none"
                            value={form.sensitivity}
                            onChange={(e) => setForm(prev => ({ ...prev, sensitivity: e.target.value }))}
                        >
                            <option value="internal">Internal</option>
                            <option value="public">Public</option>
                            <option value="confidential">Confidential</option>
                            <option value="secret">Secret</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="capture-url" className="text-xs text-inos-muted uppercase tracking-wider">URL / Ref</label>
                    <input
                        id="capture-url"
                        className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                        placeholder="https://..."
                        value={form.source_url}
                        onChange={(e) => setForm(prev => ({ ...prev, source_url: e.target.value }))}
                    />
                </div>

                <div>
                    <label htmlFor="capture-summary" className="text-xs text-inos-muted uppercase tracking-wider">Summary / Notes</label>
                    <textarea
                        id="capture-summary"
                        className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm text-white outline-none"
                        rows={2}
                        value={form.summary}
                        onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                        <label htmlFor="capture-context-entity" className="text-[10px] text-inos-muted uppercase tracking-wider">Context: Entity</label>
                        <input
                            id="capture-context-entity"
                            className="mt-1 w-full rounded-lg border border-inos-border/50 bg-[#0f172a]/50 px-2 py-1.5 text-xs text-inos-muted"
                            value={form.entity_id}
                            readOnly
                        />
                    </div>
                    <div>
                        <label htmlFor="capture-context-room" className="text-[10px] text-inos-muted uppercase tracking-wider">Context: Room</label>
                        <input
                            id="capture-context-room"
                            className="mt-1 w-full rounded-lg border border-inos-border/50 bg-[#0f172a]/50 px-2 py-1.5 text-xs text-inos-muted"
                            value={form.room_id}
                            readOnly
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button className="btn-primary w-full flex justify-center py-3" disabled={loading}>
                        {loading ? "Capturing..." : "Capture to Inbox"}
                    </button>
                </div>
            </form>
        </div>
    );
}
