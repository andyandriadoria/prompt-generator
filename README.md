# Prompt Gen 4.2 — Prompt Style Presets

Prompt Gen 4.2 is a GitHub Pages prompt builder whose content is managed from Google Sheets through a Google Apps Script JSON API.

## What is new in 4.2

- Six one-click visual style cards:
  - Hyper-Realistic iPhone
  - Cinematic Movie Still
  - Fashion Editorial
  - Indonesian Lifestyle Candid
  - Japanese Nostalgia 1980s
  - Miniature Diorama
- A style can set the prompt opening, camera style, camera angle, lighting, and aspect ratio.
- Two apply behaviors:
  - **Replace technical settings**: applies the complete preset.
  - **Fill empty settings only**: preserves technical choices already selected.
- Optional negative-prompt guidance.
- The active style appears beside the generated-prompt counter.
- Smart Compatibility uses `RECOMMENDED_TAGS` and `EXCLUDED_TAGS` to rank dropdown options.
- New **4:5** aspect ratio for editorial and Instagram-oriented images.
- Style definitions are fully editable from the `STYLE_PRESETS` Google Sheets tab.

Existing 4.1 features remain available: Searchable Dropdown, Smart Compatibility, Smart Random, dark mode, fallback database, API cache controls, and automatic pronouns.

## Files uploaded to GitHub

Upload or replace these files directly in the repository root:

```text
index.html
style.css
app.js
data-loader.js
prompt-builder.js
compatibility-engine.js
searchable-select.js
fallback.json
README.md
```

Do not upload the Excel workbooks as website files. The Excel files are for Google Sheets setup or migration.

## Choose the correct database path

### A. New installation

Import:

```text
Database_Prompt_Gen_4_2.xlsx
```

into a new Google Sheet.

### B. Upgrade from an edited Prompt Gen 4.1 Google Sheet

Use:

```text
Upgrade_4_1_to_4_2.xlsx
```

This is safer because it does not require replacing the database that you already edited. Follow `MIGRATION_4_1_TO_4_2.md`.

## Google Apps Script setup

1. Open the Prompt Gen Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the existing script with `google-apps-script/Code.gs`.
4. Run `setup()` once.
5. Open **Deploy → Manage deployments**.
6. Edit the active deployment.
7. Select **New version** and click **Deploy**.
8. The `/exec` URL normally remains unchanged.

The 4.2 script adds this API collection:

```text
STYLE_PRESETS → stylePresets
```

## Permanent API URL

Keep the Apps Script `/exec` URL in `index.html`:

```html
<meta name="prompt-api-url" content="https://script.google.com/macros/s/DEPLOYMENT_ID/exec">
```

When the URL is already configured in your existing `index.html`, copy it into the new 4.2 file before uploading it to GitHub.

## STYLE_PRESETS columns

| Column | Purpose |
|---|---|
| `ID` | Unique stable identifier |
| `LABEL` | Card title shown on the website |
| `ICON` | Emoji or short visual symbol |
| `CATEGORY` | Style grouping |
| `DESCRIPTION` | Short description shown on the card |
| `STYLE_PROMPT` | Visual-language sentence added to the generated prompt |
| `PROMPT_OPENING` | Replaces the normal prompt opening while the style is active |
| `CAMERA_STYLE_ID` | Default ID from `CAMERA_STYLES` |
| `CAMERA_ANGLE_ID` | Default ID from `CAMERA_ANGLES` |
| `LIGHTING_ID` | Default ID from `LIGHTING` |
| `ASPECT_RATIO_ID` | Default ID from `ASPECT_RATIOS` |
| `RECOMMENDED_TAGS` | Tags prioritized by Smart Compatibility; separate with `|` |
| `EXCLUDED_TAGS` | Tags penalized by Smart Compatibility; separate with `|` |
| `NEGATIVE_PROMPT` | Optional “Avoid” guidance |
| `TAGS` | General keywords |
| `ACTIVE` | `TRUE` shows the card; `FALSE` hides it |
| `SORT` | Card order |

## Editing or adding a style

1. Duplicate an existing row in `STYLE_PRESETS`.
2. Give it a unique `ID`.
3. Change the label, description, and style prompt.
4. Use valid IDs from the technical sheets.
5. Add recommended and excluded tags.
6. Set `ACTIVE=TRUE`.
7. Click **Refresh Now** on the website.

## Local testing

Because `fallback.json` is loaded with `fetch()`, run a local web server instead of opening `index.html` by double-clicking it.

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```
