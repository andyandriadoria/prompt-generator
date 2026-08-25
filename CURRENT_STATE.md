# Prompt Gen — Current State

**Baseline date:** 2026-08-25  
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

## Active Features

- Creative Prompt Builder
- Reference Outfit Catalog
- Prompt Mode switching
- Smart Compatibility
- Searchable Dropdowns
- Smart / Catalog Random
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
- local-first Prompt History v1 with state restore
- child-safe catalog logic
- strict / ultra-strict / compact outfit preservation

## Prompt Style Presets

1. Hyper-Realistic iPhone
2. Cinematic Movie Still
3. Fashion Editorial
4. Indonesian Lifestyle Candid
5. Japanese Nostalgia 1980s
6. Miniature Diorama

Current semantic icon keys:
- Creative Prompt Builder → `sparkles`
- Reference Outfit Catalog → `shirt`
- Hyper-Realistic iPhone → `smartphone`
- Cinematic Movie Still → `film`
- Fashion Editorial → `gem`
- Indonesian Lifestyle Candid → `sun`
- Japanese Nostalgia 1980s → `cassette`
- Miniature Diorama → `cube`
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

## Current Readability Baseline

Do not regress below these practical targets:
- essential desktop UI microcopy: about 10 px minimum;
- mobile metadata / microcopy: generally 11 px minimum;
- main UI body: 13–14 px;
- generated prompt: 13 px desktop / 14 px mobile;
- mobile form controls: 16 px where appropriate;
- section headings: about 17–18 px.


## Workspace Baseline 4.5

Prompt Gen 4.5 adds a persistent workspace layer above Prompt Mode. Workspace and Prompt Mode are separate concepts:

- **Build** — existing Creative / Reference Outfit Catalog authoring workflow.
- **Inspect** — Prompt Intelligence v1 with Prompt Health, expanded Prompt DNA, completeness/coherence findings, recommendations, and output diagnostics.
- **History** — browser-local prompt history, maximum 50 explicit Generate actions, with search/filter, preview, restore, copy, delete, and clear.

History must not save every automatic preview when `autoGenerate=TRUE`; only explicit **Generate Prompt** actions are committed. Restoring an item restores the saved Build state where the referenced options still exist in the current database.

Workspace implementation files:
- `workspace-tabs.js`
- `workspace-tabs.css`
- `prompt-inspector.js`
- `prompt-inspector.css`
- `prompt-history.js`
- `prompt-history.css`

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
- Apps Script exposes the data as JSON.
- Apps Script cache must not put an oversized full payload into one CacheService value.
- API cache behavior must remain sectioned/safe to avoid `Argumen terlalu besar: value`.
- `Refresh Now` should bypass stale state as intended.
- `fallback.json` must remain compatible with the API payload structure.
- QA note for 4.5: `fallback.json` remains structurally compatible but its embedded legacy version metadata/title still predates 4.5; normal production is unaffected because live CONFIG comes from Google Sheets. Sync this metadata in the next fallback maintenance pass.
- Frontend-only updates should not require Apps Script redeployment.

## Next Product Opportunities

Potential future directions, not yet baseline features:
- favorites
- shareable prompt state URLs
- Prompt Intelligence v2 expansion
- deeper semantic conflict / redundancy detection
- richer prompt completeness diagnostics
- Scene Preset Cards for Reference Outfit Catalog

Do not treat these as implemented unless production source confirms them.
