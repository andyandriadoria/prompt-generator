# Prompt Gen — Changelog

## 4.5 — Workspace Tabs + Prompt Intelligence + History + Reference Product Catalog + Outfit Focus Style

Focus:
- introduce a persistent workspace layer without changing Prompt Mode semantics;
- add prompt analysis and local session recovery;
- add a third production Prompt Mode for reference-product catalog generation;
- expand Reference Outfit Catalog with outfit-first / no-face presentation controls;
- unify Creative and Reference Outfit Catalog scene settings around one master source;
- preserve the 4.4.1 Obsidian/readability baseline.

Key changes:
- added Build / Inspect / History workspace tabs;
- Build now supports Creative, Reference Outfit Catalog, and Reference Product Catalog workflows;
- added Prompt Intelligence v1 with Prompt Health, expanded Prompt DNA, completeness/coherence findings, prioritized improvements, and output diagnostics;
- added Product-aware Prompt Intelligence dimensions for Product, Presentation, Preservation, Scene, Shot, Composition, Ratio, and optional Campaign Copy;
- added browser-local Prompt History v1 with a 50-item cap for the core history store;
- added Product Catalog local history + restore integration for explicit Generate actions;
- History saves only explicit Generate Prompt actions, not automatic live generation;
- History supports restore, search/filter, preview, copy, delete, and clear;
- added semantic `history` and `package` monoline SVG icons;
- QA fixed new workspace metadata to respect the 10 px desktop / 11 px mobile readability floor;
- synchronized release title to Prompt Gen 4.5 and renamed the production spreadsheet to `Database_Prompt_Gen_4_5`;
- added Reference Product Catalog with product-first preservation, presentation filtering, Product Random, conditional worn/campaign fields, three-block natural prompt writing, and pair/set/collection-aware preservation;
- added Product Catalog Obsidian styling with amber selection language and electric-blue Product identity accent;
- added eight Google Sheets collections:
  - `PRODUCT_TYPES`
  - `PRODUCT_PRESENTATIONS`
  - `PRODUCT_SETTINGS`
  - `PRODUCT_SHOTS`
  - `PRODUCT_COMPOSITIONS`
  - `PRODUCT_WEAR_CONTEXTS`
  - `PRODUCT_TEXT_OVERLAYS`
  - `PRODUCT_PRESERVATION_LEVELS`;
- added Product Catalog CONFIG defaults for product type, presentation, setting, shot, composition, aspect ratio, preservation, and text overlay;
- expanded Apps Script `SHEET_MAP` to expose Product Catalog collections through the existing `/exec` URL while preserving sectioned/safe CacheService behavior;
- redeployed the existing Apps Script deployment once for the Product Catalog API expansion;
- activated `reference_product_catalog` in `PROMPT_MODES` after Build / Inspect / History QA;
- added `OUTFIT_FOCUS_STYLES` as an additive Google Sheets collection for Reference Outfit Catalog;
- added CONFIG default `defaultOutfitFocusStyle = headless-outfit-crop`;
- added Outfit Focus Style presentation presets and refined the production set to:
  - Hidden Face — Holding Outfit
  - Held Hanger — Clean Lifestyle
  - POV Outfit Selfie
  - Headless Outfit Crop
  - Phone-Covered Outfit Selfie;
- retained stable legacy IDs where practical so History restore remains compatible after preset renaming/repositioning;
- added `OUTFIT_USAGE` metadata so each focus preset can explicitly behave as `held-front`, `hanger-held`, or `worn`;
- added modular `outfit-focus-style.js` instead of expanding `app.js` monolithically;
- added `outfit-focus-compatibility.js` for field relevance, controlled-field states, and presentation-specific compatibility behavior;
- added explicit no-face / cropped-face / phone-obscured / outfit-priority prompt language without weakening reference outfit preservation;
- added audience guard so adult subjects are not left paired with child-only catalog types;
- added History save/restore support for `outfitFocusStyle` on explicit Generate actions;
- added an additive Outfit Focus DNA card in Inspect;
- QA fixed conflicts where hanger/held-front styles still inherited “wearing the exact outfit” wording;
- QA fixed focus styles that conflicted with selected `Shot Type`;
- `Held Hanger — Clean Lifestyle` now ignores non-relevant model/pose fields and avoids duplicate hanger wording;
- `POV Outfit Selfie` now explicitly requests handheld front-camera/top-down OOTD framing, rejects mirror/reflection interpretation, and prioritizes the complete outfit down to the feet;
- `Phone-Covered Outfit Selfie` now explicitly keeps the smartphone visible in front of the face while rejecting mirror-selfie/reflection interpretation;
- added field-intelligence UI states so non-relevant fields can be disabled or marked `Controlled by Outfit Focus Style`;
- unified Creative Prompt Builder and Reference Outfit Catalog settings around the master `SETTINGS` collection;
- added genuinely unique Catalog settings to `SETTINGS` while avoiding duplicate scene concepts;
- retained `CATALOG_SETTINGS` as a legacy compatibility source instead of deleting it immediately;
- added legacy Catalog Setting alias resolution so old History sessions can restore to canonical master Setting IDs;
- Creative retains Indoor / Outdoor filtering while Reference Outfit Catalog sees the combined master Setting list;
- no Apps Script redeploy was required for the shared Setting migration;
- preserved `config.js` throughout;
- `fallback.json` still needs a maintenance refresh to include current 4.5 Product Catalog, shared Settings, and Outfit Focus Style data/metadata.


### 4.5 Maintenance — Architectural Sketch Smart Random (2026-09-20)

- enabled the Build Console random control for Architectural Sketch as **Sketch Random** with **Smart Sketch** guidance;
- Sketch Random fills or varies only untouched controls and preserves user-chosen fields until Reset;
- untouched Building Category/Type and Architectural Style Category/Style can be filled from the shared Architecture Taxonomy;
- Scene Type randomization remains compatible with a manually locked View / Projection;
- Sketch Style selection prefers compatibility with a manually locked Paper / Surface;
- unlocked Paper / Surface follows the selected style's recommended surfaces;
- unlocked Lighting / Time follows the selected Scene Type recommendation;
- unlocked Human Presence / Scale follows the Sketch Style recommendation, with occasional `None` for architecture-only output;
- View / Projection is randomized only from options allowed by the selected Scene Type;
- Annotations / Text remains `no-text`, and Advanced Line/Color remain Auto unless explicitly changed by the user;
- Input Type, Site / Context, Architectural Feature Emphasis, and Extra Instruction are not auto-generated;
- Saved Prompt restore and Refresh Now preserve Sketch Random manual-lock behavior;
- no Google Sheets or API contract change required;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Prompt Output Ownership Fix (2026-09-20)

- fixed stale Generated Prompt output when switching from **Reference Outfit Catalog** to Reference Product Catalog, Product Poster Builder, Architectural Render, or Architectural Sketch Builder;
- root cause: core `app.js` still treated `outfit_catalog` as the active mode and could auto-generate the Outfit prompt from global form events after an external mode had activated;
- added mode-aware output ownership so the core generator writes only for **Creative Prompt Builder** and **Reference Outfit Catalog**;
- external mode activation is tracked through `promptgen:modechange`, keeping `currentMode` synchronized with Product Catalog, Product Poster, Architectural Render, and Architectural Sketch;
- core form-change auto-generation now exits immediately while an external mode owns the Build console;
- bumped `app.js` cache key to `4.5-output-owner-1`;
- no Google Sheets data change required;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Prompt Mode Card Ordering (2026-09-20)

- stabilized Prompt Mode card ordering after asynchronously loaded mode modules insert their cards;
- card order now follows the configured `SORT` value from the active Prompt Mode data instead of module load timing;
- production order now renders as **Creative → Reference Outfit Catalog → Reference Product Catalog → Product Poster Builder → Architectural Render → Architectural Sketch Builder**;
- this places Product Poster Builder before Architectural Render and Architectural Sketch Builder at the final position as configured;
- Google Sheets data was not changed because its existing SORT values were already correct;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Architectural Render Initialization Fix (2026-09-20)

- fixed a variable-shadowing bug in `architectural-render-mode.js` where `loadFeatureData(options = {})` shadowed the module-level `options` state;
- renamed the loader argument to `loadOptions`, allowing `buildOptions(...)` to populate the module state used by `isReady()`;
- restored Architectural Render card initialization without changing its Google Sheets mode definition or Apps Script contract;
- synchronized all six active Google Sheets `PROMPT_MODES` rows into `fallback.json.promptModes`;
- added a `PETUNJUK` maintenance note establishing `PROMPT_MODES` as the source of truth for fallback mode synchronization;
- bumped the Architectural Render and workspace cache keys so browsers do not retain the broken module;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Smart Defaults & Recommendations (2026-09-20)

- added `RECOMMENDED_LIGHTING` and `RECOMMENDED_HUMAN` metadata columns to `ARCH_SKETCH_OPTIONS`;
- retained `RECOMMENDED_SURFACE` as the Sketch Style → Paper / Surface recommendation source and now uses its first value as the smart surface default;
- Scene Type now drives Lighting smart defaults: Exterior → **Morning Light**, Interior → **Soft Interior Daylight**;
- Sketch Style now drives Paper / Surface smart defaults while Paper / Surface remains untouched by the user;
- Human Presence / Scale shows a style-specific soft recommendation but never auto-changes the selected value;
- added manual override tracking for Paper / Surface, Lighting / Time, and View / Projection so user choices win until Reset;
- Saved Prompt restore protects those three controls from recommendation changes by treating restored values as manual state;
- `Refresh Now` now preserves the current Architectural Sketch state and existing smart/manual override flags instead of silently resetting recommendation ownership;
- manually selected View / Projection is preserved across scene changes when compatible and falls back to the new scene default only when incompatible;
- removed implicit `expressive entourage` wording from **Urban Observational Sketch** so Human Presence / Scale is the single controller for people;
- synchronized CONFIG JSON bridges and `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Scene Content Separation (2026-09-20)

- renamed Architectural Sketch `Landscape / Context` to `Site / Context`;
- renamed `Architectural Features` to `Architectural Feature Emphasis`;
- renamed `Human Figure for Scale` to `Human Presence / Scale`;
- kept Site / Context and Feature Emphasis as free-text controls, while Human Presence / Scale remains Sheets-driven;
- Human Presence now uses **None, Single Scale Figure, Sparse Scale Figures, Silhouette Figures, and Small Human Group**;
- retired `casual-people-scale` from active options while retaining the row for Saved Prompt compatibility, with restore mapping to `small-human-group`;
- Human Presence prompts are restricted to scale communication and avoid clothing, mood, location, staged activity, and storytelling instructions;
- prompt output now labels physical surroundings as `Site / context`;
- Concept Prompt / Design Brief feature emphasis may include and emphasize requested elements;
- Reference Image feature emphasis may only highlight existing reference features and explicitly forbids inventing, adding, removing, relocating, resizing, or redesigning architectural elements;
- synchronized `architecturalSketchHumanScale` into `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Architectural Sketch Text Guard (2026-09-20)

- added Sheets-driven `Annotations / Text` control to Architectural Sketch Builder;
- added active options **None — No Text or Annotations**, **Minimal Architectural Notes**, and **Handwritten Sketch Annotations**;
- set `no-text` as the production default through `defaultArchitecturalSketchAnnotationText`;
- default no-text mode now adds a strong final prompt guard against readable text, signage, labels, logos, captions, handwritten notes, dates, signatures, watermarks, slogans, decorative lettering, and pseudo-text;
- architectural signage panels may remain as blank design elements instead of receiving invented words;
- annotation-enabled modes still suppress unrelated branding, storefront names, logos, slogans, dates, signatures, and decorative lettering;
- Saved Prompt states that predate the control restore safely to the current no-text default;
- synchronized CONFIG JSON mirror and `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Shared Architecture Taxonomy (2026-09-19)

- added shared Google Sheets sources `ARCH_BUILDING_CATEGORIES`, `ARCH_BUILDING_TYPES`, `ARCH_STYLE_CATEGORIES`, and `ARCH_STYLE_OPTIONS`;
- replaced free-text Project Type / Architecture Style controls in Architectural Sketch with Building Category → Building Type and Architectural Style Category → Architectural Style;
- applied the same shared taxonomy to Architectural Render so building/style maintenance is centralized instead of duplicated;
- added frontend-only **Custom…** options for Building Type and Architectural Style with progressive-disclosure text inputs;
- category selections are UI navigation/filter metadata only and are not emitted into generated prompts;
- added `architectural-taxonomy.js` and `architectural-taxonomy.css` as shared architecture-mode assets;
- preserved Saved Prompt compatibility by keeping legacy resolved text fields and mapping old free-text values to taxonomy rows when possible; unmatched values restore through Custom…;
- STRICT Architectural Render now disables the style category/style/custom controls without overwriting their saved selection;
- synchronized the four taxonomy CONFIG JSON mirrors into `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Scene-Aware View / Projection (2026-09-19)

- renamed Architectural Sketch `Camera / View` to `View / Projection`;
- replaced the mixed camera/framing/style list with architectural view types: Eye-Level Perspective, Three-Quarter Perspective, Interior Corner Perspective, Frontal Perspective, Elevated Perspective, Wide Context View, Axonometric / Isometric, Orthographic Elevation, and Section Perspective;
- added `SCENE_SCOPE` to `ARCH_SKETCH_OPTIONS` and renamed the option group from `camera_view` to `view_projection`;
- Exterior now exposes Eye-Level, Three-Quarter, Frontal, Elevated, Wide Context, Axonometric / Isometric, and Orthographic Elevation;
- Interior now exposes Eye-Level, Interior Corner, Frontal, Wide Context, Axonometric / Isometric, and Section Perspective;
- added scene-aware defaults: Exterior → `three-quarter-exterior`; Interior → `interior-corner`;
- kept the Saved Prompt state key `archSketchCameraView` internally for compatibility while presenting View / Projection in the UI;
- retired legacy `frontal-elevation` and `sketchbook-perspective` from active options and added restore aliases to Frontal Perspective and Eye-Level Perspective;
- synchronized CONFIG JSON bridge and `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Lighting / Character Separation (2026-09-19)

- renamed Architectural Sketch `Atmosphere / Mood` to `Atmosphere / Character`;
- constrained Lighting / Time to physical illumination only: Morning Light, Midday Light, Golden Hour, Overcast Daylight, Soft Interior Daylight, and Evening Light;
- replaced overlapping mood/weather concepts with spatial-character options: Calm, Serene, Lively, Contemplative, Intimate, Monumental, Formal, and Casual;
- retired Cozy, Rainy, Moody, Airy, and Dramatic from the active option set while retaining their rows for Saved Prompt compatibility;
- moved rainy / wet-surface intent to Landscape / Context instead of treating weather as mood;
- added legacy restore aliases so older Saved Prompt states map to the closest current character, with legacy Rainy also restoring its weather cues into Landscape / Context;
- changed generated prompt labels to `Lighting / time` and `Atmosphere / character` to reinforce the separation;
- synchronized CONFIG bridge and `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Paper / Surface Refinement (2026-09-19)

- renamed Architectural Sketch `Paper / Medium` to `Paper / Surface` so Sketch Style remains responsible for drawing medium / visual language;
- replaced the active surface set with: White Presentation Paper, Sketchbook Page, Transparent Tracing Paper, Architectural Grid Paper, Textured Watercolor Paper, Smooth Marker Paper, and Bristol Board;
- retained stable IDs for equivalent existing surfaces and deactivated legacy Cream Toned Paper / Presentation Board Style rows instead of repurposing their IDs;
- added `RECOMMENDED_SURFACE` to `ARCH_SKETCH_OPTIONS` for non-blocking Sketch Style recommendations;
- added contextual recommendation text below Paper / Surface while keeping user choice unrestricted;
- changed the default Architectural Sketch surface to `watercolor-paper`, matching the default Soft Watercolor Architectural Sketch style;
- prompt wording now uses `Paper / surface` instead of `Medium`;
- synchronized CONFIG JSON bridge and `fallback.json`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Sketch Style Master Controls (2026-09-19)

- made Sketch Style the primary visual controller for Architectural Sketch Builder;
- moved Line Character and Color Treatment into a collapsed Advanced Style Controls section;
- added `Auto — Follow Sketch Style` rows to both `line_quality` and `color_treatment` groups in `ARCH_SKETCH_OPTIONS`;
- changed the default Line Character and Color Treatment CONFIG values to `auto-follow-style`;
- when Advanced controls stay on Auto, the builder uses each Sketch Style's own line/color rules and avoids duplicate instructions;
- explicit Advanced overrides supersede the corresponding style line/color rule;
- existing Saved Prompt states with explicit legacy line/color selections remain restorable;
- synchronized `fallback.json` and bumped production asset cache keys;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 Maintenance — Sheets-Driven Architecture Options (2026-09-19)

- added production sheets `ARCH_RENDER_OPTIONS` and `ARCH_SKETCH_OPTIONS`;
- moved Architectural Render Input Type, Design Fidelity, and Realism Target content out of hardcoded frontend lists;
- moved Architectural Sketch option maintenance from long hand-edited CONFIG JSON cells to row-based sheet data;
- retained the existing Apps Script API contract by generating the architecture CONFIG JSON values from the new option sheets with Google Sheets formulas;
- added CONFIG defaults for Architectural Render input type, fidelity, realism target, lighting, and aspect ratio;
- Architectural Render builder now receives input/fidelity/realism prompt rules from Sheets-driven state;
- Architectural Sketch JavaScript now retains only compact emergency fallback choices;
- synchronized architectural option data into `fallback.json` and refreshed its 4.5 metadata;
- bumped production cache keys for the architectural mode assets;
- no `config.js` change;
- no Apps Script redeploy required for this migration.


## 4.4.1 — Readability + Monoline Icons

Focus:
- readability audit;
- monoline icon system;
- continuation of Obsidian UI.

Key changes:
- removed essential UI text in the ~6–9 px range;
- raised desktop and mobile readability baselines;
- improved generated prompt readability;
- set mobile form fields to 16 px where appropriate;
- introduced `icon-system.js`;
- replaced emoji interface icons with monoline SVG icons;
- changed Google Sheets `ICON` values from emoji to semantic keys;
- preserved `config.js`.

## 4.4 — Obsidian UI

Focus:
- full frontend visual redesign;
- high-end startup / creative workstation feel.

Key changes:
- dark-first graphite/amber interface;
- technical-grid visual language;
- cleaner workbench layout;
- Prompt DNA;
- output styled like a professional editor;
- restrained card/radius/shadow language.

## 4.3.1 — Persistent API Configuration

Focus:
- prevent API URL loss during frontend upgrades.

Key changes:
- introduced persistent `config.js`;
- normal update packages no longer overwrite production API configuration;
- clarified API source priority and browser override behavior.

## 4.3 — Multi Mode

Focus:
- add Reference Outfit Catalog.

Key changes:
- Prompt Mode switch;
- Creative Prompt Builder retained;
- catalog-specific subject/type/preservation/setting/pose/shot datasets;
- child-safe catalog logic;
- strict outfit-preservation templates;
- 4:5 default catalog ratio.

New collections:
- PROMPT_MODES
- CATALOG_SUBJECTS
- CATALOG_TYPES
- PRESERVATION_LEVELS
- CATALOG_SETTINGS
- CATALOG_POSES
- CATALOG_SHOTS

## 4.2.2 — Apps Script Cache Fix

Fixed `Argumen terlalu besar: value` caused by oversized CacheService values. Cache behavior became sectioned/safe.

## 4.2.1 — API Reliability Fix

Improved timeout, retry, login/HTML error detection, `/exec` validation, and API status messages.

## 4.2 — Prompt Style Presets

Added one-click visual direction presets:
- Hyper-Realistic iPhone
- Cinematic Movie Still
- Fashion Editorial
- Indonesian Lifestyle Candid
- Japanese Nostalgia 1980s
- Miniature Diorama

## 4.1 — Smart Compatibility + Searchable Dropdowns

Added searchable custom dropdowns, compatibility scoring/rules, Smart Random, tag-based prioritization, and compatibility display modes.

## 4.0 — Modular / Google Sheets Architecture

Moved from one large static HTML file to GitHub Pages + modular frontend + Google Sheets + Apps Script JSON API + `fallback.json`.

## Historical Baseline — Static Prompt Generator

Before 4.x, prompt options were hardcoded inside one HTML file. That implementation is historical and not the preferred baseline.
