# Install Pain in the Agent MCP

Install only when the user asks to connect the service. This is a local stdio
MCP server. Do not register the HTTPS REST API as an HTTP MCP server.

1. Download the source archive from the GitHub release or clone this repository.
2. Check that Node.js 22 or later is available. The included `dist/index.cjs`
   already contains its dependencies; running npm installation is unnecessary.
3. Configure your client's stdio MCP server with command `node` and one
   argument, the absolute path to `dist/index.cjs`.
4. The user creates an account key at https://painintheagent.com/integrations/
   and provides `PAININTHEAGENT_API_KEY` through the client's environment or
   secret settings. Do not ask for the key in a chat message or print it.
5. Omit `PAININTHEAGENT_BASE_URL` for the public service. If the operator
   provides a local gateway, forward that value too. Never switch endpoints
   or credentials after a failure.
6. Restart the client or its MCP connection. Confirm that `start_rewrite`,
   `start_humanize`, `start_watermark_comparison`, `start_ai_detection`,
   `get_result`, `get_rewrite` and `get_limits` are listed. `get_limits` verifies access
   without starting a model run.

For a processing test, use only the text the user explicitly asks to submit.
Call `start_rewrite` once, save its `run_id`, keep the process open and read
`get_rewrite` after the suggested interval. Failed connections do not justify
automatically submitting another request. See `docs/api.md` for recovery and
the shared free allowance.
