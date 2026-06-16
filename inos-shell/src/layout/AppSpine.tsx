import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Copy, X } from "lucide-react";
import TopHeader from "./TopHeader";
import LeftRail from "./LeftRail";
import {
  ENTITY_OPTIONS,
  ROOM_OPTIONS,
  ShellEntity,
  ShellRoom,
  persistShellContext,
  readStoredShellContext,
} from "./shellContext";

const RUNTIME_ENV_LABEL = "ENV: LOCAL";
const RUNTIME_SURFACE_LABEL = "Clean Runtime";
const RUNTIME_PRIMARY_URL = "localhost:5173";

const routeMeta: Array<{
  match: (pathname: string) => boolean;
  root: string;
  mission: string;
  syncKey: string;
  runMode: string;
  acceptance: string;
}> = [
  {
    match: (pathname) => pathname.startsWith("/room/"),
    root: "ROOM // HUMAN // SESSION: ACTIVE",
    mission: "MSN-2026-0001 - Personal Operating Loop",
    syncKey: "E0-UZAMYD",
    runMode: "DEEP",
    acceptance: "0/0",
  },
  {
    match: (pathname) => pathname.startsWith("/foundation"),
    root: "ROOT // INOS_E0 // FOUNDATION: LOCKED",
    mission: "MSN-2025-0011 - Register 9 Standalone Agents",
    syncKey: "E0-SWARM-001",
    runMode: "FAST",
    acceptance: "0/9",
  },
  {
    match: (pathname) => pathname.startsWith("/apps/ie"),
    root: "ROOT // IE_HOLDCO // SESSION: ACTIVE",
    mission: "MSN-2026-0017 - IE Holdco Spine",
    syncKey: "IE-E0-V1O",
    runMode: "DEEP",
    acceptance: "0/4",
  },
  {
    match: () => true,
    root: "ROOT // INOS_E0 // SESSION: ACTIVE",
    mission: "MSN-2025-0011 - Register 9 Standalone Agents",
    syncKey: "E0-3V4C9P",
    runMode: "DEEP",
    acceptance: "0/0",
  },
];

function mapRoomToRoute(room: ShellRoom) {
  if (room === "My Room") return "/room/me";
  if (room === "Control Tower") return "/home";
  if (room === "Governance Room") return "/operations/constraints";
  if (room === "Command Center") return "/operations/core";
  return "/foundation";
}

function inferRoomFromPath(pathname: string): ShellRoom {
  if (pathname.startsWith("/room/")) return "My Room";
  if (pathname.startsWith("/operations/constraints")) return "Governance Room";
  if (pathname.startsWith("/operations/core")) return "Command Center";
  if (
    pathname.startsWith("/foundation") ||
    pathname.startsWith("/guilds") ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/apps") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/unschool") ||
    pathname.startsWith("/home")
  ) {
    return "Control Tower";
  }
  return "Control Tower";
}

export default function AppSpine() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedContext = useMemo(() => readStoredShellContext(), []);
  const [entity, setEntity] = useState<ShellEntity>(storedContext.entity);
  const [lastEntityScope, setLastEntityScope] = useState<ShellEntity>(
    storedContext.entity === "Global" ? "IE" : storedContext.entity,
  );
  const [room, setRoom] = useState<ShellRoom>(storedContext.room);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const meta = routeMeta.find((candidate) => candidate.match(location.pathname)) ?? routeMeta[routeMeta.length - 1];

  useEffect(() => {
    persistShellContext(entity, room);
  }, [entity, room]);

  useEffect(() => {
    if (entity !== "Global") {
      setLastEntityScope(entity);
    }
  }, [entity]);

  useEffect(() => {
    const inferredRoom = inferRoomFromPath(location.pathname);
    if (room !== inferredRoom) {
      setRoom(inferredRoom);
    }
  }, [location.pathname, room]);

  const handleRoomChange = (nextRoom: ShellRoom) => {
    setRoom(nextRoom);
    navigate(mapRoomToRoute(nextRoom));
  };

  const handleScopeChange = (scope: "global" | "entity" | "personal") => {
    if (scope === "global") {
      setEntity("Global");
      if (room !== "Control Tower") {
        handleRoomChange("Control Tower");
      }
      return;
    }

    if (scope === "entity") {
      const nextEntity = entity === "Global" ? lastEntityScope : entity;
      setEntity(nextEntity);
      if (room === "My Room") {
        handleRoomChange("Control Tower");
      } else {
        navigate("/apps/ie-intranet");
      }
      return;
    }

    handleRoomChange("My Room");
  };

  const handleCopySyncKey = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(meta.syncKey);
    } catch (error) {
      console.error("Failed to copy sync key", error);
    }
  };

  return (
    <div className="app-root">
      <TopHeader onOpenPOLELogger={() => navigate("/room/me")} />

      <div className="context-strip">
        <div className="context-left">
          <span className="cs-pill-label">Entity</span>
          <select
            className="cs-select"
            value={entity}
            onChange={(event) => setEntity(event.target.value as ShellEntity)}
          >
            {ENTITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="cs-pill-label">Room</span>
          <select
            className="cs-select"
            value={room}
            onChange={(event) => handleRoomChange(event.target.value as ShellRoom)}
          >
            {ROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="context-center">{meta.root}</div>
        <div className="context-right">
          <div className="scope-toggle">
            <button
              type="button"
              className={entity === "Global" ? "active" : ""}
              onClick={() => handleScopeChange("global")}
            >
              Global
            </button>
            <button
              type="button"
              className={entity !== "Global" ? "active" : ""}
              onClick={() => handleScopeChange("entity")}
            >
              Entity
            </button>
            <button
              type="button"
              className={location.pathname.startsWith("/room/") ? "active" : ""}
              onClick={() => handleScopeChange("personal")}
            >
              Personal
            </button>
          </div>
        </div>
      </div>

      <div className="mission-strip">
        <div className="ms-left">
          <span className="ms-label">Mission</span>
          <div className="ms-mission-pill">
            <span className="ms-mission-code">{meta.mission}</span>
            <span className="ms-status">Active</span>
          </div>
        </div>
        <div className="ms-center">
          <div className="ms-mono">
            <span>SYNC_KEY:</span>
            <span className="text-white">{meta.syncKey}</span>
            <button type="button" className="ms-copy" onClick={handleCopySyncKey} aria-label="Copy sync key">
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <button type="button" className="ms-run-toggle">
            <span className="ms-run-label">Run Profile</span>
            <span className="ms-run-mode">{meta.runMode}</span>
          </button>
        </div>
        <div className="ms-right">
          <div className="ms-acceptance-pill">Acceptance: {meta.acceptance} checks defined</div>
        </div>
      </div>

      <div className="workspace-row">
        <LeftRail entity={entity} room={room} />

        <div className="main-frame">
          <main className="main-canvas">
            <div className="main-canvas-inner">
              <Outlet />
            </div>
          </main>

          <aside className={`inspector-panel ${isInspectorOpen ? "open" : ""}`}>
            <div className="inspector-inner">
              <div className="inspector-header">
                <div>
                  <div className="inspector-title">Inspector</div>
                  <div className="inspector-type">Manifest trace · runtime surface</div>
                </div>
                <button type="button" className="btn-circle" onClick={() => setIsInspectorOpen(false)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="inspector-tabs">
                <button type="button" className="inspector-tab active">
                  Runtime
                </button>
                <button type="button" className="inspector-tab">
                  Context
                </button>
                <button type="button" className="inspector-tab">
                  Source
                </button>
              </div>
              <div className="inspector-body">
                <div className="space-y-3 text-xs">
                  <div className="rounded-xl border border-[#22304a] bg-[#0a1222] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#6f86a8]">Route</div>
                    <div className="mt-1 text-white">{location.pathname}</div>
                  </div>
                  <div className="rounded-xl border border-[#22304a] bg-[#0a1222] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#6f86a8]">Context</div>
                    <div className="mt-1 text-white">
                      {entity} · {room}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#22304a] bg-[#0a1222] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#6f86a8]">Runtime</div>
                    <div className="mt-1 text-white">{RUNTIME_PRIMARY_URL} · shell primary</div>
                    <div className="mt-1 text-[#9ca3af]">Single launcher, single localhost, MCP-backed clean runtime.</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="status-footer">
        <div className="sf-left">
          ACTIVE TRAIN: <span className="text-white">T1 · Protocol Setup</span>
        </div>
        <div className="sf-center">AUTOSAVED · JUST NOW</div>
        <div className="sf-right">
          <button type="button" className="btn-ghost" onClick={() => setIsInspectorOpen((value) => !value)}>
            Inspector
          </button>
          <span className="sf-env-pill">{RUNTIME_ENV_LABEL}</span>
          <span className="sf-env-pill">{RUNTIME_SURFACE_LABEL}</span>
        </div>
      </footer>
    </div>
  );
}
