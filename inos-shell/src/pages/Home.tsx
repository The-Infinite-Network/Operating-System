import { useNavigate } from "react-router-dom";
import {
  Activity,
  Database,
  Globe,
  Shield,
  Users,
} from "lucide-react";

const STATS = [
  { label: "Active Trains", val: "1", meta: "Max 5 · Epoch 0", color: "text-[#00f0ff]" },
  { label: "Humans", val: "1", meta: "Active agents", color: "text-[#00ff9d]" },
  { label: "Timeline Events", val: "142", meta: "Total logged", color: "text-white" },
  { label: "Guilds Online", val: "4", meta: "Forums active", color: "text-[#c9a227]" },
];

const QUICK_LINKS = [
  { route: "/foundation", title: "Foundation", sub: "Schema · Epoch 0", icon: Database },
  { route: "/guilds", title: "Guilds", sub: "Network Forums", icon: Globe },
  { route: "/agents", title: "TEAM AI", sub: "Roster · Roles", icon: Users },
  { route: "/operations/constraints", title: "Governance", sub: "Rules · Commands", icon: Shield },
  { route: "/logs", title: "Logs", sub: "Action stream", icon: Activity },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="card p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase">
              Workspace · Infinite Network OS // Epoch 0
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Root Node · Infinite Network & Timeline</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-inos-muted">
              Epoch 0 operating shell for humans, agents, guilds, missions, PoLE, and the shared
              Timeline. This surface carries the current runtime spine without splitting into
              separate localhost apps.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Humans · Agents · Guilds · Missions", "PoLE -> Time Credits", "Sovereign Snapshots", "Timeline Layer"].map((chip) => (
                <span key={chip} className="inos-pill">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="grid min-w-[260px] grid-cols-1 gap-3 md:grid-cols-3 xl:w-[420px]">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/80">Time-native</div>
              <div className="mt-1 text-xs font-semibold text-emerald-100">Epoch spine stable</div>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/80">Network-first</div>
              <div className="mt-1 text-xs font-semibold text-amber-100">Shared rooms online</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">Control Layer</div>
              <div className="mt-1 text-xs font-semibold text-cyan-100">Single-shell runtime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555]">
              Lead Console
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white">At-a-glance operational frame</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/room/me")}
              className="btn-secondary"
            >
              Return to My Room
            </button>
            <button
              onClick={() => navigate("/provisioning?mode=edit")}
              className="btn-secondary"
            >
              Change Environment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="inos-card relative overflow-hidden p-4"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all" />
              <div className="text-[10px] font-mono text-[#555] mb-2 uppercase">{s.label}</div>
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-indigo-400 mt-1 uppercase tracking-tighter">
                {s.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.route}
            onClick={() => navigate(link.route)}
            className="inos-card flex flex-col gap-2 p-4 text-left transition-all group hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/5"
          >
            <link.icon size={16} className="text-[#555] group-hover:text-[#00f0ff]" />
            <div>
              <div className="text-xs font-bold uppercase tracking-tight">{link.title}</div>
              <div className="text-[10px] text-[#555] mt-0.5">{link.sub}</div>
            </div>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <section className="card p-5">
          <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase mb-4">
            Current SYNC
          </div>
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

        <section className="card p-5 flex flex-col">
          <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase mb-4">
            Activity Stream
          </div>
          <div className="flex-1 space-y-4 max-h-[120px] overflow-y-auto pr-2 scrollbar-hide">
            {[
              { time: "14:22", type: "SYS", text: "INOS_E0 shell initialized" },
              { time: "14:20", type: "MSN", text: "MSN-2025-0011 created" },
              { time: "13:45", type: "SEC", text: "Identity extraction complete" },
            ].map((evt, i) => (
              <div
                key={i}
                className="flex gap-3 text-[10px] font-mono border-b border-[#1a1a1a] pb-2 last:border-0"
              >
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
