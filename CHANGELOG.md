# Prompt Gen — Changelog

## 4.5 — Workspace Tabs + Prompt Intelligence + History

Focus:
- introduce a persistent workspace layer without changing Prompt Mode semantics;
- add prompt analysis and local session recovery;
- preserve the 4.4.1 Obsidian/readability baseline.

Key changes:
- added Build / Inspect / History workspace tabs;
- Build keeps the existing Creative and Reference Outfit Catalog workflow;
- added Prompt Intelligence v1 with Prompt Health, expanded Prompt DNA, completeness/coherence findings, prioritized improvements, and output diagnostics;
- added browser-local Prompt History v1 with a 50-item cap;
- History saves only explicit Generate Prompt actions, not automatic live generation;
- History stores Build-state snapshots and supports restore, search/filter, preview, copy, delete, and clear;
- added semantic `history` monoline SVG icon;
- QA fixed new workspace metadata to respect the 10 px desktop / 11 px mobile readability floor;
- synchronized release title to Prompt Gen 4.5 and renamed the production spreadsheet to `Database_Prompt_Gen_4_5`;
- preserved `config.js`;
- no Google Sheets schema change;
- no API contract change;
- no Apps Script redeploy required.

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
