# Pain in the Agent MCP

Use the [Pain in the Agent text tools](https://painintheagent.com/tools/) from an AI client. Humanize drafts, rewrite text watermarks, compare versions or check AI writing signals. Confirmed email accounts share 100 successful operations per month across all tools, the website, API and MCP, with 100–10,000 characters per text.

The [research and examples](https://painintheagent.com/blog/text-watermark-removal-retest/) describe tests of rewrite methods against reference SynthID Text watermarks. Those measurements are separate from the live tool workflow. This client cannot verify Claude or Gemini's private watermark keys. AI writing signals are experimental style observations, not proof of authorship.

## Installation

First [sign in and create an API key](https://painintheagent.com/integrations/). Keep the key in your client's secret settings or environment, outside conversations and source control. You do not need an OpenRouter or OpenAI key.

### Claude Desktop

Download the `.mcpb` file from the [latest release](https://github.com/krllagent/painintheagent-mcp/releases/latest), open it in Claude Desktop, and enter the service key in its API key setting. The MCPB bundle contains its Node dependencies. It uses Node.js 22 or later.

### Codex

Clone this repository or extract a release. The committed `dist/index.cjs` is ready to run without `npm install`. Add this to your Codex MCP configuration, replacing the example absolute path with your checkout:

```toml
[mcp_servers.painintheagent]
command = "node"
args = ["/absolute/path/painintheagent-mcp/dist/index.cjs"]
env_vars = ["PAININTHEAGENT_API_KEY", "PAININTHEAGENT_BASE_URL"]
startup_timeout_sec = 15
tool_timeout_sec = 40
```

Set `PAININTHEAGENT_API_KEY` in the environment that starts Codex. Omit `PAININTHEAGENT_BASE_URL` for the public service. Restart the client after changing its environment.

A Codex plugin is also included at `plugins/painintheagent-mcp/`, with a repository marketplace at `.agents/plugins/marketplace.json`. To add this source, run `codex plugin marketplace add krllagent/painintheagent-mcp` and select **Pain in the Agent** from that source in the app. The generated catalog is named `personal`; it is a repository source, separate from OpenAI's public plugin directory. The plugin forwards the same two environment variables.

### Claude Code

Set `PAININTHEAGENT_API_KEY` in the environment that starts Claude Code. Then use:

```text
/plugin marketplace add krllagent/painintheagent-mcp
/plugin install painintheagent-mcp@painintheagent
```

The plugin includes a `rewrite` skill and the MCP server. A local checkout can also be loaded with `claude --plugin-dir /absolute/path/painintheagent-mcp/claude-plugins/painintheagent-mcp`.

### Cursor and other local MCP clients

Configure a stdio server with command `node` and one argument, the absolute path to `dist/index.cjs`. Supply `PAININTHEAGENT_API_KEY` through your client's environment or secret setting. Clients have different environment-variable substitution syntax, so use the format your client documents. The MCPB and source release contain the same server.

## Tools

| Tool | What it does |
| --- | --- |
| `start_rewrite` | Starts a rewrite and promptly returns a `run_id`. Optional `slop_removal` is off by default. |
| `start_humanize` | Makes targeted style edits with source checks. Optional `watermark_removal` adds deep rewriting. One shared run either way. |
| `start_watermark_comparison` | Compares `source_text` and `candidate_text` for meaning changes. Does not detect private vendor watermarks. |
| `start_ai_detection` | Checks at least 80 words of English or Russian prose for contextual AI writing signals. |
| `get_result` | Reads progress or the saved result for any text tool without starting model work. |
| `get_rewrite` | Returns progress, a saved result with fidelity notes, or an error for that ID. It starts no model work. |
| `get_limits` | Reads the existing account allowance and input limits. |

Ask your agent to use the tool you need and show its source notes or quoted style evidence. Keep the client open while it works; deep rewriting can take several minutes. The local MCP process holds the streaming connection. Closing it can interrupt the run. The separate remote MCP endpoint at `https://painintheagent.com/mcp` supports OAuth and continues queued jobs after disconnecting.

Save the request ID. If the stream fails, use `get_result` with that same ID. The earlier `get_rewrite` name still works. The client never automatically retries a POST. Reusing an ID with the same operation and input retrieves that run; a different operation, candidate or option is rejected. Failed runs do not consume successful-run quota. Pending requests reserve capacity until they finish or reach the server's deadline, and their IDs cannot start fresh work.

## Privacy and gateways

Only supplied text is sent. This client does not read your files, save prose to disk, or emit telemetry. The hosted service sends prose to its model provider and stores source text and results as described in the [privacy policy](https://painintheagent.com/privacy/). Your MCP host may retain tool inputs and outputs under its own settings. Do not submit secrets or confidential personal data.

The client reads `PAININTHEAGENT_API_KEY` and optional `PAININTHEAGENT_BASE_URL`. The default base URL is `https://painintheagent.com`. A configured gateway receives every request; there is no credential or endpoint fallback. HTTP is accepted only for localhost gateways. Authentication uses a bearer header, and redirects are rejected.

## Development

```sh
npm ci --ignore-scripts
npm run build
npm test
node scripts/package.mjs
```

The tests use fictional text and a local fake HTTP service. They cover endpoint selection, failed authentication, request reuse, dropped streams, and a fresh bundled installation speaking MCP over stdio. They do not call a paid model or claim to be live-provider validation.

See the [API reference](docs/api.md) and [distribution status](https://github.com/krllagent/painintheagent-mcp/blob/main/docs/distribution.md). The client is MIT-licensed. The hosted service and research have their own terms and evidence.
