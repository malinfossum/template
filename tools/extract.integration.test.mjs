import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { extract } from "./extract.mjs";

const WORKBENCH = resolve(import.meta.dirname, "..");

test("real design-system extract copies lean parts, excludes gallery, records version", () => {
  const target = mkdtempSync(join(tmpdir(), "wb-int-"));
  const r = extract({ libraryName: "design-system", workbenchRoot: WORKBENCH, targetDir: target });
  assert.equal(r.status, "copied-fresh");
  assert.ok(existsSync(join(target, "design-system", "tokens", "index.css")));
  assert.ok(existsSync(join(target, "design-system", "components", "index.css")));
  assert.ok(!existsSync(join(target, "design-system", "gallery")), "gallery must NOT be copied");
  assert.ok(!existsSync(join(target, "design-system", "docs")), "docs must NOT be copied");
  const anchor = readFileSync(join(target, "design-system", "tokens", "index.css"), "utf8");
  assert.match(anchor, /workbench-lib: design-system v1\.3\.0/);
  rmSync(target, { recursive: true, force: true });
});

test("real storyboard extract copies engine only and records version in engine/index.css", () => {
  const target = mkdtempSync(join(tmpdir(), "wb-int-"));
  const r = extract({ libraryName: "storyboard", workbenchRoot: WORKBENCH, targetDir: target });
  assert.equal(r.status, "copied-fresh");
  assert.ok(existsSync(join(target, "storyboard", "engine", "registry.js")));
  assert.ok(!existsSync(join(target, "storyboard", "screens")), "demo screens must NOT be copied");
  assert.ok(!existsSync(join(target, "storyboard", "index.html")), "demo index must NOT be copied");
  const anchor = readFileSync(join(target, "storyboard", "engine", "index.css"), "utf8");
  assert.match(anchor, /workbench-lib: storyboard v1\.0\.0/);
  rmSync(target, { recursive: true, force: true });
});
