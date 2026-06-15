import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Terminal, 
  Database, 
  Shield, 
  Activity, 
  Layout, 
  User, 
  Settings,
  MoreVertical,
  Maximize2
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function AppSpine() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTrain, setActiveTrain] = useState("T1: Protocol Bootstrap");
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-[#e5e5e5] font-['Syne'] overflow-hidden selection:bg-[#00f0ff]/30">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-[9999]" 
           style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)" }} />

      {/* -- GLOBAL HEADER -- */}
      <header className="h-12 border-b border-[#1a1a1a] bg-[#080808] flex items-center px-4 gap-3 z-50">
        <img src="/brand/IN_LOGO_PRIMARY.png" className="w-8 h-8 rounded-md shadow-[0_0_12px_rgba(0,240,255,0.2)] object-cover" />
        <div className="flex flex-col">
          <span className="text-[8px] tracking-[0.22em] text-[#777] font-mono leading-none">INFINITE NETWORK OS</span>
          <span className="text-sm font-bold tracking-tight">INOS_E0</span>
        </div>
        <div className="px-2 py-0.5 border border-indigo-400/50 bg-indigo-950/40 rounded-full text-[9px] text-indigo-200 font-mono tracking-widest ml-2">
          E0 · v2.7-SWARM
        </div>

        <nav className="flex-1 flex justify-center gap-1">
          {[
            { key: "home", label: "home", to: "/home" },
            { key: "room", label: "my room", to: "/room/me" },
            { key: "foundation", label: "foundation", to: "/foundation" },
            { key: "guilds", label: "guilds", to: "/guilds" },
            { key: "agents", label: "agents", to: "/agents" },
            { key: "governance", label: "governance", to: "/governance" },
            { key: "logs", label: "logs", to: "/logs" },
          ].map((view) => (
            <button 
              key={view.key}
              onClick={() => navigate(view.to)}
              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-mono transition-all ${
                (view.key === "room" ? location.pathname.startsWith("/room/") : location.pathname.includes(view.key))
                  ? 'bg-gradient-to-br from-[#1a1a2e] to-[#0d1117] border border-[#00f0ff]/50 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                  : 'text-[#555] hover:text-white'
              }`}
            >
              {view.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="px-2 py-1 border border-[#222] bg-[#0d0d0d] text-[#777] text-[9px] font-mono rounded-md hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all">?K COMMAND</button>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-800 flex items-center justify-center text-[10px] font-bold border border-[#1a1a1a]">L</div>
        </div>
      </header>

      {/* -- CONTEXT STRIP -- */}
      <div className="h-[30px] border-b border-[#1a1a1a] bg-[#080808]/90 flex items-center px-4 gap-4 text-[10px] font-mono">
        <span className="text-[#555] tracking-widest uppercase">ENTITY</span>
        <select className="bg-[#0d0d0d] border border-[#222] text-[#e5e5e5] px-2 py-0.5 rounded-sm outline-none hover:border-[#555] transition-all cursor-pointer">
          <option>GLOBAL</option>
          <option>IE (INFINITE EARTH)</option>
          <option>FFC (FORTRESS)</option>
        </select>
        <span className="text-[#555] tracking-widest uppercase">ROOM</span>
        <select className="bg-[#0d0d0d] border border-[#222] text-[#e5e5e5] px-2 py-0.5 rounded-sm outline-none hover:border-[#555] transition-all cursor-pointer">
          <option>CONTROL TOWER</option>
          <option>OPS ROOM</option>
        </select>
        <div className="flex-1 text-center text-[#555] truncate opacity-50">
          ROOT // INOS_E0 // SESSION: ACTIVE
        </div>
      </div>

      {/* -- MISSION STRIP -- */}
      <div className="h-[44px] border-b border-[#1a1a1a] bg-gradient-to-r from-[#080808] to-[#0d0d0d] flex items-center px-4 gap-4">
        <span className="text-[#555] text-[10px] font-mono tracking-widest uppercase">MISSION</span>
        <div className="px-3 py-1 bg-[#0d0d0d] border border-[#333] rounded-full flex items-center gap-2 cursor-pointer hover:border-[#00f0ff] transition-all group">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]" />
          <span className="text-[10px] font-mono group-hover:text-[#00f0ff]">MSN-2025-0011 — Register 9 Standalone Agents</span>
          <span className="text-[8px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-1.5 rounded-sm uppercase">HIGH</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#222] px-3 py-1 rounded-full text-[10px] font-mono text-[#777]">
            <span>SYNC_KEY:</span>
            <span className="text-[#00f0ff]">E0-SWARM-001</span>
          </div>
          <button className="text-[9px] font-mono px-2 py-0.5 bg-[#0d0d0d] border border-[#222] text-[#c9a227] rounded-md uppercase">Run: FAST</button>
        </div>
        <button className="flex items-center gap-2 px-3 py-1 border border-[#c9a227]/50 bg-[#1e231e]/50 rounded-full text-[10px] font-mono text-[#fef9c3] hover:border-[#c9a227]">
          <span>? ACCEPTANCE: 0/9</span>
        </button>
      </div>

      {/* -- MAIN WORKSPACE -- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SWITCHYARD RAIL (LEFT) */}
        <aside className="w-60 border-r border-[#1a1a1a] bg-gradient-to-b from-[#050505] to-[#020202] flex flex-col p-3 gap-3 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-[#555] uppercase">
              <span>Switchyard</span>
              <span>1/5</span>
            </div>
            <div className="h-[3px] bg-[#111] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: '20%' }} />
            </div>
          </div>

          <div className="text-[9px] font-mono tracking-widest text-[#555] uppercase mt-2">Active Trains</div>
          <div className="flex flex-col gap-2">
            <div className="p-2 border border-[#00f0ff]/40 bg-[#050519] rounded-md border-l-2 border-l-[#00f0ff] cursor-pointer hover:translate-x-1 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold font-mono">T1 · Protocol Setup</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]" />
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono text-[#555]">
                <span>ARC</span>
                <span className="px-1 border border-[#222] rounded-sm uppercase">SWARM</span>
              </div>
            </div>
          </div>

          <button className="mt-2 w-full py-2 border border-[#00f0ff]/30 bg-[#00f0ff]/5 rounded text-[#00f0ff] text-[10px] font-mono tracking-widest uppercase hover:bg-[#00f0ff]/10 transition-all">
            ? Start Train
          </button>
        </aside>

        {/* MAIN CANVAS */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-5 relative z-10 scrollbar-hide">
            <Outlet />
          </div>
          
          {/* INSPECTOR SLIDE-OUT */}
          {isInspectorOpen && (
            <aside className="absolute top-0 right-0 bottom-0 w-80 bg-[#050508]/98 border-l border-[#1a1a1a] shadow-[-8px_0_20px_rgba(0,0,0,0.8)] z-50 animate-in slide-in-from-right duration-200">
              <div className="p-4 flex flex-col h-full gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold">Inspector</h3>
                    <p className="text-[10px] font-mono text-[#777] mt-1">Manifest Trace // v1.0</p>
                  </div>
                  <button onClick={() => setIsInspectorOpen(false)} className="w-6 h-6 rounded-full border border-[#222] flex items-center justify-center text-[#555] hover:text-white transition-all">?</button>
                </div>
                <div className="flex-1 text-[11px] text-[#777] font-mono">
                  <p className="mb-4">Select an artifact to trace its origin and sync key.</p>
                  <div className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm space-y-2">
                    <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                      <span>Status:</span>
                      <span className="text-[#00ff9d]">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Port:</span>
                      <span className="text-[#00f0ff]">5173</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* -- STATUS FOOTER -- */}
      <footer className="h-8 border-t border-[#1a1a1a] bg-[#050505]/95 flex items-center px-4 gap-3 text-[9px] font-mono">
        <div className="min-w-[160px] text-[#555] truncate uppercase tracking-widest">
          ACTIVE TRAIN: <span className="text-[#00f0ff]">{activeTrain}</span>
        </div>
        <div className="flex-1 text-center text-[#555] uppercase tracking-widest">
          AUTOSAVED · JUST NOW
        </div>
        <div className="flex items-center gap-3 justify-end min-w-[120px]">
          <button 
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className="px-2 py-0.5 border border-sky-600/60 text-sky-300 rounded-full hover:bg-sky-600/10 transition-all"
          >
            INSPECTOR
          </button>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
             <span className="text-[#777]">ENV: SANDBOX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


