import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("fresh bundled installation speaks MCP over stdio and rewrites through local HTTP", async () => {
  let posts = 0;
  const service = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, "Bearer local-only-fixture");
    if (req.method === "POST") {
      posts++;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (!body.operation) assert.equal(body.slop_removal, false);
      else assert.equal(Object.hasOwn(body, "slop_removal"), false);
      res.writeHead(200, { "Content-Type": "application/x-ndjson" });
      res.write('{"type":"progress","stage":"semantic-audit"}\n');
      setTimeout(() => res.end('{"type":"result","text":"A fictional rewritten paragraph.","review":[],"runs_used":1}\n'), 50);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.end('{"runs_limit":100,"runs_used":0,"max_chars":10000,"shared_with_browser":true}');
    }
  });
  service.listen(0, "127.0.0.1");
  await once(service, "listening");
  const temp = await mkdtemp(path.join(tmpdir(), "pia-mcp-fresh-"));
  await copyFile(new URL("../dist/index.cjs", import.meta.url), path.join(temp, "index.cjs"));
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(temp, "index.cjs")], cwd: temp, env: { PATH: process.env.PATH, PAININTHEAGENT_API_KEY: "local-only-fixture", PAININTHEAGENT_BASE_URL: `http://127.0.0.1:${service.address().port}` }, stderr: "pipe" });
  const client = new Client({ name: "offline-test", version: "1.0.0" });
  let stderr = "";
  transport.stderr?.on("data", (chunk) => { stderr += chunk; });
  try {
    await client.connect(transport);
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), ["get_limits", "get_result", "get_rewrite", "start_ai_detection", "start_humanize", "start_rewrite", "start_watermark_comparison"]);
    const limits = await client.callTool({ name: "get_limits", arguments: {} });
    assert.equal(limits.structuredContent.runs_limit, 100);
    const started = await client.callTool({ name: "start_rewrite", arguments: { text: "A fictional local test paragraph with enough length to verify the protocol. The supplier is expected to deliver next week if the small trial succeeds." } });
    const id = started.structuredContent.run_id;
    await new Promise((resolve) => setTimeout(resolve, 100));
    const finished = await client.callTool({ name: "get_rewrite", arguments: { run_id: id } });
    assert.equal(finished.structuredContent.status, "success");
    assert.equal(posts, 1);
    const text = "A fictional local test paragraph with enough length to verify the protocol. The supplier is expected to deliver next week if the small trial succeeds. ";
    for (const [name, args] of [["start_humanize", { text, watermark_removal: true }], ["start_watermark_comparison", { source_text: text, candidate_text: text + " The comparison candidate." }], ["start_ai_detection", { text: text.repeat(4) }]]) {
      const queued = await client.callTool({ name, arguments: args });
      assert.notEqual(queued.isError, true);
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = await client.callTool({ name: "get_result", arguments: { run_id: queued.structuredContent.run_id } });
      assert.equal(result.structuredContent.status, "success");
    }
    assert.equal(posts, 4);
    assert.equal(stderr, "");
  } finally {
    await client.close();
    service.closeAllConnections();
    await new Promise((resolve) => service.close(resolve));
    await rm(temp, { recursive: true, force: true });
  }
});
