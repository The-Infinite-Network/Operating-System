import { INOS_EPOCH0_MAP } from "../data/spine_map";

export default function IeHqSpine() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          IE-HQ Spine
        </div>
        <div className="text-lg font-semibold mt-2">Entity Map + Ownership Contexts</div>
        <div className="text-[12px] text-inos-muted mt-1">
          Canonical IE-HQ spine surface. Entities remain the context selector; guilds are separate.
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Network Spine Layers
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {INOS_EPOCH0_MAP.layers.map((layer) => (
            <div key={layer.id} className="inos-card p-3">
              <div className="text-sm font-semibold">
                {layer.id} · {layer.name}
              </div>
              <ul className="agent-principles mt-2">
                {(layer.components || layer.canonical_dbs || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Pods + HQ Nodes
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {INOS_EPOCH0_MAP.pods.map((pod) => (
            <div key={pod.id} className="inos-card p-3">
              <div className="text-sm font-semibold">{pod.id}</div>
              <div className="text-[11px] text-inos-muted">{pod.role}</div>
              <div className="text-[11px] text-inos-muted mt-1">
                {pod.hq} · {pod.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
