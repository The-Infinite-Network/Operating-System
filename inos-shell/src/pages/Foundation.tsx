import { useState, useEffect } from "react";
import { api } from "../api";
import { Room, Guild } from "../types";
import { mockApps } from "../data/mock/apps";
import { INOS_EPOCH0_MAP } from "../data/spine_map";

const foundationSchema = [
  {
    name: "POLE",
    summary: "Proof of Living Event for time-based tracking.",
    fields: [
      ["id", "UUID", "Primary key"],
      ["timestamp_start", "datetime", "Start timestamp"],
      ["duration_minutes", "number", "Minutes logged"],
      ["time_mode", "text(enum)", "Deep Work, Stewardship, Recovery"],
      ["entity_context", "text", "Entity or Global context"],
      ["verification_status", "text(enum)", "Unverified, SelfVerified"],
    ],
  },
  {
    name: "Mission",
    summary: "Unit of work inside the shared mission spine.",
    fields: [
      ["id", "UUID", "Primary key"],
      ["title", "text", "Mission title"],
      ["status", "text(enum)", "Active, Planning, Done"],
      ["priority", "text(enum)", "Critical, High, Medium, Low"],
      ["entity", "text", "Entity context"],
    ],
  },
  {
    name: "TimelineEntry",
    summary: "Unified event log across the system.",
    fields: [
      ["id", "UUID", "Primary key"],
      ["occurred_at", "datetime", "Event timestamp"],
      ["type", "text(enum)", "Event, Decision, Note"],
      ["title", "text", "Summary title"],
      ["entity", "text", "Entity context"],
      ["mission", "text", "Optional mission link"],
    ],
  },
  {
    name: "Guild",
    summary: "Interest-based standards and verification org.",
    fields: [
      ["id", "UUID", "Primary key"],
      ["name", "text", "Guild name"],
      ["category", "text", "Culinary, Systems, Creative"],
      ["status", "text(enum)", "Open, Invite"],
      ["joinRule", "text", "Entry rule"],
    ],
  },
];

const coreApps = mockApps.filter((app) =>
  ["IE-HQ Spine", "Agent Forge"].includes(app.name)
);

export default function Foundation() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegistry = async () => {
      try {
        const [r, g, e] = await Promise.all([
          api.listRooms(),
          api.listGuilds(),
          api.listEntities()
        ]);
        setRooms(r.rooms);
        setGuilds(g.guilds);
        setEntities(e.entities);
      } catch (err) {
        console.error("Failed to load registry:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRegistry();
  }, []);

  return (
    <div className="spine-page">
      <div className="foundation-layout pb-8">

        {/* Building Map: Layers (The Spine) */}
        <section className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-4">
            Network Spine (Building Map Epoch 0)
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6">
            <div className="spine-stack">
              {INOS_EPOCH0_MAP.layers.map((layer) => (
                <div key={layer.id} className="spine-layer group">
                  <div className="layer-id">{layer.id}</div>
                  <div className="layer-info">
                    <div className="layer-name">{layer.name}</div>
                    <div className="layer-dbs">
                      {(layer.canonical_dbs || layer.components || []).map(item => (
                        <span key={item} className="layer-db-pill">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="inos-card p-3 bg-inos-accent/5 border-inos-accent/20">
                <div className="text-[10px] uppercase font-bold text-inos-accent">Connectivity</div>
                <div className="text-xs mt-1 text-inos-text">
                  The Spine is the vertical integration of the network's L0-L6 layers.
                </div>
              </div>
              <div className="inos-card p-3 border-white/5">
                <div className="text-[10px] uppercase font-bold text-inos-muted">Principles</div>
                <ul className="text-[10px] mt-2 space-y-1 text-inos-muted">
                  <li>• Extend-only architecture</li>
                  <li>• Single source of truth</li>
                  <li>• Canonical timelines</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Pods section */}
        <section className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-4">
            Operating Pods (HQ Entities)
          </div>
          <div className="pod-grid">
            {INOS_EPOCH0_MAP.pods.map(pod => (
              <div key={pod.id} className="pod-card">
                <div className="flex items-center justify-between">
                  <div className="pod-id">{pod.id}</div>
                  <div className="text-[9px] opacity-40 font-mono">{pod.hq}</div>
                </div>
                <div className="pod-role">{pod.role}</div>
                <div className="pod-desc">{pod.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Schema section */}
        <section className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-4">
            Data Schema & Interfaces
          </div>
          <div className="foundation-grid">
            {foundationSchema.map((entity) => (
              <div key={entity.name} className="inos-card p-3">
                <div className="text-sm font-semibold">{entity.name}</div>
                <div className="text-[11px] text-inos-muted mb-2">
                  {entity.summary}
                </div>
                <table className="inos-switchboard-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entity.fields.slice(0, 4).map(([field, type]) => (
                      <tr key={field}>
                        <td>{field}</td>
                        <td className="text-[10px] opacity-70">{type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        {/* Live Registry section */}
        <section className="card p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted mb-4">
            Network Registry (Live)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rooms */}
            <div className="inos-card p-3">
              <div className="text-sm font-bold flex items-center justify-between">
                Rooms <span className="text-[10px] text-inos-muted">{rooms.length}</span>
              </div>
              <div className="mt-2 space-y-1">
                {loading ? <div className="text-[10px] animate-pulse">Syncing...</div> :
                  rooms.slice(0, 5).map(r => (
                    <div key={r.code} className="text-[11px] flex justify-between">
                      <span>{r.name}</span>
                      <span className="opacity-50 font-mono">{r.code}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Guilds */}
            <div className="inos-card p-3">
              <div className="text-sm font-bold flex items-center justify-between">
                Guilds <span className="text-[10px] text-inos-muted">{guilds.length}</span>
              </div>
              <div className="mt-2 space-y-1">
                {loading ? <div className="text-[10px] animate-pulse">Syncing...</div> :
                  guilds.slice(0, 5).map(g => (
                    <div key={g.code} className="text-[11px] flex justify-between">
                      <span>{g.name}</span>
                      <span className="opacity-50 font-mono">{g.code}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Entities */}
            <div className="inos-card p-3">
              <div className="text-sm font-bold flex items-center justify-between">
                Entities <span className="text-[10px] text-inos-muted">{entities.length}</span>
              </div>
              <div className="mt-2 space-y-1">
                {loading ? <div className="text-[10px] animate-pulse">Syncing...</div> :
                  entities.slice(0, 5).map(e => (
                    <div key={e.id} className="text-[11px] flex justify-between">
                      <span>{e.name || e.title}</span>
                      <span className="inos-pill text-[9px]">Live</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
