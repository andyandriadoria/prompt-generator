# Prompt Gen — Project Brief

## Identity

- **Project name:** Prompt Gen
- **Current baseline:** 4.5
- **Product type:** Browser-based AI image prompt workstation
- **Creator label:** Ndoy Creator
- **Frontend hosting:** GitHub Pages
- **Content database:** Google Sheets
- **API layer:** Google Apps Script Web App
- **Primary UI direction:** Obsidian UI — futuristic, high-end, startup-like
- **Default visual mode:** Dark mode
- **Primary language of generated prompts:** English

## Product Goal

Prompt Gen is a multi-mode prompt-building system for creating structured AI image prompts without repeatedly editing HTML or JavaScript whenever prompt content changes.

The application separates:
1. application logic and interface — GitHub Pages;
2. prompt content and editable option data — Google Sheets;
3. data delivery — Google Apps Script JSON API;
4. permanent deployment-specific API URL — `config.js`;
5. offline / API-failure resilience — `fallback.json`.

## Current Product Modes

1. **Creative Prompt Builder** — flexible character, scene, camera, lighting, outfit, and style-preset workflow.
2. **Reference Outfit Catalog** — strict outfit-preservation workflow with Outfit Focus Style, child-safe logic, mannequin support, and shared master Settings.
3. **Reference Product Catalog** — product-first commercial/catalog prompts with preservation, presentation, setting, shot, composition, wear-context, and campaign controls.
4. **Product Poster Builder** — reference-photo poster workflow with premium typography and editable product information.
5. **Architectural Render** — reference-driven architectural visualization with Design Fidelity and Realism Target controls.
6. **Architectural Sketch Builder** — hand-drawn architectural concept/reference workflows across line, ink, watercolor, marker, urban-sketch, and mixed-media families.

## Current Workspaces

### Build
Primary authoring workspace containing all active Prompt Modes.

### Saved
Browser-local Saved Prompt Library backed by IndexedDB. Stores complete Build state, prompt text, optional generated-result image, and notes. Supports search, mode filtering, preview, edit, copy, delete, and Restore to Build.

The previous Inspect workspace was removed. The previous History workspace was replaced by Saved Prompt Library.

## Data Maintenance

Google Sheets is the source of truth for editable prompt content.

Important current shared/data-driven sources include:
- `SETTINGS` for Creative and Reference Outfit Catalog settings;
- `ARCH_RENDER_OPTIONS` for Architectural Render Input Type, Design Fidelity, and Realism Target content;
- `ARCH_SKETCH_OPTIONS` for Architectural Sketch dropdown option content.

For the two architecture modes, CONFIG keeps formula-generated JSON mirrors so the existing Apps Script CONFIG payload can serve the row-based option sheets without another API mapping change.

## Product Philosophy

Prompt Gen should feel like a professional creative AI workstation rather than a long HTML form. It should be fast, readable, visually restrained, data-driven, modular, mobile-friendly, safe to upgrade, and easy to maintain from Google Sheets.

Avoid emoji-heavy UI, overly playful styling, decorative AI clichés, and needless hardcoding.

## Source of Truth Hierarchy

When sources conflict, use this order:
1. `CURRENT_STATE.md`;
2. `PROJECT_RULES.md`;
3. current production repository;
4. current production Google Sheets database;
5. other project documentation;
6. historical / archived files.

Older ZIP packages and previous-version files are historical references only unless explicitly requested.
