import type { LayoutConfig, LayoutWidgetConfig } from "./types";

const STORAGE_KEY = "inos_layout_registry_v1";

type LayoutStore = Record<string, LayoutConfig>;

function readStore(): LayoutStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LayoutStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: LayoutStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

function mergeWidgets(
  defaults: LayoutWidgetConfig[],
  stored?: LayoutWidgetConfig[]
) {
  const storedById = new Map<string, LayoutWidgetConfig>();
  (stored || []).forEach((w) => storedById.set(w.widgetId, w));
  const merged = defaults.map((d) => {
    const existing = storedById.get(d.widgetId);
    return {
      ...d,
      ...existing,
      order: existing?.order ?? d.order,
      visible: existing?.visible ?? d.visible,
      props: existing?.props ?? d.props,
    };
  });
  const maxOrder = merged.reduce((max, w) => Math.max(max, w.order), 0);
  const extras = (stored || [])
    .filter((w) => !defaults.find((d) => d.widgetId === w.widgetId))
    .map((w, idx) => ({
      ...w,
      order: maxOrder + idx + 1,
    }));
  return [...merged, ...extras].sort((a, b) => a.order - b.order);
}

export function loadLayoutConfig(
  pageId: string,
  defaults: LayoutConfig
): LayoutConfig {
  const store = readStore();
  const stored = store[pageId];
  if (!stored) return defaults;
  return {
    pageId,
    widgets: mergeWidgets(defaults.widgets, stored.widgets),
  };
}

export function saveLayoutConfig(config: LayoutConfig) {
  const store = readStore();
  store[config.pageId] = config;
  writeStore(store);
}
