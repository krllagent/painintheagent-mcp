import { test } from "node:test";
import assert from "node:assert/strict";
import { RewriteClient, resolveBaseUrl } from "../src/client.mjs";

const text = "This is a fictional test paragraph with enough characters to exercise the service boundary. A supplier is expected to deliver next week, but that date is conditional.";
const id = "18cba2b4-1319-4c23-8237-fcc0448d0a33";
const key = "local-test-key";

test("endpoint resolution is deterministic and rejects unsafe credential URLs", async () => {
  assert.equal(resolveBaseUrl(), "https://painintheagent.com");
  assert.equal(resolveBaseUrl("http://127.0.0.1:8787/painintheagent/"), "http://127.0.0.1:8787/painintheagent");
  assert.throws(() => resolveBaseUrl(""));
  assert.throws(() => resolveBaseUrl("https://user:password@example.invalid"));
  assert.throws(() => resolveBaseUrl("https://example.invalid?token=secret"));
  const calls = [];
  const client = new RewriteClient({ PAININTHEAGENT_API_KEY: key, PAININTHEAGENT_BASE_URL: "http://127.0.0.1:8787/painintheagent" }, async (url, init) => {
    calls.push([url, init]);
    return new Response('{"error_code":"invalid_api_key"}', { status: 401 });
  });
  await assert.rejects(client.limits(), /invalid_api_key/u);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "http://127.0.0.1:8787/painintheagent/api/v1/watermark/limits");
  assert.equal(calls[0][1].headers.Authorization, `Bearer ${key}`);
  assert.equal(calls[0][1].redirect, "error");
});

test("start returns while streaming continues; duplicate IDs never make another POST", async () => {
  let controller;
  let requests = 0;
  const stream = new ReadableStream({ start(value) { controller = value; } });
  const client = new RewriteClient({ PAININTHEAGENT_API_KEY: key }, async () => {
    requests++;
    return new Response(stream, { headers: { "content-type": "application/x-ndjson" } });
  });
  assert.equal((await client.start({ text, run_id: id })).status, "pending");
  assert.equal((await client.start({ text, run_id: id })).status, "pending");
  await assert.rejects(client.start({ text: text + " Changed.", run_id: id }), /different input/u);
  controller.enqueue(new TextEncoder().encode('{"type":"progress","stage":"semantic-audit"}\n'));
  await new Promise(setImmediate);
  assert.equal((await client.get(id)).progress.stage, "semantic-audit");
  controller.enqueue(new TextEncoder().encode('{"type":"result","text":"Revised sample.","review":[]}\n'));
  controller.close();
  await new Promise(setImmediate);
  assert.equal((await client.get(id)).text, "Revised sample.");
  assert.equal(requests, 1);
});

test("lost transport returns the ID and recovery uses GET without restarting work", async () => {
  const calls = [];
  const client = new RewriteClient({ PAININTHEAGENT_API_KEY: key }, async (url, init) => {
    calls.push(init.method);
    if (init.method === "POST") throw new Error("local test disconnect");
    return new Response(JSON.stringify({ status: "success", text: "Recovered sample.", run_id: id }));
  });
  assert.deepEqual(await client.start({ text, run_id: id }), { status: "unknown", run_id: id, message: "The connection ended before acceptance was confirmed. Use get_rewrite with this ID; do not start another rewrite." });
  assert.equal((await client.get(id)).text, "Recovered sample.");
  assert.deepEqual(calls, ["POST", "GET"]);
});

test("invalid inputs and missing credentials fail before any network request", async () => {
  let called = false;
  const client = new RewriteClient({}, async () => { called = true; });
  await assert.rejects(client.limits(), /PAININTHEAGENT_API_KEY/u);
  await assert.rejects(client.start({ text: "short", run_id: id }), /100/u);
  await assert.rejects(client.get("not-an-id"), /UUID/u);
  assert.equal(called, false);
});
