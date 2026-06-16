# Operating-System Runtime Surface Inventory

Updated: 2026-06-16
Status: Current-state runtime inventory
Purpose: Mark the clean launch surfaces that stay active and explicitly retire legacy or misleading alternatives.

## Canonical Local Runtime

Primary launcher:

- `C:\dev\The-Infinite-Network\Operating-System\start-inos-clean.ps1`

Primary visible shell:

- `http://localhost:5173`

Background services owned by the clean launcher:

- Python API: `http://localhost:8000/health`
- Shell Node API: `http://localhost:3005/health`
- MCP Notion: `http://localhost:3002/health`

## Keep

- `start-inos-clean.ps1`
- `mcp\mcp-notion\scripts\start_clean_runtime.ps1`
- `mcp\mcp-notion\package.json` -> `npm run start:clean`
- `Infinite-Network-OS.code-workspace`
- `inos-shell\vite.config.ts`
- `mcp\services\mcpClient.ts`
- `mcp\services\mcpToolClient.ts`

## Retire For Active Runtime Use

- Any launcher or workspace path that points to `C:\dev\~devantigravity-playground\The-Infinite-Netowrk`
- Any assumption that `mcp-notion` should auto-fallback to `3003` or `3004` for the canonical clean stack
- Any README/setup note that instructs operators to store `NOTION_API_KEY` in `.env.local`
- Any alternate localhost shell root or separate IE/holdco localhost app

## Boundary Notes

- `TEAM-AI` owns canonical agent and capability source.
- `Operating-System` owns runtime, adapter, launcher, and UI surfaces.
- `Infinite-Earth` owns public business and guest-facing site surfaces.
- Legacy and preserved trees may remain on disk, but they are not active runtime roots.
