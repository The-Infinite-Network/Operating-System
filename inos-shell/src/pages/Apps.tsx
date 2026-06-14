import { Link } from "react-router-dom";
import { mockApps } from "../data/mock/apps";

export default function Apps() {
  const activeApps = mockApps.filter((app) =>
    ["IE-HQ Spine", "Agent Forge", "Timeline Viewer"].includes(app.name)
  );
  const plannedApps = mockApps.filter(
    (app) => !["IE-HQ Spine", "Agent Forge", "Timeline Viewer"].includes(app.name)
  );

  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Spine Surfaces
        </div>
        <div className="apps-grid mt-3">
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">INOS Front Door</div>
              <span className="inos-pill text-[10px]">Review</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Tester access, company routing, and venture intranet entry from theinfinitenetwork.com.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/front-door">
                Open Front Door
              </Link>
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Unschool Ops</div>
              <span className="inos-pill text-[10px]">Local-first</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Offline learning ops: baseline, daily blocks, proof logs, weekly focus.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/unschool">
                Open Surface
              </Link>
            </div>
          </div>
        </div>
        <div className="apps-grid">
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">IE Intranet</div>
              <span className="inos-pill text-[10px]">Live</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Holding co employee intranet and internal comms surface.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/ie-intranet">
                Open Intranet
              </Link>
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">FFC / Fulcrum System</div>
              <span className="inos-pill text-[10px]">Live</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Fulcrum mastery system, FFC operating surface, and gated work-product proof.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/ffc-intranet">
                Open Intranet
              </Link>
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">CNGI Intranet</div>
              <span className="inos-pill text-[10px]">Live</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              CNGI employee intranet and venture ops surface.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/cngi-intranet">
                Open Intranet
              </Link>
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">GGP Intranet</div>
              <span className="inos-pill text-[10px]">Live</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Grumpy Goat Pizza intranet and venture ops surface.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/ggp-intranet">
                Open Intranet
              </Link>
            </div>
          </div>
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">FULCRUM</div>
              <span className="inos-pill text-[10px]">Candidate</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              TEAM AI Fulcrum capability surface for coordinate diagnosis, intake review, and candidate routing.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/fulcrum">
                Open Surface
              </Link>
            </div>
          </div>

          {/* ECHO Sign-In */}
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">ECHO Sign-In</div>
              <span className="inos-pill text-[10px] bg-cyan-900/20 text-cyan-300 border-cyan-500/30">Prototype</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Homeschool co-op anchor check-in console. QR wallet pass scanning, on-site roster, offline-aware.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/echo-signin">
                Open Console
              </Link>
            </div>
          </div>

          {/* Drive Canon App */}
          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Drive Canon</div>
              <span className="inos-pill text-[10px] bg-blue-900/20 text-blue-300 border-blue-500/30">MCP Live</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Official file registry and artifact browsing via MCP.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/drive">
                Open App
              </Link>
            </div>
          </div>

          <div className="inos-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Database Sync</div>
              <span className="inos-pill text-[10px]">MCP</span>
            </div>
            <div className="text-[11px] text-inos-muted mt-1">
              Configure MCP base URL, health checks, and tool visibility.
            </div>
            <div className="apps-actions">
              <Link className="btn-secondary" to="/apps/db-sync">
                Open Surface
              </Link>
            </div>
          </div>

          {activeApps.map((app) => {
            const link =
              app.name === "IE-HQ Spine"
                ? "/apps/ie-hq-spine"
                : app.name === "Timeline Viewer"
                ? "/apps/timeline-viewer"
                : "/team-ai-hq";
            const label =
              app.name === "IE-HQ Spine"
                ? "Open Spine"
                : app.name === "Timeline Viewer"
                ? "Open Timeline"
                : "Open Forge";
            return (
              <div key={app.id} className="inos-card p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{app.name}</div>
                  <span className="inos-pill text-[10px]">Live</span>
                </div>
                <div className="text-[11px] text-inos-muted mt-1">
                  {app.description}
                </div>
                <div className="text-[10px] text-inos-muted mt-2">
                  Owner: {app.owner}
                </div>
                <div className="apps-actions mt-auto pt-2">
                  <Link className="btn-secondary w-full" to={link}>
                    {label}
                  </Link>
                </div>
              </div>
            );
          })}

          {plannedApps.map((app) => (
            <div key={app.id} className="inos-card p-3 opacity-60">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{app.name}</div>
                <span className="inos-pill text-[10px]">{app.status}</span>
              </div>
              <div className="text-[11px] text-inos-muted mt-1">
                {app.description}
              </div>
              <div className="text-[10px] text-inos-muted mt-2">
                Owner: {app.owner}
              </div>
              <div className="apps-actions mt-auto pt-2">
                <button
                  className="btn-secondary w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  Planned
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
