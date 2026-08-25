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
2. prompt content and configuration — Google Sheets;
3. data delivery — Google Apps Script JSON API;
4. permanent deployment-specific API URL — `config.js`;
5. offline / API-failure resilience — `fallback.json`.

## Current Product Modes

### Creative Prompt Builder
A flexible prompt construction mode for characters, poses/actions, expressions, outfits, settings, camera angles, lighting, camera styles, aspect ratios, Prompt Style Presets, and Smart Compatibility.

### Reference Outfit Catalog
A structured reference-image fashion workflow designed to preserve an uploaded outfit while changing the subject presentation, scene, shot, and catalog context.

Its core principle is strict outfit preservation, including original color, fabric, pattern, texture, cut, proportions, print placement, silhouette, and original details. The mode includes child-safe logic for child subjects.


## Current Workspaces

### Build
Primary authoring workspace. Contains the existing Prompt Mode system: Creative Prompt Builder and Reference Outfit Catalog.

### Inspect
Prompt Intelligence v1. Reviews the current Build state using Prompt Health, expanded Prompt DNA, completeness/coherence signals, findings, recommendations, and prompt diagnostics.

### History
Local-first browser history for explicit Generate Prompt actions. Stores up to 50 prompt/state snapshots and supports search, filtering, preview, restore, copy, delete, and clear. It does not write user activity back to Google Sheets.

## Product Philosophy

Prompt Gen should feel like a professional creative AI workstation rather than a long HTML form. It should be fast, readable, visually restrained, data-driven, modular, mobile-friendly, safe to upgrade, and easy to maintain from Google Sheets.

Avoid emoji-heavy UI, overly playful styling, decorative AI clichés, and needless hardcoding.

## Source of Truth Hierarchy

When sources conflict, use this order:
1. `CURRENT_STATE.md`
2. `PROJECT_RULES.md`
3. current production repository
4. current production Google Sheets database
5. other project documentation
6. historical / archived files

Older ZIP packages and previous-version files are historical references only unless explicitly requested.
