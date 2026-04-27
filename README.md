# Template

A reusable starting point for web projects. Three scaffolds, one shared design system. Dark-mode-first, mobile-first, accessible by default.

## What you get out of the box

- Three self-contained scaffolds — pick the one that fits and start coding
- Shared design system (tokens, primitives, components, compositions, utilities, theme)
- No-flash dark/light theme toggle that persists across sessions
- Mobile-first responsive baseline (no `max-width` queries to flip)
- Accessibility defaults — visible focus rings, reduced-motion handling, forced-colors mode, skip link

## Pick a scaffold

| Scaffold | Use it for | Build step |
|---|---|---|
| [`web-mvc-curriculum/`](./web-mvc-curriculum) | Coursework, non-module MVC assignments | None |
| [`web-vite/`](./web-vite) | Personal projects, anything that benefits from a build | `npm install` |
| [`web-static/`](./web-static) | Smallest assignments, quick visual demos | None |

Each scaffold has its own `README.md` with the first 5 setup steps.

## How to use this template

### From GitHub (recommended)

1. Click **Use this template** → **Create a new repository**
2. Clone the new repo locally
3. Delete the scaffolds you don't need (keep one)
4. Move the contents of the kept scaffold up to the project root if you prefer a flat layout
5. Open the scaffold's `README.md` for the next steps

### Locally (this folder on disk)

1. Copy the scaffold folder you want to wherever the new project lives
2. Open the project's `README.md` for the first 5 setup steps

## Design system

The shared `design-system/` lives at the top level and is the canonical source of truth. Each scaffold ships a copy of it (lean — no showcase or docs) so you only need one folder copy to start.

When the system improves, edit the canonical `design-system/` and sync the lean parts (`tokens/`, `base/`, `primitives/`, `components/`, `compositions/`, `utilities/`, `theme/`) into each scaffold.

See [`design-system/README.md`](./design-system/README.md) for principles and structure. Current version: see `design-system/VERSION`.

## Project conventions

- **Mobile-first CSS.** Baseline styles target the smallest screen. Layer up with `@media (min-width: 768px)` for tablet and `1024px` for desktop. No `max-width` queries.
- **Dark mode is the default.** A working light-mode toggle is wired up. User's choice persists in `localStorage`.
- **MVC separation.** Model holds state. View renders HTML. Controller owns behavior. Each layer has its own folder in the scaffolds that use MVC.
- **Treat `design-system/` as read-only inside any project.** Override in `src/styles/main.css`.

## License

[MIT](./LICENSE)
