# Prompt Gen 4.5

Prompt Gen is a static GitHub Pages AI image-prompt workstation backed by Google Sheets through a Google Apps Script JSON API.

Production:
- Website: https://andyandriadoria.github.io/prompt-generator/
- Spreadsheet: `Database_Prompt_Gen_4_5`
- UI: Obsidian UI
- Deployment config: persistent `config.js`

## Prompt Modes

1. Creative Prompt Builder
2. Reference Outfit Catalog
3. Reference Product Catalog
4. Product Poster Builder
5. Architectural Render
6. Architectural Sketch Builder

## Workspaces

- **Build** — authoring workspace for all active Prompt Modes.
- **Saved** — local Saved Prompt Library using IndexedDB, with complete Build-state restore, optional result images, notes, search/filter, copy, edit, and delete.

## Data Architecture

```text
Google Sheets
    ↓
Google Apps Script /exec
    ↓
config.js → data-loader.js
    ↓
mode controllers + prompt builders
    ↓
Generated Prompt
```

Google Sheets is the editable source of truth. `fallback.json` is only the resilience copy used when the API/cache path is unavailable.

## Architecture Mode Data

Architectural option maintenance is row-based in Google Sheets.

### Shared Architecture Taxonomy
Both **Architectural Render** and **Architectural Sketch** use the same building/style taxonomy:

- `ARCH_BUILDING_CATEGORIES` — Building Category labels/order
- `ARCH_BUILDING_TYPES` — Building Types linked by `CATEGORY_ID`
- `ARCH_STYLE_CATEGORIES` — Architectural Style Category labels/order
- `ARCH_STYLE_OPTIONS` — Architectural Styles linked by `CATEGORY_ID`

Category fields are UI filters only and never enter the generated prompt. Building Type and Architectural Style each expose a frontend-only **Custom…** option that reveals a manual text input.

The taxonomy is mirrored into CONFIG with formula-generated JSON keys so the current Apps Script API contract remains unchanged.

Architectural option maintenance is also row-based in Google Sheets:

### ARCH_RENDER_OPTIONS
Stores editable option content for:
- Input Type
- Design Fidelity
- Realism Target

Important columns:
`GROUP · ID · LABEL · PROMPT · OPENING · CLOSING · DESCRIPTION · ACTIVE · SORT`

### ARCH_SKETCH_OPTIONS
Stores editable option content for:
- Input Type
- Scene Type
- Sketch Style
- Paper / Surface
- Line Character
- Color Treatment
- Lighting / Time
- Atmosphere / Character
- Human Figure for Scale
- View / Projection

Sketch Style is the primary visual controller. Line Character and Color Treatment are Advanced overrides and default to `Auto — Follow Sketch Style`.

Lighting / Time controls illumination only. Atmosphere / Character controls spatial character only. Weather and site conditions belong in Landscape / Context.

View / Projection is filtered by Scene Type using `SCENE_SCOPE`. Exterior defaults to Three-Quarter Perspective; Interior defaults to Interior Corner Perspective, while users remain free to select any valid scene-compatible projection.

Important columns:
`GROUP · ID · LABEL · PROMPT · DESCRIPTION · LINE_RULE · COLOR_RULE · AVOID · ACTIVE · SORT · RECOMMENDED_SURFACE · SCENE_SCOPE`

`RECOMMENDED_SURFACE` is used on Sketch Style rows only. It stores comma-separated Paper / Surface IDs for guidance; recommendations never lock the user's selection.

The hidden `_JSON` columns and CONFIG JSON cells are generated automatically with formulas. Edit the visible option rows, not the generated JSON bridge.

This bridge keeps the current Apps Script CONFIG payload compatible, so the 2026-09-19 architecture-option migration does **not** require an Apps Script redeploy.

## Upgrade Rules

- Do not overwrite production `config.js`.
- Keep Google Sheets as the source of truth for content data.
- Preserve stable IDs when editing existing options.
- Prefer additive migrations.
- Keep Obsidian UI and the shared monoline SVG icon system.
- Sync `fallback.json` when production option data changes materially.

## Main Frontend Files

Core:
- `index.html`
- `style.css`
- `app.js`
- `data-loader.js`
- `prompt-builder.js`
- `catalog-prompt-builder.js`
- `compatibility-engine.js`
- `searchable-select.js`
- `icon-system.js`

Additional production modules include Product Catalog, Product Poster, Architectural Render, Architectural Sketch, Setting Preview, Outfit Focus, workspace navigation, and Saved Prompt Library modules.

See `CURRENT_STATE.md` for the current production baseline and `CHANGELOG.md` for release history.
