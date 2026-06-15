# MCP Notion Server

This server provides Model Context Protocol (MCP) integration for Notion database and page operations. It's part of the **INOS_E0** (Infinite Network OS, Epoch 0) project.

## Overview

The `mcp-notion` server exposes tools for:

- **databases.list** – List Notion databases accessible to INOS_E0
- **pages.get** – Retrieve a specific Notion page by ID
- **missions.upsert** – Create or update mission documents in the TEAM AI missions database

All tools follow the consistent error shape: `{ code, message, context }`.

## Setup

### Prerequisites

- Node 20+
- Notion API token (from [notion.so/my-integrations](https://notion.so/my-integrations))
- Notion database ID for missions (from database share URL)

### Environment Variables

Create a `.env.local` file for local runtime secrets and overrides:

```env
NOTION_API_KEY=replace_with_notion_integration_token
NOTION_DB_MISSIONS=a1b2c3d4e5f6g7h8...
NOTION_DB_ARK_ASSETS=optional_ark_assets_db_id
NOTION_DB_TIMELINE=optional_timeline_db_id
NOTION_DB_INBOX=optional_inbox_db_id
NOTION_DB_TASKS=controlled_tasks_exception_db_id
# Leave Mission Runs unset until the target is revalidated as live:
# NOTION_DB_RUNS_AARS=
PORT=3002
NODE_ENV=development
GEMINI_API_KEY=optional_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
VERTEX_MODEL=gemini-2.0-flash-001
AUTH_MODE=adc
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
GOOGLE_SHARED_DRIVE_ID=YOUR_SHARED_DRIVE_ID
CANON_ROOT_NAME=INFINITE_NETWORK_CANON
```

**Required:**

- `NOTION_API_KEY` - Your Notion integration token
- `NOTION_DB_MISSIONS` - Database ID for TEAM AI missions

**Optional:**

- `NOTION_DB_TASKS` - Current Tasks database surface.
- `NOTION_DB_RUNS_AARS` - Leave unset until the Mission Runs target is explicitly revalidated as live
- `NOTION_DB_ARK_ASSETS` - Asset registry for ARK seal logging
- `NOTION_DB_TIMELINE` - Timeline / PoLE events database
- `NOTION_DB_INBOX` - Inbox capture database
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment mode (default: development)
- `GEMINI_API_KEY` - Gemini AI Studio API key (optional, takes priority if set)
- `GEMINI_MODEL` - AI Studio model (default: gemini-1.5-flash)
- `GCP_PROJECT_ID` - GCP project for Vertex + Drive tools
- `GCP_REGION` - Vertex region (default: us-central1)
- `VERTEX_MODEL` - Default Vertex model
- `AUTH_MODE` - adc or service_account
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account JSON path
- `GOOGLE_SHARED_DRIVE_ID` - Shared Drive ID for Drive tools
- `CANON_ROOT_NAME` - Canon root folder (default: INFINITE_NETWORK_CANON)
- `GCP_PROJECT_ID` - GCP project for Vertex AI (required for `llm.generate`)
- `GCP_REGION` - Vertex AI region (default: us-central1)
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account JSON path for Vertex AI

### Installation & Running

```powershell
npm install
npm run build
npm run dev
```

### Clean Runtime Cutover Path

For the canonical local runtime, launch `mcp-notion` only from:

```powershell
C:\dev\The-Infinite-Network\Operating-System\mcp\mcp-notion
```

Preferred clean launch:

```powershell
npm run start:clean
```

This script:

- requires the clean `Operating-System` repo path
- requires `.env` or `.env.local` in that repo
- builds `dist\index.js` if needed
- starts `node .\dist\index.js` on port `3002` by default

Do not launch the legacy runtime from `C:\dev\~devantigravity-playground\The-Infinite-Netowrk\mcp\mcp-notion`.

### Port Conflicts (Dev)

`npm run dev` uses a preflight script that checks 3002, then 3003/3004. If 3002 is occupied, it will auto-fallback and print the PID + resolved port.

To force a port:

```powershell
set PORT=3002
npm run dev
```

### Auth Mode Matrix

- **GEMINI_API_KEY set** → AI Studio endpoint (no GCP auth required)
- **GEMINI_API_KEY unset + GCP_PROJECT_ID set** → Vertex AI (ADC/service account)
- **Neither set** → startup fails with a clear error

### Docker

```powershell
# Copy .env to docker environment
docker-compose up
```

## Tools

### databases.list

List all Notion databases accessible to this integration.

**Request:**

```json
{
  "tool": "databases.list",
  "params": {}
}
```

**Response (success):**

```json
{
  "databases": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "title": "TEAM AI Missions"
    }
  ]
}
```

**Response (error):**

```json
{
  "code": "NOTION_API_ERROR",
  "message": "Failed to fetch databases",
  "context": {
    "originalError": "..."
  }
}
```

### pages.get

Retrieve a specific page from Notion.

**Request:**

```json
{
  "tool": "pages.get",
  "params": {
    "pageId": "a1b2c3d4e5f6g7h8i9j0"
  }
}
```

**Response (success):**

```json
{
  "id": "a1b2c3d4e5f6g7h8i9j0",
  "created_time": "2025-01-01T12:00:00.000Z",
  "last_edited_time": "2025-01-01T14:00:00.000Z",
  "properties": {
    "Name": { "title": [{ "text": { "content": "..." } }] },
    "Status": { "select": { "name": "In Progress" } }
  }
}
```

**Response (error):**

```json
{
  "code": "PAGE_NOT_FOUND",
  "message": "Page not found: a1b2c3d4e5f6g7h8i9j0",
  "context": {
    "pageId": "a1b2c3d4e5f6g7h8i9j0"
  }
}
```

### missions.upsert

Create a new mission document in NOTION_DB_MISSIONS, or update an existing one.

**Request (create):**

```json
{
  "tool": "missions.upsert",
  "params": {
    "missionData": {
      "title": "Deploy Timeline Feature",
      "status": "In Progress"
    }
  }
}
```

**Request (update):**

```json
{
  "tool": "missions.upsert",
  "params": {
    "missionData": {
      "title": "Deploy Timeline Feature",
      "status": "Complete"
    },
    "existingPageId": "a1b2c3d4e5f6g7h8i9j0"
  }
}
```

**Response (success):**

```json
{
  "id": "a1b2c3d4e5f6g7h8i9j0",
  "created_time": "2025-01-01T12:00:00.000Z",
  "last_edited_time": "2025-01-01T14:05:00.000Z"
}
```

### timeline.log

Log a PoLE / timeline event into the configured `NOTION_DB_TIMELINE` database. Defaults to stamping the current time when `startedAt` is not provided.

**Request:**

```json
{
  "tool": "timeline.log",
  "params": {
    "title": "Deep work block",
    "type": "Deep Work",
    "missionId": "some-mission-id",
    "tags": ["focus", "epoch0"],
    "source": "INOS_E0",
    "durationMinutes": 90,
    "startedAt": "2025-01-02T13:00:00.000Z"
  }
}
```

**Response (success):**

```json
{
  "id": "timeline-page-id"
}
```

### timeline.list

Fetch timeline events with optional filters for date range, type, mission relation, and limit (default 50, max 100).

**Request:**

```json
{
  "tool": "timeline.list",
  "params": {
    "dateFrom": "2025-01-01",
    "dateTo": "2025-01-07",
    "type": "Deep Work",
    "missionId": "some-mission-id",
    "limit": 10
  }
}
```

**Response (success):**

```json
{
  "events": [
    {
      "id": "timeline-page-id",
      "title": "Deep work block",
      "type": "Deep Work",
      "missionId": "some-mission-id",
      "tags": ["focus", "epoch0"],
      "source": "INOS_E0",
      "notes": null,
      "link": null,
      "date": "2025-01-02T13:00:00.000Z",
      "end_date": "2025-01-02T14:30:00.000Z"
    }
  ]
}
```

### Additional tools

- `missions.list` - Recent missions from the configured missions DB
- `missions.tasks.list` - Tasks related to a mission (uses `NOTION_DB_TASKS`)
- `tasks.create` - Creates a task in the approved `NOTION_DB_TASKS` surface
- `ark.sealLog` - Ensure an ARK asset and append a timeline entry
- `inbox.capture` - Capture inbox items into `NOTION_DB_INBOX`

## Testing

```powershell
npm test
npm run test:watch
```

Tests focus on happy-path flows and schema validation. All core tools have at least one test.

### Smoke Tests

End-to-end check that each MCP tool responds successfully with safe dummy payloads. Requires valid Notion credentials and database IDs to pass.

```powershell
npm run build
npm run test:mcp
```

Env used by the smoke run:

- Required: `NOTION_API_KEY`, `NOTION_DB_MISSIONS`, `NOTION_DB_ARK_ASSETS`, `NOTION_DB_TIMELINE`, `NOTION_DB_INBOX`
- Optional: `NOTION_DB_TASKS`
- Optional overrides for dummy inputs: `NOTION_SMOKE_PAGE_ID`, `NOTION_SMOKE_EXISTING_PAGE_ID`, `NOTION_SMOKE_MISSION_ID`

## Architecture

### Module Structure

- **`src/index.ts`** – Server entry point and bootstrapping
- **`src/config.ts`** – Configuration management (Zod schema validation)
- **`src/errors.ts`** – Error shaping, Logger utility, error codes
- **`src/client.ts`** – Notion API client, tool implementations
- **`src/tools.ts`** – Tool definitions with request/response schemas
- **`tests/tools.test.ts`** – Unit tests for core flows

### Key Patterns

**Configuration:**

- All env vars validated at startup via Zod
- Fails fast if required vars are missing
- Typed config object for downstream use

**Error Handling:**

- All errors shaped as `{ code, message, context }`
- Specific error codes for programmatic handling (NOTION_API_ERROR, PAGE_NOT_FOUND, etc.)
- Full stack traces in debug mode

**Logging:**

- Structured logs with context (operation, IDs, results)
- Prefixed by module for easy filtering
- Supports development + production modes

**Schemas:**

- Request/response validated with Zod
- All tool parameters and returns are typed
- Early validation prevents runtime errors

## Common Issues

### `NOTION_API_KEY not found`

Ensure your `.env` file is in the project root and not listed in `.gitignore`. Run:

```powershell
cat .env
```

### `NOTION_DB_MISSIONS database ID is required`

Verify the database exists and the integration has access. Share the database with the integration in Notion settings.

### Port already in use

Change the `PORT` env var or kill the existing process:

```powershell
Get-Process -Name node | Stop-Process -Force
```

## Next Steps

- Implement HTTP transport layer (express or similar)
- Add more tools as INOS_E0 features expand
- Consider caching for frequently-accessed pages
- Add retry logic for transient Notion API errors
