import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ClientError, RewriteClient } from "./client.mjs";

const instructions = "Use this service only for text operations the user asks for: removing a text watermark, humanizing, comparing two versions or checking for AI writing. start_rewrite and start_humanize use characters from the account's monthly plan ($5 a month for 100,000 characters, shared with the website and the remote MCP); only a successful changed result is charged. Comparisons and AI checks are free and count toward a separate limit of 100 checks a day. Save the run_id and read get_result instead of starting another request. Keep this MCP process open while a run works. The ChatGPT, Claude and Gemini watermark detectors are not public, so complete removal cannot be verified.";
const server = new McpServer({ name: "painintheagent-mcp", version: "0.3.0" }, { instructions });
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
  title: "Remove a text watermark",
  description: "Rewrite 100–10,000 characters to remove a statistical text watermark: one rewrite by one model that is instructed to keep the meaning, structure and formatting. A successful changed result uses the input character count from the account's monthly plan; a rewrite that fails its checks is not charged. Returns a run_id promptly. Keep the MCP process open and call get_rewrite after 15 seconds. Complete removal cannot be verified. Use only for text the user asked to process.",
  inputSchema: {
    text: z.string().min(100).max(20_000).describe("The complete text to rewrite. Do not include secrets or unrelated files."),
    slop_removal: z.boolean().default(false).describe("Accepted for compatibility; it has no effect."),
    run_id: runId.optional().describe("Optional lowercase UUID for idempotency. Reusing the same ID and input cannot start another model run."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
}, (input) => result(() => api().start(input)));

server.registerTool("get_rewrite", {
  title: "Read rewrite progress or result",
  description: "Read a previous run by its run_id. Never starts or retries model work and never uses characters. A pending result includes a suggested polling interval. Keep the existing process open while it works.",
  inputSchema: { run_id: runId },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, ({ run_id }) => result(() => api().get(run_id)));

server.registerTool("get_limits", {
  title: "Read the account allowance",
  description: "Read the account's character allowance shared with the website and the remote MCP: characters used and remaining in the paid month, the per-text limit and when the month ends. Does not use characters. Running requests reserve their characters until they finish.",
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, () => result(() => api().limits()));

const textSchema = z.string().min(100).max(20_000).describe("100–10,000 Unicode characters of prose the user asked to process.");
const startAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
server.registerTool("start_humanize", {
  title: "Humanize and remove the watermark", description: "Humanize AI text and remove its statistical watermark by replacing the wording throughout, with source checks and before-and-after AI scores. A successful run uses the input character count from the account's monthly plan. Stores the submitted text and returns a run_id; read it with get_result. Complete watermark removal cannot be verified.",
  inputSchema: { text: textSchema, watermark_removal: z.boolean().default(false).describe("Accepted for compatibility; watermark-free rewriting is always included."), run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ ...input, operation: "humanize" })));
server.registerTool("start_watermark_comparison", {
  title: "Compare a source and rewrite", description: "Compare source_text and candidate_text for meaning changes. This does not detect ChatGPT, Claude or Gemini watermarks. Free: counts toward the separate daily limit of checks, not the character allowance. Stores both texts. Read with get_result.",
  inputSchema: { source_text: textSchema, candidate_text: textSchema, run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ text: input.source_text, candidate_text: input.candidate_text, run_id: input.run_id, operation: "compare" })));
server.registerTool("start_ai_detection", {
  title: "Check for AI writing", description: "Score prose with a trained AI detector (0-100) and highlight AI-writing patterns with quoted passages. At least 80 words; fullest coverage for English. Results do not prove authorship. Free: counts toward the separate daily limit of checks, not the character allowance. Stores the text. Read with get_result.",
  inputSchema: { text: textSchema, run_id: runId.optional() }, annotations: startAnnotations,
}, input => result(() => api().start({ ...input, operation: "detect-ai" })));
server.registerTool("get_result", {
  title: "Read a text tool result", description: "Read progress or a result by run_id for any text tool. Never starts model work or uses characters.",
  inputSchema: { run_id: runId }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, ({ run_id }) => result(() => api().get(run_id)));

server.connect(new StdioServerTransport()).catch(() => {
  process.stderr.write("MCP startup failed. Check the installation.\n");
  process.exit(1);
});
// Closing the host ends the stream too; this client does not promise durable
// processing after shutdown. The saved run_id can still retrieve a saved result.
process.stdin.on("end", () => process.exit(0));
