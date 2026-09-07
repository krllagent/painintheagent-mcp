import { createHash, randomUUID } from "node:crypto";

export class ClientError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const LOST = "The connection ended before acceptance was confirmed. Use get_rewrite with this ID; do not start another rewrite.";

export function resolveBaseUrl(override) {
  const url = new URL(override === undefined ? "https://painintheagent.com" : override);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ClientError("PAININTHEAGENT_BASE_URL must be an HTTP(S) base URL without credentials, query, or fragment.");
  }
  if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new ClientError("Use HTTPS, or HTTP on localhost for a local gateway.");
  }
  return url.toString().replace(/\/+$/u, "");
}

async function boundedJson(response) {
  if (!response.body) throw new ClientError("The service returned an empty response.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw new ClientError("Service response exceeded the size limit.");
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export class RewriteClient {
  #base;
  #key;
  #fetch;
  #jobs = new Map();
  constructor(env = process.env, fetchImpl = fetch) {
    this.#base = resolveBaseUrl(env.PAININTHEAGENT_BASE_URL);
    this.#key = env.PAININTHEAGENT_API_KEY;
    this.#fetch = fetchImpl;
  }

  #headers() {
    if (!this.#key || this.#key !== this.#key.trim() || /[\r\n]/u.test(this.#key)) {
      throw new ClientError("Set PAININTHEAGENT_API_KEY using a key from https://painintheagent.com/integrations/. Never paste the key into a conversation.");
    }
    return { Authorization: `Bearer ${this.#key}`, "Content-Type": "application/json", Accept: "application/json, application/x-ndjson" };
  }

  async #read(path) {
    const response = await this.#fetch(`${this.#base}${path}`, { method: "GET", headers: this.#headers(), redirect: "error", signal: AbortSignal.timeout(15_000) });
    const body = await boundedJson(response);
    if (!response.ok) throw new ClientError(`Service request failed (${response.status}, ${safeCode(body.error_code)}).`);
    return body;
  }

  async limits() { return this.#read("/api/v1/watermark/limits"); }

  async start({ text, slop_removal = false, run_id = randomUUID() }) {
    if (typeof text !== "string" || Array.from(text).length < 100 || Array.from(text).length > 10_000 || !text.trim()) throw new ClientError("Supply 100–10,000 characters of text. Long documents are not split automatically.");
    if (!UUID.test(run_id)) throw new ClientError("run_id must be a lowercase UUID.");
    if (typeof slop_removal !== "boolean") throw new ClientError("slop_removal must be a boolean.");
    const headers = this.#headers();
    const hash = createHash("sha256").update(JSON.stringify([text, slop_removal])).digest("hex");
    const prior = this.#jobs.get(run_id);
    if (prior) {
      if (prior.hash !== hash) throw new ClientError("This request ID belongs to different input.");
      return prior.value;
    }
    if ([...this.#jobs.values()].filter((job) => job.active).length >= 3) throw new ClientError("Three rewrites are already running in this client. Wait for one to finish.");
    // Bound local memory without storing source text or credentials on disk.
    if (this.#jobs.size >= 100) {
      const old = [...this.#jobs].find(([, job]) => !job.active);
      if (old) this.#jobs.delete(old[0]);
    }
    const controller = new AbortController();
    const job = { hash, active: true, value: { status: "pending", run_id, poll_after_seconds: 15 } };
    this.#jobs.set(run_id, job);
    const headerTimeout = setTimeout(() => controller.abort(), 15_000);
    headerTimeout.unref?.();
    let response;
    try {
      response = await this.#fetch(`${this.#base}/api/v1/watermark/run`, {
        method: "POST", headers, redirect: "error", body: JSON.stringify({ text, slop_removal, run_id }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35 * 60 * 1000)]),
      });
    } catch {
      job.active = false;
      job.value = { status: "unknown", run_id, message: LOST };
      return job.value;
    } finally {
      clearTimeout(headerTimeout);
    }
    if (!response.ok || !response.headers.get("content-type")?.includes("application/x-ndjson")) {
      const bodyTimeout = setTimeout(() => controller.abort(), 15_000);
      bodyTimeout.unref?.();
      try {
        const payload = await boundedJson(response);
        job.value = response.ok ? { ...payload, run_id } : { status: "error", run_id, http_status: response.status, error_code: safeCode(payload.error_code) };
      } catch {
        job.value = { status: "unknown", run_id, message: LOST };
      } finally {
        clearTimeout(bodyTimeout);
      }
      job.active = false;
      return job.value;
    }
    // The local MCP process owns this connection until the terminal event.
    // No detached Cloudflare job is assumed and no POST is retried.
    void this.#consume(response, job, run_id);
    return job.value;
  }

  async #consume(response, job, run_id) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let line = "";
    let bytes = 0;
    let terminal = false;
    const accept = (value) => {
      if (terminal || !value.trim()) return;
      const event = JSON.parse(value);
      if (event.type === "result" && typeof event.text === "string") {
        const { type, ...payload } = event;
        job.value = { ...payload, status: "success", run_id };
        terminal = true;
      } else if (event.type === "error") {
        job.value = { status: "error", run_id, error_code: safeCode(event.error_code) };
        terminal = true;
      } else if (event.type === "progress" && !terminal) {
        job.value = { status: "pending", run_id, progress: event, poll_after_seconds: 15 };
      }
    };
    try {
      if (!reader) throw new ClientError("No stream");
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_RESPONSE_BYTES * 8) throw new ClientError("Stream too large");
        line += decoder.decode(value, { stream: true });
        let newline;
        while ((newline = line.indexOf("\n")) !== -1) {
          accept(line.slice(0, newline));
          line = line.slice(newline + 1);
        }
        if (line.length > MAX_RESPONSE_BYTES) throw new ClientError("Line too large");
        if (terminal) break;
      }
      accept(line + decoder.decode());
    } catch {
      // A saved result may still be available through the recovery GET.
    } finally {
      if (!terminal) job.value = { status: "unknown", run_id, message: "The stream ended without a result. Use get_rewrite with this ID. Do not automatically submit the text again." };
      job.active = false;
      await reader?.cancel().catch(() => {});
    }
  }

  async get(run_id) {
    if (!UUID.test(run_id)) throw new ClientError("run_id must be a lowercase UUID.");
    const job = this.#jobs.get(run_id);
    if (job && (job.active || job.value.status === "success")) return job.value;
    return this.#read(`/api/v1/watermark/run?id=${encodeURIComponent(run_id)}`);
  }
}

function safeCode(value) { return typeof value === "string" && /^[a-z_]{1,64}$/u.test(value) ? value : "service_error"; }
