import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Clock, Target, Wallet, History, CheckCircle2, AlertCircle, Settings,
  TrendingUp, ArrowUpRight, Gift
} from "lucide-react";
import { mockWallet } from "../data/mockWallet";
import { formatTT, formatNTV, formatLifeHours } from "../services/timeCreditService";
import { useAuth } from "../auth/AuthContext";
import { POLEEntry } from "../components";
import { api } from "../api";
import { TimelineEvent } from "../types";
import { fetchOperatorProfile } from "../services/operatorProfile";

export default function RoomMe() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"today" | "timeline" | "missions" | "wallet">("today");
  const [recentTimeline, setRecentTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState("unified");
  const [customGrid, setCustomGrid] = useState<Record<string, string | null> | null>(null);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      setLoading(true);
      try {
        const profile = await fetchOperatorProfile(user?.email);
        if (profile.status !== "not_found") {
          setLayoutMode(profile.selectedLayout || "unified");
          setCustomGrid(profile.custom_grid || null);
        }
        const { events } = await api.timeline.queryByMission("global", 15);
        setRecentTimeline(events);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndData();
  }, [user]);

  const handlePOLESubmit = async (data: any) => {
     try {
       await api.timeline.logV1({
         event_type: "POLE",
         summary: data.summary,
         entity: "GLOBAL",
         sync_key: `ROOM-${Date.now()}`
       });
       const { events } = await api.timeline.queryByMission("global", 15);
       setRecentTimeline(events);
     } catch (e) {
       console.error("POLE Error:", e);
     }
  };

  const renderWidget = (widgetId: string | null) => {
    if (!widgetId) return <div className="w-full h-full min-h-[100px] border border-dashed border-[#1a1a1a] rounded-sm flex items-center justify-center text-[10px] text-[#333] font-mono uppercase">Empty Slot</div>;
    
    switch(widgetId) {
      case 'pole':
        return (
          <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm relative overflow-hidden h-full">   
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 blur-3xl rounded-full pointer-events-none" />      
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-2">
              <Clock size={14} /> Log Proof of Living Event (POLE)
            </h2>
            <POLEEntry onPOLESubmit={handlePOLESubmit} isLoading={false} />
          </div>
        );
      case 'timeline':
        return (
          <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm h-full flex flex-col">  
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <History size={14} /> Global Feed
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide min-h-[150px]">
              {recentTimeline.map((evt, i) => (
                <div key={evt.id || i} className="flex gap-3 p-2 border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm">
                  <div className="text-[9px] font-mono text-[#555] pt-0.5">{new Date(evt.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>
                    <div className="text-xs font-bold">{evt.title || "Log Entry"}</div>
                    <div className="text-[10px] text-[#777] leading-relaxed truncate max-w-[200px]">{evt.summary || evt.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="grid grid-cols-1 gap-2 h-full">
            <div className="bg-[#080808] border border-[#1a1a1a] p-4 rounded-sm flex flex-col justify-center">
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-1">Deep Work</div>
              <div className="text-xl font-bold text-[#00f0ff]">4.5h</div>
            </div>
            <div className="bg-[#080808] border border-[#1a1a1a] p-4 rounded-sm flex flex-col justify-center">
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-1">Sovereign Score</div>
              <div className="text-xl font-bold text-[#00ff9d]">94.2</div>
            </div>
          </div>
        );
      case 'missions':
        return (
          <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm h-full">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-2">
              <Target size={14} /> Active Missions
            </h2>
            <div className="p-3 border border-[#1a1a1a] bg-[#0d0d0d] flex flex-col">   
              <div className="text-[10px] font-mono text-[#555] mb-1">MSN-2026-0001</div>
              <div className="text-sm font-bold mb-2">Initialize Sovereign OS</div>
              <span className="text-[9px] text-[#00ff9d] border border-[#00ff9d]/30 bg-[#00ff9d]/10 px-2 py-1 rounded-sm uppercase tracking-widest self-start">Active</span>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="bg-[#080808] border border-[#1a1a1a] p-4 rounded-sm h-full flex items-center">
            <div className="flex gap-3 text-xs text-amber-400 p-2 bg-amber-400/5 border border-amber-400/20 rounded-sm w-full">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Timeline adapter is active. Canon coverage depends on the configured live database surfaces.</span>
            </div>
          </div>
        );
      case 'trains':
        return (
          <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm h-full">
            <h3 className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555] mb-4">Operator Status</h3>
            <div className="text-xs text-[#777] mb-1">Active Train</div>
            <div className="text-sm font-bold font-mono text-[#00f0ff]">T1 · Protocol Setup</div>
          </div>
        );
      default:
        return <div className="bg-[#080808] border border-[#1a1a1a] p-4 rounded-sm flex items-center justify-center text-xs text-[#555] h-full uppercase">{widgetId} Offline</div>;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="card p-5 mb-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555]">
              Room // Human Room // My Room
            </div>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="rounded-xl bg-[#00f0ff]/10 p-2 text-[#00f0ff]">
                <Activity size={18} />
              </span>
              My Room · Proof of Living Engine
            </h1>
            <p className="mt-3 text-sm leading-6 text-inos-muted">
              Personal operating surface for mission context, shell log, Proof of Living,
              timeline review, and local runtime posture.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Human scope", "PoLE v0.4", "Timeline-linked", "Training-aware"].map((pill) => (
                <span key={pill} className="inos-pill">
                  {pill}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-mono uppercase text-[#555]">
              Operator: {user ? user.displayName || user.email : "Anonymous"} // Epoch 0
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
          <Link
            to="/provisioning?mode=edit"
            className="flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] bg-[#080808] text-[9px] font-mono uppercase tracking-widest text-[#555] hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-all rounded-sm"
          >
            <Settings size={12} /> Change Environment
          </Link>

          {layoutMode !== "custom" && (
            <div className="flex gap-1 bg-[#080808] p-1 border border-[#1a1a1a] rounded-sm">
              {["today", "timeline", "missions", "wallet"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all ${        
                    activeTab === tab
                      ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                      : "text-[#444] hover:text-white border border-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {layoutMode === "custom" && customGrid ? (
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-y-auto pr-2 scrollbar-hide">
          <div className="col-span-3 flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-[200px]">{renderWidget(customGrid.sidebar_top)}</div>
            <div className="flex-1 min-h-[200px]">{renderWidget(customGrid.sidebar_bottom)}</div>
          </div>
          <div className="col-span-9 flex flex-col gap-4 h-full">
            <div className="h-40 shrink-0">{renderWidget(customGrid.main_top)}</div>
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-[300px]">
              <div className="h-full">{renderWidget(customGrid.main_left)}</div>
              <div className="h-full">{renderWidget(customGrid.main_right)}</div>
            </div>
            <div className="h-32 shrink-0">{renderWidget(customGrid.footer)}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm">
                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555] mb-4">
                  Current Sync
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-[#777]">Mission</div>
                    <div className="mt-1 text-lg font-semibold text-white">No mission linked</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#777]">SYNC_KEY</div>
                    <div className="mt-1 font-mono text-[#00f0ff]">E0-UZAMYD</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#777]">Run Profile</div>
                    <div className="mt-1 font-semibold text-white">DEEP</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#777]">Time Budget</div>
                    <div className="mt-1 font-semibold text-white">-</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm">
                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555] mb-4">
                  Navigation
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/foundation" className="rounded-xl border border-[#1f2937] bg-[#0d0d0d] px-4 py-3 text-sm text-white hover:border-[#00f0ff]/40">
                    Open Foundation
                  </Link>
                  <Link to="/agents" className="rounded-xl border border-[#1f2937] bg-[#0d0d0d] px-4 py-3 text-sm text-white hover:border-[#00f0ff]/40">
                    View Agents
                  </Link>
                  <Link to="/apps" className="rounded-xl border border-[#1f2937] bg-[#0d0d0d] px-4 py-3 text-sm text-white hover:border-[#00f0ff]/40">
                    Open Apps
                  </Link>
                </div>
              </div>
            </div>

            {activeTab === "today" && (
              <div className="space-y-6">
                 <div className="grid grid-cols-3 gap-4">
                   {[
                     { label: "Deep Work", val: "4.5h", color: "text-[#00f0ff]" },
                     { label: "Admin/Ops", val: "1.2h", color: "text-amber-400" },
                     { label: "Sovereign Score", val: "94.2", color: "text-[#00ff9d]" }
                   ].map(s => (
                     <div key={s.label} className="bg-[#080808] border border-[#1a1a1a] p-4 rounded-sm">
                       <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-1">{s.label}</div>
                       <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                     </div>
                   ))}
                 </div>
                 <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm relative overflow-hidden">   
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 blur-3xl rounded-full" />      
                   <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-2">
                     <Clock size={14} /> Log Proof of Living Event (POLE)
                   </h2>
                   <POLEEntry onPOLESubmit={handlePOLESubmit} isLoading={false} />
                 </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm flex-1 min-h-0 flex flex-col">  
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                     <History size={14} /> Personal Event Log
                   </h2>
                   <span className="text-[10px] font-mono text-[#555] border border-[#222] px-2 py-0.5 rounded-full">LOCAL + CANON</span>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                   {loading ? (
                     <div className="text-center text-[#555] text-xs font-mono py-8">Syncing timeline...</div>    
                   ) : (
                     recentTimeline.map((evt, i) => (
                       <div key={evt.id || i} className="flex gap-4 p-3 border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm hover:border-[#333] transition-all">
                         <div className="text-[10px] font-mono text-[#555] w-24 shrink-0 pt-0.5">
                           {new Date(evt.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-[9px] px-1.5 py-0.5 border border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/5 rounded-sm uppercase tracking-wider">
                               {evt.event_type || "SYS"}
                             </span>
                             <span className="text-xs font-bold">{evt.title || "Log Entry"}</span>
                           </div>
                           <div className="text-[11px] text-[#777] leading-relaxed">
                             {evt.summary || evt.notes}
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
            )}

            {activeTab === "missions" && (
              <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff] mb-6 flex items-center gap-2">
                   <Target size={14} /> Active Missions
                 </h2>
                 <div className="space-y-3">
                   <div className="p-3 border border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-between">   
                     <div>
                       <div className="text-[10px] font-mono text-[#555] mb-1">MSN-2026-0001</div>
                       <div className="text-sm font-bold">Initialize Sovereign OS</div>
                     </div>
                     <span className="text-[9px] text-[#00ff9d] border border-[#00ff9d]/30 bg-[#00ff9d]/10 px-2 py-1 rounded-sm uppercase tracking-widest">Active</span>
                   </div>
                   <div className="text-center text-[#555] text-xs font-mono py-4">Syncing WAR HQ...</div>        
                 </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="bg-[#080808] border border-[#1a1a1a] p-6 rounded-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#c9a227] flex items-center gap-2">
                    <Wallet size={14} /> Time Wallet — {mockWallet.memberId}
                    <span className="text-[8px] font-mono text-[#555] border border-[#1a1a1a] px-1.5 py-0.5 rounded-sm normal-case tracking-normal">sample</span>
                  </h2>
                  <Link
                    to="/time-wallet"
                    className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#555] hover:text-[#c9a227] transition-colors border border-[#1a1a1a] px-2 py-1 rounded-sm"
                  >
                    Full Wallet <ArrowUpRight size={10} />
                  </Link>
                </div>

                {/* mini stat row */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Spendable TT',  val: `${formatTT(mockWallet.spendableBalance)} TT`, color: '#c9a227', icon: <Wallet size={10} /> },
                    { label: 'Life Ledger',    val: formatLifeHours(mockWallet.lifeHours),          color: '#6366f1', icon: <Clock size={10} /> },
                    { label: 'Current NTV',    val: formatNTV(mockWallet.currentNTV),               color: '#00f0ff', icon: <TrendingUp size={10} /> },
                    { label: 'Time Score',     val: mockWallet.timeScore.toString(),                color: '#00ff9d', icon: <Gift size={10} /> },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-sm">
                      <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-1 flex items-center gap-1.5" style={{ color: s.color }}>
                        {s.icon} {s.label}
                      </div>
                      <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* last transaction */}
                {mockWallet.transactions[0] && (
                  <div className="border-t border-[#1a1a1a] pt-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-2">Latest Transaction</div>
                    <div className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm">
                      <div className="w-5 h-5 flex items-center justify-center rounded-sm border text-[#c9a227] border-[#c9a227]/30 bg-[#c9a227]/10 shrink-0">
                        <Gift size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#e5e5e5] truncate">{mockWallet.transactions[0].description}</div>
                        <div className="text-[9px] font-mono text-[#555] mt-0.5">{mockWallet.transactions[0].id}</div>
                      </div>
                      <div className="text-sm font-bold font-mono text-[#c9a227] shrink-0">
                        +{formatTT(mockWallet.transactions[0].amount)} TT
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm">
              <h3 className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555] mb-4">Operator Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#777] mb-1">Current State</div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#00ff9d]">
                    <CheckCircle2 size={16} /> Online & Ready
                  </div>
                </div>
                <div className="pt-4 border-t border-[#1a1a1a]">
                  <div className="text-xs text-[#777] mb-1">Active Train</div>
                  <div className="text-sm font-bold font-mono text-[#00f0ff]">T1 · Protocol Setup</div>
                </div>
              </div>
            </div>

            <div className="bg-[#080808] border border-[#1a1a1a] p-5 rounded-sm flex-1">
              <h3 className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555] mb-4">System Plane · Shell Log</h3> 
              <div className="space-y-3 text-xs">
                 <div className="rounded-sm border border-[#1a1a1a] bg-[#0d0d0d] p-3 text-[#b8c7db]">
                   <div><span className="text-white">[BOOT]</span> Infinite Network OS // Epoch 0 // Human Room online.</div>
                 </div>
                 <div className="rounded-sm border border-[#1a1a1a] bg-[#0d0d0d] p-3 text-[#b8c7db]">
                   <div><span className="text-white">[SYNC]</span> Mode: local-only · PoLE storage: browser + timeline adapter.</div>
                 </div>
                 <div className="flex gap-3 text-xs text-amber-400 p-3 bg-amber-400/5 border border-amber-400/20 rounded-sm">
                   <AlertCircle size={14} className="shrink-0 mt-0.5" />
                   <span>Timeline adapter is active. Canon coverage depends on the configured live database surfaces.</span>
                 </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
