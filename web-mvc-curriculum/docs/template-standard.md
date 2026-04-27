# Template Standard

## Intent
This is the default merged template for Malin's current MVC coursework.

## Why this merged version is better
- keeps the simple curriculum-friendly script structure
- removes repeated styling setup work
- gives every new project a calmer and more professional baseline
- reinforces separation of concerns in both code and UI

## Non-negotiable rules
- `model` stores state, not markup
- `controller` handles behavior, not HTML
- `view` returns markup, not business rules
- `src/styles/main.css` is for project-specific needs only
- design-system files stay reusable and generic
- prefer primitives before page-specific layout CSS

## Good default workflow
1. start with the model
2. sketch the view structure
3. implement controller behavior
4. reuse system classes
5. add minimal project CSS last

## When not to use this template
- when the assignment explicitly requires modules, Vite, or React
- when the project is so tiny that plain HTML/CSS with no state is enough
