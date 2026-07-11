# Spec C — Scaffold Refresh (v2.1.0)

- **Date:** 2026-07-11
- **Status:** Approved by Malin (decisions locked in the 2026-07-11 review session)
- **Depends on:** Spec A (workbench restructure, shipped locally as v2.0.0)
- **Blocks:** nothing

## 1. Summary

The scaffolds carry school-era framing ("assignment", "Emne 3", "Uke 5+", `DO NOT TOUCH` banners)
and predate lessons the real projects have since taught. This spec de-schools every scaffold,
renames `csharp-console-mvc` to what it actually is, wires the web MVC pattern as working code,
brings Vite current, and turns `csharp-wpf` from a two-file stub into a minimal working MVVM
scaffold extracted from Tidsro. Ships as **v2.1.0**.

## 2. Scope

### 2.1 De-school (all scaffolds)

- Replace "assignment"/"Emne"/"Uke"/named school exercises with project-neutral wording.
- Replace `DO NOT TOUCH` / `SAFE TO EDIT` / `EDIT THIS FILE` banners with one calm line each
  ("Boot file — rarely edited", etc.). The *rules* stay (no DOM in the model, no timers in the
  view) — they're good rules; only the student voice goes.

### 2.2 web-vite

- **Wire the MVC pattern (decided: wired, no demo feature).** The stubs currently return `{}`,
  which contradicts the documented contract. After this spec:
  - `model.js` — subscribe/notify: `subscribe(fn)`, `notify()`, state object; still no domain logic.
  - `view.js` — `render(state)` + `bindActions(handlers)` wiring `data-action` clicks/submits by
    event delegation; no state mutation.
  - `controller.js` — `init()` subscribes the view's render to the model and binds actions; live.
  - `app.js` — `controller.init()` runs (no longer commented out).
  - No example feature — the wiring is the deliverable; screens stay empty.
- **Slim `main.css`.** It predates the bundled design system and redefines its own `--bg`/`--text`
  tokens plus a mini reset that fight the DS. Reduce to a genuinely-empty project-stylesheet with
  a short comment pointing at the DS tokens. (Mobile-first rule stated in the comment.)
- **Vite:** bump from `^5.4` to the current major; verify `npm install && npm run build` and dev
  serve.

### 2.3 csharp-console-mvc → csharp-layered

- `git mv scaffolds/csharp-console-mvc scaffolds/csharp-layered`. The structure (class library +
  console front-end + tests) is *layered*, not MVC — the old name collides with the web MVC
  vocabulary.
- De-school its README (drop "Emne 3", "Uke 5+/8", named assignments); keep the layering rules and
  the "add an Api project later" section (renamed to plain "Adding an API project").
- Update root README + dashboard card.

### 2.4 csharp-wpf — build from Tidsro (read-only source)

Tidsro (`Documents/Development/GitHub/repos/tidsro`) is the extraction source and is **never
modified**. The May-2026 design in `~/.claude/memory/domain/csharp-wpf-scaffold.md` is the layout
authority; Tidsro settles its open decisions:

- **CommunityToolkit.Mvvm** (`[ObservableProperty]`/`[RelayCommand]`) — proven across 260+ tests.
- **xUnit** for the test project (as in Tidsro; the layered scaffold keeps NUnit — noted divergence,
  aligned with what each scaffold's reference project actually uses).
- **No DI container** — composition in `App.xaml.cs` like Tidsro; `Microsoft.Extensions.DependencyInjection`
  can be added when a project earns it.
- **Services = the only I/O boundary**; ViewModels never touch `File`/network directly.

Layout (`App` placeholder names, rename on copy like the layered scaffold):

```
scaffolds/csharp-wpf/
├── README.md            copy/rename/first-run steps
├── .editorconfig        (existing)
├── .gitignore           (existing)
├── App.slnx
├── App/
│   ├── App.csproj       net10.0-windows, UseWPF, Nullable, CommunityToolkit.Mvvm
│   ├── App.xaml         merges Resources/tokens.xaml
│   ├── App.xaml.cs      composition root (manual wiring)
│   ├── MainWindow.xaml  binds MainViewModel; resize-tolerant Grid; no fixed pixels
│   ├── MainWindow.xaml.cs  sets DataContext only
│   ├── Models/          state only — no timers, no UI references
│   ├── ViewModels/MainViewModel.cs   one [ObservableProperty] + one [RelayCommand], wired
│   ├── Views/           (empty, .gitkeep)
│   ├── Services/IFileService.cs + FileService.cs   the I/O boundary example
│   └── Resources/tokens.xaml
└── App.Tests/           xUnit; references App; tests ViewModels/Models only
    └── MainViewModelTests.cs
```

- **`tokens.xaml`:** structure and control styles proven in Tidsro (token groups, keyboard-only
  `ActionFocusVisual`, quiet + primary button styles, dark TextBox with hint) — but colours mirror
  the **canonical design-system default palette** (`--surface-1..5`, text, borders, accent
  `#7C9AB3`), not Tidsro's gold brand. Spacing/radius/typography/motion scales mirror the DS
  scales. App-specific pieces (converters, DayChip, ToggleSwitch, ComboBox restyle) stay in Tidsro.
- Like the web scaffold's wired MVC: the pattern runs (window opens, command works, test passes),
  no demo feature.

### 2.5 Dashboard + docs

- Update the two affected dashboard cards (`csharp-layered`, `csharp-wpf` no longer "in progress").
- Update root README scaffold table.

## 3. Non-goals

- **`aspnet-api` scaffold** — reserved; build from the first real GET Prepared project (starts
  2026-08-06), not speculatively.
- **PWA variant of web-vite** — deferred to the Ignite v2 decision.
- **`npm test` in web-vite** — deferred; revisit when a web project has model logic worth a suite.
- **Design-system internals** — still frozen.
- **CLAUDE.md / project-init skill updates** — live under `.claude/`, gated; listed as manual
  follow-ups for Malin (new scaffold paths + names, csharp-wpf status, `src/styles/main.css`).

## 4. Verification

- [ ] `node --test "tools/*.test.mjs"` still green (dashboard test updated for renamed card).
- [ ] web-vite: `npm install && npm run build` succeeds on the bumped Vite; dev server serves the
      shell; `npm run check` (Biome) clean; the wired MVC boots without console errors.
- [ ] csharp-layered: `dotnet build && dotnet test` green after rename.
- [ ] csharp-wpf: `dotnet build && dotnet test` green; app launches and the command updates the
      bound property (manual smoke).
- [ ] Root link check still passes; no stale `csharp-console-mvc` references outside archive/docs
      history.
- [ ] Tidsro working tree untouched (`git -C tidsro status` clean).

## 5. Release

- Merge to `main` locally, tag **v2.1.0** (additive: new WPF scaffold, wired patterns, renames are
  internal to the workbench — scaffolds are copy-to-start, nothing external references their paths).
- Push happens only with the gated Spec A Task 10 outward sequence (or separately, on go-ahead).
