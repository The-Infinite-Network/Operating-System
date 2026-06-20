import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Database,
  Globe,
  Shield,
  Users,
} from "lucide-react";
import { api } from "../api";
import { Mission, TimelineEvent } from "../types";

// SAMPLE: no live source wired yet for these aggregate counters (Packet 8).
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

const ACTIVE_STATUSES = ["In Flight", "Active", "Planning"];

function SampleTag() {
  return (
    <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-amber-300/70 border border-amber-300/30 bg-amber-300/5 px-1.5 py-0.5 rounded-sm">
      Sample
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [timeline, missions] = await Promise.all([
          api.timeline.queryByMission("global", 5),
          api.missions.list(50),
        ]);
        if (cancelled) return;
        setEvents(timeline.events);
        const active =
          missions.missions.find((m) => ACTIVE_STATUSES.includes(m.status)) ||
          missions.missions.find((m) => m.status !== "Done" && m.status !== "Parked") ||
          null;
        setActiveMission(active);
      } catch (e) {
        console.error("Home load failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            <div className="flex items-center gap-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#555]">
                Lead Console
              </div>
              <SampleTag />
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
              Change Workspace Layout
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
              <span className="font-mono text-[#00f0ff]">
                {loading
                  ? "…"
                  : activeMission
                    ? activeMission.mission_code || activeMission.title
                    : "No active mission"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-2">
              <span className="flex items-center gap-2 text-[#555]">SYNC_KEY <SampleTag /></span>
              <span className="font-mono text-white">E0-SWARM-001</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-2">
              <span className="flex items-center gap-2 text-[#555]">POD AUTHORITY <SampleTag /></span>
              <span className="font-mono text-[#c9a227]">CORE COMMAND</span>
            </div>
          </div>
        </section>

        <section className="card p-5 flex flex-col">
          <div className="text-[9px] font-mono tracking-[0.2em] text-[#555] uppercase mb-4">
            Activity Stream
          </div>
          <div className="flex-1 space-y-4 max-h-[120px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="text-[10px] font-mono text-[#555] py-4 text-center uppercase">Syncing timeline…</div>
            ) : events.length === 0 ? (
              <div className="text-[10px] font-mono text-[#555] py-4 text-center uppercase">No timeline events</div>
            ) : (
              events.map((evt, i) => (
                <div
                  key={evt.id || i}
                  className="flex gap-3 text-[10px] font-mono border-b border-[#1a1a1a] pb-2 last:border-0"
                >
                  <span className="text-[#555]">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[#00f0ff]">{evt.event_type || "LOG"}</span>
                  <span className="text-[#777] flex-1 truncate">{evt.title || evt.summary}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
