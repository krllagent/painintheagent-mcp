import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ClientError, RewriteClient } from "./client.mjs";

const instructions = "Use this service only for text operations the user requests: rewriting, humanizing, comparing versions or checking AI writing signals. Every successful operation uses one shared account run across the website, API and MCP. Save the run_id and read get_result instead of starting another request. Keep this MCP process open during processing. The service cannot verify private vendor watermarks or prove authorship. Show source notes and quoted style evidence with results.";
const server = new McpServer({ name: "painintheagent-mcp", version: "0.2.0" }, { instructions });
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

const textSchema = z.string().min(100).max(20_000).describe("100–10,000 Unicode characters of prose the user asked to process.");
const startAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
server.registerTool("start_humanize", {
  title: "Humanize AI writing", description: "Make targeted style edits with source checks. Optional watermark_removal adds deep rewriting. Uses one shared run, stores submitted text, and returns a run_id. Read with get_result. No private watermark guarantee.",
  inputSchema: { text: textSchema, watermark_removal: z.boolean().default(false), run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ ...input, operation: "humanize" })));
server.registerTool("start_watermark_comparison", {
  title: "Compare a source and rewrite", description: "Compare source_text and candidate_text for meaning changes. Uses one shared run and stores both supplied texts. This does not detect Claude or Gemini private watermarks. Read with get_result.",
  inputSchema: { source_text: textSchema, candidate_text: textSchema, run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ text: input.source_text, candidate_text: input.candidate_text, run_id: input.run_id, operation: "compare" })));
server.registerTool("start_ai_detection", {
  title: "Check AI writing signals", description: "Inspect at least 80 words of English or Russian prose for AI-like writing patterns. Shows quoted evidence, not a calibrated authorship probability. Uses one shared run and stores the text. Read with get_result.",
  inputSchema: { text: textSchema, run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ ...input, operation: "detect-ai" })));
server.registerTool("get_result", {
  title: "Read a text tool result", description: "Read progress or a result by run_id for any text tool. Never starts model work or uses another run.",
  inputSchema: { run_id: runId }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, ({ run_id }) => result(() => api().get(run_id)));

server.connect(new StdioServerTransport()).catch(() => {
  process.stderr.write("MCP startup failed. Check the installation.\n");
  process.exit(1);
});
// Closing the host ends the stream too; this client does not promise durable
// processing after shutdown. The saved run_id can still retrieve a saved result.
process.stdin.on("end", () => process.exit(0));
