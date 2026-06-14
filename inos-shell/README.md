# INOS Shell (Epoch 0)

Browser Shell for **INOS_E0** (Infinite Network OS, Epoch 0). Acts as the single human entry point into the Infinite Network and talks to the **mcp-notion** HTTP server as its spine.

## Quick start

```powershell
cd nullkode-apps/inos-shell
npm install
npm run dev
# open http://localhost:5173
```

Build/preview:

```powershell
npm run build
npm run preview
```

## Backend connections

INOS Shell assumes:

- Canonical MCP Notion HTTP server running locally (project: `mcp-notion`).
- Preferred port is `http://localhost:3002`.
- If `3002` is occupied, local startup may fall back to `3003` or `3004`.
- Core endpoints:
  - `GET /missions` – list missions from `[WAR] Missions`.
  - `PATCH /missions/:id/status` – update mission status.
  - `POST /tool/missions.upsert` – canonical mission create/update.
  - `POST /tool/vertex.generateText` – Vertex AI bridge.

By default, the Shell points to:

- `window.notionApiEndpoint`, if provided
- `localStorage["inos_mcp_base_url"]`, if present
- otherwise it probes `http://localhost:3002`, `3003`, then `3004`

You can override this at runtime via `window.notionApiEndpoint` or by setting `localStorage["inos_mcp_base_url"]`.

## Configure

Basic local setup for mcp-notion:

1. In `mcp-notion/.env`, set your Notion keys and DB IDs (`NOTION_API_KEY`, `NOTION_DB_MISSIONS`, etc.).
   - Do not set `NOTION_DB_RUNS_AARS` or `NOTION_MISSION_RUNS_DB_ID` unless the Mission Runs target has been explicitly revalidated as live.
   - `NOTION_DB_TASKS` is currently a controlled exception and should not be widened into broader automation without a boundary decision.
2. Set Vertex AI variables (`GCP_PROJECT_ID`, `GCP_REGION`, `VERTEX_MODEL`).
3. Start the HTTP server:

   ```powershell
   cd mcp/mcp-notion
   npm install
   npm run build
   npm run start
   ```

4. Start INOS Shell (see Quick start above).

## Features (Epoch 0)

- Timeline view backed by missions from `[WAR] Missions` (`GET /missions`).
- Mission entry via the canonical `missions.upsert` tool (`POST /tool/missions.upsert`).
- Vertex AI Gemini bridge via `vertex.generateText`.

## Unschool Ops (Local-first app v2)

Unschool Ops is bundled inside the shell under `/unschool`. It is fully offline-capable and uses IndexedDB (Dexie) for storage.

Key flows:

- Operator Dashboard: `/unschool`.
- Students: `/unschool/students`.
- Skill Map: `/unschool/skills`.
- Session Runner: `/unschool/session/new`.
- Baseline Sprint: `/unschool/baseline` (Day 0–3).
- Weekly Review + Timeline writeback: `/unschool/weekly`.
- Teacher Console: `/unschool/teacher`.
- Settings (sync + export/import): `/unschool/settings`.

### Data storage

- IndexedDB database: `unschool_ops_v2`.
- Data never leaves the browser unless you export a JSON backup.

### Export/Import

- Export from Settings to download a JSON backup (optional redaction).
- Import restores the full dataset into a fresh install.

### MCP health check

Use Settings → “Health Check + Resync” to ping `MCP_BASE_URL`. Preferred local URL is `http://localhost:3002`, with `3003/3004` as valid fallback ports.

### Extend drills

- Edit `src/unschool/data/drills.ts` to add or tune drill lists.

### Unschool v2 structure

- `src/unschool/domain` — skill taxonomy, mastery engine, generators, commands.
- `src/unschool/data` — Dexie schema, repos, seed data, export/import.
- `src/unschool/services` — MCP adapter + outbox sync.
- `src/unschool/ui` — shared UI widgets.
- `src/unschool/pages` — operator dashboard + routes.

## Project layout

- `index.html` – Shell document.
- `src/App.tsx` – Main application component.
- `src/index.css` – Dark console aesthetic + tokens.

The Shell is a React/Vite app designed for rapid evolution of the INOS interface.
