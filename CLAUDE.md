# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Multi-Repo System Context

`Operating-System` is one of four repos forming **The Infinite Network** (INOS — Infinite Network OS, Epoch 0). This repo owns the runtime, adapter, and control-plane layer only.

| Repo | Owns |
|---|---|
| `Operating-System` (this repo) | Runtime: MCP servers, INOS API, INOS Shell UI |
| `TEAM-AI` | Agent/capability source, mission orchestration, Leviathan knowledge base |
| `Infinite-Earth` | Holdco/subsidiary business sites (FFC, CNGI, GGP) |
| `VAP` | Operator doctrine, routing architecture, canon management |

**Boundary rule:** This repo does not own mission orchestration logic (→ TEAM-AI), entity business apps (→ Infinite-Earth), or VAP routing doctrine. Changes to MCP contracts must be coordinated with TEAM-AI downstream consumers.

## Services and Ports

| Service | Port | Start |
|---|---|---|
| INOS Shell (Vite) | 5173 | `npm run dev` in `inos-shell/` |
| Node API (Express) | 3005 | `npm run server:dev` in `inos-shell/` |
| Python API (FastAPI) | 8000 | `uvicorn main:app --reload` in `inos-api/` |
| MCP Notion Server | 3002 | `npm run start:clean` in `mcp/mcp-notion/` |

Full clean stack (Windows): `start-inos-clean.ps1` at repo root. The MCP Notion server must not auto-fallback to ports 3003/3004 in the canonical clean stack.

## inos-shell

React 18 / Vite 7 / TypeScript 5 / Tailwind 3 command center.

### Commands

```bash
# from inos-shell/
npm install
npm run dev           # Vite dev server → http://localhost:5173
npm run dev:all       # Vite + Node API server concurrently
npm run server:dev    # Node API only (port 3005, nodemon)
npm run build         # Production bundle → dist/
npm run lint          # canonical API check + tsc --noEmit
npm test              # Vitest single run
npm run test:watch    # Vitest watch mode
```

### Three-Layer API Architecture

The shell **never calls Notion directly**. All external data flows through the MCP server:

```
Browser ──/mcp──→ MCP Notion (port 3002)
         ──/api──→ Node API   (port 3005)
```

**Layer 1 — `src/services/mcpToolClient.ts`**: Raw HTTP executor. 7-second timeout. Falls back to mock data when MCP is unavailable.

**Layer 2 — `src/services/mcpClient.ts`**: Typed wrappers over dot-name MCP tools. Tool names follow dot-notation: `missions.list`, `missions.upsert`, `timeline.log`, `timeline.queryByMission`, `runs.create`, `runs.end`, `aars.update`, `inbox.capture`, `inbox.dedupe.find`.

**Layer 3 — `src/api.ts`**: Canonical business logic layer. All pages/components import from here. Maps UI enums to MCP statuses:

| Shell UI | MCP canonical |
|---|---|
| Planning | Intake |
| In Flight | Active |
| Done | Complete |

MCP HTTP contract:
```
POST /tool/{toolName}   body: { params: {...} }
→ { ok: true, data: T } | { ok: false, error: { code, message } }
GET  /health
```

### State and Persistence

- **Zustand** (`src/unschool/store.ts`): Unschool `currentStudentId`, persisted to `localStorage["unschool_current_student_v2"]`
- **localStorage**: Entity/room context (`ENTITY_STORAGE_KEY`, `ROOM_STORAGE_KEY`), Forge threads/artifacts/runs, CNGI bakery menu, MCP base URL override
- **Dexie IndexedDB** (schema: `unschool_ops_v2`): Unschool offline-only data (students, sessions, proofLogs, baselineResults, focusPlans, dailyPlans)

`LeftRail` fires `window.CustomEvent('inos-context-change')` on entity/room change; components subscribe with `window.addEventListener`.

### Design System

Brand themes are applied via `.theme-ie`, `.theme-ffc`, `.theme-cngi` CSS classes. Semantic CSS custom properties (`--brand-bg`, `--brand-surface`, `--brand-text`, `--brand-accent`, etc.) default to the IE theme. Extended Tailwind palettes: `inos.*` (dark command-center blues) and `ops.*` (sand/clay/ink ops palette). Entity accents: `--entity-holdco` amber, `--entity-opco` blue, `--entity-venture` purple.

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_MCP_BASE_URL` | `/mcp` | MCP base path (Vite proxies to port 3002 in dev) |
| `VITE_INOS_API_ENDPOINT` | — | Direct INOS API override |
| `VITE_NOTION_API_ENDPOINT` | — | Direct Notion endpoint override |

Secrets go in `.env` (never `.env.local` per the retired pattern).

### Key Non-Obvious Files

- `src/agentlang.ts` — AGENTLANG v0.1.1: custom language with a deterministic lexer and Pratt parser for agent rule expressions. Supports Unicode symbols (`⊕ ⊖ ∆ → ⊗ ● ○ ◆ ◇ ∃ ∀ ⇒ ∧ ∨ ≡ ¬ ∅ Θ`), KEY refs (`<name>`), and duration literals (`5m`, `2h`). Tests in `test/agentlang.spec.ts`.
- `src/unschool/` — fully offline-first education sub-platform; no MCP dependency for core flows. `outbox.ts` drains queued events to the MCP timeline when available.
- `src/layout/AppSpine.tsx` — main layout shell (sidebar + outlet); `LeftRail.tsx` manages entity/room context.
- `src/forge_api.ts` — localStorage-backed Forge API (agent creation wizard persistence).

### Valid Status Strings

These exact strings are required in MCP calls and Zod schemas:

- **Missions:** `Proposed` | `Planning` | `In Flight` | `Blocked` | `Done` | `Parked`
- **Build Tasks:** `Spec` | `In Build` | `QA` | `Parked` | `Shipped`
- **Inbox:** `Captured` | `Triaged` | `Routed` | `Verified` | `Closed` | `Archived` | `Blocked` | `Duplicate`

## inos-api

Python FastAPI backend.

```bash
# from inos-api/
pip install -r requirements.txt
uvicorn main:app --reload   # → http://localhost:8000/health
```

Routes:
- `POST /api/v1/intake/extract-twin` — runs Gemini extraction using `prompts/twin_profile_extractor_v3.txt`
- `GET  /api/v1/profile/...`
- `GET  /health`

Key deps: `fastapi==0.111.0`, `google-genai==0.3.0`, `pydantic==2.7.4`.
