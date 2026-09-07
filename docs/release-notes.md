Initial MCP client for the free Pain in the Agent text watermark rewrite service.

- `start_rewrite`, `get_rewrite` and `get_limits` use the same hosted pipeline and free account quota as the web tool.
- Repeated request IDs retrieve an existing run without starting new model work.
- The MCPB includes its Node dependencies. Codex and Claude Code plugin packages are included in the source repository.
- Requires a free account key from https://painintheagent.com/integrations/ and Node.js 22 or later. Keep the client open during a rewrite.

Validated with fictional text against a local HTTP service, actual API handlers and SQLite, including a browser-created key and a fresh MCP stdio process. No live-provider run was made for this client release. The client does not verify private watermark keys or guarantee detector results.
