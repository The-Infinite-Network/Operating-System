# REPO_OWNERSHIP.md

**Repository:** Operating-System
**Wave 3 Classification Date:** 2026-05-28
**Source:** WAVE3_REPO_BOUNDARY_CLASSIFICATION.md (in legacy source)

## Ownership

This repository is responsible for the **core INOS runtime, adapter, and control-plane layer**.

### Primary Components (from Wave 3)

- `mcp/` - All Model Context Protocol servers and scripts.
- `inos-api/` - Python backend services.
- `inos-shell/` - Primary React/Vite command center.
- Core platform documentation and contracts (AGENTS.md, CLAUDE.md, MCP validation docs, etc.)

### MCP Runtime Surfaces

- `mcp/mcp-notion` - Active Notion/Drive integration runtime.
- `mcp/scripts` - MCP helper and validation scripts.
- `mcp/webmcp` - Intentionally placed WebMCP specification/runtime-adjacent MCP surface under `Operating-System`; treat it as MCP/runtime infrastructure, not as a top-level system bucket or orphan project.

## Boundary Rule

`Operating-System` owns runtime surfaces, adapters, contracts, and control-plane behavior.

It does **not** become the source of truth for:

- TEAM AI capability source or agent doctrine
- VAP routing or private operator canon
- business/trust canon merely because the runtime reads or writes those systems

### Out of Scope

- Mission / Team orchestration logic -> TEAM-AI
- Entity-specific applications (Infinite-Earth, GGP, etc.) -> respective repos
- Standalone AI tooling (gemini-cli-desktop) -> parked or explicitly classified tooling

## Governance

Changes to core MCP contracts or the INOS platform layer should be coordinated with downstream consumers (TEAM-AI, etc.).

## Migration Notes

This baseline was created in Wave 4. File migration is committed separately after secret and boundary checks.

**Last Updated:** 2026-05-28
