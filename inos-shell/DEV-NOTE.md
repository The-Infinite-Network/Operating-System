# INOS Shell UI Notes

## Layout Registry

- Location: `src/ui/layoutRegistry/`
- Registry file: `src/ui/layoutRegistry/registry.tsx`
- Storage helper: `src/ui/layoutRegistry/storage.ts`

### Add a new widget

1) Add a React component in `registry.tsx`.
2) Register it in `WidgetRegistry` with `id`, `title`, `description`, and component.
3) Add the widget to the default layout in `DefaultLayouts`.
4) Update page layout if needed to reference the same `pageId`.

### Persistence

- Layouts are stored in localStorage under `inos_layout_registry_v1`.
- The merge logic is extend-only: defaults are preserved and any stored widget config overlays visibility/order.

## Pages & Routing

- Router lives in `src/App.tsx`.
- App spine layout (header + left rail + outlet) is in `src/layout/AppSpine.tsx`.
- Pages are in `src/pages/*`.

## Mock Data

- Interfaces: `src/types/inos.ts`
- Mock data sources: `src/data/mock/*`

This UI pass is surface-only. No MCP wiring changes and no new governance hierarchy.
