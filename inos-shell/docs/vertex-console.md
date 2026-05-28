# Vertex Console v2

## Purpose

Operator-facing panel to send prompts to MCP tool `vertex.generateText` and review responses in a read-only JSON viewer.

## Tool Contract (v2)

- Inputs: `prompt`, `system`, `max_output_tokens`, `temperature`, `json_only`, `request_id` (optional)
- Output: `ok`, `request_id`, `model`, `text`, `usage`, `timing_ms`, `error?`

## Acceptance Checklist

- View loads via `?view=vertex` or `/vertex` without breaking other views.
- Clicking Run calls `POST /tool/vertex.generateText` and renders JSON response.
- `request_id` is visible after response.
- Latency is shown in milliseconds.
- Copy JSON button copies the response payload.
- If MCP is down, an error panel renders and the last successful response remains visible.
- Health button calls `POST /tool/vertex.health` and shows project_id, region, model, auth, timing_ms.

## Manual Test Steps

1. Navigate to `http://localhost:5173/?view=vertex` or `http://localhost:5173/vertex`.
2. Enter a prompt and click Run.
3. Confirm response JSON renders and Copy JSON works.
4. Trigger a failure (stop MCP) and verify error panel appears while last response stays.
5. Click Health and verify fields render.
