/**
 * 在将静态站点写入仓库根目录的 docs/ 之前，删除上一次构建产物，
 * 保留源码目录 docs/website 与 GitHub Pages 辅助文件。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 仓库根目录下的 docs/（本脚本位于 docs/website/scripts/） */
const docsRoot = path.resolve(__dirname, "..", "..");

const KEEP = new Set([
  "website",
  ".nojekyll",
  "README.md",
]);

if (!fs.existsSync(docsRoot)) {
  console.error("clean-docs-build: docs directory not found:", docsRoot);
  process.exit(1);
}

for (const name of fs.readdirSync(docsRoot)) {
  if (KEEP.has(name)) continue;
  const p = path.join(docsRoot, name);
  fs.rmSync(p, { recursive: true, force: true });
  console.log("removed:", path.relative(docsRoot, p));
}

const nojekyll = path.join(docsRoot, ".nojekyll");
fs.writeFileSync(nojekyll, "");
console.log("ensured:", path.relative(docsRoot, nojekyll));
