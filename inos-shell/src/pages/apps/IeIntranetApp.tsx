import { Building2, Compass, ExternalLink, Globe2, Link2, Network, ShieldCheck, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import IeHqSpine from "../IeHqSpine";

const ventures = [
  {
    id: "ffc",
    name: "Fulcrum Fortress Consulting",
    status: "Active",
    description: "Consulting engine, Fulcrum methodology surface, and internal proof layer.",
    route: "/apps/ffc-intranet",
  },
  {
    id: "cngi",
    name: "Crumb & Get It Bakery",
    status: "Active",
    description: "Bakery operations surface, menu cadence, pickup rhythm, and venture ops.",
    route: "/apps/cngi-intranet",
  },
  {
    id: "ggp",
    name: "Grumpy Goat Pizza",
    status: "Active Candidate",
    description: "Internal venture surface for the concept lane. Public site remains placeholder-only.",
    route: "/apps/ggp-intranet",
  },
];

const controlCards = [
  {
    title: "Holdco Command Surface",
    detail: "Owner-level runtime for entity context, venture posture, and control surfaces.",
    icon: Building2,
  },
  {
    title: "Shared System Boundaries",
    detail: "TEAM AI source, INOS runtime, VAP doctrine, and Infinite Earth business canon stay distinct.",
    icon: ShieldCheck,
  },
  {
    title: "Single Shell Runtime",
    detail: "This intranet now lives inside INOS Shell rather than as a separate localhost app.",
    icon: Workflow,
  },
];

export default function IeIntranetApp() {
  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-xs uppercase tracking-[0.22em] text-inos-muted">
              Infinite Earth · Holdco Runtime
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
              IE Intranet
            </h1>
            <p className="mt-2 text-sm leading-6 text-inos-muted">
              Native INOS shell surface for the Infinite Earth holdco spine, venture routing,
              entity visibility, and internal operating context. This replaces the old separate
              venture-intranet localhost path for IE.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[440px]">
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">
                UI Origin
              </div>
              <div className="mt-1 text-xs font-semibold text-cyan-100">localhost:5173</div>
            </div>
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/80">
                MCP Path
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-100">/mcp</div>
            </div>
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/80">
                Mode
              </div>
              <div className="mt-1 text-xs font-semibold text-amber-100">Single-shell</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {controlCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="inos-card p-4">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold text-white">{card.title}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-inos-muted">{card.detail}</p>
                </article>
              );
            })}
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                  Holdco Spine
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  IE HQ native surface
                </h2>
              </div>
              <Link
                className="btn-secondary"
                to="/apps/ie-hq-spine"
              >
                Open full spine
              </Link>
            </div>
            <div className="mt-4">
              <IeHqSpine />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Network className="h-4 w-4 text-cyan-200" />
              Venture routes
            </div>
            <div className="mt-3 space-y-3">
              {ventures.map((venture) => (
                <div key={venture.id} className="rounded-lg border border-inos-border/70 bg-[#0f172a] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{venture.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200/70">
                        {venture.status}
                      </div>
                    </div>
                    <Link className="text-xs text-cyan-200 hover:text-white" to={venture.route}>
                      Open
                    </Link>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-inos-muted">{venture.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Compass className="h-4 w-4 text-cyan-200" />
              Runtime links
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <Link className="flex items-center justify-between rounded-lg border border-inos-border/70 bg-[#0f172a] px-3 py-2 text-inos-muted hover:text-white" to="/apps">
                <span>INOS app directory</span>
                <Link2 className="h-3.5 w-3.5" />
              </Link>
              <Link className="flex items-center justify-between rounded-lg border border-inos-border/70 bg-[#0f172a] px-3 py-2 text-inos-muted hover:text-white" to="/front-door">
                <span>Front door</span>
                <Link2 className="h-3.5 w-3.5" />
              </Link>
              <a
                className="flex items-center justify-between rounded-lg border border-inos-border/70 bg-[#0f172a] px-3 py-2 text-inos-muted hover:text-white"
                href="https://infinteearth.net/"
                rel="noreferrer"
                target="_blank"
              >
                <span>Public holdco site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Globe2 className="h-4 w-4 text-cyan-200" />
              Consolidation note
            </div>
            <p className="mt-2 text-xs leading-5 text-inos-muted">
              The browser-visible operating surface is now intended to run from one shell on
              <span className="mx-1 font-mono text-cyan-100">localhost:5173</span>.
              MCP stays behind the shell as a backend integration surface.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
