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
- `fallback.json` was fully refreshed from the live 4.5 Google Sheet on 2026-09-23, including current Catalog, Outfit Focus, Product, Prompt Mode, and Architecture CONFIG data.


### 4.5 Refinement — Precise Architectural Pen Drawing (2026-09-23)

- transformed the stable `refined-line-drawing` style from a generic clean line sketch into **Precise Architectural Pen Drawing**;
- strengthened the model-facing prompt around disciplined ink contours, accurate proportions, controlled line hierarchy, crosshatching, architectural detailing, line-drawn vegetation, restrained tonal accents, and clean white paper;
- made the default style predominantly monochrome and explicitly subordinate any optional color to ink linework;
- added negative guidance against watercolor washes, marker blocks, loose scribbles, painterly shading, heavy graphite texture, and photorealistic material rendering;
- retained White Presentation Paper + Bristol Board recommendations and preserved the stable style ID for Saved Prompt compatibility;
- synchronized Google Sheets, CONFIG-derived fallback data, README, current-state documentation, and PETUNJUK;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Refinement — Sketch Style Core Set (2026-09-23)

- reduced active Architectural Concept Sketch Styles from eight to six based on side-by-side output review;
- active set: Precise Architectural Pen Drawing, Loose Concept Sketch, Bold Ink Perspective Sketch, Soft Watercolor Architectural Sketch, Marker Presentation Sketch, and Urban Observational Sketch;
- renamed Clean Facade Line Sketch to Precise Architectural Pen Drawing while preserving stable ID `refined-line-drawing`;
- deactivated but did not delete `concept-presentation` and `mixed-media` source rows;
- legacy Saved Prompts migrate `concept-presentation` → `refined-line-drawing` and `mixed-media` → `marker-sketch`;
- synchronized CONFIG-derived fallback data and production cache keys;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Feature — Style Semantic Profile (2026-09-23)

- added model-facing `SEMANTIC_PROFILE` metadata for all 32 Architectural Styles in `ARCH_STYLE_OPTIONS`;
- kept `DESCRIPTION` UX-only, preserving the separation between human explanation and model guidance;
- updated the existing `_JSON` / CONFIG bridge to include `semantic_profile` without changing the API contract;
- Architectural Taxonomy now carries semantic profiles through the selected style state;
- Concept / Brief prompts use style-specific architectural DNA instead of relying on style names alone;
- Reference Image Concept and Balanced Render use semantic cues conservatively and prohibit unsupported signature additions;
- Creative Render uses semantic profiles more broadly while preserving reference massing / project identity;
- STRICT Render remains reference-controlled and ignores style semantic data;
- Custom Style continues to use generic style discipline when no database profile exists;
- synchronized fallback data, PETUNJUK, README, current-state documentation, and production cache keys;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Feature — Architecture Prompt Quality Expansion (2026-09-23)

- added shared semantic composer `architecture-prompt-quality.js` used by both Architecture builders;
- no new prompt controls were added: the composer interprets combinations already selected by the user;
- added category-aware and selected Building Type-aware architectural priorities, with specific type rules replacing broader category rules to avoid redundancy;
- made STRICT Render quality guidance presentation-only so it cannot silently redesign preserved reference geometry;
- added fidelity-aware style discipline for Balanced / Creative Render, source-aware interpretation for Reference / Sketch / Massing / Existing Photo, material construction logic, realism-target rules, and camera coherence;
- added Concept / Brief design-resolution discipline and conservative reference-image ambiguity handling;
- added Photography scene realism, realism-target behavior, camera/lens coherence, and human-scale discipline;
- technical Sketch projections now use projection-consistency wording instead of generic perspective wording;
- fixed `a/an` grammar for Architectural Photography realism-target openings;
- enriched Input Type and Scene Type DESCRIPTION metadata in `ARCH_SKETCH_OPTIONS`;
- synchronized fallback metadata, PETUNJUK, README, current-state documentation, and production cache keys;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Feature — Architecture UX (2026-09-23)

- filled the shared Architecture Taxonomy DESCRIPTION metadata for all active categories, building types, and architectural styles;
- added dynamic taxonomy help to both architecture modes without adding description text to generated prompts;
- made Building Type and Architectural Style dependent selectors wait for their parent category;
- added contextual help for Render Input Type / Realism Target and Concept Output Representation / Photography / feature-emphasis / view / annotation controls;
- made Architectural Photography representation-aware by hiding Axonometric / Isometric, Orthographic Elevation, Section Perspective, and legacy Sketchbook Perspective;
- excluded sketch-specific Silhouette Figures from Architectural Photography;
- aligned Concept Random and Saved Prompt restore with the new compatibility filters;
- wrapped taxonomy DESCRIPTION cells in Google Sheets for maintainability;
- synchronized CONFIG-derived fallback data and bumped production architecture asset cache keys;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Feature — Architecture Prompt Intelligence (2026-09-23)

- clarified the two architecture workflows across Prompt Mode copy and field guidance:
  - **Architectural Render** = reference-first workflow for preserving an existing design with explicit Design Fidelity;
  - **Architectural Concept Builder** = concept-first workflow for developing ideas, briefs, or references into Sketch Presentation or Architectural Photography;
- added contextual Input Type guidance inside both modes so Reference Image in Concept Builder explicitly points users to Architectural Render when exact geometry/source-view preservation is required;
- added Photography-only **Text / Signage Policy** to Architectural Concept Builder;
- added four Sheets-driven policies in `ARCH_SKETCH_OPTIONS`:
  - **No Invented Text — Preserve Existing** (default);
  - **Preserve Reference Signage / Text**;
  - **Allow Functional Architectural Signage**;
  - **Blank Signage — No Text**;
- removed the old universal photography no-text guard: photography now follows the selected policy, while Sketch Presentation retains the existing Annotations / Text guard;
- made **Preserve Reference Signage / Text** input-aware: it is disabled outside Reference Image input and falls back to the default non-invention policy if the input changes;
- added `defaultArchitecturalSketchTextSignagePolicy` and formula-bridged `architecturalSketchTextSignagePolicies` to CONFIG without changing the Apps Script contract;
- Saved Prompt state now stores/restores Text / Signage Policy and labels the mode consistently as **Architectural Concept Builder**;
- Workstation mode-card copy now distinguishes **Reference-first** Render from **Concept-first** Concept Builder;
- synchronized `PROMPT_MODES`, `PETUNJUK`, `fallback.json`, README, and current-state documentation;
- JavaScript syntax checks and prompt-builder behavior checks passed;
- no Apps Script redeploy required; `config.js` unchanged.

### 4.5 Feature — Architectural Concept Builder (2026-09-20)

- renamed the visible **Architectural Sketch Builder** mode to **Architectural Concept Builder** while preserving stable internal ID `architectural_sketch`;
- added **Output Representation** with **Sketch Presentation** and **Architectural Photography**;
- added Photography-only **Photo Realism Target** options: Hyper-Real, Natural Documentary, and Editorial Architectural Photo;
- Sketch Presentation keeps Sketch Style, Paper / Surface, Advanced Line/Color, and Annotations / Text;
- Architectural Photography hides sketch-only controls and uses the shared project, architecture, lighting, atmosphere, site, human-scale, and View / Projection controls;
- photography prompt opening is driven by the selected realism target; the default branch generates `Create a hyper realistic photography of ...`;
- input-type prompts were made representation-neutral so Reference Image and Design Brief work correctly in both paths;
- Concept Random preserves manual Output Representation and randomizes only controls relevant to the active representation;
- Prompt DNA / Prompt Analysis switch from **Sketch / Surface** to **Photo / Realism** when Architectural Photography is active;
- Google Sheets `ARCH_SKETCH_OPTIONS` remains the source of truth and gained `output_representation` + `photo_realism_target` groups;
- CONFIG gained formula-bridged `architecturalSketchOutputRepresentations` and `architecturalSketchPhotoRealismTargets`;
- `PROMPT_MODES`, `PETUNJUK`, and `fallback.json` were synchronized;
- legacy Saved Prompt state defaults to Sketch Presentation for backward compatibility;
- cache key bumped to `4.5-arch-concept-1`;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Creative Aspect Ratio Hotfix (2026-09-20)

- fixed Creative Aspect Ratio inheriting the legacy label-left / control-right fieldset layout;
- Aspect Ratio now uses the full width beneath its label inside Camera & Technical;
- removed the extra ratio pseudo-glyphs that competed with the `9:16 / 1:1 / 16:9 / 4:5` text;
- retained four equal segments on desktop and 2×2 on mobile;
- no prompt-builder, Google Sheets, Apps Script, or `config.js` changes.

### 4.5 UI — Style DNA 16:9 Thumbnails (2026-09-20)

- changed Style DNA image containers from a fixed short strip to a true `16:9` aspect ratio;
- recommended `1200×675` Workstation style assets now display with minimal/no crop when authored at 16:9;
- retained `background-size: cover` and centered framing for consistent thumbnail fill;
- moved the selected-state check indicator to the upper-right so it remains aligned with the taller thumbnail;
- no Google Sheets, Apps Script, or `config.js` changes.

### 4.5 UI — Workstation Thumbnail Layout Hotfix (2026-09-20)

- fixed Workstation cache-busting applying Prompt Mode images to the entire card instead of the thumbnail region;
- Prompt Mode images now flow through a `--workstation-mode-image` CSS custom property and render only inside the card `::before` thumbnail;
- inline full-card background images are actively removed when the visual asset mapper runs;
- Style DNA thumbnail cache-busting remains unchanged;
- no Google Sheets, Apps Script, or `config.js` changes.

### 4.5 UI — Workstation Asset Cache Fix (2026-09-20)

- verified that newly replaced Style DNA images were present in GitHub but the browser/GitHub Pages could continue serving cached image URLs;
- added deploy-aware cache-busting for all Workstation Prompt Mode and Style DNA backgrounds using the page deployment timestamp;
- future image replacement keeps the same stable filename and does not require CSS/JS edits;
- corrected Product Poster Workstation thumbnail from `product-poster.jpg` to the uploaded canonical `product-poster.png`;
- updated `assets/workstation/README.md` with cache/deploy guidance;
- no Google Sheets or API contract changes;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Dedicated Workstation Visual Assets (2026-09-20)

- created `assets/workstation/modes/` for the six Prompt Mode card thumbnails;
- created `assets/workstation/styles/` for Style DNA thumbnails;
- copied the current production visuals into the new stable filenames so the UI remains populated immediately;
- added `assets/workstation/README.md` with replacement instructions and a recommended 16:9 / 1200×675 image format;
- updated Workstation V2 CSS so Prompt Mode and Style DNA presentation images no longer depend on `assets/settings/`;
- future visual replacement only requires replacing a file with the same filename in GitHub;
- Google Sheets remains the source of truth for content data; this folder is presentation-only;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Workstation V2 Final Polish (2026-09-20)

- kept all six Prompt Mode cards in one desktop row while increasing card/thumbnail breathing room and replacing long descriptions with shorter presentation-only copy;
- changed Architectural Render thumbnail to an architecture-first facade asset and Architectural Sketch thumbnail to an architecture-first pavilion asset with stronger monochrome/contrast treatment;
- rebalanced Creative Prompt Details into **Subject / Scene & Action / Camera & Technical** without changing prompt data or IDs;
- simplified the topbar subtitle to **AI Creative Workstation · Build better prompts. Create without limits.**;
- Prompt Analysis now shows six mode-relevant checkpoints and always includes Output while the score still evaluates all seven DNA steps;
- added adaptive Live Output editor height for short / medium / long prompts so Prompt Analysis remains visible;
- kept Style DNA structurally unchanged and applied only minor height/spacing polish;
- setting preview remains contextual inside Scene / Setting; the removed Live Output Visual Preview was not reintroduced;
- QA covers all six Prompt Modes for seven DNA labels, Output-inclusive analysis mapping, and referenced field IDs;
- no Google Sheets or API contract changes;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Scene Preview & Aspect Ratio Cleanup (2026-09-20)

- removed the separate **Visual Preview** card from Live Output;
- moved Creative / Outfit Setting Preview cards into the owning Scene / Setting detail card;
- compacted Setting Preview to an image + selected setting title, removing redundant preview kicker, explanatory copy, and metadata pills in Workstation V2;
- fixed the large empty Scene card caused by the legacy preview layout and margin;
- redesigned Creative Aspect Ratio as a four-segment control with ratio-shaped monoline glyphs and clear selected state;
- mobile Aspect Ratio falls back to a 2×2 layout;
- no prompt-builder, Google Sheets, or API contract changes;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Workstation V2 Refinement Pass (2026-09-20)

- compacted the global topbar so Google Sheets status, appearance toggle, and creator profile stay on one horizontal line;
- forced all six Prompt Mode cards into a single desktop row and corrected thumbnail selectors for `reference_product_catalog` and `reference_product_poster`;
- switched Architectural Render / Sketch visual cues to architecture-focused repository assets;
- stopped Prompt Details cards from stretching to the tallest column;
- moved Architectural Sketch Site / Context, Architectural Feature Emphasis, Extra Instruction, and line/color overrides into one **Advanced Settings** disclosure;
- hid redundant per-mode intro banners and the duplicate Architectural Sketch logic card in Workstation V2;
- changed the bottom Generate / Reset / Copy / Save bar from sticky overlay to static end-of-form actions;
- removed the second outer scrollbar from Live Output; only the prompt editor scrolls while Prompt Analysis and Visual Preview stay compact;
- changed Live Output hierarchy to **Live Output** with a small real-time subtitle;
- made Prompt DNA and Prompt Analysis mode-aware for Creative, Outfit Catalog, Product Catalog, Product Poster, Architectural Render, and Architectural Sketch;
- Prompt Analysis readiness is now derived deterministically from active-mode field completion instead of reusing Creative compatibility scoring;
- Structure tab now exposes Ready / Partial / Incomplete state per active-mode DNA step;
- no Google Sheets or API contract changes;
- `config.js` unchanged; Apps Script redeploy not required.

### 4.5 UI — Workstation V2 Visual Migration (2026-09-20)

- migrated the Build workspace to the approved creative-workstation visual direction while preserving Prompt Gen 4.5 logic and data contracts;
- added fixed left sidebar navigation, compact topbar, large Build Your Prompt heading, and responsive three-zone desktop workstation layout;
- moved Prompt DNA into the Build canvas and expanded it to seven visual steps: Subject / Scene / Style / Camera / Light / Frame / Output;
- redesigned Prompt Mode cards as visual thumbnail cards for all six production modes;
- redesigned Creative Style Presets as visual Style DNA cards using existing repository imagery;
- reorganized mode fields into grouped Prompt Details cards while retaining original form IDs and mode-controller bindings;
- added persistent dark Live Output with Prompt / Structure / Metadata tabs, copy control, deterministic readiness analysis, and a clearly labeled visual-direction preview;
- moved Database connection into a sidebar utility drawer and added a lightweight Settings drawer while keeping existing controls intact;
- added responsive tablet/mobile behavior: output stacks below Build content and workspace navigation becomes a bottom bar on mobile;
- extended the shared monoline icon system with Settings / Camera and chevron alias support; no emoji UI introduced;
- added `workstation-v2.js` and `workstation-v2.css` as the final presentation layer;
- no Google Sheets content/schema changes;
- `config.js` unchanged; Apps Script redeploy not required.

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
