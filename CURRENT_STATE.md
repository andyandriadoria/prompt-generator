# Prompt Gen — Current State

**Baseline date:** 2026-09-23  
**Production baseline:** Prompt Gen 4.5

This file is the primary baseline for future Prompt Gen work.

## Production Endpoints

- **Website:** https://andyandriadoria.github.io/prompt-generator/
- **Repository:** https://github.com/andyandriadoria/prompt-generator/
- **Google Sheets:** https://docs.google.com/spreadsheets/d/1H8gSBBkMJlYqZj2dHaUJjVDrlYM_CHaPsdLxOFmQPGk/edit
- **Apps Script API:** https://script.google.com/macros/s/AKfycbz81juqJ3M8Bo-vIfjOvMzVkBf1HaAHTXGygQs-Z5vEDsC5uMqWjUTaMCSbp3itPkuXHw/exec

These are deployment references, not passwords or private API keys.

## Live Google Sheets State

Current spreadsheet title:
`Database_Prompt_Gen_4_5`

Current CONFIG baseline:

| Key | Value |
|---|---|
| appTitle | Prompt Gen 4.5 |
| creatorName | Ndoy Creator |
| subtitle | AI Creative Workstation · Multi-Mode Prompt System |
| defaultCharacter | custom |
| defaultGender | auto |
| defaultSettingType | outdoor |
| defaultAspectRatio | 9:16 |
| promptOpening | A hyper-realistic photograph of |
| promptSuffix | highly detailed, realistic skin texture, natural proportions |
| autoGenerate | TRUE |
| apiCacheMinutes | 10 |
| smartCompatibility | TRUE |
| compatibilityMode | prioritize |
| searchableDropdowns | TRUE |
| defaultStylePreset | blank |
| styleApplyMode | replace |
| includeNegativePrompt | FALSE |
| defaultPromptMode | creative |
| defaultCatalogAspectRatio | 9:16 |
| defaultPreservationLevel | exact-strict |
| defaultCatalogType | lifestyle-fashion |
| defaultCatalogPose | natural-pose |
| defaultCatalogShot | full-body |
| defaultCatalogSubject | indonesian-hijabi-woman |
| defaultCatalogSetting | indoor-serene-neutral-minimalist-interior |
| defaultOutfitFocusStyle | blank |
| defaultProductType | clothing |
| defaultProductPresentation | hanging-product |
| defaultProductSetting | minimal-studio |
| defaultProductShot | full-product |
| defaultProductComposition | single-product |
| defaultProductAspectRatio | 4:5 |
| defaultProductPreservation | exact-strict |
| defaultProductTextOverlay | none |
| defaultProductPosterAspectRatio | 9:16 |
| defaultArchitecturalRenderInputType | reference-image |
| defaultArchitecturalRenderFidelity | strict |
| defaultArchitecturalRenderRealismTarget | hyper-real-photo |
| defaultArchitecturalRenderLighting | daylight |
| defaultArchitecturalRenderAspectRatio | 16:9 |
| defaultArchitecturalSketchInputType | concept-prompt |
| defaultArchitecturalSketchOutputRepresentation | sketch-presentation |
| defaultArchitecturalSketchPhotoRealismTarget | hyper-real-architectural-photo |
| defaultArchitecturalSketchTextSignagePolicy | no-invented-text |
| defaultArchitecturalSketchSceneType | exterior |
| defaultArchitecturalSketchStyle | watercolor-sketch |
| defaultArchitecturalSketchMedium | watercolor-paper |
| defaultArchitecturalSketchLineQuality | auto-follow-style |
| defaultArchitecturalSketchColorTreatment | auto-follow-style |
| defaultArchitecturalSketchLighting | morning-light |
| defaultArchitecturalSketchMood | calm |
| defaultArchitecturalSketchHumanScale | none |
| defaultArchitecturalSketchExteriorView | three-quarter-exterior |
| defaultArchitecturalSketchInteriorView | interior-corner |
| defaultArchitecturalSketchAnnotationText | no-text |
| defaultArchitecturalSketchAspectRatio | 4:5 |

Active Prompt Modes:
- Creative Prompt Builder
- Reference Outfit Catalog
- Reference Product Catalog (`ACTIVE = TRUE`)
- Product Poster Builder (`ACTIVE = TRUE`)
- Architectural Render (`ACTIVE = TRUE`)
- Architectural Concept Builder (`ACTIVE = TRUE`, stable internal ID: `architectural_sketch`)

Reference Outfit Catalog additive collection:
- `OUTFIT_FOCUS_STYLES`

Reference Product Catalog collections:
- `PRODUCT_TYPES`
- `PRODUCT_PRESENTATIONS`
- `PRODUCT_SETTINGS`
- `PRODUCT_SHOTS`
- `PRODUCT_COMPOSITIONS`
- `PRODUCT_WEAR_CONTEXTS`
- `PRODUCT_TEXT_OVERLAYS`
- `PRODUCT_PRESERVATION_LEVELS`

## Shared Setting Architecture

`SETTINGS` is now the master setting source for both:
- Creative Prompt Builder;
- Reference Outfit Catalog.

Behavior:
- Creative keeps its existing Indoor / Outdoor filtering;
- Reference Outfit Catalog reads the combined master `SETTINGS` collection;
- Catalog-only settings that were genuinely unique were added to `SETTINGS`;
- duplicate Catalog setting concepts are resolved to canonical master Setting IDs through a legacy alias map;
- `CATALOG_SETTINGS` remains in Google Sheets as a legacy compatibility source and is not deleted yet;
- old History sessions that contain Catalog Setting IDs can still restore through the alias/fallback path.

This keeps new setting maintenance centralized: new shared scene/location data should be added to `SETTINGS` unless a future feature explicitly requires its own source.

## Active Features

- Creative Prompt Builder
- Reference Outfit Catalog
- Reference Product Catalog
- Prompt Mode switching
- Shared master Setting source for Creative + Reference Outfit Catalog
- Smart Compatibility
- Searchable Dropdowns
- Smart / Catalog / Product Random
- Prompt Style Presets
- Prompt DNA indicator
- Google Sheets API loading
- browser cache
- `fallback.json`
- persistent `config.js`
- `config.example.js` pattern
- mobile responsive layout
- portrait-mobile dropdown fix
- dark / light appearance
- Obsidian UI
- readability pass
- monoline SVG icon system
- Workspace Tabs: Build / Saved
- Saved Prompt Library backed by browser IndexedDB
- complete Build-state restore across active prompt modes
- optional generated-result image attachment and notes in Saved
- search, mode filtering, copy, edit, delete, and Restore to Build
- child-safe outfit catalog logic
- strict / ultra-strict / compact outfit preservation
- Outfit Focus Style inside Reference Outfit Catalog
- Outfit Focus field intelligence / relevance control
- no-face / outfit-first presentation presets
- exact / exact-strict / ultra-strict product preservation

## Reference Outfit Catalog — Outfit Focus Style

`Outfit Focus Style` is an additive presentation control inside **Reference Outfit Catalog**. It is not a separate Prompt Mode.

Purpose:
- create outfit-first reference-image prompts where the face is hidden, cropped, obscured, or intentionally de-emphasized;
- keep the original outfit as the visual priority;
- support seller-style, hanger, handheld selfie, OOTD, and no-face presentation without weakening outfit preservation language.

Current production presets:
1. Hidden Face — Holding Outfit
2. Held Hanger — Clean Lifestyle
3. POV Outfit Selfie
4. Headless Outfit Crop
5. Phone-Covered Outfit Selfie

Stable IDs are retained where practical so previous History references remain compatible. In particular, the old `neck-down-selfie` ID now presents as **POV Outfit Selfie**, and the previous `modest-full-outfit-no-face` slot now presents as **Phone-Covered Outfit Selfie**.

Data source:
- Google Sheets collection: `OUTFIT_FOCUS_STYLES`
- default CONFIG key is currently blank (`defaultOutfitFocusStyle = ""`), so Outfit Focus Style is opt-in rather than preselected

Important behavior:
- `OUTFIT_USAGE` drives whether the garment is worn, held in front of the subject, or displayed on a hanger;
- `Hidden Face — Holding Outfit` uses held-front behavior and explicitly states that the garment is not being worn;
- `Held Hanger — Clean Lifestyle` uses hanger-held behavior, does not require Subject/Pose, and explicitly states that no model is wearing the outfit;
- `POV Outfit Selfie` uses a direct handheld front-camera / top-down outfit-selfie direction, explicitly rejects mirror/reflection framing, and prioritizes a full-outfit view down to the feet;
- `Headless Outfit Crop` controls framing so the face stays outside the usable crop while the outfit remains the visual subject;
- `Phone-Covered Outfit Selfie` keeps a smartphone visibly in front of the face, partially obscuring it, while explicitly rejecting mirror-selfie/reflection interpretation;
- Outfit Focus intelligence can disable or mark non-relevant fields as controlled by the selected focus style;
- conflicting field values are suppressed or normalized instead of being blindly repeated in the prompt;
- adult subjects are prevented from staying paired with child-only catalog types when the frontend detects an audience mismatch;
- child subjects continue to use child-safe options and family-friendly catalog language.

Implementation files:
- `outfit-focus-style.js`
- `outfit-focus-compatibility.js`

API / loader:
- Apps Script `SHEET_MAP` exposes `OUTFIT_FOCUS_STYLES` as `outfitFocusStyles`;
- `data-loader.js` treats `outfitFocusStyles` as an optional additive collection so older fallback payloads do not break the existing app.

History / Inspect:
- explicit Generate actions persist the selected Outfit Focus Style in local history;
- restore reapplies the saved focus style;
- Inspect receives an additive Outfit Focus DNA card when Reference Outfit Catalog is active.

## Reference Product Catalog Baseline

Purpose:
- generate product-first commercial/catalog prompts from a reference product image;
- preserve the original visible product while allowing environment, presentation, framing, and campaign styling to change.

Supported product types:
- Clothing
- Jewelry
- Shoes
- Accessory
- Other Product

Supported presentation directions include:
- Hanging Product
- Tabletop Still Life
- Mannequin / Bust Display
- Worn Close-Up
- Rack / Collection Display
- Campaign Poster

Prompt architecture:
1. preservation + reference fidelity;
2. presentation / setting / framing;
3. quality + final constraints.

Product Catalog uses composition-aware preservation language for Single Product, Pair, Product Set, and Collection. Conditional fields appear only where relevant, including Wear Context for worn-close-up workflows and campaign text fields for Campaign Poster.

Implementation files:
- `product-catalog-builder.js`
- `product-catalog-mode.js`
- `product-catalog-workspace.js`
- `product-catalog.css`

## Architectural Render Baseline

Architectural Render is the dedicated **reference-first** prompt mode for architectural visualization. Use it when an existing design, geometry, or source view must remain controlled through explicit Design Fidelity.

Core fields:
- Input Type
- Building Category
- Building Type
- Design Fidelity
- Realism Target
- Architectural Style Category
- Architectural Style
- Building Materials
- Lighting
- Weather / Atmosphere
- Landscape / Site
- View / Projection
- Aspect Ratio
- Extra Instruction

Design Fidelity is the master controller:
- `STRICT` disables Architectural Style Category / Architectural Style and locks Camera / View to **Preserve Reference View**;
- `Balanced` keeps the core design intact while allowing restrained style and framing refinements;
- `Creative` allows controlled design development while keeping the core project identity recognizable.

Prompt-engine rules:
- Realism Target provides three output behaviors: **Photoreal Archviz**, **Hyper-Real Architectural Photo**, and **Documentary Site Photo**;
- **Hyper-Real Architectural Photo** is the default and explicitly avoids CGI / 3D-render / polished-archviz appearance while adding real-camera, material-irregularity, vegetation-variation, and natural-light cues;
- **Photoreal Archviz** retains polished presentation-quality visualization behavior;
- **Documentary Site Photo** favors natural, observational, less-polished real-world site photography;
- Render Style is controlled internally by the selected Realism Target rather than exposed as a generic field;
- Quality remains an internal high-detail professional default rather than a visible field;
- STRICT preservation language protects geometry, massing, roof form, floor levels, facade proportions, openings, visible structure, setbacks, camera position, framing, lens relationship, and perspective;
- when the requested ratio differs from the source, only surrounding sky / ground / site environment may be extended; the architecture must not be cropped, stretched, compressed, or redesigned to fit;
- prompt wording is intentionally compact and avoids repeating the same camera / preservation instruction in multiple paragraphs;
- shared semantic quality composition adds fidelity-aware typology/building-type priorities, reference interpretation, style discipline, material construction logic, realism discipline, and camera coherence without adding visible controls.

Implementation files:
- `architecture-prompt-quality.js`
- `architectural-render-builder.js`
- `architectural-render-mode.js`
- `architectural-render.css`
- shared loader in `workspace-tabs.js`
- Saved Prompt Library integration in `prompt-saved-store.js`

Data:
- mode definition is stored in Google Sheets `PROMPT_MODES` as `architectural_render`;
- editable Architectural Render option content is stored row-by-row in `ARCH_RENDER_OPTIONS`;
- `CONFIG` contains formula-generated JSON mirrors (`architecturalRenderInputTypes`, `architecturalRenderFidelities`, and `architecturalRenderRealismTargets`) so the existing Apps Script CONFIG payload can serve the new rows without another Apps Script mapping/redeploy;
- defaults live in `CONFIG` as `defaultArchitecturalRender*` keys;
- existing shared `LIGHTING`, `CAMERA_ANGLES`, and `ASPECT_RATIOS` collections are reused;
- Building Category / Building Type and Architectural Style Category / Architectural Style use the shared Architecture Taxonomy described below; category fields are navigation metadata and are never emitted into prompts.
- Architectural Render initialization uses a dedicated `loadOptions` parameter so the module-level render `options` state is populated correctly; this prevents the Render card from disappearing because `isReady()` sees a null options state.
- `fallback.json.promptModes` mirrors all active rows from Google Sheets `PROMPT_MODES`, including Architectural Render, so the mode remains available on fallback paths.
- Prompt Mode cards are re-ordered after async module insertion using each mode's configured `SORT` value, preventing load timing from changing the visual order. Current production order is Creative → Outfit Catalog → Product Catalog → Product Poster → Architectural Render → Architectural Concept Builder.
- Generated Prompt output ownership is mode-aware: the core `app.js` generator may write output only while the active mode is `creative` or `outfit_catalog`; Product Catalog, Product Poster, Architectural Render, and Architectural Sketch own their own output while active.
- `promptgen:modechange` keeps the core mode state synchronized with externally loaded modes, and global form auto-generation is ignored while an external mode owns the Build console.

## Architectural Concept Builder Baseline

Architectural Concept Builder is the production label for the stable internal mode `architectural_sketch`. It is the **concept-first** architecture workflow for developing an idea, brief, or reference into Sketch Presentation or Architectural Photography. Reference Image remains available as a design basis, but exact geometry/source-view preservation is intentionally delegated to Architectural Render.

Core fields:
- Input Type
- Output Representation
- Photo Realism Target (Architectural Photography)
- Text / Signage Policy (Architectural Photography)
- Building Category
- Building Type
- Scene Type
- Sketch Style
- Paper / Surface
- Architectural Style Category
- Architectural Style
- Lighting / Time
- Atmosphere / Character
- Site / Context
- Architectural Feature Emphasis
- Human Presence / Scale
- View / Projection
- Annotations / Text
- Aspect Ratio
- Extra Instruction

Advanced Style Controls (collapsed by default):
- Line Character
- Color Treatment

Sketch Style is the primary visual controller. Production style families:
1. Precise Architectural Pen Drawing
2. Loose Concept Sketch
3. Bold Ink Perspective Sketch
4. Soft Watercolor Architectural Sketch
5. Marker Presentation Sketch
6. Urban Observational Sketch

Defaults:
- Sketch Style: `watercolor-sketch` → **Soft Watercolor Architectural Sketch**
- Line Character: `auto-follow-style` → **Auto — Follow Sketch Style**
- Color Treatment: `auto-follow-style` → **Auto — Follow Sketch Style**
- Paper / Surface: `watercolor-paper` → **Textured Watercolor Paper**
- Lighting / Time: `morning-light` → **Morning Light**
- Atmosphere / Character: `calm` → **Calm**
- Annotations / Text: `no-text` → **None — No Text or Annotations**
- Text / Signage Policy: `no-invented-text` → **No Invented Text — Preserve Existing**

Prompt behavior:
- **Sketch Style is the master visual controller**: each style carries its own style prompt, line rule, color rule, and avoid rule from Google Sheets;
- Building Category / Building Type and Architectural Style Category / Architectural Style use the shared Architecture Taxonomy; categories only filter the UI and do not appear in the generated prompt;
- both Building Type and Architectural Style include a frontend-only **Custom…** option that reveals a custom text input without requiring a database row;
- legacy Saved Prompt free-text project/style values are matched back to taxonomy IDs when possible; unmatched legacy values restore through Custom… without losing the original text;
- Line Character and Color Treatment are hidden inside a collapsed **Advanced Style Controls** section and default to **Auto — Follow Sketch Style**;
- when both Advanced controls remain on Auto, the prompt uses the selected style's built-in line and color rules without adding duplicate line/color instructions;
- an explicit Advanced override replaces the corresponding style line/color rule while keeping the selected Sketch Style as the primary visual family;
- legacy Saved Prompt states with explicit Line Character or Color Treatment values remain restorable and automatically reopen Advanced controls;
- legacy Sketch Style IDs `concept-presentation` and `mixed-media` restore to `refined-line-drawing` (Precise Architectural Pen Drawing) and `marker-sketch` (Marker Presentation Sketch) respectively;
- the builder no longer applies one universal heavy line-weight paragraph to every style;
- watercolor / marker / color styles explicitly preserve visible linework and white-paper negative space instead of collapsing into graphite or grayscale;
- Precise Architectural Pen Drawing and ink-oriented styles can remain monochrome when a monochrome Sketch Color Mode is selected;
- `Reference Image / Existing Design` preserves the main architectural form, massing, proportions, openings, and spatial composition while translating the source into sketch language;
- `Concept Prompt` builds the sketch from the user's concept and selected design directions;
- `Design Brief / Idea` translates an architectural brief into a coherent sketch presentation;
- Site / Context, Architectural Feature Emphasis, Human Presence / Scale, and Extra Instruction are conditional and omitted when empty / `None`;
- Site / Context is limited to physical surroundings such as planting, hardscape, terrain, streetscape, adjacent context, and weather/site conditions;
- Architectural Feature Emphasis is separate from Architectural Style: it identifies specific building elements to highlight rather than redefining the overall design language;
- in Concept Prompt and Design Brief / Idea modes, Feature Emphasis may include and emphasize the requested architectural elements;
- in Reference Image / Existing Design mode, Feature Emphasis may only emphasize features that already exist in the reference and explicitly must not invent, add, remove, relocate, resize, or redesign architectural elements;
- Human Presence / Scale controls only the amount / representation of human figures for architectural scale, not mood, clothing, location, or narrative activity;
- active Human Presence / Scale options are **None, Single Scale Figure, Sparse Scale Figures, Silhouette Figures, and Small Human Group**;
- legacy Saved Prompt value `casual-people-scale` restores to **Small Human Group**;
- Lighting / Time and Atmosphere / Character are intentionally separated: Lighting controls physical illumination only, while Atmosphere / Character controls spatial character only;
- active Lighting / Time options are **Morning Light, Midday Light, Golden Hour, Overcast Daylight, Soft Interior Daylight, and Evening Light**;
- active Atmosphere / Character options are **Calm, Serene, Lively, Contemplative, Intimate, Monumental, Formal, and Casual**;
- View / Projection is scene-aware: Exterior and Interior expose only compatible architectural views;
- active View / Projection options are **Eye-Level Perspective, Three-Quarter Perspective, Interior Corner Perspective, Frontal Perspective, Elevated Perspective, Wide Context View, Axonometric / Isometric, Orthographic Elevation, and Section Perspective**;
- default View / Projection follows Scene Type: **Exterior → Three-Quarter Perspective** and **Interior → Interior Corner Perspective**; the selection is not locked and can be changed to any valid view for that scene;
- `SCENE_SCOPE` in `ARCH_SKETCH_OPTIONS` is the editable source for scene compatibility;
- Annotations / Text is Sketch Presentation-only and Sheets-driven through the `annotation_text` group. Default `no-text` adds a strong final prompt guard against readable text, labels, signage, logos, captions, handwritten notes, annotations, dates, signatures, watermarks, slogans, decorative lettering, and pseudo-text;
- if architectural signboards or signage panels are part of a sketch while `no-text` is active, they remain blank / without readable characters rather than receiving invented lettering;
- optional sketch modes **Minimal Architectural Notes** and **Handwritten Sketch Annotations** allow controlled annotations while still suppressing unrelated branding, storefront names, logos, slogans, dates, signatures, and decorative lettering;
- Architectural Photography uses a separate Sheets-driven `text_signage_policy` group instead of inheriting the sketch no-text guard;
- the Photography default **No Invented Text — Preserve Existing** blocks fabricated lettering while allowing supported existing reference signage to remain where visible;
- **Preserve Reference Signage / Text** is available only when Input Type is Reference Image; Concept Prompt and Design Brief disable that option and normalize it back to the default policy if necessary;
- **Allow Functional Architectural Signage** permits restrained wayfinding, address markers, room numbers, or similar architectural information while blocking invented brands/logos/slogans;
- **Blank Signage — No Text** recreates the former strict clean-output behavior for photography when the user explicitly wants all sign panels blank;
- Saved Prompt states created before this control existed restore with the current default `no-text`;
- legacy Saved Prompt values `frontal-elevation` and `sketchbook-perspective` restore to **Frontal Perspective** and **Eye-Level Perspective** respectively;
- weather-like conditions such as rain belong in Landscape / Context rather than Atmosphere / Character;
- legacy Saved Prompt values `cozy`, `moody`, `airy`, and `dramatic` restore to the closest current spatial character; legacy `rainy` restores to Calm while adding rain / wet-surface cues to Landscape / Context;
- all styles explicitly reject photorealistic image, CGI, 3D visualization, polished archviz, and realistic digital-painting output;
- selected style descriptions appear below the Sketch Style control to clarify the intended visual language;
- prompt assembly is intentionally compact: Concept Prompt does not repeat a separate source sentence, aspect ratio is carried in the opening, architectural clarity is stated once, and photoreal / CGI / 3D-archviz rejection is consolidated into a single guard block;
- Paper / Surface is a separate physical-surface control and no longer implies the drawing medium; the drawing medium remains part of Sketch Style;
- the active Paper / Surface set is **White Presentation Paper, Sketchbook Page, Transparent Tracing Paper, Architectural Grid Paper, Textured Watercolor Paper, Smooth Marker Paper, and Bristol Board**;
- each Sketch Style carries optional `RECOMMENDED_SURFACE` IDs from Google Sheets; the first recommendation can seed the smart default while the surface is untouched, but the user's manual selection is never locked or overwritten;
- Smart Defaults now use Sheets metadata: Scene Type provides `RECOMMENDED_LIGHTING`, while Sketch Style provides `RECOMMENDED_SURFACE` and `RECOMMENDED_HUMAN`;
- Exterior recommends and initially selects **Morning Light**; Interior recommends and initially selects **Soft Interior Daylight**;
- changing Sketch Style auto-selects the first recommended Paper / Surface only until the user manually changes Paper / Surface;
- changing Scene Type auto-selects recommended Lighting / Time only until the user manually changes Lighting / Time;
- View / Projection keeps its scene-aware default behavior, but a valid manual view is preserved across scene changes; only incompatible views fall back to the new scene's valid default;
- Human Presence / Scale remains a soft recommendation only and is never auto-changed;
- manual choices for Paper / Surface, Lighting / Time, and View / Projection always win until Reset;
- Saved Prompt restore treats those three controls as manual state so recommendation logic cannot overwrite restored values;
- Refresh Now preserves the current Architectural Sketch form state and the existing manual-vs-smart override flags; only Reset re-enables untouched smart-default behavior from scratch;
- Urban Observational Sketch no longer contains implicit `entourage` wording; people are controlled only by Human Presence / Scale;
- Architectural Sketch now exposes **Sketch Random** in the Build Console. It randomizes only untouched sketch controls, preserves manual user selections until Reset, and uses existing scene/style recommendation metadata for coherent combinations;
- Sketch Random may fill Building Category/Type and Architectural Style Category/Style when they are still untouched, randomize Scene Type, Sketch Style, Atmosphere, scene-compatible View / Projection, and Aspect Ratio, while Surface follows the selected Sketch Style and Lighting follows Scene Type recommendations;
- Human Presence / Scale follows the selected style recommendation with an occasional `None` result for architecture-only compositions;
- Input Type, Site / Context, Architectural Feature Emphasis, Extra Instruction, and manual Custom fields are never invented or overwritten by Sketch Random;
- Annotations / Text remains `no-text` unless the user deliberately changed it; Advanced Line/Color remain Auto unless manually overridden;
- Saved Prompt restore marks restored non-empty values as manual for Sketch Random, and Refresh Now preserves the current random/manual lock state.
- production style, line-character, color, and surface prompt fragments are kept concise in Google Sheets to reduce redundancy while preserving distinct sketch-family behavior;
- shared semantic quality composition adds typology/building-type priorities, conservative reference interpretation, coherent design-resolution rules, style discipline, representation-aware camera/projection logic, scene realism, realism-target behavior, and photography human-scale discipline;
- technical views such as Orthographic Elevation, Axonometric / Isometric, and Section Perspective no longer inherit the generic “perspective believable” sentence; they use explicit projection-consistency language instead;
- Architectural Photography opening grammar correctly uses `a/an` for the selected realism target (for example, `an editorial architectural photograph`).

Data source:
- mode registry: Google Sheets `PROMPT_MODES` row `architectural_sketch`;
- editable Architectural Concept option content is stored row-by-row in `ARCH_SKETCH_OPTIONS`, including Output Representation, Photo Realism Target, Text / Signage Policy, and visible `RECOMMENDED_SURFACE`, `RECOMMENDED_LIGHTING`, and `RECOMMENDED_HUMAN` metadata columns;
- existing `architecturalSketch*` CONFIG keys are formula-generated JSON mirrors of `ARCH_SKETCH_OPTIONS`, including `architecturalSketchTextSignagePolicies`, preserving the existing API contract while making the option content easy to edit;
- defaults remain in `CONFIG` using `defaultArchitecturalSketch*` keys;
- Aspect Ratio reuses the shared `ASPECT_RATIOS` collection;
- `fallback.json` contains a synchronized resilience copy, while JavaScript keeps only minimal emergency fallbacks.

Implementation files:
- `architecture-prompt-quality.js`
- `architectural-sketch-builder.js`
- `architectural-sketch-mode.js`
- `architectural-sketch.css`
- shared loader in `workspace-tabs.js`
- Saved Prompt Library integration in `prompt-saved-store.js` / `prompt-saved.js`

Saved Prompt Library:
- complete Architectural Concept state is stored and restored, including Output Representation, Photo Realism Target, and Text / Signage Policy;
- legacy states without Text / Signage Policy restore to `no-invented-text`;
- stable existing Sketch Style IDs are retained where practical so previously saved states remain restorable.

## Prompt Style Presets

Active production presets:

1. Hyper-Realistic iPhone
2. Cinematic Movie Still
3. Fashion Editorial
4. Indonesian Lifestyle Candid

Inactive / retained in Google Sheets for compatibility and possible future reuse:

- Japanese Nostalgia 1980s (`ACTIVE = FALSE`)
- Miniature Diorama (`ACTIVE = FALSE`)

Current semantic icon keys:
- Creative Prompt Builder → `sparkles`
- Reference Outfit Catalog → `shirt`
- Reference Product Catalog → `package`
- Hyper-Realistic iPhone → `smartphone`
- Cinematic Movie Still → `film`
- Fashion Editorial → `gem`
- Indonesian Lifestyle Candid → `sun`
- Japanese Nostalgia 1980s → `cassette` (inactive)
- Miniature Diorama → `cube` (inactive)
- History workspace → `history`

## Current Frontend Direction

**Design name:** Obsidian UI — Workstation V2

Production shell:
- compact global topbar with app identity, data status, appearance control, and creator profile;
- fixed left workstation sidebar for Build / Library plus Database and Settings utilities;
- center Build canvas with Creative Instrument heading, 7-step Prompt DNA, visual Prompt Mode cards, visual Style DNA cards, and grouped Prompt Details;
- persistent dark Live Output panel with Prompt / Structure / Metadata tabs, deterministic Prompt Analysis, adaptive prompt-editor height, and copy control;
- active Prompt Mode and Style Preset cards use visual thumbnail treatment built from existing repository assets;
- desktop uses a three-zone workstation layout; tablet collapses the output below the Build canvas; mobile converts navigation to a bottom workspace bar and keeps cards horizontally scrollable.

Visual language:
- light or dark Obsidian workspace surfaces with restrained Signal Amber accent;
- mint and electric blue as secondary signals;
- monoline SVG icon system only;
- compact but readable typography;
- professional startup / creative workstation character;
- dark editor-style Live Output remains the visual anchor in both themes.

Implementation:
- `workstation-v2.js` performs presentation-layer DOM composition while preserving production field IDs and mode logic;
- `workstation-v2.css` is the final visual override layer loaded after mode-specific styles;
- underlying prompt builders, Google Sheets data, Saved Prompt state, Smart Compatibility, Smart Random, architecture taxonomy, and mode controllers remain unchanged.
- Workstation V2 refinement pass: topbar controls are forced into a single compact row; all six Prompt Mode cards stay in one desktop row; Product Catalog and Product Poster thumbnail selectors use their production mode IDs; Prompt Details cards align to content height instead of stretching to the tallest column; Architectural Concept Builder moves Site / Context, Feature Emphasis, Extra Instruction, and Advanced Style Controls into a dedicated Advanced Settings disclosure; per-mode intro banners and the redundant Architectural Sketch logic card are hidden in the workstation shell; action buttons are static at the end of Prompt Details and no longer cover form controls.
- Live Output uses a fixed-height shell with only the prompt editor scrolling; Prompt / Structure / Metadata remain tabbed, Prompt Analysis stays visible, and prompt-editor height adapts to short / medium / long output.
- Prompt DNA and Prompt Analysis are mode-aware. Each production mode gets its own seven labels and readiness checks; readiness score is deterministic from the active mode's actual field state and no longer blends in Creative compatibility scores for Architecture/Product modes.
- The separate Live Output **Visual Preview** card has been removed. Scene/Setting preview now stays contextual beside the field that owns it instead of duplicating imagery in the output panel.
- In Workstation V2, Setting Preview is re-parented into the active Scene/Setting detail card and rendered as a compact image card with only the selected setting title; descriptive kicker/note/tag metadata are suppressed in the compact shell.
- Creative Aspect Ratio radio options are rendered as a full-width segmented control beneath the field label. The legacy two-column fieldset layout and decorative ratio pseudo-glyphs are overridden so `9:16 / 1:1 / 16:9 / 4:5` remain fully readable; mobile collapses to a 2×2 arrangement.
- Prompt Mode cards remain six-across on desktop, use shorter presentation-only descriptions, and have slightly taller card/thumbnail proportions for better readability; Architectural Render uses an architecture-first facade asset and Architectural Concept Builder uses an architecture-first pavilion asset with a stronger sketch-like monochrome treatment.
- Creative Prompt Details are balanced as **Subject / Scene & Action / Camera & Technical** without changing prompt data or field IDs.
- Topbar subtitle is simplified to **AI Creative Workstation · Build better prompts. Create without limits.** because creator identity already appears in the profile control.
- Prompt Analysis shows six mode-relevant checkpoints and always includes **Output**; the underlying readiness score still evaluates all seven Prompt DNA steps.
- Style DNA remains structurally unchanged, with only minor height/spacing refinement.
- Workstation presentation imagery is isolated from Setting data under `assets/workstation/`. Prompt Mode thumbnails live in `assets/workstation/modes/`; Style DNA thumbnails live in `assets/workstation/styles/`.
- Workstation CSS references only these dedicated visual asset paths, so UI imagery can be replaced directly in GitHub without editing JavaScript, Google Sheets, Apps Script, or `config.js`. Keep the existing filenames when replacing an image.
- `assets/workstation/README.md` documents the stable filenames and recommends 16:9 images around 1200×675 px.
- Style DNA thumbnail containers now render at a true `16:9` aspect ratio. A 1200×675 source therefore fills the thumbnail without the previous aggressive crop caused by the old fixed-height strip.
- Workstation visual assets use deploy-aware cache-busting from `document.lastModified`: mode/style card images receive a version query automatically, so replacing a stable filename in GitHub does not require code changes. After GitHub Pages finishes redeploying, a refresh loads the new asset; one hard refresh may be needed for tabs opened before this fix.
- Product Poster workstation thumbnail canonical filename is `assets/workstation/modes/product-poster.png` (PNG), matching the current uploaded asset.

Reference Product Catalog follows the same Obsidian selection language:
- amber = active / selected state;
- electric blue = Product Catalog identity accent / package icon.

## Current Readability Baseline

Do not regress below these practical targets:
- essential desktop UI microcopy: about 10 px minimum;
- mobile metadata / microcopy: generally 11 px minimum;
- main UI body: 13–14 px;
- generated prompt: 13 px desktop / 14 px mobile;
- mobile form controls: 16 px where appropriate;
- section headings: about 17–18 px.

## Workspace Baseline 4.5

Workspace and Prompt Mode are separate concepts:

- **Build** — all active authoring workflows: Creative, Reference Outfit Catalog, Reference Product Catalog, Product Poster Builder, Architectural Render, and Architectural Concept Builder.
- **Saved** — browser-local Saved Prompt Library. Stores reusable prompt templates in IndexedDB together with complete Build state, optional generated-result image, and notes. Supports search, mode filtering, preview, edit, copy, delete, and Restore to Build.

The previous Inspect workspace was removed on 2026-09-02. The previous History workspace was replaced by Saved Prompt Library on 2026-09-06.

Workspace implementation files:
- `workspace-tabs.js`
- `workspace-tabs.css`
- `prompt-saved-store.js`
- `prompt-saved.js`
- `prompt-saved.css`

## Persistent API Configuration

`config.js` is installation-specific and must survive upgrades.

Effective API source priority:
1. URL query parameter `?api=...`
2. browser override saved by the user
3. `config.js`
4. legacy meta tag in `index.html`
5. `fallback.json`

Normal production should resolve to `config.js`.

## Architectural Concept Builder — Output Representation

The production mode with stable internal ID `architectural_sketch` is now presented as **Architectural Concept Builder**.

It has two representation paths:
- **Sketch Presentation** — retains Sketch Style, Paper / Surface, Advanced Line/Color controls, sketch-specific Human Presence recommendations, and optional sketch annotations.
- **Architectural Photography** — hides sketch-only controls and exposes **Photo Realism Target** plus **Text / Signage Policy**.

Shared controls remain common to both paths:
- Input Type;
- Building Category / Type;
- Scene Type;
- Architectural Style Category / Style;
- Lighting / Time;
- Atmosphere / Character;
- Site / Context;
- Architectural Feature Emphasis;
- Human Presence / Scale;
- View / Projection;
- Aspect Ratio;
- Extra Instruction.

Compatibility:
- legacy Saved Prompt state without an Output Representation restores as `sketch-presentation`;
- legacy photography state without Text / Signage Policy restores to `no-invented-text`;
- the internal mode ID, frontend module names, and Saved Prompt field prefix `archSketch*` remain unchanged;
- **Architectural Render** remains a separate reference-first workflow with Design Fidelity;
- Google Sheets `ARCH_SKETCH_OPTIONS` remains the source of truth for both representation paths;
- CONFIG exposes `architecturalSketchOutputRepresentations`, `architecturalSketchPhotoRealismTargets`, and `architecturalSketchTextSignagePolicies` through the existing formula bridge;
- no Apps Script redeploy is required because the API contract remains CONFIG-driven.

Photography prompt opening follows the selected realism target. The default Hyper-Real path produces, for example:
`Create a hyper realistic photography of a retail store as an interior architectural view in a 4:5 aspect ratio.`

## Known Architectural Decisions

- Google Sheets is the source of truth for content data.
- `ARCH_RENDER_OPTIONS` and `ARCH_SKETCH_OPTIONS` are the canonical editable sources for Architectural Render and Architectural Sketch option content.
- Shared Architecture Taxonomy is maintained in `ARCH_BUILDING_CATEGORIES`, `ARCH_BUILDING_TYPES`, `ARCH_STYLE_CATEGORIES`, and `ARCH_STYLE_OPTIONS`, and is consumed by both Architectural Render and Architectural Sketch.
- Taxonomy category values exist only to organize/filter dropdowns; only the selected Building Type or Architectural Style prompt value is emitted into generated prompts.
- `Custom…` is a frontend utility option and is intentionally not stored as a taxonomy row in Google Sheets.
- Architecture option JSON stored in `CONFIG` is a formula-generated compatibility bridge for the current Apps Script API, not the primary editing surface.
- `SETTINGS` is the canonical setting source for Creative and Reference Outfit Catalog; `CATALOG_SETTINGS` remains legacy-only for compatibility.
- Apps Script exposes the data as JSON.
- Apps Script collection mapping is explicit via `SHEET_MAP`; Product Catalog collections and `OUTFIT_FOCUS_STYLES` are included in the deployed API mapping.
- Apps Script cache must not put an oversized full payload into one CacheService value.
- API cache behavior must remain sectioned/safe to avoid `Argumen terlalu besar: value`.
- `Refresh Now` should bypass stale state as intended.
- `fallback.json` must remain compatible with the API payload structure.
- `PRODUCT_*` and `outfitFocusStyles` are treated as optional additive collections by the frontend loader so older fallback payloads do not break Creative / core Outfit Catalog.
- `fallback.json` was fully refreshed from the live `Database_Prompt_Gen_4_5` source on 2026-09-23, including CONFIG, active/inactive source rows, shared Settings, Outfit Focus, Product Catalog collections, Prompt Modes, and Architecture CONFIG mirrors. It remains a resilience snapshot; Google Sheets is the source of truth.
- Frontend-only updates should not require Apps Script redeployment.
- Workstation V2 is a presentation-layer migration only: no Google Sheets schema or Apps Script API contract change is required, and production `config.js` remains untouched.
- `config.js` was preserved during the Reference Product Catalog, Outfit Focus Style, and shared Setting expansions.

## Release / Deployment Status

Reference Product Catalog production activation completed on 2026-08-25.

Outfit Focus Style enhancement for Reference Outfit Catalog completed and refined through 2026-08-30.

- Google Sheets schema/content: added `OUTFIT_FOCUS_STYLES`, `defaultOutfitFocusStyle`, and `OUTFIT_USAGE` metadata.
- Apps Script: redeployed once to expose `OUTFIT_FOCUS_STYLES` through the existing `/exec` deployment URL.
- Frontend: modular `outfit-focus-style.js` plus `outfit-focus-compatibility.js` are live and augment Reference Outfit Catalog without creating another Prompt Mode.
- QA: Hidden Face, Held Hanger, POV Outfit Selfie, Headless Outfit Crop, and Phone-Covered Outfit Selfie were reviewed in production UI.
- Field intelligence: non-relevant fields can be disabled/marked controlled by Outfit Focus Style, reducing contradictory prompt assembly.
- Shared Setting migration completed on 2026-08-30: `SETTINGS` is the master source for Creative + Reference Outfit Catalog, unique Catalog settings were moved into the master list, duplicate legacy IDs are resolved through aliases, and `CATALOG_SETTINGS` remains as compatibility-only data.
- `config.js`: unchanged.
- Apps Script redeploy was not required for the shared Setting migration.
- Update ZIP: not generated for these final frontend/data refinements.

## 2026-09-19 Architecture Option Data Migration

- added `ARCH_RENDER_OPTIONS` and `ARCH_SKETCH_OPTIONS` to the production Google Sheet;
- migrated Architectural Sketch choice content out of hand-edited CONFIG JSON into row-based data;
- moved Architectural Render Input Type, Design Fidelity, and Realism Target content out of frontend hardcoding into Sheets-driven data;
- CONFIG JSON option keys are generated from the new sheets by formulas, allowing the existing Apps Script CONFIG payload to keep working without a redeploy;
- Architectural Render defaults for input type, fidelity, realism target, lighting, and aspect ratio are now CONFIG-driven;
- JavaScript retains only compact emergency fallbacks;
- `config.js` unchanged.

## 2026-09-23 Sync & Stability Refresh

- live Google Sheets remained the source of truth and required no schema repair;
- `fallback.json` was regenerated from current Sheet values for CONFIG and all API-backed core, Catalog, Outfit Focus, and Product collections;
- stale Catalog defaults in fallback were replaced with the live defaults: 9:16, Lifestyle Fashion, Full Body, Indonesian Hijabi Woman, and the current shared Setting ID;
- blank `defaultOutfitFocusStyle` is intentional and matches production;
- Product Catalog and Outfit Focus collections are now present in fallback instead of depending on the live API only;
- legacy `CATALOG_SETTINGS` rows are preserved in the resilience snapshot with their live ACTIVE state; Reference Outfit Catalog continues to use master `SETTINGS`;
- `CURRENT_STATE.md` was refreshed to match the live CONFIG and production mode naming;
- no Apps Script redeploy or Google Sheets edit was required for this synchronization.

## 2026-09-23 Architecture Prompt Intelligence

- clarified architecture-mode intent in Google Sheets and Workstation UI: **Architectural Render = reference-first preservation**, **Architectural Concept Builder = concept-first development**;
- both modes now show contextual workflow guidance at Input Type level;
- Reference Image inside Concept Builder remains valid for design translation, but the UI directs exact geometry/source-view preservation to Architectural Render;
- added Photography-only **Text / Signage Policy** with four Sheets-driven options: No Invented Text — Preserve Existing, Preserve Reference Signage / Text, Allow Functional Architectural Signage, and Blank Signage — No Text;
- default Photography behavior no longer applies the Sketch no-text guard universally;
- Preserve Reference Signage / Text is input-aware and disabled outside Reference Image;
- new CONFIG keys: `defaultArchitecturalSketchTextSignagePolicy` and `architecturalSketchTextSignagePolicies`;
- Saved Prompt state and display labels were updated for the Concept Builder / Photography path;
- Workstation mode-card copy, README, PETUNJUK, CHANGELOG, and fallback CONFIG were synchronized;
- JavaScript syntax checks passed and prompt-builder behavior was tested for all four policy branches;
- no Apps Script redeploy required; `config.js` unchanged.

## 2026-09-23 Architecture UX

- populated UX-only descriptions for all active shared Architecture Taxonomy records: 6 Building Categories, 47 Building Types, 6 Style Categories, and 32 Architectural Styles;
- taxonomy descriptions are emitted through the existing CONFIG JSON bridge but never added to generated prompts;
- Architectural Render and Architectural Concept Builder now show contextual category/type/style descriptions beneath the relevant fields;
- Building Type and Architectural Style remain locked until their parent category is selected, preventing empty or contextless dependent selections;
- Render contextual help also reflects Input Type and Realism Target, while STRICT fidelity explicitly explains that style controls are reference-controlled;
- Concept contextual help now reflects Output Representation, Photo Realism Target, Input-aware Feature Emphasis, View / Projection, Annotations / Text, and Text / Signage Policy;
- Architectural Photography now filters out non-camera projections: Axonometric / Isometric, Orthographic Elevation, Section Perspective, and legacy Sketchbook Perspective;
- Sketch Presentation retains those technical projection options;
- Architectural Photography excludes Silhouette Figures while keeping standard scale-figure choices;
- Concept Random and Saved Prompt restore follow the same representation-aware view/human rules, with incompatible legacy Photography values normalized to a valid fallback;
- DESCRIPTION cells in the taxonomy source sheets are wrapped for easier maintenance;
- `fallback.json` and production cache keys were synchronized;
- no Apps Script redeploy required; `config.js` unchanged.

## 2026-09-23 Prompt Quality Expansion

- added shared module `architecture-prompt-quality.js` for semantic composition across Architectural Render and Architectural Concept Builder;
- quality logic uses existing selections rather than adding new dropdowns;
- introduced category-aware typology priorities for Residential, Commercial, Institutional/Public, Religious, Industrial, and Specialty/Historic architecture;
- added higher-specificity Building Type priorities for common types including Single-family House, Retail Store, Hotel / Resort, Restaurant / Café, School / University, Hospital / Clinic, Museum, Factory / Manufacturing, Warehouse, Pavilion, and Architectural Bridge;
- specific Building Type rules replace broader category rules when available to avoid repetitive prompt expansion;
- STRICT Render uses quality guidance only to improve architectural readability and realism without modifying reference geometry;
- Balanced / Creative Render receive fidelity-specific style discipline, while Materials trigger construction-scale/joint/reflectance logic and Input Type triggers source-specific interpretation rules;
- Concept / Design Brief inputs receive coherent secondary-detail resolution instead of arbitrary ornament; Reference Image inputs resolve ambiguity conservatively and protect core massing/openings/spatial composition;
- Architectural Photography gains scene-aware real-camera rules, realism-target behavior, human-scale discipline, and physically coherent lens / horizon / vertical guidance;
- Sketch technical projections gain projection-consistency rules and no longer receive contradictory generic perspective wording;
- corrected Photography opening grammar for vowel-leading targets such as **Editorial Architectural Photo**;
- added descriptions for Concept Input Type and Scene Type rows in `ARCH_SKETCH_OPTIONS`, synchronized CONFIG-derived fallback data, and documented the semantic composer in `PETUNJUK`;
- production cache bundle bumped to `4.5-arch-quality-3`;
- no Apps Script redeploy required; `config.js` unchanged.

## 2026-09-23 Style Semantic Profile

- added `SEMANTIC_PROFILE` to `ARCH_STYLE_OPTIONS` for all 32 active Architectural Styles;
- `DESCRIPTION` remains human-facing UX help, while `SEMANTIC_PROFILE` is compact model-facing architectural guidance;
- the existing `_JSON` bridge now emits `semantic_profile` without changing the CONFIG key or Apps Script contract;
- Architectural Taxonomy exposes the semantic profile to the frontend but does not render it as a new field;
- Architectural Render passes the profile only in Balanced / Creative; STRICT continues to ignore style controls entirely;
- Balanced Render uses semantic cues selectively and explicitly blocks unsupported signature elements that would conflict with preserved geometry;
- Creative Render uses the profile as a coherent design system while retaining reference massing and project identity;
- Concept / Design Brief uses the profile across proportion, openings, material character, structure, and detail hierarchy instead of relying only on the style name;
- Reference Image Concept uses only compatible semantic cues and explicitly avoids adding unsupported signature elements merely to make the style more obvious;
- Custom Architectural Style remains supported; because it has no database semantic profile, the composer falls back to generic style discipline;
- `fallback.json` synchronized with 32/32 style semantic profiles;
- production cache bundle bumped to `4.5-style-semantic-1`;
- no Apps Script redeploy required; `config.js` unchanged.

## 2026-09-23 Sketch Style Core Set

- reduced the active Sketch Style production set from eight to six visually clearer families based on actual image-output comparison;
- retained **Precise Architectural Pen Drawing**, **Loose Concept Sketch**, **Bold Ink Perspective Sketch**, **Soft Watercolor Architectural Sketch**, **Marker Presentation Sketch**, and **Urban Observational Sketch**;
- renamed visible `Clean Facade Line Sketch` to **Precise Architectural Pen Drawing** while preserving stable ID `refined-line-drawing`;
- deactivated `Minimal Color Perspective Sketch` (`concept-presentation`) and `Marker / Mixed Media Sketch` (`mixed-media`) without deleting their source rows;
- normalized active SORT order to 1–6; inactive legacy rows remain available for maintenance/history;
- Saved Prompt restore maps `concept-presentation` → `refined-line-drawing` and `mixed-media` → `marker-sketch`;
- CONFIG and `fallback.json` now expose only the six active production styles;
- no Apps Script redeploy required; `config.js` unchanged.

## 2026-09-23 Precise Architectural Pen Drawing

- replaced the previous Clean Architectural Line Sketch presentation language with **Precise Architectural Pen Drawing** while preserving stable ID `refined-line-drawing`;
- new style DNA emphasizes disciplined ink contours, accurate proportions, controlled line-weight hierarchy, controlled crosshatching, articulated structural/material details, line-drawn vegetation, restrained tonal accents, and generous clean white paper;
- default color behavior is predominantly monochrome ink; optional color must remain minimal and subordinate to linework;
- style guard explicitly rejects watercolor-style washes, broad marker blocks, loose gestural scribbles, painterly shading, heavy graphite texture, and photorealistic material rendering;
- recommended surfaces remain **White Presentation Paper** and **Bristol Board**;
- no Saved Prompt migration is required because the style ID remains `refined-line-drawing`;
- CONFIG and `fallback.json` synchronized; no Apps Script redeploy required.

## Next Product Opportunities

Potential future directions, not yet baseline features:
- favorites
- shareable prompt state URLs
- Prompt Intelligence v2 expansion
- user-facing semantic conflict diagnostics beyond the architecture composer
- richer prompt completeness diagnostics
- automate Sheet → fallback snapshot generation and drift validation so future syncs do not rely on manual refreshes
- retire `CATALOG_SETTINGS` only after legacy History compatibility is no longer needed

Do not treat these as implemented unless production source confirms them.
