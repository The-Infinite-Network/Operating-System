import { INOS_EPOCH0_MAP } from "../data/spine_map";

const spineCards = [
  { label: "Entities", value: "1", detail: "LegalEntity records", accent: "text-cyan-300" },
  { label: "Trusts", value: "0", detail: "TrustVehicle records", accent: "text-emerald-300" },
  { label: "Assets", value: "0", detail: "Registered", accent: "text-amber-300" },
  { label: "Agreements", value: "0", detail: "Governing docs", accent: "text-fuchsia-300" },
  { label: "Bank", value: "0", detail: "Accounts", accent: "text-sky-300" },
  { label: "Config", value: "E0", detail: "Epoch 0 / USD", accent: "text-teal-300" },
];

export default function IeHqSpine() {
  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          IE-HQ Spine
        </div>
        <div className="text-lg font-semibold mt-2">Holdco & Entity Spine</div>
        <div className="text-[12px] text-inos-muted mt-1">
          Holdco structure reference for entities, trusts, assets, agreements, bank surfaces, and venture mapping.
        </div>
        <div className="mt-2 text-[11px] text-amber-300">
          Static reference scaffold (sample) — this surface is not yet wired to a live entity/holdco datasource. Counts, directory rows, and detail below are seeded examples, not live records.
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Spine Snapshot · Sample (not live counts)</div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {spineCards.map((card) => (
            <div key={card.label} className="inos-card p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-inos-muted">{card.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${card.accent}`}>{card.value}</div>
              <div className="mt-1 text-[11px] text-inos-muted">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1.2fr_420px]">
          <div className="space-y-3">
            {[
              "Entity Map",
              "Trust & Vehicle Map",
              "Asset Registry",
              "Agreements & Docs",
              "Bank & Accounts",
              "Ventures",
            ].map((item, index) => (
              <div key={item} className={`rounded-2xl border px-4 py-3 ${index === 0 ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-[#22304a] bg-[#0a1222] text-[#b8c7db]"}`}>
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[#22304a] bg-[#0a1222] p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Entity Directory</div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Sample</span>
              </div>
              <div className="mt-2 text-sm text-inos-muted">
                LegalEntity spine for HoldCos, OpCos, SPVs, trusts, and related vehicles. Row below is a seeded example, not a live LegalEntity query.
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#22304a]">
                <table className="inos-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Legal Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Jurisdiction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>IE_HOLDCO</td>
                      <td>Infinite Earth Holdings, LLC</td>
                      <td>HoldCo</td>
                      <td className="text-emerald-300">Active</td>
                      <td>WY</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-[#22304a] bg-[#0a1222] p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-violet-200/80">Venture Map</div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Sample</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#22304a] bg-[#08101d] p-4">
                  <div className="text-sm font-semibold text-white">Crumb n Get It Bakery</div>
                  <div className="mt-2 text-xs text-inos-muted">Freedom-baked goods, Oklahoma proving ground.</div>
                </div>
                <div className="rounded-2xl border border-[#22304a] bg-[#08101d] p-4">
                  <div className="text-sm font-semibold text-white">Fulcrum Fortress Consulting</div>
                  <div className="mt-2 text-xs text-inos-muted">Systems consulting engine and internal proof layer.</div>
                </div>
                <div className="rounded-2xl border border-[#22304a] bg-[#08101d] p-4 md:col-span-2">
                  <div className="text-sm font-semibold text-white">Grumpy Goat Pizza</div>
                  <div className="mt-2 text-xs text-inos-muted">Internal venture lane and operating sandbox surface.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[#22304a] bg-[#0a1222] p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Entity Detail</div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Sample</span>
              </div>
              <div className="mt-3 text-xl font-semibold text-white">Infinite Earth Holdings, LLC</div>
              <div className="mt-1 text-sm text-inos-muted">IE_HOLDCO · HoldCo · WY</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[#6f86a8] uppercase tracking-[0.18em]">Code</div>
                  <div className="mt-1 text-white">IE_HOLDCO</div>
                </div>
                <div>
                  <div className="text-[#6f86a8] uppercase tracking-[0.18em]">Jurisdiction</div>
                  <div className="mt-1 text-white">WY</div>
                </div>
                <div>
                  <div className="text-[#6f86a8] uppercase tracking-[0.18em]">Operating State</div>
                  <div className="mt-1 text-white">WY</div>
                </div>
                <div>
                  <div className="text-[#6f86a8] uppercase tracking-[0.18em]">Epoch</div>
                  <div className="mt-1 text-white">Epoch 0</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#22304a] bg-[#0a1222] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Spine Layers</div>
              <div className="mt-3 space-y-3">
                {INOS_EPOCH0_MAP.layers.slice(0, 4).map((layer) => (
                  <div key={layer.id} className="rounded-2xl border border-[#22304a] bg-[#08101d] p-3">
                    <div className="text-sm font-semibold text-white">
                      {layer.id} · {layer.name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(layer.components || layer.canonical_dbs || []).slice(0, 3).map((item) => (
                        <span key={item} className="inos-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
