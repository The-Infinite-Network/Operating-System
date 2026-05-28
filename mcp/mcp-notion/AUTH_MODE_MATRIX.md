# Auth Mode Matrix (MCP Notion)

This server supports two LLM auth modes:

## 1) Gemini AI Studio (API Key)

- Set `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL` (default: gemini-1.5-flash)
- **Priority:** If `GEMINI_API_KEY` exists, it is always used.

## 2) Vertex AI (GCP)

- Set `GCP_PROJECT_ID`
- Optional: `GCP_REGION`, `VERTEX_MODEL`, `AUTH_MODE`
- Auth via ADC or service account (`GOOGLE_APPLICATION_CREDENTIALS`)

## Resolution Rules

- If `GEMINI_API_KEY` is set → API Key mode
- Else if `GCP_PROJECT_ID` is set → Vertex mode
- Else → server fails fast with a clear error

## Verification

- `GET /health` returns:
  - `llm.auth_mode_resolved`
  - `llm.model`
  - `request_id`

No secrets are ever returned in /health.
