import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ClientError, RewriteClient } from "./client.mjs";

const instructions = "Use this service only when the user asks to rewrite their text or reduce a text watermark. start_rewrite sends the supplied text to painintheagent.com and consumes the account's shared free quota on success. Save the run_id and use get_rewrite; do not retry by starting a new run. Keep this MCP process open during processing. Review the returned text and fidelity notes before publishing. It cannot verify Claude or Gemini private watermark keys.";
const server = new McpServer({ name: "painintheagent-mcp", version: "0.1.0" }, { instructions });
let client;
const api = () => client ??= new RewriteClient();
const runId = z.string().uuid().describe("The run_id returned by start_rewrite. Reuse it to retrieve that run.");
async function result(work) {
  try {
    const data = await work();
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data, ...(data.status === "error" ? { isError: true } : {}) };
  } catch (error) {
    // Only locally generated validation messages are exposed. Fetch errors can
    // include URL details, so their default messages are kept out of stdout.
    const message = error instanceof ClientError
      ? error.message : "The service connection failed. Check configuration. For an existing run, use get_rewrite; do not automatically start another.";
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}
server.registerTool("start_rewrite", {
  title: "Start a text watermark rewrite",
  description: "Rewrite 100–10,000 characters through Pain in the Agent, with fidelity checks. Sends text to the hosted service; successful runs use the shared free account quota. Returns a run_id promptly. Keep the MCP process open and call get_rewrite after 15 seconds. No private-key watermark guarantee. Use only for text the user asked to process.",
  inputSchema: {
    text: z.string().min(100).max(20_000).describe("The complete text to rewrite. Do not include secrets or unrelated files."),
    slop_removal: z.boolean().default(false).describe("Also remove formulaic AI phrasing. Off by default."),
    run_id: runId.optional().describe("Optional lowercase UUID for idempotency. Reusing the same ID and input cannot start another model run."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
}, (input) => result(() => api().start(input)));

server.registerTool("get_rewrite", {
  title: "Read rewrite progress or result",
  description: "Read a previous run by its run_id. Does not start or retry model processing and does not consume rewrite quota. A pending result includes a suggested polling interval. Keep the existing process open while it works.",
  inputSchema: { run_id: runId },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, ({ run_id }) => result(() => api().get(run_id)));

server.registerTool("get_limits", {
  title: "Read the shared free account limits",
  description: "Read this account's character limit and monthly successful-run usage, shared with the website. Does not rewrite text or consume rewrite quota. Running requests also reserve slots until they finish.",
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, () => result(() => api().limits()));

server.connect(new StdioServerTransport()).catch(() => {
  process.stderr.write("MCP startup failed. Check the installation.\n");
  process.exit(1);
});
// Closing the host ends the stream too; this client does not promise durable
// processing after shutdown. The saved run_id can still retrieve a saved result.
process.stdin.on("end", () => process.exit(0));
