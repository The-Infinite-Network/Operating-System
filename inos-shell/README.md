# INOS Shell (Epoch 0)

Browser Shell for **INOS_E0** (Infinite Network OS, Epoch 0). Acts as the single human entry point into the Infinite Network and talks to the **mcp-notion** HTTP server as its spine.

## Quick start

```powershell
cd C:\dev\The-Infinite-Network\Operating-System
.\start-inos-clean.ps1
```

Shell-only manual start:

```powershell
cd C:\dev\The-Infinite-Network\Operating-System\inos-shell
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
- Preferred backend port is `http://localhost:3002`.
- Preferred browser origin is `http://localhost:5173`.
- If `3002` is occupied, local startup may fall back to `3003` or `3004`.
- Core endpoints:
  - `GET /missions` – list missions from `[WAR] Missions`.
  - `PATCH /missions/:id/status` – update mission status.
  - `POST /tool/missions.upsert` – canonical mission create/update.
  - `POST /tool/vertex.generateText` – Vertex AI bridge.

By default, the Shell points to:

- `window.notionApiEndpoint`, if provided
- `localStorage["inos_mcp_base_url"]`, if present
- otherwise it uses same-origin MCP proxy path `/mcp`

You can override this at runtime via `window.notionApiEndpoint` or by setting `localStorage["inos_mcp_base_url"]`.

## Configure

Basic local setup for mcp-notion:

1. In `C:\dev\The-Infinite-Network\Operating-System\mcp\mcp-notion\.env.local`, set your Notion keys and DB IDs (`NOTION_API_KEY`, `NOTION_DB_MISSIONS`, etc.).
   - `NOTION_DB_RUNS_AARS` and `NOTION_MISSION_RUNS_DB_ID` should point to the live Mission Runs surface when Mission Run tools are enabled.
   - Mission Run lookup is relation-only on the persisted `Mission` relation. `SYNC_KEY` is not a Mission lookup fallback.
   - `NOTION_DB_TASKS` is the approved Tasks surface.
2. Set Vertex AI variables (`GCP_PROJECT_ID`, `GCP_REGION`, `VERTEX_MODEL`).
3. Start the clean consolidated launcher:

   ```powershell
   cd C:\dev\The-Infinite-Network\Operating-System
   .\start-inos-clean.ps1
   ```

   This starts:
   - `mcp-notion` in the background from the new repo path
   - `inos-shell` on `http://localhost:5173`

4. Manual MCP start, if needed:

   ```powershell
   cd C:\dev\The-Infinite-Network\Operating-System\mcp\mcp-notion
   npm install
   npm run build
   npm run start:clean
   ```

5. Manual shell start (see Quick start above).

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

Use Settings → “Health Check + Resync” to ping `MCP_BASE_URL`. Default local shell-facing path is `/mcp`, which proxies to the MCP backend.

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
