# REPO_OWNERSHIP.md

**Repository:** Operating-System
**Wave 3 Classification Date:** 2026-05-28
**Source:** WAVE3_REPO_BOUNDARY_CLASSIFICATION.md (in legacy source)

## Ownership

This repository is responsible for the **core INOS platform and integration layer**.

### Primary Components (from Wave 3)

- `mcp/` - All Model Context Protocol servers and scripts.
- `inos-api/` - Python backend services.
- `inos-shell/` - Primary React/Vite command center.
- Core platform documentation and contracts (AGENTS.md, CLAUDE.md, MCP validation docs, etc.)

### Out of Scope

- Mission / Team orchestration logic -> TEAM-AI
- Entity-specific applications (Infinite-Earth, GGP, etc.) -> respective repos
- Standalone AI tooling (gemini-cli-desktop) -> parked or explicitly classified tooling

## Governance

Changes to core MCP contracts or the INOS platform layer should be coordinated with downstream consumers (TEAM-AI, etc.).

## Migration Notes

This baseline was created in Wave 4. File migration is committed separately after secret and boundary checks.

**Last Updated:** 2026-05-28
