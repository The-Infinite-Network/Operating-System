# GGP MCP Server

Minimal MCP server that exposes Mission Deck tools backed by Supabase.

## Tools

- `get_daily_snapshot(date, unit_id)`
- `audit_cash_log(date)`
- `query_roster(role_filter)`
- `submit_incident_report(type, severity, description, unit_id)`

## Setup

1) Apply schema/RLS:
   - `nullkode-apps/GGP/ggp_schema.sql`

2) Install dependencies:

```bash
cd mcp/ggp-mcp
npm install
```

1) Configure env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (preferred for RLS)
- `SUPABASE_SERVICE_ROLE_KEY` (fallback only)
- `PORT` (default 3020)

1) Run:

```bash
npm start
```

## Example

```bash
curl -X POST http://localhost:3020/tool/get_daily_snapshot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_JWT_WITH_UNIT_ID_CLAIM>" \
  -d '{"params":{"date":"2026-01-11","unit_id":"<unit-uuid>"}}'
```
