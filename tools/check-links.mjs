// Verifies every relative href/src in the site's HTML pages points at a file
// or directory that exists in the repo. External URLs and pure anchors are
// skipped. Exit 1 on any broken reference.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "guide/index.html", "docs/index.html"];

let broken = 0;
for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page), "utf8");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|#)/.test(url)) continue;
    const path = url.split("#")[0].split("?")[0];
    if (!path) continue;
    const target = join(ROOT, dirname(page), path);
    if (!existsSync(target)) {
      console.error(`BROKEN: ${page} -> ${url}`);
      broken = 1;
    }
  }
}

console.log(broken ? "link check FAILED" : `link check OK (${PAGES.length} pages)`);
process.exit(broken);
