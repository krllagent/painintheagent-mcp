# Distribution status

Verified on September 7, 2026. Publication, submission and directory review
are recorded separately. The service remains free under its existing quotas.

| Destination | Status and evidence |
| --- | --- |
| GitHub source | [Public repository](https://github.com/krllagent/painintheagent-mcp); the published Git tree matches the reviewed local source |
| GitHub release / MCPB | [v0.1.0](https://github.com/krllagent/painintheagent-mcp/releases/tag/v0.1.0) published; downloaded artifact matches the local validated bundle byte for byte |
| Official MCP Registry | [Record](https://registry.modelcontextprotocol.io/v0.1/servers?search=painintheagent&limit=5) active; name `io.github.krllagent/painintheagent-mcp`, version `0.1.0` |
| Codex repository plugin | Published at `plugins/painintheagent-mcp/`; manifest and skill validate; local repository marketplace added successfully |
| Claude Code repository plugin | Published at `claude-plugins/painintheagent-mcp/`; strict manifest validation passes |
| Claude Desktop MCPB | Downloadable release artifact; manifest and fresh stdio process verified; no public Desktop directory approval claimed |
| MCP.so | [Submission #3983](https://github.com/chatmcp/mcpso/issues/3983) sent and open for review; no live directory card confirmed |
| Smithery | MCPB is ready; authenticated publisher session/namespace is needed, and the free listing path must be confirmed |
| Glama | `glama.json` prepared; Add Server opens a sign-up/sign-in flow; no authenticated session is available in this task |
| mcpservers.org | Free form inspected; awaiting the maintainer's chosen contact email |
| Cline marketplace | Install instructions and 400×400 icon prepared; the required Cline-driven installation check has not been performed |
| OpenAI public plugin directory | Not submitted; its server-backed flow requires a public HTTP MCP endpoint and verified publisher access |
| Other curated indexes | No individual listing confirmed; registry publication alone is not counted as acceptance elsewhere |

The published bundle is 153,057 bytes. Its SHA-256 is
`722e6c4a4e0679a7402930a12d940b49d53be9be14c6589c6c0dbd9d9da49ba4`.
The official registry record reports `active`, published at
`2026-09-07T08:33:09.478944Z`. The [publishing workflow](https://github.com/krllagent/painintheagent-mcp/actions/runs/34101120423)
completed successfully. An earlier attempt failed on the registry step; the
subsequent attempt and public API readback establish the current status.

Verification uses fictional inputs with a local fake pipeline, actual API
handlers and SQLite, including a browser-created key and a fresh bundled MCP
process over stdio. Production checks verified the page and authentication
boundaries without signing in or calling a model. No live-provider run was
performed for this client release.

See [remaining submission materials](submissions/remaining.md). Contact details,
authentication and actual client-test confirmations are not invented to fill
required submission fields.
