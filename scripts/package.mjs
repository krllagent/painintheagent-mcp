import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { unzipSync, zipSync } from "fflate";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const stage = `artifacts/bundle-${version}`;
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
for (const file of ["dist", "manifest.json", "LICENSE", "THIRD_PARTY_NOTICES.md", "README.md"]) cpSync(file, `${stage}/${file}`, { recursive: true });
mkdirSync(`${stage}/docs`);
for (const file of ["api.md", "release-notes.md"]) cpSync(`docs/${file}`, `${stage}/docs/${file}`);
const artifact = `artifacts/painintheagent-mcp-${version}.mcpb`;
execFileSync(process.execPath, ["node_modules/@anthropic-ai/mcpb/dist/cli/cli.js", "pack", stage, artifact], { stdio: "inherit" });
// Fixed ZIP timestamps make the registry hash reproducible across checkouts.
const files = unzipSync(readFileSync(artifact));
const canonical = Object.fromEntries(Object.keys(files).sort().map((name) => [name, [files[name], { mtime: new Date("2020-01-01T00:00:00Z"), level: 9 }]]));
writeFileSync(artifact, zipSync(canonical));
const hash = createHash("sha256").update(readFileSync(artifact)).digest("hex");
const manifest = {
  $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  name: "io.github.krllagent/painintheagent-mcp",
  title: "Pain in the Agent",
  description: "Humanize, rewrite and analyze prose with one shared Pain in the Agent account allowance.",
  version,
  websiteUrl: "https://painintheagent.com/integrations/",
  repository: { url: "https://github.com/krllagent/painintheagent-mcp", source: "github" },
  packages: [{ registryType: "mcpb", identifier: `https://github.com/krllagent/painintheagent-mcp/releases/download/v${version}/painintheagent-mcp-${version}.mcpb`, fileSha256: hash, transport: { type: "stdio" } }],
};
writeFileSync("server.json", JSON.stringify(manifest, null, 2) + "\n");
writeFileSync("artifacts/SHA256SUMS", `${hash}  painintheagent-mcp-${version}.mcpb\n`);
