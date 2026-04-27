# Malin Pro MVC Starter Template

A merged starter template that combines your non-module MVC project structure with your reusable design system.

## What this is
- non-module MVC structure for the current curriculum
- built-in design system from the start
- calm default UI with reusable primitives and components
- clean baseline for assignments, small apps, dashboards, and portfolio prototypes

## Folder structure
- `design-system/` shared visual foundation
- `src/model/` app state only
- `src/view/` markup-generating views
- `src/controller/` behavior only
- `src/utilities/` reusable project-level markup helpers
- `src/styles/main.css` project-specific overrides only
- `docs/` template rules and usage notes

## Script order
Keep this order in `index.html`:
1. theme behavior
2. model
3. utilities / components
4. views
5. controller
6. app

This matters because the template uses plain script files without modules.

## Working rules
- put state in `model.js`
- put HTML in views and small markup helpers
- put behavior in controller files
- call `updateView()` after state changes
- use design-system classes before writing custom CSS
- only add reusable system code when at least two projects need it

## First steps in a new project
1. Change `<title>` in `index.html`
2. Update `model.ui.projectTitle`
3. Replace `homeView()` with real project markup
4. Add only the state your project needs
5. Keep custom CSS minimal in `src/styles/main.css`

## Standard moving forward
Use this template as the default baseline for future non-module MVC assignments unless a task explicitly requires another setup.
