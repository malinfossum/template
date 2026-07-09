# Spec A — Workbench Restructure (v2.0.0)

- **Date:** 2026-07-09
- **Status:** Reviewed — stress-tested 2026-07-09; ready for implementation planning
- **Repo:** `github.com/malinfossum/template` → to be renamed `workbench`
- **Depends on:** nothing
- **Blocks:** Spec B (Storyboard) — needs its `libraries/storyboard/` home to exist

> **Revision note (2026-07-09):** §8, §9, §10, §11, §12 hardened after a four-lens stress test
> (security / privacy / accessibility / loopholes). Changes: dashboard a11y baseline made
> mandatory; extract tool given overwrite protection + untrusted-input constraints + a
> non-served version stamp; migration made atomic for Pages with a pinned outward order and
> explicit grep targets; redirect-preservation warning added.

---

## 1. Summary

Restructure the public `template` repo into a **named workbench**: one canonical home that owns
the design-system, the (future) storyboard, and all the starter scaffolds, with honest internal
tiers so any piece can be extracted and reused cleanly. Rename the repo `template` → `workbench`,
reorganise its folders into `libraries / scaffolds / lab / tools / docs`, add a unified dashboard
front door, and replace the currently-manual design-system sync with a versioned extract script.
Ship as **v2.0.0**.

This is a foundation project. The reusable **storyboard** the work started from is designed
separately (Spec B) and slots in afterwards as a `libraries/` member.

## 2. Goals

- One canonical workbench that visibly owns design-system + storyboard + scaffolds.
- Honest, physical tier boundaries so extraction is a copy (or one command), never untangling.
- A single **extract/sync tool** that works across the *whole* ecosystem — web scaffolds **and**
  C# `wwwroot` — because the design-system is already consumed by copy in both (`wend`, `kenaz`).
- Keep the design-system's internals **frozen** — this project only relocates it.
- Preserve GitHub Pages continuity and git history.

## 3. Non-goals

- **Storyboard internals** — reserved home only; designed in Spec B.
- **Any change to design-system tokens/primitives/components** — relocation only, no edits.
- **npm packaging / git submodules** — deliberately rejected (see §7). Copy model stays; a
  published package can be added later as an *additional* channel without redoing this work.
- **Rewriting the scaffolds** — they keep their own bundled DS copies unchanged.

## 4. Locked decisions (from brainstorm)

| Decision | Choice | Why |
|---|---|---|
| Restructure depth | Physical tiers **+ rename repo to `workbench`** | Full "named workbench" the project set out to build |
| First stack for storyboard (Spec B) | web-vite (vanilla JS MVC) | DS is CSS-native there; the `gallery/` MVC is ~80% of the engine |
| Reuse mechanism | **Copy model**, via `tools/extract.mjs` (Node) | Only model that serves web **and** C# `wwwroot`; keeps no-build ethos |
| Version safety | Version-stamp copies + `--check` drift detection | Recovers the one real benefit of a dependency model without the coupling |
| DS internals | Frozen; folder relocated only | Respects the read-only design-system rule |
| Release | v2.0.0 (repo), DS library keeps its own VERSION | Library and workbench version independently going forward |

## 5. Target structure

```
workbench/                        (renamed from template)
├── libraries/                    ← canonical, reused as-is
│   ├── design-system/            (moved intact — internals frozen; keeps its own VERSION)
│   └── storyboard/               ← NEW, reserved home (built in Spec B)
├── scaffolds/                    ← copy-to-start starters
│   ├── web-vite/
│   ├── csharp-console/
│   ├── csharp-console-mvc/
│   └── csharp-wpf/
├── lab/                          ← was design-system-lab/ (dev/preview surface)
├── tools/                        ← extract / sync script (extract.mjs)
├── docs/                         ← workbench docs + specs (this file)
├── reference/                    ← was Reference/
├── archive/                      ← was Archive/ (incl. stray duplicate-design-system)
├── index.html                    ← unified workbench dashboard (Pages entry)
├── README.md
├── Project_README_Template.md
├── LICENSE · .nojekyll · .gitattributes · .gitignore
```

## 6. Tier boundaries

The whole point of the workbench is that these three lines stay honest:

- **`libraries/`** — canonical, versioned, reused *as-is*. You never edit a library inside a
  consuming project; you edit it here and re-extract. Members: `design-system`, `storyboard`.
- **`scaffolds/`** — starting points you *copy once* to begin a project, then own. Each bundles a
  lean copy of the libraries it needs. Members: `web-vite`, `csharp-console`,
  `csharp-console-mvc`, `csharp-wpf`.
- **content** — the actual screens, flows, data, and features of a real app. **Never lives in the
  workbench.** It lives in the project you spun up from a scaffold.

Support tiers: `lab` (a place to develop/preview the libraries), `tools` (the extract script),
`docs`, `reference`, `archive`.

## 7. Why the copy model (rejected alternatives)

`design-system/` is already consumed **by copy into C# `wwwroot`** — confirmed in the workspace:
`wend/Wend.Api/wwwroot/design-system/`, `kenaz/Kenaz.Api/wwwroot/design-system/`,
`kenaz/Kenaz.Web/public/design-system/`. That single fact rules out the dependency models:

- **npm workspace** — needs projects co-located inside the workbench; hers are separate repos.
- **npm package** — build + publish per version, and *still* cannot drop into a C# `wwwroot`.
- **git submodule** — language-agnostic but fiddly (detached HEAD, recursive clones) and would
  require splitting the DS into its own repo to pin cleanly.

The copy model is the only universal substrate across web + C#. Hardening it with a version stamp
and drift check gives the safety a dependency model would, without excluding half the stack. Copy
now does not foreclose a published package later — a package build can read the same canonical
`libraries/design-system/`.

## 8. Unified dashboard (`index.html`)

Replaces the current meta-refresh redirect (today: `<meta http-equiv="refresh" … design-system/gallery/`).

- **Role:** the workbench front door and the GitHub Pages entry point.
- **Content:** three tier sections as card grids —
  - **Libraries** → Design System (link to `libraries/design-system/gallery/`), Storyboard
    (added in Spec B; until then a **non-interactive** "coming soon" card — plain text with
    `aria-disabled="true"` and **no `href`**, never a dead link).
  - **Scaffolds** → one card per scaffold linking its `README.md`.
  - **Lab & Docs** → links to `lab/` and `docs/`.
- **Markup & a11y (required):** every live card is a semantic `<a>` (keyboard-reachable by
  default — no `<div>`-with-click cards); one `<h1>` (workbench name) and an `<h2>` per tier for
  screen-reader structure; the page inherits the DS accessibility baseline — skip link,
  `:focus-visible` rings, `prefers-reduced-motion` handling, colour-contrast tokens, and
  ≥44×44px touch targets.
- **Build:** static HTML using the design-system's own classes/tokens (dogfooding). Dark-first,
  both themes via the DS no-flash `data-theme` init snippet. Mobile-first. No build step.
- **Constraint:** must keep `.nojekyll` at root and remain the Pages source.

## 9. Extract / sync tool (`tools/extract.mjs`)

A Node script (Node already present for Vite; cross-platform; publicly runnable). Automates the
sync that README §"Design system (web)" currently describes as a manual chore.

**CLI**

```
node tools/extract.mjs <library> <target-dir> [--check] [--force]
```

Examples:
```
node tools/extract.mjs design-system ../my-web-app            # → ../my-web-app/design-system
node tools/extract.mjs design-system ../wend/Wend.Api/wwwroot # → C# wwwroot
node tools/extract.mjs design-system ../my-app --check        # report drift, write nothing
```

**Behaviour**

1. Resolve source = `libraries/<library>/`.
2. Read `libraries/<library>/extract.json` — a per-library manifest:
   ```json
   {
     "versionFile": "VERSION",
     "include": ["tokens", "base", "primitives", "components", "compositions", "utilities", "theme", "assets"],
     "exclude": ["gallery", "sandbox", "docs"]
   }
   ```
   (For design-system, `include` = the lean parts README already documents, plus `assets` for the
   self-hosted fonts.)
3. Copy the included parts into `<target-dir>/<library>/` (e.g. `.../design-system/`) — but
   **only files that are absent or unchanged since the last stamp**. If any target file was
   modified locally since the recorded stamp, **halt and print the conflicting file list**;
   overwriting them requires `--force`. Never clobber local edits silently.
4. Record the copied library version (from `versionFile`) as a **comment header in an
   already-served CSS file** (e.g. the top of the copied `index.css`) — **not** a `.version`
   dotfile inside a served root, so the version is never publicly fetchable at
   `…/design-system/.version`.
5. `--check`: compare the target's recorded version to the canonical `versionFile`. If behind (or
   missing), print a warning and exit non-zero. Never writes. Enables "is my copy stale?" checks.
6. `--force`: overwrite locally-modified files and re-copy even when the recorded version matches.

**Safety & constraints** (the tool runs from a public repo, so treat all inputs as untrusted):

- Resolve `target-dir` and every manifest `include`/`exclude` entry to an absolute path; **reject
  anything that escapes** the library root (source) or the intended project dir (dest) — no `..`
  break-out.
- Filesystem APIs only — **no `child_process`/shell**, so nothing is injectable via a path arg.
- Parse `extract.json` defensively — reject `__proto__`/`constructor` keys (no prototype pollution).
- A missing or malformed `extract.json`, or an unknown `<library>`, is a **hard error** — never
  fall back to copying everything (that would leak `gallery`/`sandbox`/`docs` into consumers).

**Generalises for free:** the storyboard (Spec B) ships its own `extract.json`; no tool changes.

**Backs `project-init`:** the `project-init` skill calls the same script (or reuses its copy list)
so new projects and refreshes share one code path.

## 10. Migration plan (ordered)

Executed on a branch, verified, then merged. **Steps 1–7 are local and reversible** (branch,
moves, builds, local merge + tag). **Step 8 is outward-facing and irreversible** (repo rename,
push, link updates) and happens **only on Malin's explicit go-ahead** — never automatically.
Detailed step list for the implementation plan:

1. **Branch:** `git switch -c workbench-v2`. Do not restructure on `main`.
2. **Move with history** (`git mv`):
   - `design-system/` → `libraries/design-system/`
   - `web-vite/`, `csharp-console/`, `csharp-console-mvc/`, `csharp-wpf/` → `scaffolds/`
   - `design-system-lab/` → `lab/`
   - `Reference/` → `reference/`; `Archive/` → `archive/`
   - create empty `libraries/storyboard/` (with a `.gitkeep` + short README stub), `tools/`, `docs/`.
   - gitignore `desktop.ini` opportunistically.
3. **Re-point references.** Enumerate every occurrence with grep over these targets:
   `design-system/`, `../design-system`, the string `template` (name/paths), and the old Pages
   URL. Fix each:
   - Root `index.html` — replace redirect with the §8 dashboard.
   - `lab/` — any `../design-system` → `../libraries/design-system`.
   - `README.md` — new structure, new paths, and point the sync section at `tools/extract.mjs`.
   - `project-init` skill — update copy sources: scaffold path → `scaffolds/<name>`, DS source →
     `libraries/design-system`.
   - Confirm each scaffold still resolves its **own bundled** `design-system/` copy (internal
     paths unchanged — should be untouched, but verify).
4. **Build** `tools/extract.mjs` + `libraries/design-system/extract.json`.
5. **Build** root `index.html` dashboard. Keep the folder-move and this dashboard in the **same
   merge unit** so GitHub Pages flips atomically — never a window where the old redirect points
   at a moved `design-system/gallery/`.
6. **Versioning:** the **repo** releases as `v2.0.0`; leave `libraries/design-system/VERSION`
   as-is (1.3.0) — internals unchanged; library and repo version independently from here on.
7. **Verify** (§11) on the branch, then merge `workbench-v2` → `main` locally and tag `v2.0.0`
   on the merge commit.
8. **Outward sequence — in this exact order, on explicit go-ahead:**
   rename the GitHub repo `template` → `workbench` (Settings → Rename) →
   `git remote set-url origin https://github.com/malinfossum/workbench.git` →
   push `main` + the `v2.0.0` tag →
   update external links (portfolio "Open source", LinkedIn, README, cross-repo refs).

## 11. Verification / acceptance criteria

- [ ] GitHub Pages loads at the new URL; root dashboard renders in **both** themes.
- [ ] Dashboard links resolve: DS gallery (`libraries/design-system/gallery/`), each scaffold
      README, `lab/`, `docs/`.
- [ ] Dashboard is keyboard-navigable end to end; the "coming soon" Storyboard card is not focusable
      and not a link.
- [ ] DS gallery still works from its new location.
- [ ] Each scaffold still resolves its bundled DS (open `web-vite`, DS styles apply).
- [ ] `node tools/extract.mjs design-system <tmp>` copies exactly the lean parts and records the version.
- [ ] `--check` reports drift when the target is behind, and exit code is non-zero.
- [ ] Overwrite protection: extract against a target with a locally-modified file **halts and lists
      it**; `--force` is required to overwrite.
- [ ] Path-escape: a manifest `include` or a `target-dir` containing `..` outside the roots is **rejected**.
- [ ] The version record is **not** publicly fetchable from a served target (no `wwwroot/**/.version`).
- [ ] No broken relative links in `lab/` or `docs/` (link-check).
- [ ] `project-init` scaffolds correctly from the new `scaffolds/` + `libraries/` paths.
- [ ] `git log --follow` shows preserved history on a moved file (confirms `git mv`).
- [ ] `.nojekyll` still at repo root.

## 12. Outward-facing impact

- **Repo rename:** GitHub redirects the old git + web URLs to `workbench`. Existing clones keep
  working via redirect but should update their remote.
- **Pages URL changes** `…/template` → `…/workbench`. Do not assume the old Pages URL redirects
  forever — update any hardcoded links (portfolio, LinkedIn, README).
- **Do not recreate a `template` repo.** GitHub's redirect from `malinfossum/template` →
  `workbench` breaks the moment a new repo named `template` exists under your account. Leave the
  old name retired.
- **v2.0.0 is breaking** (paths moved). Document the new layout in the release notes.

## 13. Follow-on — Spec B (Storyboard)

`libraries/storyboard/` is reserved by this spec. Spec B designs the storyboard **engine**
(generalising the `gallery/` registry-swap MVC from component specimens to full screens), the
**Screen / Flow / State** data model, mock-data rendering, its own `extract.json`, and a real
(enabled) card + nav entry in the workbench dashboard.
