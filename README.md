# Prompt Gen 4.1 — Smart Compatibility + Searchable Dropdown

Prompt Gen 4.1 is a static GitHub Pages app whose content is managed from Google Sheets through a Google Apps Script JSON API.

## Main improvements

- Searchable dropdowns for character, pose, expression, outfit, setting, camera angle, lighting, and camera style.
- Search by option label, category, or TAGS from Google Sheets.
- Compatibility score from 0–100 for the selected combination.
- Compatible choices are prioritized inside dropdown results.
- Three display modes: prioritize, original order, or hide weak matches.
- Smart Random chooses higher-scoring combinations instead of fully random combinations.
- `Refresh Now` bypasses both browser cache and Apps Script cache.
- Apps Script automatically clears its API cache when the spreadsheet is edited.

## Files uploaded to GitHub

Upload these files directly to the repository root:

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

Do not upload the Excel workbook as part of the website. Import it to Google Sheets instead.

## Google Sheets setup

1. Import `Database_Prompt_Gen_4_1.xlsx` into Google Sheets.
2. Keep all sheet names and header names unchanged.
3. Open **Extensions → Apps Script**.
4. Replace the default script with `google-apps-script/Code.gs`.
5. Run `setup()` once and approve access.
6. Deploy as a Web app:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the `/exec` URL.
8. Paste the URL into this meta tag in `index.html`:

```html
<meta name="prompt-api-url" content="https://script.google.com/macros/s/DEPLOYMENT_ID/exec">
```

When updating an existing Apps Script deployment, choose **Deploy → Manage deployments → Edit → New version → Deploy**.

## Updating the database

Add or edit rows in Google Sheets, then click **Refresh Now** on the website. The `onEdit()` trigger also clears server-side cache automatically.

Important columns:

- `ID`: unique stable identifier.
- `LABEL`: text visible in the dropdown.
- `PROMPT`: English text inserted into the generated prompt.
- `CATEGORY`: visual grouping and searchable metadata.
- `TAGS`: comma-separated keywords used by search and Smart Compatibility.
- `ACTIVE`: `TRUE` displays the row; `FALSE` hides it.
- `SORT`: smaller numbers appear earlier.

## Compatibility rules

Rules are stored in `COMPATIBILITY_RULES`.

| Column | Purpose |
|---|---|
| `SOURCE_TYPE` | `pose`, `outfit`, `setting`, `expression`, or `character` |
| `SOURCE_TAG` | One or more source tags separated by `|` |
| `RELATION` | `prefers`, `requires`, `excludes`, or `supports` |
| `TARGET_TYPE` | Type being checked |
| `TARGET_TAG` | Accepted or excluded target tags separated by `|` |
| `SEVERITY` | `info`, `warn`, or `block` |
| `WEIGHT` | Score reduction when the rule is violated |
| `MESSAGE` | Explanation shown to the user |

Example:

```text
pose | bath | requires | setting | bathroom|water|pool | block | 65
```

This means a pose tagged `bath` should use a setting tagged `bathroom`, `water`, or `pool`.

## Compatibility philosophy

The default mode does not lock creative choices. It gives scores and suggestions, then places more coherent choices at the top. Use **Hide weak matches** only when you want stronger filtering.

## Local testing

Because `fallback.json` is loaded with `fetch()`, open the project through a local web server rather than double-clicking `index.html`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
