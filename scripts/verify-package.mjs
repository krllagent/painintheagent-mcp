import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";

const metadata = JSON.parse(readFileSync("server.json", "utf8"));
const archive = readFileSync(`artifacts/painintheagent-mcp-${metadata.version}.mcpb`);
assert.equal(createHash("sha256").update(archive).digest("hex"), metadata.packages[0].fileSha256);
const entries = unzipSync(archive);
for (const name of Object.keys(entries)) assert.ok(!name.startsWith("/") && !name.split("/").includes(".."), name);
for (const name of ["manifest.json", "dist/index.cjs", "LICENSE", "THIRD_PARTY_NOTICES.md", "README.md", "docs/api.md"]) assert.ok(entries[name], name);
const manifest = JSON.parse(new TextDecoder().decode(entries["manifest.json"]));
assert.equal(manifest.version, metadata.version);
assert.equal(manifest.server.entry_point, "dist/index.cjs");
assert.equal(manifest.user_config.api_key.sensitive, true);
assert.equal(manifest.user_config.api_key.required, true);
assert.equal(Buffer.compare(entries["dist/index.cjs"], readFileSync("dist/index.cjs")), 0);
console.log("MCPB entries, embedded server, version and registry hash verified.");
