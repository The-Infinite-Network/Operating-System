import { useState, useCallback, useEffect } from "react";
import { api } from "../api";
import { InboxItem, InboxStatus } from "../types/inbox";
import { InboxTable } from "../components/inbox/InboxTable";
import { InboxFilters } from "../components/inbox/InboxFilters";
import { InboxEditorDrawer } from "../components/inbox/InboxEditorDrawer";
import { InboxCaptureForm } from "../components/inbox/InboxCaptureForm";
import { DuplicateResultsModal } from "../components/inbox/DuplicateResultsModal";

export default function Inbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGlobalDupModal, setShowGlobalDupModal] = useState(false);
  const [globalDupMatches, setGlobalDupMatches] = useState<InboxItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState("triage");
  const [filters, setFilters] = useState<{ status?: InboxStatus; entity?: string; room?: string; search?: string }>({
    status: 'Captured'
  });

  // Force refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      // Logic to handle "All" tab which sends undefined status
      const statusParam = filters.status;

      const res = await api.inboxList({
        request_id: `req_${Date.now()}`,
        status: statusParam,
        entity_id: filters.entity,
        room_id: filters.room,
        limit: 100,
      });

      let fetched = (res.data?.items || []) as InboxItem[];

      // Client-side search filtering if API doesn't support it yet
      if (filters.search) {
        const q = filters.search.toLowerCase();
        fetched = fetched.filter(i =>
          (i.item && i.item.toLowerCase().includes(q)) ||
          (i.summary && i.summary.toLowerCase().includes(q))
        );
      }
      setItems(fetched);
    } catch (err) {
      console.error("Inbox list failed", err);
    } finally {
      setLoading(false);
    }
  }, [filters, refreshKey]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleGlobalDuplicateScan = async () => {
    setActionLoading(true);
    try {
      const res = await api.inboxDedupeFind({
        query: "", // Not used in this mode per se, but tool signature requirement
        time_window_days: 30
      });
      setGlobalDupMatches(res.data.matches || []);
      setShowGlobalDupModal(true);
    } catch (err) {
      console.error("Global duplicate scan failed", err);
      alert("Scan failed check console");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkBackfill = async () => {
    if (!confirm("This will scan ALL inbox items from the last year and normalize codes. Continue?")) return;
    setActionLoading(true);
    try {
      const res = await api.inboxBackfillCodes({
        dry_run: false,
        limit: 500,
        filter: { time_window_days: 365 }
      });
      const { scanned, changed, unchanged, errors } = res.data;
      let msg = `Backfill Complete:\nScanned: ${scanned}\nChanged: ${changed}\nUnchanged: ${unchanged}\nErrors: ${errors.length}`;
      if (errors.length > 0) {
        msg += "\n\nFirst 10 Errors:\n" + errors.slice(0, 10).map((e: any) => JSON.stringify(e)).join("\n");
      }
      alert(msg);
      handleRefresh();
    } catch (err) {
      console.error("Backfill failed", err);
      alert("Backfill failed");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedItem = items.find(i => i.id === selectedId) || null;

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-[#0b0e11]">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[320px_1fr] h-full overflow-hidden">

        {/* Left Side: Capture Form */}
        <div className="hidden xl:flex flex-col border-r border-inos-border/30 bg-[#050816]/50 p-4 overflow-y-auto">
          <InboxCaptureForm onCapture={handleRefresh} />

          <div className="mt-8 p-4 rounded-xl border border-inos-border/30 bg-black/20">
            <h3 className="text-xs font-semibold text-inos-muted uppercase tracking-wider mb-2">Inbox Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>New</span>
                <span className="font-mono text-inos-accent">{items.filter(i => i.status === 'Captured').length}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Triaged</span>
                <span className="font-mono text-blue-400">{items.filter(i => i.status === 'Classified').length}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Blocked</span>
                <span className="font-mono text-red-400">{items.filter(i => i.status === 'Blocked').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Console */}
        <div className="flex flex-col h-full overflow-hidden relative">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-inos-muted mb-1">System of Action</div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  SECOND BRAIN
                  <span className="px-2 py-0.5 rounded-full bg-inos-accent/10 border border-inos-accent/30 text-[10px] text-inos-accent font-mono">v2.0</span>
                </h1>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-white/5 text-inos-muted hover:text-white transition-colors"
                title="Refresh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
              </button>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleGlobalDuplicateScan}
                  disabled={actionLoading}
                  className="text-xs btn-secondary px-3 py-1.5 flex items-center gap-2"
                  title="Find duplicates in last 30 days"
                >
                  {actionLoading ? "Scanning..." : "Global Dedupe"}
                </button>
                <button
                  onClick={handleBulkBackfill}
                  disabled={actionLoading}
                  className="text-xs btn-secondary px-3 py-1.5 flex items-center gap-2 border-red-900/30 hover:border-red-900 text-red-400"
                  title="Admin: Normalize codes"
                >
                  {actionLoading ? "Running..." : "Backfill Codes"}
                </button>
              </div>
              {/* Mobile Capture Toggle could go here */}
            </div>

            <InboxFilters
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onFilterChange={setFilters}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
            <InboxTable
              items={items}
              loading={loading}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            />
          </div>

          {/* Editor Drawer / Overlay */}
          {/* Logic: If captured item selected, show drawer. */}
          <InboxEditorDrawer
            item={selectedItem}
            onUpdate={handleRefresh}
            onClose={() => setSelectedId(null)}
          />

          {showGlobalDupModal && (
            <DuplicateResultsModal
              matches={globalDupMatches}
              onClose={() => setShowGlobalDupModal(false)}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
