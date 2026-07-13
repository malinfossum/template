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
