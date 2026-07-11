# Workbench Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the public `template` repo into a named `workbench` with honest tiers (`libraries / scaffolds / tools / docs`), a unified dashboard, and a versioned extract tool that syncs libraries into web **and** C# projects by copy.

> **Amended 2026-07-11:** the `lab/` tier is dropped — `design-system-lab/` retires to `archive/design-system-lab/` (stale at v1.0.0; the DS `gallery/` + `sandbox/` are the dev surface). Dashboard has no lab card. Spec §9 gained the consumer-formatter rule (`"!design-system"` in consumer Biome includes — already shipped in web-vite).

**Architecture:** Move existing folders into tiers with `git mv` (history preserved). Add a dependency-free Node script (`tools/extract.mjs`) that reads a per-library `extract.json`, copies lean parts into a target, records the version in a served CSS comment, detects drift (`--check`), and refuses to clobber local edits (without `--force`). Replace the root redirect with a static, accessible dashboard built from the design-system's own classes. All work on a `workbench-v2` branch; merge is atomic so GitHub Pages never serves a broken intermediate. Rename + push happen only on explicit go-ahead.

**Tech Stack:** Node ≥18 (built-in `node:fs`, `node:path`, `node:test` — no new dependencies), vanilla HTML/CSS (the design-system), git.

**Spec:** [`docs/specs/2026-07-09-workbench-restructure.md`](../specs/2026-07-09-workbench-restructure.md)

## Global Constraints

Every task's requirements implicitly include these:

- **Release:** the repo releases as **v2.0.0**; `libraries/design-system/VERSION` stays **1.3.0** (internals unchanged).
- **Commits:** conventional style (`feat:` / `docs:` / `chore:`). **Never** add a `Co-Authored-By` trailer or any Claude/Generated-with attribution — Malin is the sole author.
- **Design-system internals are frozen** — this project relocates the folder only; do not edit any token/primitive/component file.
- **Extract tool safety:** filesystem APIs only; never interpolate a path into a shell; reject any path containing a `..` escape past its root; parse `extract.json` defensively (reject `__proto__`/`constructor`/`prototype` keys); a missing/malformed/unknown manifest is a hard error, never a copy-everything fallback.
- **No new runtime dependencies.** Tests use built-in `node:test` (`node --test <file>`).
- **Dashboard:** static, no build step; dark-first + both themes via the DS no-flash `data-theme` snippet; mobile-first; inherits the DS a11y baseline (skip link, `:focus-visible`, `prefers-reduced-motion`, ≥44×44px targets); one `<h1>` + `<h2>` per tier; every live card a semantic `<a>`; keep `.nojekyll` at root.
- **Branch:** all tasks commit to `workbench-v2` (already created). Do not touch `main` until Task 9.
- **Gated tasks (8, 10):** do not execute without Malin's explicit go-ahead in the moment — Task 8 edits a file under `.claude/` (protected); Task 10 renames the public repo and pushes.

All paths below are relative to the repo root `C:/Users/Nugget/Documents/Development/template` (Git Bash form). The repo is currently on branch `workbench-v2`.

---

### Task 1: Restructure folders into tiers (git mv)

**Files:**
- Move: `design-system/` → `libraries/design-system/`
- Move: `web-vite/`, `csharp-console/`, `csharp-console-mvc/`, `csharp-wpf/` → `scaffolds/<name>/`
- Move: `Reference/` → `reference/`; `Archive/` → `archive/`; `design-system-lab/` → `archive/design-system-lab/`
- Create: `libraries/storyboard/.gitkeep`, `libraries/storyboard/README.md`, `tools/.gitkeep`
- Modify: `.gitignore` (add `desktop.ini`)

**Interfaces:**
- Produces: the tier layout every later task depends on (`libraries/design-system/`, `scaffolds/web-vite/`, `tools/`).

- [ ] **Step 1: Move the library and scaffolds with history**

```bash
cd "C:/Users/Nugget/Documents/Development/template"
mkdir -p libraries scaffolds
git mv design-system libraries/design-system
git mv web-vite scaffolds/web-vite
git mv csharp-console scaffolds/csharp-console
git mv csharp-console-mvc scaffolds/csharp-console-mvc
git mv csharp-wpf scaffolds/csharp-wpf
git mv Reference reference
git mv Archive archive
git mv design-system-lab archive/design-system-lab
```

- [ ] **Step 2: Create the reserved storyboard home + tools dir**

```bash
mkdir -p libraries/storyboard tools
printf '' > libraries/storyboard/.gitkeep
printf '' > tools/.gitkeep
cat > libraries/storyboard/README.md <<'EOF'
# Storyboard (reserved)

Reserved home for the Storyboard library. Designed in Spec B
(`docs/specs/` — the storyboard sub-project). Empty until then.
EOF
```

- [ ] **Step 3: Ignore the Windows system file**

Append to `.gitignore` (create the line if absent):

```
desktop.ini
```

Then stop tracking it if it was tracked:

```bash
git rm --cached desktop.ini 2>/dev/null || true
```

- [ ] **Step 4: Verify the tree and that history followed**

```bash
ls -1 .                    # expect: libraries scaffolds tools docs reference archive index.html README.md ...
ls -1 libraries scaffolds  # expect design-system+storyboard ; web-vite+csharp-*
git log --follow --oneline -3 -- libraries/design-system/tokens/index.css
```
Expected: the tree matches spec §5; `git log --follow` shows commits from before the move (history preserved).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: restructure into workbench tiers (libraries/scaffolds/tools)"
```

---

### Task 2: Extract tool — manifest loading, path safety, copy planning

**Files:**
- Create: `tools/extract.mjs`
- Test: `tools/extract.test.mjs`

**Interfaces:**
- Produces:
  - `loadManifest(libraryDir: string) -> { versionFile: string, include: string[], exclude: string[] }` — throws on missing/malformed/dangerous-key/empty-include.
  - `assertWithinRoot(root: string, entry: string) -> string` (absolute path) — throws if `entry` escapes `root`.
  - `planCopy(libraryDir: string, manifest) -> string[]` — flat list of file paths (relative to `libraryDir`) to copy: every file under each `include` entry, minus `exclude` entries.

- [ ] **Step 1: Write the failing tests**

Create `tools/extract.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadManifest, assertWithinRoot, planCopy } from "./extract.mjs";

function fixtureLib() {
  const dir = mkdtempSync(join(tmpdir(), "wb-lib-"));
  mkdirSync(join(dir, "tokens"));
  writeFileSync(join(dir, "tokens", "index.css"), "/* tokens */");
  mkdirSync(join(dir, "gallery"));
  writeFileSync(join(dir, "gallery", "index.html"), "<x>");
  writeFileSync(join(dir, "VERSION"), "1.3.0\n");
  writeFileSync(join(dir, "extract.json"), JSON.stringify({
    versionFile: "VERSION", include: ["tokens", "gallery"], exclude: ["gallery"],
  }));
  return dir;
}

test("loadManifest reads a valid manifest", () => {
  const dir = fixtureLib();
  const m = loadManifest(dir);
  assert.equal(m.versionFile, "VERSION");
  assert.deepEqual(m.include, ["tokens", "gallery"]);
  rmSync(dir, { recursive: true, force: true });
});

test("loadManifest throws when manifest is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "wb-nom-"));
  assert.throws(() => loadManifest(dir), /No extract\.json/);
  rmSync(dir, { recursive: true, force: true });
});

test("loadManifest rejects dangerous keys", () => {
  const dir = mkdtempSync(join(tmpdir(), "wb-proto-"));
  writeFileSync(join(dir, "extract.json"), '{"__proto__":{"x":1},"include":["a"]}');
  assert.throws(() => loadManifest(dir), /dangerous key/);
  rmSync(dir, { recursive: true, force: true });
});

test("assertWithinRoot rejects escapes", () => {
  assert.throws(() => assertWithinRoot("/a/b", "../../etc"), /escapes/);
  assert.equal(assertWithinRoot("/a/b", "tokens").endsWith("tokens"), true);
});

test("planCopy includes tokens, excludes gallery", () => {
  const dir = fixtureLib();
  const files = planCopy(dir, loadManifest(dir));
  assert.deepEqual(files, [join("tokens", "index.css")]);
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/extract.test.mjs
```
Expected: FAIL — `Cannot find module './extract.mjs'` / functions undefined.

- [ ] **Step 3: Implement the manifest + planning half of `tools/extract.mjs`**

Create `tools/extract.mjs`:

```js
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function loadManifest(libraryDir) {
  const manifestPath = join(libraryDir, "extract.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`No extract.json in ${libraryDir} — refusing to copy.`);
  }
  let data;
  try {
    data = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    throw new Error(`Malformed extract.json in ${libraryDir}: ${e.message}`);
  }
  for (const key of Object.keys(data)) {
    if (DANGEROUS_KEYS.has(key)) throw new Error(`Refusing manifest with dangerous key "${key}".`);
  }
  const include = Array.isArray(data.include) ? data.include : null;
  if (!include || include.length === 0) {
    throw new Error(`extract.json in ${libraryDir} needs a non-empty "include" array.`);
  }
  return {
    versionFile: typeof data.versionFile === "string" ? data.versionFile : "VERSION",
    include,
    exclude: Array.isArray(data.exclude) ? data.exclude : [],
  };
}

export function assertWithinRoot(root, entry) {
  const abs = resolve(root, entry);
  const rel = relative(resolve(root), abs);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path "${entry}" escapes ${root} — refusing.`);
  }
  return abs;
}

function walkFiles(absDir, base) {
  const out = [];
  for (const name of readdirSync(absDir)) {
    const abs = join(absDir, name);
    if (statSync(abs).isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(relative(base, abs));
  }
  return out;
}

export function planCopy(libraryDir, manifest) {
  const exclude = new Set(manifest.exclude);
  const files = [];
  for (const entry of manifest.include) {
    if (exclude.has(entry)) continue;
    const abs = assertWithinRoot(libraryDir, entry);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isDirectory()) {
      for (const rel of walkFiles(abs, libraryDir)) files.push(rel);
    } else {
      files.push(entry);
    }
  }
  return files;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/extract.test.mjs
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/extract.mjs tools/extract.test.mjs
git commit -m "feat(tools): extract manifest loading, path safety, copy planning"
```

---

### Task 3: Extract tool — version record (read/write) + `--check` result

**Files:**
- Modify: `tools/extract.mjs`
- Modify: `tools/extract.test.mjs`

**Interfaces:**
- Consumes: `loadManifest`, `assertWithinRoot` (Task 2).
- Produces:
  - `readCanonicalVersion(libraryDir, manifest) -> string` — trimmed contents of `manifest.versionFile`.
  - `anchorRel(manifest) -> string` — the CSS file that carries the version comment: `join(manifest.include[0], "index.css")`.
  - `readRecordedVersion(targetLibDir, anchorRel) -> string | null` — parses the workbench version comment on the first line of the anchor CSS; `null` if absent.
  - `writeVersionHeader(targetLibDir, anchorRel, libraryName, version)` — prepends/replaces that comment.

- [ ] **Step 1: Write the failing tests**

Append to `tools/extract.test.mjs`:

```js
import {
  readCanonicalVersion, anchorRel, readRecordedVersion, writeVersionHeader,
} from "./extract.mjs";
import { readFileSync } from "node:fs";

test("readCanonicalVersion trims the VERSION file", () => {
  const dir = fixtureLib();
  assert.equal(readCanonicalVersion(dir, loadManifest(dir)), "1.3.0");
  rmSync(dir, { recursive: true, force: true });
});

test("version header round-trips through the anchor CSS", () => {
  const target = mkdtempSync(join(tmpdir(), "wb-tgt-"));
  mkdirSync(join(target, "tokens"));
  writeFileSync(join(target, "tokens", "index.css"), "/* tokens */\n.a{}");
  const anchor = "tokens/index.css";
  assert.equal(readRecordedVersion(target, anchor), null);
  writeVersionHeader(target, anchor, "design-system", "1.3.0");
  assert.equal(readRecordedVersion(target, anchor), "1.3.0");
  // original content preserved below the header
  assert.match(readFileSync(join(target, "tokens", "index.css"), "utf8"), /\.a\{\}/);
  // re-writing replaces, does not stack, the header
  writeVersionHeader(target, anchor, "design-system", "1.4.0");
  const lines = readFileSync(join(target, "tokens", "index.css"), "utf8").split("\n");
  assert.equal(lines.filter((l) => l.includes("workbench-lib")).length, 1);
  assert.equal(readRecordedVersion(target, anchor), "1.4.0");
  rmSync(target, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/extract.test.mjs
```
Expected: FAIL — new exports undefined.

- [ ] **Step 3: Implement the version-record functions**

Append to `tools/extract.mjs`:

```js
import { writeFileSync } from "node:fs";

export function readCanonicalVersion(libraryDir, manifest) {
  return readFileSync(assertWithinRoot(libraryDir, manifest.versionFile), "utf8").trim();
}

export function anchorRel(manifest) {
  return join(manifest.include[0], "index.css");
}

const HEADER_LINE_RE = /^\/\* workbench-lib:.*\*\/\r?\n?/;
const HEADER_READ_RE = /^\/\* workbench-lib:\s*\S+\s+v(\S+?)\s*(?:—|-).*\*\//;

export function readRecordedVersion(targetLibDir, anchor) {
  const file = join(targetLibDir, anchor);
  if (!existsSync(file)) return null;
  const firstLine = readFileSync(file, "utf8").split("\n", 1)[0];
  const m = firstLine.match(HEADER_READ_RE);
  return m ? m[1] : null;
}

export function writeVersionHeader(targetLibDir, anchor, libraryName, version) {
  const file = join(targetLibDir, anchor);
  const header = `/* workbench-lib: ${libraryName} v${version} — extracted; edit in the workbench, not here */`;
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  writeFileSync(file, `${header}\n${existing.replace(HEADER_LINE_RE, "")}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/extract.test.mjs
```
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/extract.mjs tools/extract.test.mjs
git commit -m "feat(tools): version-comment record + canonical version read"
```

---

### Task 4: Extract tool — `extract()` orchestration, overwrite protection, CLI

**Files:**
- Modify: `tools/extract.mjs`
- Modify: `tools/extract.test.mjs`

**Interfaces:**
- Consumes: everything from Tasks 2–3.
- Produces:
  - `extract({ libraryName, workbenchRoot, targetDir, check?, force? }) -> { status, canonical, recorded?, files?, conflicts? }` where `status` ∈ `"current" | "stale" | "copied-fresh" | "noop" | "halted-modified" | "halted-unknown" | "synced"`.
  - CLI: `node tools/extract.mjs <library> <target-dir> [--check] [--force]`; exit 0 on success/current, exit 1 on `stale`/`halted-*`/error.

- [ ] **Step 1: Write the failing tests**

Append to `tools/extract.test.mjs`:

```js
import { extract } from "./extract.mjs";
import { cpSync, existsSync as exists } from "node:fs";

// Build a fixture workbench with libraries/design-system + a fresh target dir.
function fixtureWorkbench() {
  const root = mkdtempSync(join(tmpdir(), "wb-root-"));
  const lib = join(root, "libraries", "design-system");
  mkdirSync(join(lib, "tokens"), { recursive: true });
  writeFileSync(join(lib, "tokens", "index.css"), "/* tokens */\n.t{}");
  mkdirSync(join(lib, "gallery"), { recursive: true });
  writeFileSync(join(lib, "gallery", "index.html"), "<x>");
  writeFileSync(join(lib, "VERSION"), "1.3.0\n");
  writeFileSync(join(lib, "extract.json"), JSON.stringify({
    versionFile: "VERSION", include: ["tokens", "gallery"], exclude: ["gallery"],
  }));
  const target = mkdtempSync(join(tmpdir(), "wb-consumer-"));
  return { root, target };
}

test("extract copies lean parts and records version, excludes gallery", () => {
  const { root, target } = fixtureWorkbench();
  const r = extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  assert.equal(r.status, "copied-fresh");
  assert.ok(exists(join(target, "design-system", "tokens", "index.css")));
  assert.ok(!exists(join(target, "design-system", "gallery")));
  assert.equal(r.canonical, "1.3.0");
  rmSync(root, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true });
});

test("second run is a noop when up to date", () => {
  const { root, target } = fixtureWorkbench();
  extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  const r = extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  assert.equal(r.status, "noop");
  rmSync(root, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true });
});

test("--check reports stale when target is behind", () => {
  const { root, target } = fixtureWorkbench();
  extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  writeFileSync(join(root, "libraries", "design-system", "VERSION"), "1.4.0\n");
  const r = extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target, check: true });
  assert.equal(r.status, "stale");
  rmSync(root, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true });
});

test("halts on a locally-modified up-to-date copy, --force overrides", () => {
  const { root, target } = fixtureWorkbench();
  extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  writeFileSync(join(target, "design-system", "tokens", "index.css"), "/* workbench-lib: design-system v1.3.0 — x */\n.HAND_EDIT{}");
  const halted = extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target });
  assert.equal(halted.status, "halted-modified");
  assert.ok(halted.conflicts.length >= 1);
  const forced = extract({ libraryName: "design-system", workbenchRoot: root, targetDir: target, force: true });
  assert.equal(forced.status, "synced");
  rmSync(root, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true });
});

test("unknown library is a hard error", () => {
  const { root, target } = fixtureWorkbench();
  assert.throws(() => extract({ libraryName: "nope", workbenchRoot: root, targetDir: target }), /Unknown library/);
  rmSync(root, { recursive: true, force: true }); rmSync(target, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/extract.test.mjs
```
Expected: FAIL — `extract` undefined.

- [ ] **Step 3: Implement `extract()` + `doCopy` + CLI**

Append to `tools/extract.mjs`:

```js
import { mkdirSync, cpSync } from "node:fs";

function filesDiffer(a, b) {
  if (!existsSync(a) || !existsSync(b)) return true;
  return !readFileSync(a).equals(readFileSync(b));
}

function doCopy(libraryDir, targetLibDir, manifest) {
  const exclude = new Set(manifest.exclude);
  mkdirSync(targetLibDir, { recursive: true });
  for (const entry of manifest.include) {
    if (exclude.has(entry)) continue;
    const src = assertWithinRoot(libraryDir, entry);
    if (!existsSync(src)) continue;
    cpSync(src, join(targetLibDir, entry), { recursive: true });
  }
}

export function extract({ libraryName, workbenchRoot, targetDir, check = false, force = false }) {
  const librariesDir = assertWithinRoot(workbenchRoot, "libraries");
  const libraryDir = assertWithinRoot(librariesDir, libraryName); // rejects "../x"
  if (!existsSync(libraryDir)) throw new Error(`Unknown library "${libraryName}".`);

  const manifest = loadManifest(libraryDir);
  const canonical = readCanonicalVersion(libraryDir, manifest);
  const anchor = anchorRel(manifest);
  const targetLibDir = join(resolve(targetDir), libraryName);
  const recorded = readRecordedVersion(targetLibDir, anchor);

  if (check) {
    return { status: recorded === canonical ? "current" : "stale", canonical, recorded };
  }

  if (!existsSync(targetLibDir)) {
    doCopy(libraryDir, targetLibDir, manifest);
    writeVersionHeader(targetLibDir, anchor, libraryName, canonical);
    return { status: "copied-fresh", canonical, files: planCopy(libraryDir, manifest) };
  }

  if (recorded === canonical && !force) {
    const conflicts = planCopy(libraryDir, manifest).filter((rel) =>
      existsSync(join(targetLibDir, rel)) &&
      filesDiffer(join(libraryDir, rel), join(targetLibDir, rel)) &&
      rel !== anchor, // the anchor legitimately differs (it carries the header)
    );
    if (conflicts.length) return { status: "halted-modified", canonical, conflicts };
    return { status: "noop", canonical };
  }

  if (recorded === null && readdirSync(targetLibDir).length && !force) {
    return { status: "halted-unknown", canonical };
  }

  doCopy(libraryDir, targetLibDir, manifest);
  writeVersionHeader(targetLibDir, anchor, libraryName, canonical);
  return { status: "synced", canonical, recorded, files: planCopy(libraryDir, manifest) };
}

// ---- CLI ----
function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const [library, target] = argv.filter((a) => !a.startsWith("--"));
  if (!library || !target) {
    console.error("usage: node tools/extract.mjs <library> <target-dir> [--check] [--force]");
    process.exit(1);
  }
  const workbenchRoot = resolve(new URL("..", import.meta.url).pathname);
  let r;
  try {
    r = extract({ libraryName: library, workbenchRoot, targetDir: target,
                  check: flags.has("--check"), force: flags.has("--force") });
  } catch (e) {
    console.error(`extract: ${e.message}`);
    process.exit(1);
  }
  const okStatuses = new Set(["current", "copied-fresh", "noop", "synced"]);
  console.log(`extract: ${library} → ${target}  [${r.status}${r.canonical ? " v" + r.canonical : ""}]`);
  if (r.conflicts?.length) console.error("locally-modified files (pass --force to overwrite):\n  " + r.conflicts.join("\n  "));
  process.exit(okStatuses.has(r.status) ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv.slice(2));
}
```

Note: the guarded `main()` call runs only when the file is executed directly (`node tools/extract.mjs …`), never when imported by the test file.

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/extract.test.mjs
```
Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/extract.mjs tools/extract.test.mjs
git commit -m "feat(tools): extract orchestration, overwrite protection, CLI"
```

---

### Task 5: design-system manifest + real-world integration test

**Files:**
- Create: `libraries/design-system/extract.json`
- Test: `tools/extract.integration.test.mjs`

**Interfaces:**
- Consumes: `extract()` (Task 4).
- Produces: the real manifest the CLI uses for `design-system`.

- [ ] **Step 1: Create the design-system manifest**

Create `libraries/design-system/extract.json`:

```json
{
  "versionFile": "VERSION",
  "include": ["tokens", "base", "primitives", "components", "compositions", "utilities", "theme", "assets"],
  "exclude": ["gallery", "sandbox", "docs"]
}
```

- [ ] **Step 2: Write the failing integration test**

Create `tools/extract.integration.test.mjs`:

```js
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
```

- [ ] **Step 3: Run the integration test**

```bash
node --test tools/extract.integration.test.mjs
```
Expected: PASS — confirms the tool works against the real, relocated design-system.

- [ ] **Step 4: Sanity-check the CLI + exit codes manually**

```bash
node tools/extract.mjs design-system "$(mktemp -d)"          # → [copied-fresh v1.3.0], exit 0
node tools/extract.mjs design-system /nonexistent 2>&1; echo "exit=$?"   # target parent missing → error, exit 1
node tools/extract.mjs nope "$(mktemp -d)" 2>&1; echo "exit=$?"          # → "Unknown library", exit 1
```
Expected: first prints `copied-fresh`; the unknown-library call prints the hard error and `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add libraries/design-system/extract.json tools/extract.integration.test.mjs
git commit -m "feat(design-system): extract manifest + integration test"
```

---

### Task 6: Unified workbench dashboard (`index.html`)

**Files:**
- Modify: `index.html` (replace the redirect entirely)
- Test: `tools/dashboard.test.mjs`

**Interfaces:**
- Consumes: nothing (static). Links to `libraries/design-system/gallery/`, `scaffolds/*/README.md`, `docs/`.

- [ ] **Step 1: Write the failing structural test**

Create `tools/dashboard.test.mjs` (asserts the a11y/link contract without a browser):

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve(import.meta.dirname, "..", "index.html"), "utf8");

test("dashboard has one h1 and semantic structure", () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.ok((html.match(/<h2[\s>]/g) || []).length >= 3, "one h2 per tier");
});

test("dashboard has a skip link and no div-click cards", () => {
  assert.match(html, /class="skip-link"/);
  assert.doesNotMatch(html, /<div[^>]*onclick/i);
});

test("dashboard links the key destinations", () => {
  for (const href of [
    "libraries/design-system/gallery/",
    "scaffolds/web-vite/README.md",
    "docs/",
  ]) assert.ok(html.includes(href), `missing link: ${href}`);
});

test("disabled storyboard card is aria-disabled and has no href", () => {
  assert.match(html, /aria-disabled="true"/);
});

test("no-flash theme init and both-theme support present", () => {
  assert.match(html, /data-theme/);
  assert.match(html, /prefers-reduced-motion|design-system\/theme/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tools/dashboard.test.mjs
```
Expected: FAIL — current `index.html` is the redirect; assertions fail.

- [ ] **Step 3: Write the dashboard `index.html`**

Replace the entire contents of `index.html` with (adjust DS class names to the actual design-system where noted — the classes below match spec §5/§8; verify against `libraries/design-system/` while implementing):

```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workbench</title>
    <!-- No-flash theme init: mirror the snippet from libraries/design-system/theme/theme-init-snippet.html -->
    <script>
      (function () {
        try {
          var t = localStorage.getItem("theme");
          if (t) document.documentElement.setAttribute("data-theme", t);
          var p = localStorage.getItem("palette");
          if (p) document.documentElement.setAttribute("data-palette", p);
        } catch (e) {}
      })();
    </script>
    <link rel="stylesheet" href="./libraries/design-system/tokens/index.css" />
    <link rel="stylesheet" href="./libraries/design-system/base/reset.css" />
    <link rel="stylesheet" href="./libraries/design-system/base/base.css" />
    <link rel="stylesheet" href="./libraries/design-system/primitives/index.css" />
    <link rel="stylesheet" href="./libraries/design-system/components/index.css" />
    <link rel="stylesheet" href="./libraries/design-system/utilities/index.css" />
    <style>
      /* dashboard-local chrome only — self-namespaced, not part of the DS */
      .skip-link { position: absolute; left: -999px; }
      .skip-link:focus { left: var(--space-3, 1rem); top: var(--space-3, 1rem); }
      .wb-grid { display: grid; gap: var(--space-4, 1rem); grid-template-columns: 1fr; }
      @media (min-width: 768px) { .wb-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (min-width: 1024px) { .wb-grid { grid-template-columns: repeat(3, 1fr); } }
      .wb-card { display: block; min-height: 44px; padding: var(--space-4, 1rem);
                 border: 1px solid var(--surface-3, #333); border-radius: var(--radius-md, 8px);
                 color: inherit; text-decoration: none; }
      .wb-card:hover { border-color: rgb(var(--accent-rgb) / 60%); }
      .wb-card[aria-disabled="true"] { opacity: 0.55; cursor: default; }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="container">
      <h1>Workbench</h1>
      <p>Malin's canonical libraries and scaffolds — one source of truth.</p>
    </header>
    <main id="main" class="container stack stack-xl">
      <section aria-labelledby="libs">
        <h2 id="libs">Libraries</h2>
        <div class="wb-grid">
          <a class="wb-card" href="./libraries/design-system/gallery/">
            <strong>Design System</strong><br />Tokens, primitives, components — the gallery.
          </a>
          <span class="wb-card" role="note" aria-disabled="true">
            <strong>Storyboard</strong><br />Screens, flows &amp; states — coming soon.
          </span>
        </div>
      </section>
      <section aria-labelledby="scaffolds">
        <h2 id="scaffolds">Scaffolds</h2>
        <div class="wb-grid">
          <a class="wb-card" href="./scaffolds/web-vite/README.md"><strong>web-vite</strong><br />Vanilla-JS MVC web starter.</a>
          <a class="wb-card" href="./scaffolds/csharp-console/README.md"><strong>csharp-console</strong><br />Single-project console app.</a>
          <a class="wb-card" href="./scaffolds/csharp-console-mvc/README.md"><strong>csharp-console-mvc</strong><br />Multi-project MVC + NUnit.</a>
          <a class="wb-card" href="./scaffolds/csharp-wpf/README.md"><strong>csharp-wpf</strong><br />WPF/MVVM (planned stub).</a>
        </div>
      </section>
      <section aria-labelledby="more">
        <h2 id="more">Docs</h2>
        <div class="wb-grid">
          <a class="wb-card" href="./docs/"><strong>Docs</strong><br />Specs, plans, and workbench notes.</a>
        </div>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tools/dashboard.test.mjs
```
Expected: PASS (5 tests). If a linked DS stylesheet path differs from the real folder (e.g. `base/reset.css`), correct the `<link>` to the actual file before moving on.

- [ ] **Step 5: Eyeball it in a browser (both themes + keyboard)**

```bash
# From repo root, serve statically and open index.html
python -m http.server 8080  # then visit http://localhost:8080/
```
Verify: cards reachable by Tab, focus ring visible, skip link works, toggling `data-theme` (via the DS toggle or devtools) restyles, layout reflows single-column on a narrow window. Fix any issue in `index.html`.

- [ ] **Step 6: Commit**

```bash
git add index.html tools/dashboard.test.mjs
git commit -m "feat: workbench dashboard replaces the gallery redirect"
```

---

### Task 7: Re-point references + README + link check

**Files:**
- Modify: `README.md`
- Modify: `scaffolds/csharp-console/init.sh` + `README.md` (stale `_template/` paths → `scaffolds/` paths)
- Verify: each `scaffolds/*/` still resolves its own bundled `design-system/`
- (Skip `archive/design-system-lab/` — dead storage, links not re-pointed.)

**Interfaces:**
- Consumes: the tier layout (Task 1), the dashboard (Task 6), the extract tool (Tasks 2–5).

- [ ] **Step 1: Find every stale reference**

```bash
cd "C:/Users/Nugget/Documents/Development/template"
grep -rIn --exclude-dir=.git -e "\.\./design-system" -e "design-system-lab" -e "_template" \
  -e "malinfossum.github.io/template" -e "github.com/malinfossum/template" \
  README.md index.html docs scaffolds 2>/dev/null
```
Record each hit. (Scaffold-internal `/design-system/` links are their own bundled copies — leave them.)

- [ ] **Step 2: Fix the stale `csharp-console` paths**

In `scaffolds/csharp-console/init.sh` and `README.md`, update `~/Documents/Development/_template/csharp-console/` → `~/Documents/Development/template/scaffolds/csharp-console/` (path changes again only if the local folder is ever renamed to `workbench`).

- [ ] **Step 3: Rewrite `README.md` for the workbench**

Update `README.md` to describe the workbench: the three tiers, the new folder paths, and replace the manual "sync the lean parts" instructions (current §"Design system (web)") with the tool:

```markdown
## Reuse a library

Libraries live in `libraries/`. Copy one into any project (web or C#) with the extract tool:

    node tools/extract.mjs design-system ../my-app            # → ../my-app/design-system
    node tools/extract.mjs design-system ../my-api/wwwroot    # into a C# wwwroot
    node tools/extract.mjs design-system ../my-app --check    # is my copy stale?

The tool copies only the lean parts, records the version, and refuses to overwrite files you've
edited locally (pass `--force` to override). Edit a library **in the workbench**, never in a
consuming project, then re-run extract.
```

- [ ] **Step 4: Confirm scaffolds still resolve their bundled DS**

```bash
ls scaffolds/web-vite/design-system/tokens/index.css   # must exist (bundled copy, unchanged)
grep -n "/design-system/" scaffolds/web-vite/index.html | head   # absolute links intact
```
Expected: the bundled copy is present and its links are unchanged by the move.

- [ ] **Step 5: Broken-link check on moved surfaces**

```bash
# every relative href in index.html points at something that exists
node -e '
const {readFileSync,existsSync}=require("fs");const {dirname,join}=require("path");
for(const f of ["index.html"]){const html=readFileSync(f,"utf8");
for(const m of html.matchAll(/href="\.\/([^"#?]+)/g)){const p=m[1];
if(!existsSync(p)) {console.error("BROKEN:",f,"->",p);process.exitCode=1;}}}
console.log("link check done");'
```
Expected: `link check done`, no `BROKEN:` lines.

- [ ] **Step 6: Commit**

```bash
git add README.md scaffolds/csharp-console
git commit -m "docs: repoint references and README to workbench layout"
```

---

### Task 8: Update the `project-init` skill  ⚠️ GATED (edits `.claude/`)

**Do not run this task without Malin's explicit go-ahead** — it modifies a file under `.claude/`, which is protected by CLAUDE.md. Confirm first; if she declines, skip and note it as a manual follow-up.

**Files:**
- Modify: `C:/Users/Nugget/.claude/skills/project-init/SKILL.md` (copy-source paths)

**Interfaces:**
- Consumes: the new `scaffolds/` + `libraries/` paths.

- [ ] **Step 1: Confirm go-ahead, then locate the paths**

```bash
grep -rIn -e "_template" -e "template/" -e "design-system" \
  "C:/Users/Nugget/.claude/skills/project-init/"
```

- [ ] **Step 2: Update copy sources**

Change scaffold-copy source `…/template/<scaffold>` → `…/workbench/scaffolds/<scaffold>`, and any design-system source → `…/workbench/libraries/design-system`. If the skill mentions running the sync, point it at `node tools/extract.mjs`.

- [ ] **Step 3: Verify**

Re-run the grep from Step 1; confirm no stale `_template`/old-path references remain.

- [ ] **Step 4: Commit (in the skills repo/location as appropriate)**

The skill lives outside this repo. Commit it wherever `.claude/skills/` is version-controlled (or note the edit for Malin to commit via her usual flow). Do **not** commit it into the workbench repo.

---

### Task 9: Local finalize — full acceptance, merge, tag (local only)

**Files:** none (verification + git).

**Interfaces:** consumes all prior tasks.

- [ ] **Step 1: Run the full test suite**

```bash
cd "C:/Users/Nugget/Documents/Development/template"
node --test tools/
```
Expected: all `extract`, `integration`, and `dashboard` tests PASS.

- [ ] **Step 2: Walk the spec §11 acceptance checklist**

Confirm each box in spec §11 (Pages/dashboard both themes, keyboard nav, gallery works, scaffolds resolve DS, `--check` non-zero when behind, overwrite halt + `--force`, path-escape rejected, version not publicly fetchable as a dotfile, `.nojekyll` at root, `git log --follow` history). Fix anything red before merging.

- [ ] **Step 3: Merge to main and tag (local, not pushed)**

```bash
git switch main
git merge --no-ff workbench-v2 -m "feat: workbench v2.0.0 — tiered restructure, dashboard, extract tool"
git tag -a v2.0.0 -m "Workbench v2.0.0"
git log --oneline -3
```
Expected: `main` contains the merge; `v2.0.0` tag on the merge commit. **Nothing is pushed yet.**

- [ ] **Step 4: STOP — hand back to Malin**

Report status and wait. Do not proceed to Task 10 without her explicit go-ahead.

---

### Task 10: Outward release  ⚠️ GATED (renames public repo + pushes)

**Do not run without Malin's explicit, in-the-moment go-ahead.** These steps are irreversible-ish and public. Execute in this exact order.

**Files:** none (GitHub + git remote + external links).

- [ ] **Step 1: Rename the repo on GitHub**

GitHub → repo **Settings → Rename** → `template` → `workbench`. (GitHub sets up redirects for git + web.)

- [ ] **Step 2: Update the local remote**

```bash
git remote set-url origin https://github.com/malinfossum/workbench.git
git remote -v   # confirm origin points at /workbench.git
```

- [ ] **Step 3: Push main + tag**

```bash
git push origin main
git push origin v2.0.0
```

- [ ] **Step 4: Verify Pages + redirect**

Visit the new Pages URL (`malinfossum.github.io/workbench/`); confirm the dashboard loads and the DS gallery link works. Confirm the old repo URL redirects.

- [ ] **Step 5: Update external links**

Update the portfolio "Open source" link, LinkedIn, and any README/cross-repo references from `template` → `workbench`. Do **not** create a new repo named `template` (it would break the redirect — spec §12).

- [ ] **Step 6: Push the workbench-v2 branch update / open a PR if preferred**

If Malin prefers a PR flow instead of the local merge in Task 9, push `workbench-v2` and open the PR rather than pushing `main` directly. (Choose one path with her.)

---

## Self-Review

**Spec coverage:**
- §5 structure → Task 1. §6 boundaries → Tasks 1 + 7 (README). §7 rationale → doc only, no code. §8 dashboard → Task 6. §9 extract tool → Tasks 2–5. §10 migration → Tasks 1, 6, 7, 9, 10. §11 acceptance → Task 9 Step 2 (+ per-task checks). §12 outward impact → Task 10. §13 storyboard reserved home → Task 1 Step 2. ✅ every section maps to a task.
- Stress-test additions: a11y baseline → Task 6 tests; overwrite protection → Task 4 tests; path-escape/defensive-parse/hard-error → Tasks 2 & 4 tests; non-served version record → Task 3 (CSS comment, not dotfile) + Task 9 acceptance; atomic Pages → branch strategy + Task 9 merge; pinned outward order → Task 10; grep targets → Task 7 Step 1; don't-recreate-`template` → Task 10 Step 5.

**Placeholder scan:** No "TBD/TODO/handle edge cases". The one adjust-to-reality note (Task 6 DS class/link names) is explicit with a verification step, not a placeholder.

**Type consistency:** `extract()` status strings, `loadManifest`/`planCopy`/`readCanonicalVersion`/`anchorRel`/`readRecordedVersion`/`writeVersionHeader` signatures are consistent between the task that defines each and the tasks/tests that consume them. `anchorRel(manifest)` is defined in Task 3 and used in Task 4's `extract()`.

**Known implementation nuance (documented, not a gap):** overwrite-conflict detection is exact when the copy is *up to date* (recorded == canonical, so source == last-stamped content); when the copy is *behind*, a version bump overwrites as intended (spec §9's accepted sync behaviour). The `halted-unknown` status covers an existing copy with no version marker.
