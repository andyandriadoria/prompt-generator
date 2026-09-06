(function (global) {
  "use strict";

  const DB_NAME = "PromptGenSavedV1";
  const DB_VERSION = 1;
  const STORE = "savedPrompts";
  const META = "meta";
  const MIGRATION_KEY = "legacy-history-migrated-v1";
  const LEGACY_KEYS = ["promptGenHistoryV1", "promptGenProductHistoryV1"];
  const MODE_PRODUCT = "reference_product_catalog";
  const MODE_POSTER = "reference_product_poster";
  const MODES = new Set(["creative", "outfit_catalog", MODE_PRODUCT, MODE_POSTER]);
  const MAX_IMAGE_EDGE = 1600;
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const saved = db.createObjectStore(STORE, { keyPath: "id" });
          saved.createIndex("updatedAt", "updatedAt", { unique: false });
          saved.createIndex("mode", "mode", { unique: false });
        }
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    });
    return dbPromise;
  }

  function requestPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
    });
  }

  async function tx(store, mode, method, ...args) {
    const db = await openDb();
    return requestPromise(db.transaction(store, mode).objectStore(store)[method](...args));
  }

  async function list() {
    const rows = await tx(STORE, "readonly", "getAll");
    return rows.sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
  }
  const get = id => tx(STORE, "readonly", "get", id);
  const put = item => tx(STORE, "readwrite", "put", item);
  const remove = id => tx(STORE, "readwrite", "delete", id);
  const metaGet = key => tx(META, "readonly", "get", key);
  const metaPut = item => tx(META, "readwrite", "put", item);

  async function migrateLegacy() {
    if ((await metaGet(MIGRATION_KEY))?.value) return 0;
    const legacy = [];
    LEGACY_KEYS.forEach(key => {
      try {
        const rows = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(rows)) legacy.push(...rows);
      } catch (_) {}
    });
    let count = 0;
    for (const row of legacy) {
      if (!row || !MODES.has(row.mode) || typeof row.prompt !== "string") continue;
      const id = `legacy-${row.id || uid()}`;
      if (await get(id)) continue;
      const timestamp = Number(row.timestamp || Date.now());
      await put({
        id, createdAt: timestamp, updatedAt: timestamp, mode: row.mode,
        modeLabel: row.modeLabel || modeLabel(row.mode), styleLabel: row.styleLabel || "Legacy",
        title: legacyTitle(row), prompt: row.prompt, state: row.state || {}, notes: "Imported from the previous Prompt History.",
        imageBlob: null, legacy: true
      });
      count += 1;
    }
    await metaPut({ key: MIGRATION_KEY, value: true, timestamp: Date.now() });
    return count;
  }

  function currentMode() {
    const badge = document.getElementById("activeModeBadge")?.dataset?.mode;
    if (MODES.has(badge)) return badge;
    if (global.ProductPosterMode?.isActive?.()) return MODE_POSTER;
    if (global.ProductCatalogMode?.isActive?.()) return MODE_PRODUCT;
    if (document.getElementById("catalogFields") && !document.getElementById("catalogFields").hidden) return "outfit_catalog";
    return "creative";
  }

  function snapshot(prompt) {
    const mode = currentMode();
    const now = Date.now();
    return {
      id: uid(), createdAt: now, updatedAt: now, mode, modeLabel: modeLabel(mode),
      styleLabel: styleLabel(mode), prompt: String(prompt || "").trim(), state: captureState(mode),
      title: suggestTitle(mode), notes: "", imageBlob: null, legacy: false
    };
  }

  function commonState() {
    return {
      styleApplyMode: checked("styleApplyMode"),
      includeNegativePrompt: Boolean(byId("includeNegativePrompt")?.checked),
      compatibilityEnabled: Boolean(byId("compatibilityToggle")?.checked),
      compatibilityMode: value("compatibilityMode")
    };
  }

  function captureState(mode) {
    if (mode === MODE_PRODUCT) return global.ProductCatalogMode?.getState?.() || {};
    if (mode === MODE_POSTER) return global.ProductPosterMode?.getState?.() || {};
    const common = commonState();
    if (mode === "outfit_catalog") return {
      catalogSubject: value("catalogSubject"), catalogCustomSubject: value("catalogCustomSubject"),
      outfitFocusStyle: value("outfitFocusStyle"), catalogType: value("catalogType"), preservationLevel: value("preservationLevel"),
      catalogSetting: value("catalogSetting"), catalogCustomSetting: value("catalogCustomSetting"), catalogPose: value("catalogPose"),
      mannequinCustomPoseDirection: value("mannequinCustomPoseDirection"), catalogShot: value("catalogShot"),
      catalogAspectRatio: value("catalogAspectRatio"), catalogExtraInstruction: value("catalogExtraInstruction"), ...common
    };
    return {
      characterPreset: value("characterPreset"), subjectGender: value("subjectGender"), features: value("features"),
      action: value("action"), expression: value("expression"), outfit: value("outfit"), manualOutfit: value("manualOutfit"),
      setting: value("setting"), cameraAngle: value("cameraAngle"), lighting: value("lighting"), cameraType: value("cameraType"),
      aspectRatio: checked("aspectRatio"), stylePresetId: document.querySelector("[data-style-preset-id].is-active")?.dataset?.stylePresetId || "", ...common
    };
  }

  async function restore(item) {
    if (!item || !MODES.has(item.mode)) throw new Error("Unsupported saved prompt mode");
    const missing = [];
    global.PromptWorkspaceTabs?.setActive?.("build");
    if (item.mode === MODE_PRODUCT) {
      global.ProductCatalogMode?.activate?.(); await sleep(80);
      missing.push(...(global.ProductCatalogMode?.restoreState?.(item.state || {})?.missing || []));
      global.ProductCatalogMode?.generate?.();
      return missing;
    }
    if (item.mode === MODE_POSTER) {
      global.ProductPosterMode?.activate?.(); await sleep(80);
      missing.push(...(global.ProductPosterMode?.restoreState?.(item.state || {})?.missing || []));
      global.ProductPosterMode?.generate?.();
      return missing;
    }
    const card = document.querySelector(`[data-prompt-mode-id="${cssEscape(item.mode)}"]`);
    if (!card) throw new Error("Prompt mode is not ready");
    card.click(); await sleep(80);
    if (item.mode === "outfit_catalog") await restoreOutfit(item.state || {}, missing);
    else restoreCreative(item.state || {}, missing);
    byId("generatePromptBtn")?.click();
    return missing;
  }

  function restoreCommon(state, missing) {
    setRadio("styleApplyMode", state.styleApplyMode || "replace");
    if (state.includeNegativePrompt !== undefined) setCheckbox("includeNegativePrompt", state.includeNegativePrompt);
    if (state.compatibilityEnabled !== undefined) setCheckbox("compatibilityToggle", state.compatibilityEnabled);
    setSelect("compatibilityMode", state.compatibilityMode || "prioritize", missing, "Compatibility mode");
  }

  function restoreCreative(state, missing) {
    restoreCommon(state, missing);
    if (state.stylePresetId) {
      const card = document.querySelector(`[data-style-preset-id="${cssEscape(state.stylePresetId)}"]`);
      if (card) card.click(); else missing.push("Style Preset");
    } else byId("clearStylePresetBtn")?.click();
    setSelect("characterPreset", state.characterPreset || "custom", missing, "Character");
    setSelect("subjectGender", state.subjectGender || "auto", missing, "Subject / Pronoun");
    setText("features", state.features); setSelect("action", state.action, missing, "Pose / Action");
    setSelect("expression", state.expression, missing, "Expression"); setSelect("outfit", state.outfit, missing, "Outfit");
    setText("manualOutfit", state.manualOutfit); setSelect("setting", resolveSetting(state.setting), missing, "Setting");
    setSelect("cameraAngle", state.cameraAngle, missing, "Camera Angle"); setSelect("lighting", state.lighting, missing, "Lighting");
    setSelect("cameraType", state.cameraType, missing, "Camera Style"); setRadio("aspectRatio", state.aspectRatio);
  }

  async function restoreOutfit(state, missing) {
    restoreCommon(state, missing);
    setSelect("catalogSubject", state.catalogSubject || "custom", missing, "Subject"); setText("catalogCustomSubject", state.catalogCustomSubject);
    await sleep(90);
    if (byId("outfitFocusStyle")) setSelect("outfitFocusStyle", state.outfitFocusStyle, missing, "Outfit Focus Style");
    setSelect("catalogType", state.catalogType, missing, "Catalog Type"); setSelect("preservationLevel", state.preservationLevel, missing, "Preservation");
    setSelect("catalogSetting", resolveSetting(state.catalogSetting), missing, "Catalog Setting"); setText("catalogCustomSetting", state.catalogCustomSetting);
    setSelect("catalogPose", state.catalogPose, missing, "Catalog Pose"); setText("mannequinCustomPoseDirection", state.mannequinCustomPoseDirection);
    setSelect("catalogShot", state.catalogShot, missing, "Catalog Shot"); setSelect("catalogAspectRatio", state.catalogAspectRatio, missing, "Aspect Ratio");
    setText("catalogExtraInstruction", state.catalogExtraInstruction); global.MannequinCatalog?.sync?.();
  }

  async function normalizeImage(file) {
    if (!file?.type?.startsWith("image/")) throw new Error("Not an image");
    if (file.size > 30 * 1024 * 1024) throw new Error("Image is too large");
    if (!global.createImageBitmap) return file;
    let bitmap;
    try { bitmap = await createImageBitmap(file); } catch (_) { return file; }
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    return await new Promise(resolve => canvas.toBlob(blob => resolve(blob || file), "image/webp", .86));
  }

  function suggestTitle(mode = currentMode()) {
    if (mode === MODE_PRODUCT) return joinTitle(label("productType"), label("productPresentation"), "Product Catalog");
    if (mode === MODE_POSTER) {
      const info = value("posterProductInformation");
      const product = lineValue(info, "Product Name") || lineValue(info, "Brand");
      return product ? `${product} · Poster` : "Product Poster";
    }
    if (mode === "outfit_catalog") return joinTitle(label("outfitFocusStyle"), label("catalogSetting"), label("catalogSubject") || "Outfit Catalog");
    return joinTitle(label("characterPreset"), label("setting"), "Creative Prompt");
  }

  function modeLabel(mode) { return ({ creative: "Creative Prompt Builder", outfit_catalog: "Reference Outfit Catalog", [MODE_PRODUCT]: "Reference Product Catalog", [MODE_POSTER]: "Product Poster Builder" })[mode] || "Prompt Gen"; }
  function shortMode(mode) { return ({ creative: "Creative", outfit_catalog: "Outfit", [MODE_PRODUCT]: "Product", [MODE_POSTER]: "Poster" })[mode] || "Prompt"; }
  function modeIcon(mode) { return ({ creative: "sparkles", outfit_catalog: "shirt", [MODE_PRODUCT]: "package", [MODE_POSTER]: "poster" })[mode] || "bookmark"; }
  function styleLabel(mode) {
    if (mode === MODE_PRODUCT) return [label("productType"), label("productPresentation")].filter(Boolean).join(" · ") || "Product Catalog";
    if (mode === MODE_POSTER) return "9:16 Product Poster";
    if (mode === "outfit_catalog") return label("outfitFocusStyle") || label("catalogType") || "Outfit Catalog";
    const badge = byId("activeStyleBadge"); return badge && !badge.hidden && badge.textContent.trim() ? badge.textContent.trim() : label("cameraType") || "Custom / unstyled";
  }
  function legacyTitle(row) { const style = String(row.styleLabel || "").trim(); return style && style !== "Custom / unstyled" ? `${style} · Legacy` : `${shortMode(row.mode)} · Legacy`; }
  function joinTitle(a, b, fallback) { const parts = [a, b].filter(Boolean); return parts.length ? parts.join(" · ") : fallback; }
  function lineValue(text, key) { return String(text || "").match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "im"))?.[1]?.trim() || ""; }
  function resolveSetting(id) { return global.PromptSettingIdMigration?.resolve?.(id) || id || ""; }
  function label(id) { const o = byId(id)?.selectedOptions?.[0]; if (!o || o.dataset?.placeholder === "true") return ""; const t = o.textContent?.trim() || ""; return /^--.*--$/.test(t) ? "" : t; }
  function value(id) { return byId(id)?.value || ""; }
  function checked(name) { return document.querySelector(`input[name="${cssEscape(name)}"]:checked`)?.value || ""; }
  function byId(id) { return document.getElementById(id); }
  function setText(id, v) { const e = byId(id); if (!e) return; e.value = String(v ?? ""); e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }
  function setCheckbox(id, v) { const e = byId(id); if (!e) return; e.checked = Boolean(v); e.dispatchEvent(new Event("change", { bubbles: true })); }
  function setRadio(name, v) { if (!v) return false; const e = [...document.querySelectorAll(`input[name="${cssEscape(name)}"]`)].find(x => x.value === String(v)); if (!e) return false; e.checked = true; e.dispatchEvent(new Event("change", { bubbles: true })); return true; }
  function setSelect(id, v, missing, name) { const e = byId(id); if (!e) { if (v) missing.push(name || id); return false; } const wanted = String(v || ""); const o = [...e.options].find(x => x.value === wanted || x.dataset?.id === wanted); if (!o && wanted) { missing.push(name || id); return false; } e.value = o ? o.value : ""; e.dispatchEvent(new Event("change", { bubbles: true })); return true; }
  function cssEscape(v) { return global.CSS?.escape ? CSS.escape(String(v)) : String(v).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function uid() { return global.crypto?.randomUUID ? crypto.randomUUID() : `pg-saved-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }

  global.PromptSavedStore = { ready: openDb, list, get, put, remove, migrateLegacy, snapshot, restore, normalizeImage, suggestTitle, modeLabel, shortMode, modeIcon };
})(window);
