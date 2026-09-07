Please add Pain in the Agent MCP to the server directory.

- **Repository:** https://github.com/krllagent/painintheagent-mcp
- **Setup and API keys:** https://painintheagent.com/integrations/
- **Release:** https://github.com/krllagent/painintheagent-mcp/releases/tag/v0.1.0
- **Maintainer:** Kirill Balakhonov
- **License:** MIT
- **Transport:** local stdio, Node.js 22 or later

The client connects an AI writing workflow to the free Pain in the Agent text
watermark rewrite service. It returns revised prose with fidelity notes and
shares the website account's allowance of 100 successful runs per month, with
up to 10,000 characters per text.

Three tools are included: `start_rewrite`, `get_rewrite` and `get_limits`.
The client holds the streaming connection while the rewrite runs. Reusing a
request ID retrieves its status or result without starting more model work.
Optional removal of formulaic AI phrasing is off by default.

The release includes an MCPB for Claude Desktop. Codex and Claude Code plugins
and their repository catalogs are included in the source. Other stdio MCP
clients can run `node /absolute/path/painintheagent-mcp/dist/index.cjs`; the
bundle includes its dependencies. A free account key is supplied through
`PAININTHEAGENT_API_KEY`, with an optional `PAININTHEAGENT_BASE_URL` for a local
API gateway.

The package has been tested from an empty directory through MCP stdio and
through a browser-created key, real API handlers and SQLite with a fictional
local pipeline. The underlying service's research and limitations are linked
from the setup page. Private Claude/Gemini watermark keys cannot be verified,
and detector results are not guaranteed. Text handling is disclosed at
https://painintheagent.com/privacy/.
