import { useMemo, useState } from "react";
import { DefaultLayouts, WidgetRegistry } from "./registry";
import { loadLayoutConfig, saveLayoutConfig } from "./storage";
import type { LayoutConfig, LayoutWidgetConfig } from "./types";

type LayoutHostProps = {
  pageId: string;
  editMode: boolean;
};

function reorderWidgets(
  widgets: LayoutWidgetConfig[],
  sourceId: string,
  targetId: string
) {
  const ordered = [...widgets].sort((a, b) => a.order - b.order);
  const fromIndex = ordered.findIndex((w) => w.widgetId === sourceId);
  const toIndex = ordered.findIndex((w) => w.widgetId === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return widgets;
  }
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);
  return ordered.map((w, index) => ({ ...w, order: index }));
}

export default function LayoutHost({ pageId, editMode }: LayoutHostProps) {
  const defaults = DefaultLayouts[pageId];
  const [layout, setLayout] = useState<LayoutConfig>(() =>
    defaults ? loadLayoutConfig(pageId, defaults) : { pageId, widgets: [] }
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const ordered = useMemo(() => {
    return [...layout.widgets].sort((a, b) => a.order - b.order);
  }, [layout.widgets]);

  const updateLayout = (next: LayoutConfig) => {
    setLayout(next);
    saveLayoutConfig(next);
  };

  const handleToggle = (widgetId: string) => {
    const widgets = layout.widgets.map((w) =>
      w.widgetId === widgetId ? { ...w, visible: !w.visible } : w
    );
    updateLayout({ ...layout, widgets });
  };

  const handleDragStart = (widgetId: string) => {
    setDraggingId(widgetId);
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const widgets = reorderWidgets(layout.widgets, draggingId, targetId);
    updateLayout({ ...layout, widgets });
    setDraggingId(null);
  };

  return (
    <div className="layout-grid">
      {ordered.map((widget) => {
        const def = WidgetRegistry[widget.widgetId];
        if (!def) return null;
        const isVisible = widget.visible;
        const Component = def.component;
        return (
          <div
            key={widget.widgetId}
            className={`layout-widget ${!isVisible ? "layout-hidden" : ""}`}
            draggable={editMode}
            onDragStart={() => handleDragStart(widget.widgetId)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={(event) => {
              if (!editMode) return;
              event.preventDefault();
            }}
            onDrop={() => handleDrop(widget.widgetId)}
          >
            <div className="layout-widget-header">
              <div className="layout-widget-title">
                {editMode && <span className="layout-drag-handle">::</span>}
                <span>{def.title}</span>
              </div>
              {editMode && (
                <button
                  className="layout-toggle"
                  type="button"
                  onClick={() => handleToggle(widget.widgetId)}
                >
                  {isVisible ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {isVisible ? (
              <Component {...(widget.props || {})} />
            ) : editMode ? (
              <div className="layout-hidden-note">
                Hidden in view mode. Toggle to show.
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
