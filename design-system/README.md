# Design System

Reusable UI foundation. Tokens, primitives, components, compositions, utilities, theme. Dark-mode-first, mobile-first, semantic.

Current version: see `VERSION`.

## Principles

- True-black dark mode with restrained, damped accent color
- Semantic tokens over hard-coded values
- Primitives before page-specific layout
- Subtle motion only when it improves clarity
- Accessible defaults from the start (focus rings, reduced-motion, forced-colors, skip link)
- Reusable structure for both small and growing projects

## Structure

- `tokens/` — colors, spacing, typography, radius, shadows, motion, layers (the values)
- `base/` — `reset.css` and `base.css` (HTML defaults, focus rings, reduced motion, forced colors, skip link)
- `primitives/` — layout helpers (`stack`, `cluster`, `grid`, `sidebar`, `split`, `center`, `container`)
- `components/` — `button`, `card`, `input`, `nav`, `modal`, `alert`, `badge`, `progress`, `stat`, `table`
- `compositions/` — page patterns (`app-shell`, `dashboard`, `settings`, `hero`, `empty-state`)
- `utilities/` — single-purpose helpers
- `theme/` — `theme-toggle.js` (click handler) and `theme-init-snippet.html` (inline `<head>` snippet)
- `showcase/` — visual reference page
- `docs/` — system spec and usage notes

## Theme behavior

The initial theme is set by an **inline `<head>` snippet** so there's no flash on first paint. Copy `theme/theme-init-snippet.html` into every scaffold's `<head>`, before stylesheets. The click handler in `theme/theme-toggle.js` toggles between dark and light when any `[data-theme-toggle]` element is clicked.

Default is dark. User's saved choice (from `localStorage`) wins.

## Versioning

Bump `VERSION` when the system changes in a way that would affect existing projects:

- **MAJOR** — breaking change (renamed token, removed component)
- **MINOR** — additive (new component, new utility)
- **PATCH** — fix (bug, accessibility correction, doc update)

When bumping, sync the lean parts (`tokens/`, `base/`, `primitives/`, `components/`, `compositions/`, `utilities/`, `theme/`) into each scaffold's bundled `design-system/`.
