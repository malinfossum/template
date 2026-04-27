# web-static

Single-page static starter. No build step, no module system, no MVC. Open `index.html` in a browser and it works.

Use this for: smallest assignments, visual demos, quick prototypes.

## What's included

- Full design system (`design-system/`) — tokens, primitives, components, compositions, utilities, theme
- No-flash dark/light theme toggle (works on first load, persists in `localStorage`)
- Mobile-first responsive baseline
- Accessibility defaults (focus rings, reduced-motion, forced-colors, skip link)

## First 5 steps

1. Set `<title>` and `<meta name="description">` in `index.html`
2. Replace the page header content (the `<h1 class="title">`)
3. Replace the two demo `<section class="card">` blocks in `<main>` with real content
4. Add project-specific styles in `src/styles/main.css` (mobile-first, no `max-width` queries)
5. Add behavior in `src/js/app.js`

## Run locally

Open `index.html` directly in a browser, or serve with any static server:

```bash
# Python
python -m http.server 5500

# VS Code Live Server extension
right-click index.html → Open with Live Server
```

## Folder layout

- `index.html` — page shell, demo content
- `src/styles/main.css` — project-specific overrides
- `src/js/app.js` — project entry point
- `design-system/` — read-only foundation, do not edit
