# Prompt Gen 4.3 — Multi Mode

Prompt Gen 4.3 is a static GitHub Pages web app backed by Google Sheets through a Google Apps Script JSON API.

## Modes

### 1. Creative Prompt Builder
The existing flexible generator with:
- Prompt Style Presets
- Smart Compatibility
- Searchable Dropdowns
- Smart Random
- Camera, lighting, setting and aspect ratio controls

### 2. Reference Outfit Catalog
A new strict template-driven generator for image-reference fashion workflows. It preserves the original outfit while changing the model, pose, framing and environment.

Default output pattern:

```text
Without changing the existing outfit in any way, including its exact color, fabric, pattern, texture, cut, proportions, and every original detail, create a photorealistic image in a 4:5 aspect ratio.

A young Indonesian hijabi girl wearing the exact outfit from the reference image, photographed for a modest children's clothing catalog inside an elegant luxury living room. Natural pose, age-appropriate presentation, medium shot.

Family-friendly children's fashion photography. No text, no accessories that alter the outfit, and no modification or distortion of the clothing.
```

## GitHub root files

Upload/replace these in the repository root:

- `index.html`
- `style.css`
- `app.js`
- `prompt-builder.js`
- `catalog-prompt-builder.js`
- `compatibility-engine.js`
- `searchable-select.js`
- `data-loader.js`
- `fallback.json`

`README.md` is optional for the website but useful for the repository.

## Google Sheets upgrade

For an existing Prompt Gen 4.2 database, use `Upgrade_4_2_to_4_3.xlsx` instead of replacing your whole spreadsheet. This protects rows you have already edited or added.

For a fresh install, use `Database_Prompt_Gen_4_3.xlsx`.

## Apps Script

Copy `google-apps-script/Code.gs` into the Apps Script project, run `setup()` once, and deploy a **New version** of the existing Web App. The `/exec` URL stays the same.

The API keeps the 4.2.2 cache-size fix: each collection is cached separately, and oversized collections are served without failing the API.

## API source priority

The browser uses:
1. `?api=` URL parameter
2. URL saved through **Save & Reload**
3. `<meta name="prompt-api-url">` inside `index.html`

For normal public use, set the meta URL and use **Reset Source** once on browsers that previously saved another URL.

## Version

Prompt Gen 4.3.0
