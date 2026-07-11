# MVC Integration Notes

## Intent
Keep the design system independent from business logic.

## Recommended split
- `design-system/` shared styles and theme behavior
- `src/model` state only
- `src/view` returns markup using system classes
- `src/controller` behavior only
- `src/components` project-specific markup helpers

## View rule
Views should compose with system classes first:
- `container`
- `stack`
- `cluster`
- `grid`
- `split`
- `card`
- `btn`

If you need many custom selectors for one page, first ask whether a primitive or composition is missing.
