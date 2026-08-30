# Prompt Gen — Current State

**Baseline date:** 2026-08-30  
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
| defaultCatalogAspectRatio | 4:5 |
| defaultPreservationLevel | exact-strict |
| defaultCatalogType | modest-children |
| defaultCatalogPose | natural-pose |
| defaultCatalogShot | medium-shot |
| defaultCatalogSubject | young-indonesian-hijabi-girl |
| defaultCatalogSetting | luxury-living-room |
| defaultOutfitFocusStyle | headless-outfit-crop |
| defaultProductType | clothing |
| defaultProductPresentation | hanging-product |
| defaultProductSetting | minimal-studio |
| defaultProductShot | full-product |
| defaultProductComposition | single-product |
| defaultProductAspectRatio | 4:5 |
| defaultProductPreservation | exact-strict |
| defaultProductTextOverlay | none |

Active Prompt Modes:
- Creative Prompt Builder
- Reference Outfit Catalog
- Reference Product Catalog (`ACTIVE = TRUE`)

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
- Workspace Tabs: Build / Inspect / History
- Prompt Intelligence v1 in Inspect
- Product-aware Prompt Intelligence in Inspect
- local-first Prompt History v1 with state restore
- Product Catalog local history + restore integration
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
- default CONFIG key: `defaultOutfitFocusStyle = headless-outfit-crop`

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

**Design name:** Obsidian UI

Characteristics:
- dark-first;
- graphite surfaces;
- restrained amber accent;
- mint and blue as secondary signals;
- monoline icons;
- compact but readable typography;
- high-end startup / creative workstation feel;
- desktop workbench layout;
- output panel styled like an editor.

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

- **Build** — Creative / Reference Outfit Catalog / Reference Product Catalog authoring workflows.
- **Inspect** — Prompt Intelligence with Prompt Health, expanded Prompt DNA, completeness/coherence findings, recommendations, and output diagnostics. Product Catalog uses Product / Presentation / Preservation / Scene / Shot / Composition / Ratio dimensions, with optional Campaign Copy. Reference Outfit Catalog can append an Outfit Focus DNA card when Outfit Focus Style is active.
- **History** — browser-local prompt history with search/filter, preview, restore, copy, delete, and clear. Product Catalog explicit Generate actions are included and can be restored to Build. Reference Outfit Catalog history also retains `outfitFocusStyle` for explicit Generate actions. Legacy Catalog Setting IDs remain restorable through the shared-setting alias/fallback compatibility layer.

History must not save every automatic preview when `autoGenerate=TRUE`; only explicit **Generate Prompt** actions are committed.

Workspace implementation files:
- `workspace-tabs.js`
- `workspace-tabs.css`
- `prompt-inspector.js`
- `prompt-inspector.css`
- `prompt-history.js`
- `prompt-history.css`
- `product-catalog-workspace.js`
- `outfit-focus-style.js`
- `outfit-focus-compatibility.js`

## Persistent API Configuration

`config.js` is installation-specific and must survive upgrades.

Effective API source priority:
1. URL query parameter `?api=...`
2. browser override saved by the user
3. `config.js`
4. legacy meta tag in `index.html`
5. `fallback.json`

Normal production should resolve to `config.js`.

## Known Architectural Decisions

- Google Sheets is the source of truth for content data.
- `SETTINGS` is the canonical setting source for Creative and Reference Outfit Catalog; `CATALOG_SETTINGS` remains legacy-only for compatibility.
- Apps Script exposes the data as JSON.
- Apps Script collection mapping is explicit via `SHEET_MAP`; Product Catalog collections and `OUTFIT_FOCUS_STYLES` are included in the deployed API mapping.
- Apps Script cache must not put an oversized full payload into one CacheService value.
- API cache behavior must remain sectioned/safe to avoid `Argumen terlalu besar: value`.
- `Refresh Now` should bypass stale state as intended.
- `fallback.json` must remain compatible with the API payload structure.
- `PRODUCT_*` and `outfitFocusStyles` are treated as optional additive collections by the frontend loader so older fallback payloads do not break Creative / core Outfit Catalog.
- QA note for 4.5: `fallback.json` remains structurally compatible but its embedded legacy version metadata/title still predates 4.5 and does not yet include Product Catalog, current shared Setting data, or Outfit Focus Style data; normal production is unaffected because live CONFIG/content comes from Google Sheets. Sync this in the next fallback maintenance pass.
- Frontend-only updates should not require Apps Script redeployment.
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

## Next Product Opportunities

Potential future directions, not yet baseline features:
- favorites
- shareable prompt state URLs
- Prompt Intelligence v2 expansion
- deeper semantic conflict / redundancy detection
- richer prompt completeness diagnostics
- fallback payload refresh to include current 4.5 Product Catalog, shared Settings, and Outfit Focus Style collections
- retire `CATALOG_SETTINGS` only after legacy History compatibility is no longer needed

Do not treat these as implemented unless production source confirms them.
