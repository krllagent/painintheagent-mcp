import { build } from "esbuild";
import { chmodSync, mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync, cpSync } from "node:fs";
import path from "node:path";

mkdirSync("dist", { recursive: true });
const built = await build({
  entryPoints: ["src/index.mjs"], outfile: "dist/index.cjs", bundle: true,
  platform: "node", format: "cjs", target: "node22", minify: false,
  banner: { js: "#!/usr/bin/env node" }, legalComments: "eof", metafile: true,
});
chmodSync("dist/index.cjs", 0o755);
const packages = new Set(Object.keys(built.metafile.inputs).filter((file) => file.includes("node_modules/")).map((file) => {
  const parts = file.slice(file.lastIndexOf("node_modules/") + 13).split("/");
  return parts[0].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}));
let notices = "# Bundled dependency licenses\n\n";
for (const name of [...packages].sort()) {
  const root = path.join("node_modules", name);
  const meta = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const license = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "LICENSE-MIT"].find((file) => existsSync(path.join(root, file)));
  if (!license) throw new Error(`Review the license file for ${name} before packaging.`);
  notices += `## ${name} ${meta.version} (${meta.license})\n\n${readFileSync(path.join(root, license), "utf8")}\n\n`;
}
writeFileSync("THIRD_PARTY_NOTICES.md", notices);
for (const plugin of ["plugins/painintheagent-mcp", "claude-plugins/painintheagent-mcp"]) {
  mkdirSync(`${plugin}/dist`, { recursive: true });
  copyFileSync("dist/index.cjs", `${plugin}/dist/index.cjs`);
  copyFileSync("LICENSE", `${plugin}/LICENSE`);
  copyFileSync("THIRD_PARTY_NOTICES.md", `${plugin}/THIRD_PARTY_NOTICES.md`);
}
cpSync("plugins/painintheagent-mcp/skills", "claude-plugins/painintheagent-mcp/skills", { recursive: true });
