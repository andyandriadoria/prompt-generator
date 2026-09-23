# Prompt Gen 4.5

Prompt Gen is a static GitHub Pages AI image-prompt workstation backed by Google Sheets through a Google Apps Script JSON API.

Production:
- Website: https://andyandriadoria.github.io/prompt-generator/
- Spreadsheet: `Database_Prompt_Gen_4_5`
- UI: Obsidian UI — Workstation V2
- Deployment config: persistent `config.js`

## Prompt Modes

1. Creative Prompt Builder
2. Reference Outfit Catalog
3. Reference Product Catalog
4. Product Poster Builder
5. Architectural Render
6. Architectural Concept Builder

## Workspaces

- **Build** — authoring workspace for all active Prompt Modes.
- **Saved** — local Saved Prompt Library using IndexedDB, with complete Build-state restore, optional result images, notes, search/filter, copy, edit, and delete.

### Workstation V2 shell
The Build workspace uses a three-zone creative workstation layout:
- left navigation sidebar;
- center Build canvas with Prompt DNA, visual Prompt Mode / Style cards, and grouped Prompt Details;
- right dark Live Output with Prompt / Structure / Metadata tabs, deterministic readiness analysis, adaptive prompt-editor height, and copy control.

`workstation-v2.js` and `workstation-v2.css` are presentation-layer files. They preserve all production form IDs and mode controllers so Google Sheets data, Saved Prompt restore, Smart Random, and prompt builders continue to operate without API changes.

Setting previews remain contextual inside their owning Scene / Setting card; the separate Live Output Visual Preview was removed. Prompt Mode cards remain six-across on desktop, Creative details are grouped as Subject / Scene & Action / Camera & Technical, and Prompt Analysis uses active-mode DNA rather than Creative-only state.

### Workstation visual assets
Workstation thumbnails are intentionally separated from content/Setting assets:
- `assets/workstation/modes/` — six Prompt Mode thumbnails;
- `assets/workstation/styles/` — Style DNA thumbnails.

To change a UI image, replace the existing file in GitHub using the same filename. No frontend code or Google Sheets edit is required. See `assets/workstation/README.md` for the stable filename list and image recommendations.

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

Google Sheets is the editable source of truth. `fallback.json` is only the resilience copy used when the API/cache path is unavailable. Active `PROMPT_MODES` rows are mirrored into `fallback.json.promptModes` so production mode availability remains consistent during fallback operation.

## Architecture Mode Data

Architectural option maintenance is row-based in Google Sheets.

### Shared Architecture Taxonomy
Both **Architectural Render** and **Architectural Concept Builder** use the same building/style taxonomy:

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
- Output Representation
- Photo Realism Target
- Text / Signage Policy
- Scene Type
- Sketch Style
- Paper / Surface
- Line Character
- Color Treatment
- Lighting / Time
- Atmosphere / Character
- Human Presence / Scale
- View / Projection
- Annotations / Text

Sketch Style is the primary visual controller. Line Character and Color Treatment are Advanced overrides and default to `Auto — Follow Sketch Style`.

Lighting / Time controls illumination only. Atmosphere / Character controls spatial character only. Weather and physical surroundings belong in Site / Context.

Site / Context is a free-text physical-environment field. Architectural Feature Emphasis is a separate free-text building-element field. In Reference Image mode, feature emphasis is preservation-aware and may only highlight elements already present in the reference. Human Presence / Scale controls figures only for scale, not narrative activity.

View / Projection is filtered by Scene Type using `SCENE_SCOPE`. Exterior defaults to Three-Quarter Perspective; Interior defaults to Interior Corner Perspective, while users remain free to select any valid scene-compatible projection.

Annotations / Text applies to **Sketch Presentation** and defaults to **None — No Text or Annotations**. In this mode the prompt engine adds an explicit guard against generated signage, labels, logos, captions, handwritten notes, dates, signatures, watermarks, slogans, decorative lettering, and pseudo-text. Optional annotation modes are maintained as rows in the `annotation_text` group.

Architectural Photography uses a separate **Text / Signage Policy** instead of inheriting the sketch no-text guard. The default **No Invented Text — Preserve Existing** blocks fabricated lettering while allowing supported existing reference signage to remain. **Preserve Reference Signage / Text** is available only for Reference Image input; non-reference inputs automatically disable it.

Important columns:
`GROUP · ID · LABEL · PROMPT · DESCRIPTION · LINE_RULE · COLOR_RULE · AVOID · ACTIVE · SORT · RECOMMENDED_SURFACE · SCENE_SCOPE · RECOMMENDED_LIGHTING · RECOMMENDED_HUMAN`

`RECOMMENDED_SURFACE` is used on Sketch Style rows only. It stores comma-separated Paper / Surface IDs for guidance; recommendations never lock the user's selection.

`RECOMMENDED_LIGHTING` is used on Scene Type rows for scene-aware Lighting smart defaults. `RECOMMENDED_HUMAN` is used on Sketch Style rows as a soft Human Presence / Scale recommendation only.

Smart Defaults respect manual overrides. Paper / Surface, Lighting / Time, and View / Projection stop auto-following recommendations after the user changes them manually; Reset re-enables smart defaults. Saved Prompt restore is treated as manual state and is never overwritten by the recommendation engine.

Architectural Concept Builder provides **Concept Random**. It varies only untouched controls and keeps manual selections locked until Reset. When Output Representation is Sketch Presentation it uses `RECOMMENDED_SURFACE`, `RECOMMENDED_LIGHTING`, `RECOMMENDED_HUMAN`, and `SCENE_SCOPE`; when Architectural Photography is selected it randomizes only photography-relevant representation controls. Site / Context, Architectural Feature Emphasis, Extra Instruction, and Input Type are not invented by randomization.

The hidden `_JSON` columns and CONFIG JSON cells are generated automatically with formulas. Edit the visible option rows, not the generated JSON bridge.

This bridge keeps the current Apps Script CONFIG payload compatible, so the 2026-09-19 architecture-option migration does **not** require an Apps Script redeploy.

## Architectural Concept Builder

The existing internal mode ID `architectural_sketch` is intentionally retained for Saved Prompt and frontend compatibility, but its production UI label is **Architectural Concept Builder**. It is the concept-first workflow; use **Architectural Render** when preserving an existing design, geometry, or source view with explicit Design Fidelity is the priority.

**Output Representation**:
- `sketch-presentation` — shows Sketch Style, Paper / Surface, Advanced Line/Color controls, and Annotations / Text.
- `architectural-photography` — hides sketch-only controls and shows Photo Realism Target plus Text / Signage Policy.

Photo Realism Targets:
- Hyper-Real Architectural Photo
- Natural Documentary Architectural Photo
- Editorial Architectural Photo

Photography Text / Signage Policies:
- No Invented Text — Preserve Existing (default)
- Preserve Reference Signage / Text (Reference Image only)
- Allow Functional Architectural Signage
- Blank Signage — No Text

Both paths share the same Architecture Taxonomy, Scene Type, Lighting / Time, Atmosphere / Character, Site / Context, Architectural Feature Emphasis, Human Presence / Scale, View / Projection, and Aspect Ratio controls.

The option data remains in `ARCH_SKETCH_OPTIONS`; the CONFIG JSON bridge exposes Output Representation, Photo Realism Target, and Text / Signage Policy without an Apps Script redeploy. Existing Saved Prompts that predate this feature restore into Sketch Presentation automatically.

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
