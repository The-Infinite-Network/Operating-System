# INOS Shell â€” Complete Reference

**INOS_E0** (Infinite Network OS, Epoch 0) â€” Browser-based command center for TEAM AI operations. Single human entry point into the Infinite Network with a timeline-native operating system.

---

## Stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| UI Framework | React 18.3.1            |
| Routing      | React Router DOM 6.30.3 |
| Language     | TypeScript 5.3.3        |
| Build        | Vite 7.3.0              |
| State        | Zustand 4.5.4           |
| Styling      | Tailwind CSS 3.4.3      |
| Icons        | Lucide React 0.562.0    |
| Local DB     | Dexie 4.0.7 (IndexedDB) |
| Date Utils   | date-fns 3.6.0          |

Dev server runs on `http://localhost:5173`. Production builds to `/dist`.

---

## Directory Structure

```text
nullkode-apps/inos-shell/
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â”œâ”€â”€ vite.config.ts
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ tailwind.config.js
â”œâ”€â”€ postcss.config.js
â”‚
â””â”€â”€ src/
    â”œâ”€â”€ main.tsx                    # Entry point
    â”œâ”€â”€ App.tsx                     # Root router
    â”œâ”€â”€ index.css                   # Global CSS + design tokens
    â”‚
    â”œâ”€â”€ api.ts                      # Canonical business logic API layer
    â”œâ”€â”€ agentlang.ts                # Agent language definitions
    â”œâ”€â”€ cngiState.ts                # CNGI bakery menu state (localStorage)
    â”œâ”€â”€ inosMap.ts                  # INOS entity/room mapping utilities
    â”œâ”€â”€ mockDriveCanon.ts           # Mock Google Drive Canon data
    â”œâ”€â”€ driveCanonClient.ts         # Drive Canon HTTP client
    â”œâ”€â”€ forge_api.ts                # Local Forge API (localStorage-backed)
    â”‚
    â”œâ”€â”€ layout/
    â”‚   â”œâ”€â”€ AppSpine.tsx            # Main layout wrapper with sidebar + outlet
    â”‚   â”œâ”€â”€ LeftRail.tsx            # Sidebar: entity/room context selector + nav
    â”‚   â””â”€â”€ TopHeader.tsx           # Top bar: logo, tabs, profile
    â”‚
    â”œâ”€â”€ pages/
    â”‚   â”œâ”€â”€ Home.tsx                # MissionBoard display
    â”‚   â”œâ”€â”€ Inbox.tsx               # Inbox (capture, triage, route)
    â”‚   â”œâ”€â”€ Tasks.tsx
    â”‚   â”œâ”€â”€ RoomMe.tsx
    â”‚   â”œâ”€â”€ Foundation.tsx
    â”‚   â”œâ”€â”€ Core.tsx                # CORE directives display
    â”‚   â”œâ”€â”€ Agents.tsx
    â”‚   â”œâ”€â”€ TeamAIHQ.tsx            # Forge wizard + artifact library
    â”‚   â”œâ”€â”€ Guilds.tsx
    â”‚   â”œâ”€â”€ Apps.tsx
    â”‚   â”œâ”€â”€ IeHqSpine.tsx           # IE-HQ entity spine visualization
    â”‚   â”œâ”€â”€ TimelineViewer.tsx
    â”‚   â”œâ”€â”€ DatabaseSync.tsx
    â”‚   â”œâ”€â”€ Logs.tsx
    â”‚   â””â”€â”€ operations/
    â”‚       â”œâ”€â”€ OperationsLayout.tsx
    â”‚       â”œâ”€â”€ WarRoom.tsx         # Mission/task kanban
    â”‚       â”œâ”€â”€ CoreConsole.tsx
    â”‚       â”œâ”€â”€ AimRouter.tsx
    â”‚       â”œâ”€â”€ Constraints.tsx
    â”‚       â””â”€â”€ Evidence.tsx
    â”‚
    â”œâ”€â”€ components/
    â”‚   â”œâ”€â”€ MissionBoard.tsx        # Mission list + detail + PoLE entry
    â”‚   â”œâ”€â”€ MissionList.tsx         # Filter & list view
    â”‚   â”œâ”€â”€ MissionDetail.tsx       # Detail tabs: tasks, timeline, events
    â”‚   â”œâ”€â”€ MissionTask.tsx
    â”‚   â”œâ”€â”€ TimelineStream.tsx      # Timeline event stream
    â”‚   â”œâ”€â”€ PoleEntry.tsx           # PoLE logger form
    â”‚   â”œâ”€â”€ CoreDirectiveBoard.tsx
    â”‚   â”œâ”€â”€ DevConnectionPanel.tsx  # Dev-only MCP connection status
    â”‚   â”œâ”€â”€ GlobalPoleLogger.tsx    # Modal: PoLE transmission logging
    â”‚   â”œâ”€â”€ TwinProfileIntake.tsx
    â”‚   â”œâ”€â”€ index.ts                # Barrel export
    â”‚   â”œâ”€â”€ forge/
    â”‚   â”‚   â”œâ”€â”€ ForgeWizard.tsx     # Agent creation multi-step wizard
    â”‚   â”‚   â”œâ”€â”€ ForgeThreadCard.tsx # Agent thread card
    â”‚   â”‚   â”œâ”€â”€ ArtifactLibrary.tsx # Artifact browser
    â”‚   â”‚   â””â”€â”€ RunsLog.tsx         # Forge run history
    â”‚   â””â”€â”€ inbox/
    â”‚       â”œâ”€â”€ InboxTable.tsx
    â”‚       â”œâ”€â”€ InboxFilters.tsx
    â”‚       â”œâ”€â”€ InboxEditorDrawer.tsx
    â”‚       â”œâ”€â”€ InboxCaptureForm.tsx
    â”‚       â””â”€â”€ DuplicateResultsModal.tsx
    â”‚
    â”œâ”€â”€ services/
    â”‚   â”œâ”€â”€ mcpClient.ts            # High-level MCP client (typed methods)
    â”‚   â”œâ”€â”€ mcpToolClient.ts        # Low-level callTool + health check
    â”‚   â””â”€â”€ todoClient.ts           # Todo sync service
    â”‚
    â”œâ”€â”€ types/
    â”‚   â”œâ”€â”€ index.ts                # Mission, Task, Room, Guild, Agent, Drive
    â”‚   â”œâ”€â”€ inos.ts
    â”‚   â”œâ”€â”€ inbox.ts                # InboxItem, InboxStatus, InboxLane
    â”‚   â”œâ”€â”€ operations.ts           # Mission/Task types for operations
    â”‚   â”œâ”€â”€ timeline.ts             # TimelineEvent, PoleRecord
    â”‚   â””â”€â”€ forge.ts                # AgentForgeThread, ForgeArtifact, AgentForgeRun
    â”‚
    â”œâ”€â”€ data/
    â”‚   â”œâ”€â”€ forge_templates.ts      # Agent template library
    â”‚   â”œâ”€â”€ spine_map.ts            # Entity spine mapping
    â”‚   â””â”€â”€ mock/
    â”‚       â”œâ”€â”€ agents.ts
    â”‚       â”œâ”€â”€ apps.ts
    â”‚       â”œâ”€â”€ guilds.ts
    â”‚       â”œâ”€â”€ missions.ts
    â”‚       â”œâ”€â”€ poles.ts
    â”‚       â””â”€â”€ timeline.ts
    â”‚
    â”œâ”€â”€ ui/
    â”‚   â””â”€â”€ layoutRegistry/
    â”‚       â”œâ”€â”€ LayoutHost.tsx      # Layout persistence
    â”‚       â”œâ”€â”€ registry.tsx
    â”‚       â”œâ”€â”€ storage.ts
    â”‚       â””â”€â”€ types.ts
    â”‚
    â””â”€â”€ unschool/                   # Offline-first education sub-platform
        â”œâ”€â”€ UnschoolLayout.tsx
        â”œâ”€â”€ store.ts                # Zustand store (currentStudentId)
        â”œâ”€â”€ types.ts
        â”œâ”€â”€ storage.ts
        â”œâ”€â”€ generators.ts
        â”œâ”€â”€ services/
        â”‚   â”œâ”€â”€ mcpClient.ts
        â”‚   â””â”€â”€ outbox.ts
        â”œâ”€â”€ domain/
        â”‚   â”œâ”€â”€ models.ts
        â”‚   â”œâ”€â”€ mastery.ts
        â”‚   â”œâ”€â”€ skills.ts
        â”‚   â”œâ”€â”€ generators.ts
        â”‚   â””â”€â”€ commands.ts
        â”œâ”€â”€ data/
        â”‚   â”œâ”€â”€ db.ts               # Dexie schema (unschool_ops_v2)
        â”‚   â”œâ”€â”€ drills.ts
        â”‚   â”œâ”€â”€ repositories.ts
        â”‚   â”œâ”€â”€ seed.ts
        â”‚   â””â”€â”€ export.ts
        â”œâ”€â”€ pages/
        â”‚   â”œâ”€â”€ OperatorDashboard.tsx
        â”‚   â”œâ”€â”€ Students.tsx
        â”‚   â”œâ”€â”€ Skills.tsx
        â”‚   â”œâ”€â”€ Sessions.tsx
        â”‚   â”œâ”€â”€ SessionRunner.tsx
        â”‚   â”œâ”€â”€ BaselineV2.tsx
        â”‚   â”œâ”€â”€ WeeklyReviewV2.tsx
        â”‚   â”œâ”€â”€ TeacherConsole.tsx
        â”‚   â””â”€â”€ SettingsV2.tsx
        â””â”€â”€ ui/
            â”œâ”€â”€ CommandPalette.tsx
            â”œâ”€â”€ ScoreButtons.tsx
            â”œâ”€â”€ Timer.tsx
            â”œâ”€â”€ SessionWizard.tsx
            â””â”€â”€ ExportImport.tsx
```

---

## Routing

### Main Layout (`AppSpine`)

| Path          | Component  | Description              |
| ------------- | ---------- | ------------------------ |
| `/home`       | Home       | MissionBoard             |
| `/room/me`    | RoomMe     | Personal room            |
| `/foundation` | Foundation | Foundation view          |
| `/core`       | Core       | CORE directives          |
| `/agents`     | Agents     | Agent roster             |
| `/team-ai-hq` | TeamAIHQ   | Forge wizard + artifacts |
| `/guilds`     | Guilds     | Guild list               |
| `/apps`       | Apps       | App portal               |
| `/logs`       | Logs       | System logs              |
| `/inbox`      | Inbox      | Inbox workflow           |
| `/tasks`      | Tasks      | Task board               |

### Operations (nested under `/operations`)

| Path                      | Component   | Description           |
| ------------------------- | ----------- | --------------------- |
| `/operations`             | WarRoom     | Default: kanban board |
| `/operations/war`         | WarRoom     | Mission/task kanban   |
| `/operations/core`        | CoreConsole | Core console          |
| `/operations/aim`         | AimRouter   | AIM router            |
| `/operations/constraints` | Constraints | Constraints view      |
| `/operations/evidence`    | Evidence    | Evidence log          |

### Apps (nested under `/apps`)

| Path                    | Component         |
| ----------------------- | ----------------- |
| `/apps/ie-hq-spine`     | IeHqSpine         |
| `/apps/twin-profile`    | TwinProfileIntake |
| `/apps/timeline-viewer` | TimelineViewer    |
| `/apps/db-sync`         | DatabaseSync      |
| `/apps/drive`           | Drive Canon App   |

### Unschool (nested under `/unschool`)

| Path                    | Component         |
| ----------------------- | ----------------- |
| `/unschool`             | OperatorDashboard |
| `/unschool/students`    | Students          |
| `/unschool/skills`      | Skills            |
| `/unschool/sessions`    | Sessions          |
| `/unschool/session/new` | SessionRunner     |
| `/unschool/baseline`    | BaselineV2        |
| `/unschool/weekly`      | WeeklyReviewV2    |
| `/unschool/teacher`     | TeacherConsole    |
| `/unschool/settings`    | SettingsV2        |

---

## API & MCP Integration

INOS Shell never calls Notion directly. All external data goes through the MCP server over HTTP. Preferred local URL is `http://localhost:3002`, with `3003/3004` as valid fallback ports. The shell can also use an override from `localStorage` or `VITE_MCP_BASE_URL`.

### HTTP Contract

```text
POST /tool/{toolName}
Body:     { params: { ...payload } }
Success:  { ok: true, data: T, request_id? }
Failure:  { ok: false, error: { code, message } }

GET /health â†’ 200 OK
```

### Three API Layers

**`services/mcpToolClient.ts`** â€” Raw tool executor

```typescript
callTool<T>(toolName: string, payload: object): Promise<MCPToolResult<T>>
checkMcpHealth(): Promise<boolean>
```

**`services/mcpClient.ts`** â€” Typed local wrappers over canonical dot-name MCP tools

- `health()`, `tools()`
- `missionsList()` -> `missions.list`, `tasksList()` -> `missions.tasks.list`, `timelineList()` -> `timeline.list`
- `roomsList()`, `guildsList()`
- `missionCreate()` -> `missions.create`, `updateMissionStatus()` -> legacy compatibility alias
- `createTaskForMission()` -> `tasks.create`, `updateTaskForMission()` -> legacy compatibility alias
- `createRun()` -> MCP `runs.create`, `listRunsForMission()` -> MCP `runs.list`
- `timelineLog()` -> MCP `timeline.log` â€” Log PoLE events

**`api.ts`** â€” Canonical business logic layer (maps UI enums â†’ MCP statuses)

- Missions: `listMissions()`, `upsertMission()`
- Tasks: `listTasks()`, `createTaskForMission()`, `updateTaskForMission()`
- Entities: `listEntities()`, `listRooms()`, `listGuilds()`, `listAgents()`
- Inbox: `inboxList()`, `inboxCreate()`, `inboxUpdate()`, `inboxTriage()`, `inboxRoute()`, `inboxDuplicate()`, `inboxArchive()`, `inboxDedupeFind()` -> canonical MCP tools such as `inbox.capture`, `inbox.dedupe.find`, and `inbox.backfill.codes`
- Timeline: `listTimelineForMission()`, `logTimelineEvent()`, `queryTimelineByMission()`
- Runs & AARs: `createRun()`, `endRun()`, `updateAAR()`
- Core: `createDirective()`, `listDirectives()`
- Vertex AI: `vertexGenerate()`, `vertexHealth()`

Public MCP contract uses dot-names, for example `missions.upsert`, `timeline.list`, `timeline.log`, `timeline.logEvent`, `timeline.queryByMission`, `runs.create`, `runs.end`, `runs.list`, `aars.update`, `databases.list`, and `pages.get`.

HTTP timeout: 7 seconds. Falls back to mock data when MCP is unavailable.

---

## Design System

### CSS Custom Properties

**Brand Themes** (applied via `.theme-ie`, `.theme-ffc`, `.theme-cngi`):

| Theme | Brand            | Background           | Accent                                |
| ----- | ---------------- | -------------------- | ------------------------------------- |
| IE    | Infinite Earth   | `#0b0e11` void black | `#c9a227` gold                        |
| FFC   | Fulcrum Fortress | `#111827` slate      | `#1f6f78` teal                        |
| CNGI  | Crumb N Get It   | `#1a1412` espresso   | `#8b1e3f` cranberry + `#ffbf00` amber |

**Semantic tokens** (default to IE):

```css
--brand-bg        /* page background */
--brand-surface   /* card/panel surface */
--brand-text      /* primary text */
--brand-muted     /* secondary text */
--brand-accent    /* primary accent color */
--brand-border    /* border color */
```

**Entity accents:**

```css
--entity-holdco:   #FFBF00  /* amber */
--entity-opco:     #1E4AA8  /* blue */
--entity-venture:  #6F2DA8  /* purple */
--entity-treasury: #FFBF00  /* amber */
```

### Tailwind Extended Palette

```javascript
inos: {
  bg:     "#0B1F3A",
  panel:  "#11153A",
  border: "#B7BDC8",
  text:   "#F5F1E6",
  muted:  "#EAF2F9",
  accent: "#FFBF00",
}

ops: {
  sand:  "#f6f3ec",
  clay:  "#e9dfd1",
  ink:   "#1b1b1f",
  muted: "#6b6b70",
  teal:  "#1f8a7a",
  coral: "#f26c4f",
  dusk:  "#0f2f2d",
  leaf:  "#7fb069",
}
```

### Layout Classes

| Class            | Purpose                                |
| ---------------- | -------------------------------------- |
| `.app-root`      | Full-height root container             |
| `.spine-body`    | Main layout body                       |
| `.spine-rail`    | Left rail sidebar                      |
| `.spine-header`  | Top header bar                         |
| `.spine-content` | Primary content area                   |
| `.spine-outlet`  | Router outlet region                   |
| `.global-header` | Global header element                  |
| `.gh-tabs`       | Header tab group                       |
| `.gh-profile`    | Header profile section                 |
| `.spine-stack`   | Flex column-reverse (L0â†’top display) |

---

## Type Definitions

### Mission

```typescript
Mission {
  id: string
  title: string
  status: "Proposed" | "Planning" | "In Flight" | "Blocked" | "Done" | "Parked"
  priority: number | null
  owner: string
  due_date: string | null
  mission_code: string
  entity: string
  room: string
  tags: string[]
}
```

### MissionTask

```typescript
MissionTask {
  id: string
  title: string
  status: "Spec" | "In Build" | "QA" | "Parked" | "Shipped"
  owner: string
  due_date: string | null
  priority: number | null
  entity: string
  room: string
}
```

### InboxItem

```typescript
InboxItem {
  id: string
  item: string               // title
  summary: string
  status: InboxStatus        // see workflow below
  sensitivity: "Internal" | "Public" | "Confidential" | "Secret"
  lane: "L0" | "L1" | "L2" | "L3" | "L4" | "L5"
  layer: string
  domain: string
  object_type: string
  owner_pod: string
  destination_db: string
  routing_status: string
  routing_key: string
  tags: string[]
  source_type: string
  source_url: string
  source_ref: string
  target_url: string
  target_notion_id: string
  blocker_reason: string
  duplicate_of: string
  verified_at: string
  verified_by: string
  entity_id: string
  entity_name: string
  room_id: string
  room_name: string
  move_log: object[]
}
```

### TimelineEvent / PoleRecord

```typescript
TimelineEvent {
  id: string
  title: string
  type: "note" | string
  event_type: string
  missionId: string
  source: string
  notes: string
  summary: string
  timestamp: string
  actor?: string
  external_refs: string[]
  date: string
  last_edited_time: string
}

PoleRecord {
  pole_id: string
  timestamp: string
  content: { raw: string }
  entity?: string
  mission_id?: string
  title: string
  source: string
}
```

### AgentForgeThread

```typescript
AgentForgeThread {
  id: string
  handle: string
  working_title: string
  pod: string
  status: string
  requested_by: string
  architect: string
  executor: string
  anchor_entities: string[]
  challenge_pattern: string
  autogen_mode: "Assist" | "Auto"
  artifacts: Record<string, unknown>
  sync_key: string
  created_at: string
  updated_at: string
}
```

---

## State Management

### Zustand Store (`unschool/store.ts`)

```typescript
useUnschoolStore {
  currentStudentId: string | null
  setCurrentStudentId: (id: string | null) => void
  refreshToken: number        // bump to trigger reactive refresh
  bumpRefresh: () => void
}
// Persisted to: localStorage["unschool_current_student_v2"]
```

### localStorage Keys

| Key                                | Contents                         |
| ---------------------------------- | -------------------------------- |
| `ENTITY_STORAGE_KEY`               | Active entity context (LeftRail) |
| `ROOM_STORAGE_KEY`                 | Active room context (LeftRail)   |
| `unschool_current_student_v2`      | Current Unschool student ID      |
| `VITE_MCP_BASE_URL` or storage key | MCP base URL override            |
| `THREADS_KEY`                      | Forge threads                    |
| `ARTIFACTS_KEY`                    | Forge artifacts                  |
| `RUNS_KEY`                         | Forge runs                       |
| CNGI `STORAGE_KEY`                 | Bakery menu state                |

### Custom Events

LeftRail fires `window.CustomEvent('inos-context-change')` whenever entity or room context changes. Components listen with `window.addEventListener('inos-context-change', ...)`.

### IndexedDB (Dexie)

Schema `unschool_ops_v2` â€” used exclusively by the Unschool subsystem:

| Table             | Contents                                      |
| ----------------- | --------------------------------------------- |
| `students`        | ChildProfile records                          |
| `sessions`        | Session logs (type, duration, emotional tone) |
| `proofLogs`       | Session outcomes (wins, misses, next moves)   |
| `baselineResults` | Day 1/2/3 baseline assessments                |
| `focusPlans`      | Weekly focus plans (reading, math, readiness) |
| `dailyPlans`      | Daily activity plans                          |

---

## Feature Workflows

### Inbox Workflow

```text
Capture â†’ Triage â†’ Route â†’ Verify â†’ Close / Archive
```

| Step      | Status      | What happens                         |
| --------- | ----------- | ------------------------------------ |
| Capture   | `Captured`  | Item created with source metadata    |
| Triage    | `Triaged`   | Lane/layer/domain classified         |
| Route     | `Routed`    | Assigned to destination database     |
| Verify    | `Verified`  | Accuracy confirmed                   |
| Close     | `Closed`    | Marked complete                      |
| Archive   | `Archived`  | Removed from active view             |
| Blocked   | `Blocked`   | Awaiting resolution                  |
| Duplicate | `Duplicate` | Flagged as duplicate of another item |

### PoLE (Purpose-Oriented Lifecycle Event)

PoLE events are atomic, timestamped records tied to a mission, entity, and room. They form the audit trail of the timeline.

- Created via `PoleEntry` component or `GlobalPoleLogger` modal
- Written via `api.logTimelineEvent()` â†’ MCP `timeline_log` tool
- Viewable in `TimelineStream` and `MissionDetail` timeline tab

### Forge Wizard (Agent Creation)

Multi-step wizard for spinning up new agent threads:

1. **Create Thread** â€” handle, working title, pod selection
2. **Turn 1** â€” emit initial artifacts
3. **Turn 2** â€” augmentation generation
4. **Greenlight** â€” set ready-for-approval status
5. **Turn 3** â€” finalization artifacts

Threads, artifacts, and runs all persist to localStorage via `forge_api.ts`.

### WarRoom Kanban

Mission and task cards arranged in status columns. Supports:

- Inline status updates
- Run and AAR (After-Action Review) creation
- Per-mission task drill-down

---

## Environment Variables

| Variable                   | Default                 | Purpose                                                                         |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `VITE_MCP_BASE_URL`        | `http://localhost:3002` | Preferred MCP server base URL. Local startup may fall back to `3003` or `3004`. |
| `VITE_INOS_API_ENDPOINT`   | â€”                     | INOS API endpoint                                                               |
| `VITE_NOTION_API_ENDPOINT` | â€”                     | Notion API endpoint                                                             |

---

## Scripts

```bash
# from nullkode-apps/inos-shell/
npm install
npm run dev          # Vite dev server â†’ http://localhost:5173
npm run build        # Production bundle â†’ dist/
npm run lint         # tsc --noEmit (type check only)
npm test             # Vitest single run
npm run test:watch   # Vitest watch mode
```

---

## Unschool Subsystem

Fully offline-capable education platform bundled within INOS Shell. Uses Dexie for all persistence â€” no MCP dependency for core flows.

**Purpose:** Track student baselines, run timed skill drills, log session outcomes, produce weekly reviews.

**Key flows:**

- 3-day baseline assessment â†’ stored in `baselineResults`
- Session runner with drill queue, timer, and emotional tone tracking
- Weekly review with optional writeback to MCP timeline
- Export/import JSON snapshots for backup

**Sync:** When MCP is available, `unschool/services/outbox.ts` drains queued events to the timeline.

---

## Valid Status Values

These exact strings are required in MCP calls and Zod schemas:

**Missions:** `Proposed` | `Planning` | `In Flight` | `Blocked` | `Done` | `Parked`

**Build Tasks:** `Spec` | `In Build` | `QA` | `Parked` | `Shipped`
