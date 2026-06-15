# Operating-System MCP Surfaces

This folder contains MCP-related runtime and integration infrastructure owned by `Operating-System`.

## Classification

Everything in this folder is part of the `INOS` runtime/adaptor layer unless explicitly superseded by a narrower repo-boundary rule.

Current intentional surfaces:

- `mcp-notion` - active Notion/Drive MCP integration runtime
- `scripts` - MCP helper, validation, and launch support scripts
- `webmcp` - intentionally placed WebMCP MCP/runtime-adjacent surface under `Operating-System`

## Boundary Rule

These paths are MCP/runtime infrastructure.

They do not become:

- top-level architecture buckets
- TEAM AI canonical source
- VAP doctrine roots
- business/trust ownership roots

## Launch / Path Rule

Do not treat prior umbrella-folder placement as active.

Active local MCP surfaces for this repo should resolve from:

- `C:\dev\The-Infinite-Network\Operating-System\mcp\...`
