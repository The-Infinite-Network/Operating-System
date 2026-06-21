import { NavLink } from "react-router-dom";
import { ShellEntity, ShellRoom } from "./shellContext";

const ACTIVE_TRAINS = [
  {
    code: "T1 · Protocol Setup",
    owner: "ARC",
    mode: "SWARM",
    status: "Active",
  },
  {
    code: "T2 · My Room",
    owner: "TWIN",
    mode: "LOCAL",
    status: "Parked",
  },
];

type LeftRailProps = {
  entity: ShellEntity;
  room: ShellRoom;
};

export default function LeftRail({ entity, room }: LeftRailProps) {
  const activeCount = ACTIVE_TRAINS.filter((train) => train.status === "Active").length;
  const activePercent = `${Math.max(20, Math.min(100, activeCount * 20))}%`;

  return (
    <aside className="switchyard-rail" aria-label="Switchyard">
      <div className="sy-header">
        <div className="sy-title-row">
          <span className="sy-title">Switchyard</span>
          <span className="sy-count" title="sample data">{activeCount}/5</span>
        </div>
        <div className="sy-progress">
          <div className="sy-progress-fill" style={{ width: activePercent }} />
        </div>
      </div>

      <div className="rail-section">
        <div className="rail-title">Current Scope</div>
        <div className="rounded-2xl border border-[#22304a] bg-[#0a1222] p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6f86a8]">
            Entity
          </div>
          <div className="mt-1 text-base font-semibold text-white">{entity}</div>
          <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#6f86a8]">
            Room
          </div>
          <div className="mt-1 text-sm font-semibold text-[#b8c7db]">{room}</div>
        </div>
      </div>

      <div className="rail-section">
        <div className="sy-section-label flex items-center justify-between">
          <span>Active Trains</span>
          <span className="text-[8px] font-mono text-[#555] border border-[#1a1a1a] px-1.5 py-0.5 rounded-sm">sample</span>
        </div>
        <div className="sy-train-list">
          {ACTIVE_TRAINS.map((train) => (
            <div
              key={train.code}
              className={`sy-train-card ${train.status === "Active" ? "active" : ""}`}
            >
              <div className="sy-train-top">
                <span className="sy-train-code">{train.code}</span>
                <div className="sy-train-status">
                  <span className={`sy-status-dot sy-status-${train.status.replace(/\s/g, "")}`} />
                </div>
              </div>
              <div className="sy-train-bottom">
                <span className="sy-mini-meta">{train.owner}</span>
                <span className="sy-owner-tag">{train.mode}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sy-controls">
          <NavLink to="/operations/war" className="btn-primary sy-start-btn">
            Start Train
          </NavLink>
        </div>
      </div>

      <div className="rail-section">
        <div className="rail-title">Core Apps</div>
        <nav className="rail-nav">
          <NavLink to="/home" className={({ isActive }) => `rail-link ${isActive ? "rail-link-active" : ""}`}>
            Lead Console
          </NavLink>
          <NavLink to="/room/me" className={({ isActive }) => `rail-link ${isActive ? "rail-link-active" : ""}`}>
            My Room
          </NavLink>
          <NavLink to="/foundation" className={({ isActive }) => `rail-link ${isActive ? "rail-link-active" : ""}`}>
            Foundation
          </NavLink>
          <NavLink to="/guilds" className={({ isActive }) => `rail-link ${isActive ? "rail-link-active" : ""}`}>
            Guild Room
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => `rail-link ${isActive ? "rail-link-active" : ""}`}>
            Timeline Viewer
          </NavLink>
        </nav>
      </div>

      <div className="rail-section">
        <div className="rail-title">Runtime Surfaces</div>
        <NavLink
          to="/apps/ie-intranet"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          IE Intranet
        </NavLink>
        <NavLink
          to="/apps/ie-hq-spine"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          IE HoldCo Spine
        </NavLink>
        <NavLink
          to="/apps/fulcrum"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          FULCRUM
        </NavLink>
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Small Brain
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Tasks
        </NavLink>
        <NavLink
          to="/unschool"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Unschool
        </NavLink>
        <NavLink
          to="/apps"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          App Directory
        </NavLink>
      </div>

      <div className="rail-footer">
        <div className="rail-footer-label">Epoch Spine</div>
        <div className="rail-footer-value">INOS_E0 · Extend-only</div>
      </div>
    </aside>
  );
}
