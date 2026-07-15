# Design-System Identity Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the design system's default look a committed identity — Sora 600 display + Figtree body, crisp 6/8px shape language, high-contrast solid primary button — plus three opt-in type skins (fraunces, instrument, nordic).

**Architecture:** Pure CSS/token/asset change inside `libraries/design-system/`. Values change and additive tokens appear; no class names, markup contracts, or token names break. A new structural test file (`tools/design-system.test.mjs`, node:test) grows task by task and is the arbiter for fonts, radii, and color contrast. Spec: `docs/specs/2026-07-13-design-system-identity.md`.

**Tech Stack:** Plain CSS custom properties, self-hosted woff2 (Fontsource latin subsets), node:test, existing `tools/extract.mjs` copy model.

## Global Constraints

- Branch: `ds-identity-spec` (exists; spec committed at `73e81ff`). Commit per task.
- Commit messages: plain, no `Co-Authored-By`, no Claude/AI attribution (Malin's global rule).
- CSS files use **tab indentation** (match every existing file).
- Color palettes (`_oled`, `gold`, `wend`, `daily`, `ignite`) stay visually untouched — the ONLY permitted additions are `--on-accent` / `--accent-solid` / `--accent-solid-strong` overrides where the contrast test demands them (spec §3, §7).
- Size scale (`--text-*`), line-heights, `--font-mono`, `--font-serif`: unchanged (spec §3).
- All tests run with: `node --test tools/` from the workbench root. Everything must be green at every commit.
- Font subsets are **latin** (includes æøå). All new fonts are SIL OFL.
- Out of scope, pre-existing (do NOT fix here): `daily.css` lists non-bundled Inter as its body font.

---

### Task 1: Bundle the new font assets

**Files:**
- Create: `libraries/design-system/assets/fonts/sora-latin-600-normal.woff2`
- Create: `libraries/design-system/assets/fonts/figtree-latin-400-normal.woff2`
- Create: `libraries/design-system/assets/fonts/figtree-latin-500-normal.woff2`
- Create: `libraries/design-system/assets/fonts/figtree-latin-600-normal.woff2`
- Create: `libraries/design-system/assets/fonts/instrument-serif-latin-400-normal.woff2`
- Create: `libraries/design-system/assets/fonts/schibsted-grotesk-latin-700-normal.woff2`
- Create: `libraries/design-system/assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2`
- Create: `libraries/design-system/assets/fonts/atkinson-hyperlegible-next-latin-500-normal.woff2`
- Create: `libraries/design-system/assets/fonts/Sora-OFL.txt`, `Figtree-OFL.txt`, `InstrumentSerif-OFL.txt`, `SchibstedGrotesk-OFL.txt`, `AtkinsonHyperlegibleNext-OFL.txt`

**Interfaces:**
- Produces: woff2 files at the exact paths above — Task 2's `@font-face` declarations and its test depend on these names verbatim.

- [ ] **Step 1: Download the woff2 files (Fontsource CDN, latin subset)**

Run from the workbench root (Git Bash):

```bash
cd libraries/design-system/assets/fonts
curl -fLo sora-latin-600-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/sora@latest/latin-600-normal.woff2
curl -fLo figtree-latin-400-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/figtree@latest/latin-400-normal.woff2
curl -fLo figtree-latin-500-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/figtree@latest/latin-500-normal.woff2
curl -fLo figtree-latin-600-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/figtree@latest/latin-600-normal.woff2
curl -fLo instrument-serif-latin-400-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@latest/latin-400-normal.woff2
curl -fLo schibsted-grotesk-latin-700-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/schibsted-grotesk@latest/latin-700-normal.woff2
curl -fLo atkinson-hyperlegible-next-latin-400-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/atkinson-hyperlegible-next@latest/latin-400-normal.woff2
curl -fLo atkinson-hyperlegible-next-latin-500-normal.woff2 https://cdn.jsdelivr.net/fontsource/fonts/atkinson-hyperlegible-next@latest/latin-500-normal.woff2
```

Expected: each file 10–40 KB. If a jsDelivr URL 404s, the fallback source is the npm tarball (`npm view @fontsource/<name> dist.tarball`, file at `package/files/<name>-latin-<weight>-normal.woff2`).

- [ ] **Step 2: Download the OFL license texts**

```bash
curl -fLo Sora-OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/sora/OFL.txt
curl -fLo Figtree-OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/figtree/OFL.txt
curl -fLo InstrumentSerif-OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt
curl -fLo SchibstedGrotesk-OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/schibstedgrotesk/OFL.txt
curl -fLo AtkinsonHyperlegibleNext-OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/atkinsonhyperlegiblenext/OFL.txt
```

Expected: each ~4.4 KB of SIL OFL text (first line names the font's copyright holder — eyeball each).

- [ ] **Step 3: Verify the binaries are real woff2**

```bash
cd ../../../..
node -e "const{readFileSync}=require('fs');['sora-latin-600-normal','figtree-latin-400-normal','figtree-latin-500-normal','figtree-latin-600-normal','instrument-serif-latin-400-normal','schibsted-grotesk-latin-700-normal','atkinson-hyperlegible-next-latin-400-normal','atkinson-hyperlegible-next-latin-500-normal'].forEach(f=>{const b=readFileSync('libraries/design-system/assets/fonts/'+f+'.woff2');if(b.subarray(0,4).toString('ascii')!=='wOF2')throw new Error(f+' is not woff2');console.log('ok',f,b.length,'bytes')})"
```

Expected: eight `ok <name> <bytes>` lines, no throw.

- [ ] **Step 4: Commit**

```bash
git add libraries/design-system/assets/fonts/
git commit -m "Bundle Sora, Figtree, Instrument Serif, Schibsted Grotesk, Atkinson Hyperlegible Next (latin, OFL)"
```

---

### Task 2: Default type identity — tokens, base headings, stat numbers

**Files:**
- Create: `tools/design-system.test.mjs`
- Modify: `libraries/design-system/tokens/typography.css`
- Modify: `libraries/design-system/base/base.css:13-19`
- Modify: `libraries/design-system/components/stat.css:5-9`

**Interfaces:**
- Consumes: font files from Task 1 (exact paths).
- Produces: tokens `--font-sans` (Figtree-first), `--font-display` (`"Sora", "Figtree", sans-serif`), `--weight-display: 600`, `--tracking-display: -0.03em`, `--tracking-heading: -0.02em`. Tasks 5 (skins) override these same token names. The test helpers `read()` and the file itself are extended by Tasks 3–5.

- [ ] **Step 1: Write the failing test**

Create `tools/design-system.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DS = join(dirname(fileURLToPath(import.meta.url)), "..", "libraries", "design-system");
export const read = (p) => readFileSync(join(DS, p), "utf8");

test("every @font-face src resolves to a bundled real woff2", () => {
	const css = read("tokens/typography.css");
	const srcs = [...css.matchAll(/url\("\.\.\/(assets\/fonts\/[^"]+\.woff2)"\)/g)].map((m) => m[1]);
	assert.ok(srcs.length >= 15, `expected >=15 font srcs (7 existing + 8 new), got ${srcs.length}`);
	for (const rel of srcs) {
		const abs = join(DS, rel);
		assert.ok(existsSync(abs), `missing font file ${rel}`);
		const magic = readFileSync(abs).subarray(0, 4).toString("ascii");
		assert.equal(magic, "wOF2", `${rel} is not a woff2 file`);
	}
});

test("default identity is Sora display + Figtree body, Inter is gone", () => {
	const css = read("tokens/typography.css");
	assert.match(css, /--font-sans:\s*"Figtree"/, "--font-sans must lead with Figtree");
	assert.match(css, /--font-display: "Sora", "Figtree", sans-serif;/);
	assert.ok(!css.includes("Inter"), "Inter must not appear in typography.css");
	for (const fam of ["Sora", "Figtree", "Instrument Serif", "Schibsted Grotesk", "Atkinson Hyperlegible Next", "Fraunces"]) {
		assert.ok(css.includes(`font-family: "${fam}"`), `missing @font-face for ${fam}`);
	}
	assert.match(css, /--weight-display: 600;/);
	assert.match(css, /--tracking-display: -0\.03em;/);
	assert.match(css, /--tracking-heading: -0\.02em;/);
});

test("base headings and stat numbers carry the display face", () => {
	const base = read("base/base.css");
	assert.match(base, /h1,\nh2,\nh3,\nh4 \{[^}]*font-family: var\(--font-display\);/s);
	assert.match(base, /h1,\nh2,\nh3,\nh4 \{[^}]*font-weight: var\(--weight-display\);/s);
	assert.match(base, /h1,\nh2,\nh3,\nh4 \{[^}]*letter-spacing: var\(--tracking-heading\);/s);
	assert.match(base, /h1,\nh2 \{\n\tletter-spacing: var\(--tracking-display\);\n\}/);
	assert.match(read("components/stat.css"), /\.stat-value \{[^}]*font-family: var\(--font-display\);/s);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/design-system.test.mjs`
Expected: FAIL — `expected >=15 font srcs`, missing `@font-face` for Sora etc.

- [ ] **Step 3: Update `tokens/typography.css`**

Append these `@font-face` blocks after the existing Hanken Grotesk block (keep the seven existing blocks; tab indentation):

```css
@font-face {
	font-family: "Sora";
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url("../assets/fonts/sora-latin-600-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Figtree";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../assets/fonts/figtree-latin-400-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Figtree";
	font-style: normal;
	font-weight: 500;
	font-display: swap;
	src: url("../assets/fonts/figtree-latin-500-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Figtree";
	font-style: normal;
	font-weight: 600;
	font-display: swap;
	src: url("../assets/fonts/figtree-latin-600-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Instrument Serif";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../assets/fonts/instrument-serif-latin-400-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Schibsted Grotesk";
	font-style: normal;
	font-weight: 700;
	font-display: swap;
	src: url("../assets/fonts/schibsted-grotesk-latin-700-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Atkinson Hyperlegible Next";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2") format("woff2");
}
@font-face {
	font-family: "Atkinson Hyperlegible Next";
	font-style: normal;
	font-weight: 500;
	font-display: swap;
	src: url("../assets/fonts/atkinson-hyperlegible-next-latin-500-normal.woff2") format("woff2");
}
```

Then replace the `:root` font/tracking block (keep `--font-mono`, `--font-serif`, all `--text-*`, all `--leading-*` exactly as they are):

```css
:root {
	--font-sans: "Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
	--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
	--font-serif: "Palatino Linotype", Palatino, "Book Antiqua", Optima, Georgia, serif;
	--font-display: "Sora", "Figtree", sans-serif;

	--weight-display: 600;
	--tracking-display: -0.03em;
	--tracking-heading: -0.02em;
```

- [ ] **Step 4: Update `base/base.css` headings**

Replace lines 13–19 (`h1, h2, h3, h4 { line-height…; letter-spacing: -0.02em; }`) with:

```css
h1,
h2,
h3,
h4 {
	font-family: var(--font-display);
	font-weight: var(--weight-display);
	line-height: var(--leading-snug);
	letter-spacing: var(--tracking-heading);
}
h1,
h2 {
	letter-spacing: var(--tracking-display);
}
```

- [ ] **Step 5: Update `components/stat.css`**

Add one line to `.stat-value` (after `color`):

```css
.stat-value {
	color: var(--text);
	font-family: var(--font-display);
	font-size: var(--text-3xl);
	line-height: 1;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test tools/design-system.test.mjs`
Expected: PASS (3 tests). Then run the full suite: `node --test tools/` — everything green.

- [ ] **Step 7: Commit**

```bash
git add tools/design-system.test.mjs libraries/design-system/tokens/typography.css libraries/design-system/base/base.css libraries/design-system/components/stat.css
git commit -m "Adopt Sora 600 + Figtree as the default type identity"
```

---

### Task 3: Crisp shape — radius remap and 42px controls

**Files:**
- Modify: `libraries/design-system/tokens/radius.css`
- Modify: `libraries/design-system/components/badge.css:5-7`
- Modify: `libraries/design-system/components/button.css:5,49`
- Modify: `libraries/design-system/components/input.css:5,7`
- Modify: `libraries/design-system/components/tabs.css:12`
- Modify: `libraries/design-system/components/card.css:5,25`
- Modify: `libraries/design-system/components/table.css:4`
- Modify: `libraries/design-system/components/alert.css:5`
- Modify: `libraries/design-system/components/modal.css:6`
- Test: `tools/design-system.test.mjs` (append)

**Interfaces:**
- Produces: token `--radius-xs: 0.25rem` (new) and remapped `--radius-sm/md/lg/xl` values. Component size classes: badge→xs, button/input→sm, card/table/alert→md, modal→lg.

- [ ] **Step 1: Append the failing tests**

Append to `tools/design-system.test.mjs`:

```js
test("radius scale is the crisp remap", () => {
	const css = read("tokens/radius.css");
	for (const [token, value] of Object.entries({
		"--radius-xs": "0.25rem",
		"--radius-sm": "0.375rem",
		"--radius-md": "0.5rem",
		"--radius-lg": "0.75rem",
		"--radius-xl": "1rem",
		"--radius-pill": "999px",
	})) {
		assert.ok(css.includes(`${token}: ${value};`), `${token} should be ${value}`);
	}
});

test("components sit on the right radius size class", () => {
	for (const [file, token] of [
		["components/badge.css", "--radius-xs"],
		["components/button.css", "--radius-sm"],
		["components/input.css", "--radius-sm"],
		["components/card.css", "--radius-md"],
		["components/table.css", "--radius-md"],
		["components/alert.css", "--radius-md"],
		["components/modal.css", "--radius-lg"],
	]) {
		assert.ok(read(file).includes(`border-radius: var(${token})`), `${file} should use ${token}`);
	}
});

test("interactive controls are 42px", () => {
	for (const file of ["components/button.css", "components/input.css", "components/tabs.css"]) {
		assert.ok(read(file).includes("min-height: 2.625rem"), `${file} control height should be 2.625rem`);
	}
	assert.ok(read("components/button.css").includes("width: 2.625rem"), "icon-btn width should match");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/design-system.test.mjs`
Expected: FAIL on all three new tests (old values still in place).

- [ ] **Step 3: Remap the tokens**

Replace the body of `tokens/radius.css`:

```css
:root {
	--radius-xs: 0.25rem;
	--radius-sm: 0.375rem;
	--radius-md: 0.5rem;
	--radius-lg: 0.75rem;
	--radius-xl: 1rem;
	--radius-pill: 999px;
}
```

- [ ] **Step 4: Re-point the components**

Exact single-line edits (all stay 1-line diffs):

- `badge.css:7` — `border-radius: var(--radius-pill);` → `border-radius: var(--radius-xs);`
- `button.css:7` — `border-radius: var(--radius-md);` → `border-radius: var(--radius-sm);`
- `button.css:5` — `min-height: 2.75rem;` → `min-height: 2.625rem;`
- `button.css:49` (`.icon-btn`) — `width: 2.75rem;` → `width: 2.625rem;`
- `input.css:7` — `border-radius: var(--radius-md);` → `border-radius: var(--radius-sm);`
- `input.css:5` — `min-height: 2.75rem;` → `min-height: 2.625rem;`
- `tabs.css:12` — `min-height: 2.75rem;` → `min-height: 2.625rem;`
- `card.css:5` and `card.css:25` — `var(--radius-lg)` → `var(--radius-md)`
- `table.css:4` — `var(--radius-lg)` → `var(--radius-md)`
- `alert.css:5` — `var(--radius-lg)` → `var(--radius-md)`
- `modal.css:6` — `var(--radius-xl)` → `var(--radius-lg)`

Leave alone (they inherit the sharpened values by design): `nav.css`, `toast.css`, `skeleton.css`, `progress.css` (pill), `empty-state.css` (xl → now 1rem), `gallery.css`, `base.css` skip-link, `skeleton-circle` (2.75rem avatar circle — not a control).

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tools/design-system.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add libraries/design-system/tokens/radius.css libraries/design-system/components/ tools/design-system.test.mjs
git commit -m "Sharpen shape language: radius remap, 42px controls"
```

---

### Task 4: Solid primary button with contrast-verified ink

**Files:**
- Modify: `libraries/design-system/tokens/colors.css` (both theme blocks)
- Modify: `libraries/design-system/components/button.css:25-33`
- Modify: `libraries/design-system/tokens/palettes/*.css` (only where the contrast test demands)
- Modify: `docs/specs/2026-07-13-design-system-identity.md` (revision note)
- Test: `tools/design-system.test.mjs` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: tokens `--accent-solid` (btn-primary fill, defaults `var(--accent)`), `--accent-solid-strong` (hover fill, defaults `var(--accent-strong)`), `--on-accent` (text on the solid fill). **Spec amendment:** the spec names only `--on-accent`; the two `--accent-solid*` tokens are added so a palette with a mid-tone accent can fix its *button* contrast without changing its accent identity (palettes stay visually untouched everywhere else). Append a revision note to the spec recording this.

- [ ] **Step 1: Append the failing contrast test**

Append to `tools/design-system.test.mjs`:

```js
function luminance([r, g, b]) {
	const lin = (c) => {
		c /= 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
function blockVars(css, selectorRe) {
	const m = css.match(selectorRe);
	if (!m) return {};
	const body = css.slice(m.index).match(/\{([\s\S]*?)\n\}/)[1];
	const vars = {};
	for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[name] = value.trim();
	return vars;
}
function resolveColor(value, scope) {
	const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		let h = hex[1];
		if (h.length === 3) h = [...h].map((c) => c + c).join("");
		return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
	}
	const triplet = value.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
	if (triplet) return triplet.slice(1, 4).map(Number);
	const rgbvar = value.match(/^rgb\(var\((--[a-z0-9-]+)\)\)$/);
	if (rgbvar) return resolveColor(scope(rgbvar[1]), scope);
	const varref = value.match(/^var\((--[a-z0-9-]+)\)$/);
	if (varref) return resolveColor(scope(varref[1]), scope);
	throw new Error(`cannot resolve color: ${value}`);
}

test("solid primary button meets 4.5:1 in every theme and palette", () => {
	const colors = read("tokens/colors.css");
	const scopes = [
		{ label: "default dark", layers: [blockVars(colors, /:root \{/)] },
		{ label: "default light", layers: [blockVars(colors, /:root\[data-theme="light"\]/), blockVars(colors, /:root \{/)] },
	];
	for (const file of ["gold.css", "wend.css", "daily.css", "ignite.css"]) {
		const css = read(`tokens/palettes/${file}`);
		const dark = blockVars(css, /^\[data-palette="[a-z]+"\] \{/m);
		scopes.push({ label: `palette ${file} (dark)`, layers: [dark, blockVars(colors, /:root \{/)] });
		const light = blockVars(css, /\[data-theme="light"\]\[data-palette="[a-z]+"\]/);
		if (Object.keys(light).length > 0) {
			scopes.push({
				label: `palette ${file} (light)`,
				layers: [light, dark, blockVars(colors, /:root\[data-theme="light"\]/), blockVars(colors, /:root \{/)],
			});
		}
	}
	for (const { label, layers } of scopes) {
		const scope = (name) => {
			for (const layer of layers) if (name in layer) return layer[name];
			throw new Error(`${label}: token ${name} not found`);
		};
		const ink = resolveColor(scope("--on-accent"), scope);
		for (const fill of ["--accent-solid", "--accent-solid-strong"]) {
			const c = contrast(resolveColor(scope(fill), scope), ink);
			assert.ok(c >= 4.5, `${label}: ${fill} vs --on-accent is ${c.toFixed(2)}:1 (needs >=4.5)`);
		}
	}
});
```

Note for the implementer: `_oled.css` is a shared foundation, not an opt-in palette, so it is deliberately absent from the file list. Open it before finishing this step: if it *does* override `--accent-rgb` under some selector, add that selector as one more scope (same `layers` pattern) so its solid button is also checked. Palettes layer on top of it at runtime, but for contrast purposes each palette's own `--accent-rgb` is what its button renders with — if a palette inherits `_oled.css` accents instead of defining its own, extend that palette's `layers` array with `blockVars` of `_oled.css` so `scope()` can resolve the inherited channel. The test's job is one assertion per *scope that can render a primary button*: default dark, default light, each palette's dark block, each palette's light block where it overrides accents.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/design-system.test.mjs`
Expected: FAIL — `token --on-accent not found`.

- [ ] **Step 3: Add the tokens to `tokens/colors.css`**

In the dark `:root` block, after the `--accent-ghost` line:

```css
	/* Solid-button ink — fill + text of .btn-primary only. Defaults derive
	   from the accent; a palette with a mid-tone accent overrides these
	   instead of changing its accent identity. */
	--accent-solid: var(--accent);
	--accent-solid-strong: var(--accent-strong);
	--on-accent: #0a0d10;
```

In the light block, same position:

```css
	--accent-solid: var(--accent);
	--accent-solid-strong: var(--accent-strong);
	--on-accent: #ffffff;
```

(Verified by hand: dark `#7c9ab3` vs `#0a0d10` ≈ 6.6:1; light `#5f7890` vs white ≈ 7.8:1 — the defaults pass; palettes are the open question the test settles.)

- [ ] **Step 4: Update `.btn-primary` in `components/button.css`**

Replace the `.btn-primary` and `.btn-primary:hover` rules:

```css
.btn-primary {
	background: var(--accent-solid);
	border-color: var(--accent-solid);
	color: var(--on-accent);
	font-weight: 600;
}
.btn-primary:hover {
	background: var(--accent-solid-strong);
	border-color: var(--accent-solid-strong);
}
```

`.btn-ghost`, `.btn-danger`, `.btn-secondary`, `.btn` neutral: unchanged.

- [ ] **Step 5: Run the test; add palette overrides until green**

Run: `node --test tools/design-system.test.mjs`
Expected: failures naming exact palettes and ratios. For each failing palette add an override block **at the bottom of that palette file** — recipe: if the accent is mid-tone (fails against both inks), keep `--on-accent: #ffffff` and darken the *solid* fill until ≥4.5:1. Starting point for daily (ember `190 85 38` ≈ 4.17:1 vs dark ink):

```css
/* Solid-button ink — ember is mid-tone, so the button fill deepens
   (button-only) to carry white text at AA contrast. */
[data-palette="daily"] {
	--on-accent: #ffffff;
	--accent-solid: #943c16;
	--accent-solid-strong: #a8481e;
}
```

Adjust per palette until: PASS (7 tests). Do not touch any palette that already passes.

- [ ] **Step 6: Append the revision note to the spec**

Append under the spec's title block in `docs/specs/2026-07-13-design-system-identity.md`:

```markdown
> **Revision note (implementation):** §7 gains two sibling tokens next to `--on-accent`:
> `--accent-solid` / `--accent-solid-strong` (fill + hover fill of `.btn-primary`,
> defaulting to `var(--accent)` / `var(--accent-strong)`). Palettes whose accent is
> mid-tone override the *solid fill* to reach 4.5:1 instead of altering their accent —
> keeping §3's "palettes visually untouched" promise everywhere except the one new
> solid surface. Enforced by the contrast test in `tools/design-system.test.mjs`.
```

- [ ] **Step 7: Run the full suite, then commit**

Run: `node --test tools/`
Expected: all green.

```bash
git add libraries/design-system/tokens/colors.css libraries/design-system/tokens/palettes/ libraries/design-system/components/button.css tools/design-system.test.mjs docs/specs/2026-07-13-design-system-identity.md
git commit -m "Add solid primary button with contrast-verified --on-accent ink"
```

---

### Task 5: Type skins — fraunces, instrument, nordic

**Files:**
- Create: `libraries/design-system/tokens/palettes/fraunces.css`
- Create: `libraries/design-system/tokens/palettes/instrument.css`
- Create: `libraries/design-system/tokens/palettes/nordic.css`
- Modify: `libraries/design-system/tokens/palettes/index.css`
- Test: `tools/design-system.test.mjs` (append)

**Interfaces:**
- Consumes: `--font-display`, `--font-sans`, `--weight-display`, `--tracking-display`, `--tracking-heading` from Task 2; fonts from Task 1.
- Produces: opt-in attribute `data-typeskin="fraunces|instrument|nordic"` on `<html>` — deliberately a *separate* attribute from `data-palette` so a color palette and a type skin compose (e.g. Spindle = gold palette + fraunces skin).

- [ ] **Step 1: Append the failing test**

```js
test("type skins exist, scope via data-typeskin, and are imported", () => {
	const index = read("tokens/palettes/index.css");
	for (const [file, display] of [
		["fraunces.css", "Fraunces"],
		["instrument.css", "Instrument Serif"],
		["nordic.css", "Schibsted Grotesk"],
	]) {
		const css = read(`tokens/palettes/${file}`);
		const skin = file.replace(".css", "");
		assert.ok(css.includes(`[data-typeskin="${skin}"]`), `${file} must scope via data-typeskin`);
		assert.ok(css.includes(`"${display}"`), `${file} must set display font ${display}`);
		assert.ok(index.includes(`./${file}`), `palettes/index.css must import ${file}`);
	}
	for (const file of ["fraunces.css", "instrument.css"]) {
		assert.match(
			read(`tokens/palettes/${file}`),
			/h3,\n\[data-typeskin="[a-z]+"\] h4 \{\n\tfont-family: var\(--font-sans\);/,
			`${file} must return h3/h4 to the body sans (serif reads poorly small)`,
		);
	}
	assert.ok(read("tokens/palettes/nordic.css").includes("Atkinson Hyperlegible Next"), "nordic must set the hyperlegible body");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/design-system.test.mjs`
Expected: FAIL — skin files missing.

- [ ] **Step 3: Create the three skin files**

`fraunces.css`:

```css
/*
 * Fraunces — warm editorial type skin. Serif display on large headings and
 * stats only; body stays the default sans. Composes with any color palette.
 * Opt in with <html data-typeskin="fraunces">.
 */
[data-typeskin="fraunces"] {
	--font-display: "Fraunces", "Palatino Linotype", Georgia, serif;
	--weight-display: 600;
	--tracking-display: -0.01em;
	--tracking-heading: 0em;
}

/* Serif reads poorly small — sub-section headings return to the body sans. */
[data-typeskin="fraunces"] h3,
[data-typeskin="fraunces"] h4 {
	font-family: var(--font-sans);
	font-weight: 600;
	letter-spacing: -0.02em;
}
```

`instrument.css`:

```css
/*
 * Instrument — sharp editorial type skin. Single-weight serif display on
 * large headings and stats only; body stays the default sans.
 * Opt in with <html data-typeskin="instrument">.
 */
[data-typeskin="instrument"] {
	--font-display: "Instrument Serif", Georgia, serif;
	--weight-display: 400;
	--tracking-display: 0em;
	--tracking-heading: 0em;
}

/* Serif reads poorly small — sub-section headings return to the body sans. */
[data-typeskin="instrument"] h3,
[data-typeskin="instrument"] h4 {
	font-family: var(--font-sans);
	font-weight: 600;
	letter-spacing: -0.02em;
}
```

`nordic.css`:

```css
/*
 * Nordic — Norwegian grotesk display over the Braille Institute's
 * hyperlegible body. The accessibility-first skin; grotesk holds up at
 * every heading size, so no small-heading exception is needed.
 * Opt in with <html data-typeskin="nordic">.
 */
[data-typeskin="nordic"] {
	--font-sans: "Atkinson Hyperlegible Next", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
	--font-display: "Schibsted Grotesk", "Atkinson Hyperlegible Next", sans-serif;
	--weight-display: 700;
	--tracking-display: -0.025em;
	--tracking-heading: -0.015em;
}
```

- [ ] **Step 4: Register them in `tokens/palettes/index.css`**

Append after the existing imports, with a comment separating skins from palettes:

```css

/* Type skins — opt-in via <html data-typeskin="NAME">; compose with any palette. */
@import url("./fraunces.css");
@import url("./instrument.css");
@import url("./nordic.css");
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tools/design-system.test.mjs`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add libraries/design-system/tokens/palettes/ tools/design-system.test.mjs
git commit -m "Add fraunces, instrument, nordic type skins (data-typeskin opt-in)"
```

---

### Task 6: Docs and version — README, VERSION 2.0.0

**Files:**
- Modify: `libraries/design-system/README.md`
- Modify: `libraries/design-system/VERSION`
- Test: `tools/design-system.test.mjs` (append)

**Interfaces:**
- Consumes: everything above (this task documents it).
- Produces: `VERSION` = `2.0.0` (Task 7's extract stamps it into consumers).

- [ ] **Step 1: Append the failing test**

```js
test("VERSION is 2.0.0 and README documents the identity", () => {
	assert.equal(read("VERSION").trim(), "2.0.0");
	const readme = read("README.md");
	for (const needle of ["Sora", "Figtree", "data-typeskin", "fraunces", "instrument", "nordic"]) {
		assert.ok(readme.includes(needle), `README should mention ${needle}`);
	}
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/design-system.test.mjs`
Expected: FAIL — VERSION is 1.3.0.

- [ ] **Step 3: Update `VERSION`**

File content becomes exactly:

```
2.0.0
```

- [ ] **Step 4: Update `README.md`**

Two edits, matching the README's existing plain tone:

1. The fonts line (currently line 35) becomes:

```markdown
- `assets/fonts/` — self-hosted fonts (Sora, Figtree, Fraunces, Instrument Serif, Schibsted Grotesk, Atkinson Hyperlegible Next, Space Grotesk, Bricolage Grotesque, Hanken Grotesk)
```

2. Add a short section after the palettes documentation (adjacent to wherever `data-palette` is described):

```markdown
## Type skins

The default identity is Sora 600 headings over a Figtree body. Three opt-in type skins
swap the display face (and for nordic, the body) without touching color:

| Skin | Headings | Body |
|---|---|---|
| `fraunces` | Fraunces 600 (h1/h2/stats only) | Figtree |
| `instrument` | Instrument Serif (h1/h2/stats only) | Figtree |
| `nordic` | Schibsted Grotesk 700 | Atkinson Hyperlegible Next |

Opt in with `<html data-typeskin="fraunces">`. Skins compose with color palettes
(`data-palette`) — set both attributes to combine them.
```

- [ ] **Step 5: Run tests and check-links**

Run: `node --test tools/design-system.test.mjs` — Expected: PASS (9 tests).
Run: `node tools/check-links.mjs` — Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add libraries/design-system/README.md libraries/design-system/VERSION tools/design-system.test.mjs
git commit -m "Document type identity and skins; bump design-system to 2.0.0"
```

---

### Task 7: Re-sync the web-vite scaffold and run the browser acceptance sweep

**Files:**
- Modify: `scaffolds/web-vite/design-system/**` (generated — via `extract.mjs` only, never by hand)

**Interfaces:**
- Consumes: the finished library + `VERSION` 2.0.0.

- [ ] **Step 1: Check drift, then sync**

```bash
node tools/extract.mjs design-system scaffolds/web-vite --check
```

Expected: drift report (exit 1) listing the changed files.

```bash
node tools/extract.mjs design-system scaffolds/web-vite --force
node tools/extract.mjs design-system scaffolds/web-vite --check
```

Expected: second `--check` reports clean (exit 0).

- [ ] **Step 2: Full test suite**

Run: `node --test tools/`
Expected: all tests green (design-system, extract, dashboard, storyboard).

- [ ] **Step 3: Browser sweep — gallery, default identity**

Serve the library: `python -m http.server 8137 --directory libraries/design-system` and open `http://localhost:8137/gallery/index.html`.

Verify in the browser console:

```js
["Sora", "Figtree"].map((f) => [f, document.fonts.check(`600 16px "${f}"`) || document.fonts.check(`16px "${f}"`)])
```

Expected: both `true` (the silent-system-fallback bug this whole spec kills). Then eyeball all gallery sections at 375px and 1280px widths: headings render Sora 600, buttons/inputs are 6px/42px, cards 8px, badges 4px squares (not pills), primary buttons solid with dark ink.

- [ ] **Step 4: Browser sweep — skins and palettes**

In the console, per skin:

```js
document.documentElement.setAttribute("data-typeskin", "fraunces"); // then instrument, nordic
```

Expected per skin: h1/h2 switch face; for fraunces/instrument h3 stays sans; for nordic body text changes too (`document.fonts.check('16px "Atkinson Hyperlegible Next"')` → true after render). Also set `data-palette="daily"` together with a skin — colors and type compose. Check a `.btn-primary` in daily: deepened ember fill, white text.

Spot-check (spec §10, unchanged behavior): with DevTools emulating `prefers-reduced-motion: reduce`, animations stay killed; with forced-colors emulation, `:focus-visible` outlines remain visible; tab through a gallery section and confirm focus rings on the new 42px controls.

- [ ] **Step 5: Commit the sync**

```bash
git add scaffolds/web-vite/design-system/
git commit -m "Re-sync web-vite scaffold to design-system 2.0.0"
```

- [ ] **Step 6: Human acceptance gate**

Stop here. Malin verifies in her own browser (gallery at :8137 or :5500): overall feel, keyboard pass, both themes. Merge to `main`, workbench version/tag (v2.3.0), and Pages deploy follow the repo's release habit **only on her explicit go-ahead** — not part of this plan's automation.
