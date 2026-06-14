import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

const ENTITY_OPTIONS = ["Global", "IE", "FFC", "CNGI", "GGP"];
const ROOM_OPTIONS = [
  "Control Tower",
  "Ops & Training",
  "Governance Room",
  "Command Center",
];

const ENTITY_STORAGE_KEY = "inos_entity_context_v1";
const ROOM_STORAGE_KEY = "inos_room_context_v1";

export default function LeftRail() {
  const [entity, setEntity] = useState(() => {
    if (typeof window === "undefined") return ENTITY_OPTIONS[0];
    return window.localStorage.getItem(ENTITY_STORAGE_KEY) || ENTITY_OPTIONS[0];
  });
  const [room, setRoom] = useState(() => {
    if (typeof window === "undefined") return ROOM_OPTIONS[0];
    return window.localStorage.getItem(ROOM_STORAGE_KEY) || ROOM_OPTIONS[0];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ENTITY_STORAGE_KEY, entity);
    window.dispatchEvent(
      new CustomEvent("inos-context-change", {
        detail: { entity, room },
      })
    );
  }, [entity]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROOM_STORAGE_KEY, room);
    window.dispatchEvent(
      new CustomEvent("inos-context-change", {
        detail: { entity, room },
      })
    );
  }, [room]);

  return (
    <aside className="spine-rail" aria-label="Left Rail">
      <div className="rail-section">
        <div className="rail-title">Context</div>
        <label className="rail-label" htmlFor="rail-entity">
          Entity
        </label>
        <select
          id="rail-entity"
          className="rail-select"
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
        >
          {ENTITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label className="rail-label" htmlFor="rail-room">
          Room
        </label>
        <select
          id="rail-room"
          className="rail-select"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
        >
          {ROOM_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rail-section">
        <div className="rail-title">Rooms</div>
        <nav className="rail-nav">
          <NavLink
            to="/front-door"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Intake Hub
          </NavLink>
          <NavLink
            to="/operations/war"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Operations
          </NavLink>
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Second Brain
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
            to="/room/me"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            My Room
          </NavLink>
          <NavLink
            to="/foundation"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Entities Map
          </NavLink>
          <NavLink
            to="/core"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            CORE
          </NavLink>
          <NavLink
            to="/agents"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Agent Roster
          </NavLink>
          <NavLink
            to="/guilds"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Guild Directory
          </NavLink>
          <NavLink
            to="/apps"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Apps
          </NavLink>
          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `rail-link ${isActive ? "rail-link-active" : ""}`
            }
          >
            Global Timeline
          </NavLink>
        </nav>
      </div>

      <div className="rail-section">
        <div className="rail-title">Apps</div>
        <NavLink
          to="/unschool"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Unschool Ops
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
          to="/apps/ie-intranet"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          IE Intranet
        </NavLink>
        <NavLink
          to="/apps/ffc-intranet"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          FFC / Fulcrum
        </NavLink>
        <NavLink
          to="/apps/cngi-intranet"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          CNGI Intranet
        </NavLink>
        <NavLink
          to="/apps/ggp-intranet"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          GGP Intranet
        </NavLink>
        <NavLink
          to="/apps/timeline-viewer"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Timeline Viewer
        </NavLink>
        <NavLink
          to="/apps/db-sync"
          className={({ isActive }) =>
            `rail-link ${isActive ? "rail-link-active" : ""}`
          }
        >
          Database Sync
        </NavLink>
      </div>

      <div className="rail-footer">
        <div className="rail-footer-label">Epoch Spine</div>
        <div className="rail-footer-value">INOS_E0 - Locked</div>
      </div>
    </aside>
  );
}
