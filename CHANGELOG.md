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
