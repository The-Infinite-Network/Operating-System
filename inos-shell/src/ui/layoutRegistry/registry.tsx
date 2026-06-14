import type { LayoutConfig, WidgetDefinition } from "./types";
import { mockMissions } from "../../data/mock/missions";
import { mockPOLEs } from "../../data/mock/poles";
import { mockTimeline } from "../../data/mock/timeline";

function CurrentSyncWidget() {
  const active = mockMissions[0];
  return (
    <div className="layout-widget-body">
      <div className="text-xs text-inos-muted uppercase tracking-[0.2em]">
        Active Sync
      </div>
      <div className="text-lg font-semibold">{active.title}</div>
      <div className="text-[11px] text-inos-muted mt-1">
        Entity: {active.entity} - Priority: {active.priority}
      </div>
      <div className="text-[11px] text-inos-muted mt-1">
        Status: <span className="badge-status Active">{active.status}</span>
      </div>
    </div>
  );
}

function TodaysPOLEsWidget() {
  return (
    <div className="layout-widget-body">
      <div className="text-xs text-inos-muted uppercase tracking-[0.2em]">
        Today&apos;s POLEs
      </div>
      <div className="mt-2 space-y-2 text-sm">
        {mockPOLEs.map((POLE) => (
          <div key={POLE.id} className="rounded-lg border border-inos-border/60 p-2">
            <div className="font-semibold">{POLE.title}</div>
            <div className="text-[11px] text-inos-muted">
              {POLE.time_mode} - {POLE.duration_minutes} min - {POLE.entity_context}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickPOLELoggerWidget() {
  return (
    <div className="layout-widget-body">
      <div className="text-xs text-inos-muted uppercase tracking-[0.2em]">
        Quick POLE Logger
      </div>
      <div className="mt-2 grid gap-2 text-sm">
        <input
          className="inos-input"
          placeholder="Label"
          aria-label="POLE label"
        />
        <select className="inos-input" aria-label="Time mode">
          <option value="">Select time mode</option>
          <option value="Deep Work">Deep Work</option>
          <option value="Stewardship">Stewardship</option>
          <option value="Recovery">Recovery</option>
        </select>
        <div className="flex gap-2">
          <input
            className="inos-input"
            placeholder="Minutes"
            aria-label="Minutes"
          />
          <button className="btn-primary" type="button" disabled>
            Log POLE
          </button>
        </div>
        <div className="text-[11px] text-inos-muted">
          Placeholder only. Connects to Timeline in MCP later.
        </div>
      </div>
    </div>
  );
}

function SystemHealthWidget() {
  return (
    <div className="layout-widget-body">
      <div className="text-xs text-inos-muted uppercase tracking-[0.2em]">
        System Health
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-inos-border/60 p-2">
          <div className="text-[11px] text-inos-muted">Timeline Events</div>
          <div className="text-lg font-semibold">{mockTimeline.length}</div>
        </div>
        <div className="rounded-lg border border-inos-border/60 p-2">
          <div className="text-[11px] text-inos-muted">Active Missions</div>
          <div className="text-lg font-semibold">{mockMissions.length}</div>
        </div>
        <div className="rounded-lg border border-inos-border/60 p-2">
          <div className="text-[11px] text-inos-muted">POLEs Today</div>
          <div className="text-lg font-semibold">{mockPOLEs.length}</div>
        </div>
        <div className="rounded-lg border border-inos-border/60 p-2">
          <div className="text-[11px] text-inos-muted">Sync Status</div>
          <div className="text-lg font-semibold">Stable</div>
        </div>
      </div>
    </div>
  );
}

export const WidgetRegistry: Record<string, WidgetDefinition> = {
  "current-sync": {
    id: "current-sync",
    title: "Current Sync",
    description: "Active mission and run profile snapshot.",
    component: CurrentSyncWidget,
  },
  "todays-POLEs": {
    id: "todays-POLEs",
    title: "Today's POLEs",
    description: "Recent proof-of-living entries for today.",
    component: TodaysPOLEsWidget,
  },
  "quick-POLE-logger": {
    id: "quick-POLE-logger",
    title: "Quick POLE Logger",
    description: "Fast logging for TimeMode and minutes.",
    component: QuickPOLELoggerWidget,
  },
  "system-health": {
    id: "system-health",
    title: "System Health",
    description: "Snapshot of system signals and counts.",
    component: SystemHealthWidget,
  },
};

export const DefaultLayouts: Record<string, LayoutConfig> = {
  "room.me.today": {
    pageId: "room.me.today",
    widgets: [
      { widgetId: "current-sync", visible: true, order: 0 },
      { widgetId: "system-health", visible: true, order: 1 },
      { widgetId: "todays-POLEs", visible: true, order: 2 },
      { widgetId: "quick-POLE-logger", visible: true, order: 3 },
    ],
  },
};
