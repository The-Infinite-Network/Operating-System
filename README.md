# INOS (Infinite Network OS) - Clean Boot

## Quick start (recommended)

```powershell
cd C:\dev\The-Infinite-Network\Operating-System
npm install          # one time (registers the local scripts)
npm run start-inos-clean
```

Or simply:

```powershell
npm start
```

This runs the full clean boot:

- Python API → http://localhost:8000/health
- Node API (shell server) → http://localhost:3005/health
- mcp-notion clean runtime → http://localhost:3002/health
- INOS Vite shell → http://localhost:5173

## Other variants

```powershell
npm run start-inos-clean:shell-only     # skip MCP, just UI + APIs
npm run start-inos-clean:visible-mcp    # start the mcp-notion process in a visible window (for debugging)
```

## Direct PowerShell (still supported)

```powershell
pwsh -ExecutionPolicy Bypass -File ./start-inos-clean.ps1
pwsh -ExecutionPolicy Bypass -File ./start-inos-clean.ps1 -ShellOnly
```

## Secrets

Private runtime secrets (NOTION_API_KEY etc.) are loaded from:

`%USERPROFILE%\.infinite-network\secrets\inos-runtime.json`

Never commit this file.

Non-secret canonical values live in `mcp/mcp-notion/.env.local`.

## Components started by the clean boot

| Component     | Port | Health                     | Notes |
|---------------|------|----------------------------|-------|
| Python API    | 8000 | /health                    | FastAPI / uvicorn |
| Node API      | 3005 | /health                    | inos-shell/server |
| mcp-notion    | 3002 | /health + Fulcrum schema   | clean runtime (dist/index.js) |
| INOS shell    | 5173 | /                          | Vite dev server |

The orchestrator (`start-inos-clean.ps1`) does proper health waiting, stale process detection for the MCP port, and secret injection without polluting .env.local.

## Notes

- The root `package.json` was added so you can use `npm run start-inos-clean` / `npm start`.
- Paths inside the scripts are now dynamic (`$PSScriptRoot`) instead of hard-coded, so the folder can be moved.
- The Microsoft Store version of Claude etc. is unrelated to this local boot.
```

## Summary of changes

I made `npm run start-inos-clean` (and `npm start`) a real, first-class command.

### What I changed

1. **Created** `package.json` at the Operating-System root with proper scripts:
   - `npm run start-inos-clean`
   - `npm start`
   - variants for shell-only and visible-mcp

2. **Improved** `start-inos-clean.ps1`:
   - Now computes `$root = $PSScriptRoot` dynamically (no more hard-coded `C:\dev\...` path).
   - Will continue to work even if you move the folder or run it via npm from any working directory.

3. **Hardened** the delegated `mcp/mcp-notion/scripts/start_clean_runtime.ps1` the same way.

Your last boot output looked perfect (all four stages green).

Run it the npm way from now on:

```powershell
cd C:\dev\The-Infinite-Network\Operating-System
npm run start-inos-clean
```

Let me know if you want:
- A cross-platform (non-PowerShell) version
- `npm run dev` that only brings up the shell + watches
- Integration with the Docker MCP gateway
- Or anything else around the clean boot.