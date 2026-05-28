import { Rocket, Users, Activity, Globe, Database, Terminal, Shield, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATS = [
  { label: "Active Trains", val: "1", meta: "Max 5 · Epoch 0", color: "text-[#00f0ff]" },
  { label: "Humans", val: "1", meta: "Active agents", color: "text-[#00ff9d]" },
  { label: "Timeline Events", val: "142", meta: "Total logged", color: "text-white" },
  { label: "Guilds Online", val: "4", meta: "Forums active", color: "text-[#c9a227]" }
];

const QUICK_LINKS = [
  { id: "foundation", title: "Foundation", sub: "Schema · Epoch 0", icon: Database },
  { id: "guilds", title: "Guilds", sub: "Network Forums", icon: Globe },
  { id: "agents", title: "TEAM AI", sub: "Roster · Roles", icon: Users },
  { id: "governance", title: "Governance", sub: "Rules · Commands", icon: Shield },
  { id: "logs", title: "Logs", sub: "Action stream", icon: Activity }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* -- STATUS PANEL -- */}
      <section className="bg-[#080808] border border-[#222] p-6 rounded-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase">Home · Operating Frame</div>
            <h2 className="text-xl font-bold mt-1">Epoch 0 · Infinite Network OS</h2>
            <p className="text-xs text-[#777] mt-1">At-a-glance: SYNC, trains, POLEs, and Timeline activity.</p>
          </div>
          <button className="px-3 py-1.5 border border-[#333] text-[10px] font-mono text-[#555] rounded hover:border-[#555] hover:text-white transition-all">
            SEED DEMO
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="relative group overflow-hidden bg-gradient-to-br from-[#0a0a14]/95 to-[#05050a]/85 border border-indigo-900/30 p-4 rounded-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all" />
              <div className="text-[10px] font-mono text-[#555] mb-2 uppercase">{s.label}</div>
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-indigo-400 mt-1 uppercase tracking-tighter">{s.meta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* -- QUICK NAV -- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {QUICK_LINKS.map(link => (
          <button 
            key={link.id}
            onClick={() => navigate(`/${link.id}`)}
            className="flex flex-col gap-2 p-4 bg-[#080808] border border-[#222] rounded-sm text-left hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/5 transition-all group"
          >
            <link.icon size={16} className="text-[#555] group-hover:text-[#00f0ff]" />
            <div>
              <div className="text-xs font-bold uppercase tracking-tight">{link.title}</div>
              <div className="text-[10px] text-[#555] mt-0.5">{link.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* -- RECENT SYNC -- */}
        <section className="bg-[#080808] border border-[#222] p-5 rounded-sm">
           <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase mb-4">Current SYNC</div>
           <div className="space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-2">
                <span className="text-[#555]">ACTIVE MISSION</span>
                <span className="font-mono text-[#00f0ff]">MSN-2025-0011</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-2">
                <span className="text-[#555]">SYNC_KEY</span>
                <span className="font-mono text-white">E0-SWARM-001</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-2">
                <span className="text-[#555]">POD AUTHORITY</span>
                <span className="font-mono text-[#c9a227]">CORE COMMAND</span>
              </div>
           </div>
        </section>

        {/* -- RECENT ACTIVITY -- */}
        <section className="bg-[#080808] border border-[#222] p-5 rounded-sm flex flex-col">
          <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase mb-4">Activity Stream</div>
          <div className="flex-1 space-y-4 max-h-[120px] overflow-y-auto pr-2 scrollbar-hide">
             {[
               { time: "14:22", type: "SYS", text: "INOS_E0 shell initialized" },
               { time: "14:20", type: "MSN", text: "MSN-2025-0011 created" },
               { time: "13:45", type: "SEC", text: "Identity extraction complete" }
             ].map((evt, i) => (
               <div key={i} className="flex gap-3 text-[10px] font-mono border-b border-[#1a1a1a] pb-2 last:border-0">
                 <span className="text-[#555]">{evt.time}</span>
                 <span className="text-[#00f0ff]">{evt.type}</span>
                 <span className="text-[#777] flex-1">{evt.text}</span>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}


