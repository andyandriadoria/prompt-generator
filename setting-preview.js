(function (global) {
    "use strict";

    const CACHE_KEY = "promptGenApiCache";
    const MAX_META_PILLS = 4;
    let database = null;
    let loaderWrapped = false;
    let initialized = false;

    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        if (global.PromptDataLoader) {
            wrapLoader();
            return bootstrap();
        }
        if (attempt > 100) return;
        global.setTimeout(() => waitForDependencies(attempt + 1), 60);
    }

    function wrapLoader() {
        if (loaderWrapped || !global.PromptDataLoader) return;
        loaderWrapped = true;
        const originalLoad = global.PromptDataLoader.load.bind(global.PromptDataLoader);
        global.PromptDataLoader.load = async function (...args) {
            const result = await originalLoad(...args);
            database = result?.data || null;
            global.setTimeout(refreshAll, 0);
            return result;
        };
    }

    function bootstrap() {
        if (initialized) return;
        initialized = true;
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", init, { once: true });
        } else {
            init();
        }
    }

    function init() {
        injectPreview("setting", "creativeSettingPreview");
        injectPreview("catalogSetting", "catalogSettingPreview");

        document.addEventListener("change", event => {
            if (event.target?.id === "setting") refreshPreview("setting", "creativeSettingPreview");
            if (event.target?.id === "catalogSetting") refreshPreview("catalogSetting", "catalogSettingPreview");
            if (event.target?.name === "settingType") global.setTimeout(() => refreshPreview("setting", "creativeSettingPreview"), 40);
        });

        global.addEventListener("promptgen:modechange", () => global.setTimeout(refreshAll, 30));
        global.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "build") global.setTimeout(refreshAll, 30);
        });

        refreshAll();
        hydrateFromCache();
    }

    function hydrateFromCache(attempt = 0) {
        if (database) return;
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            const cached = raw ? JSON.parse(raw) : null;
            if (cached && Array.isArray(cached.settings)) {
                database = cached;
                refreshAll();
                return;
            }
        } catch (_) {}
        if (attempt < 50) global.setTimeout(() => hydrateFromCache(attempt + 1), 120);
    }

    function injectPreview(selectId, previewId) {
        if (document.getElementById(previewId)) return;
        const select = document.getElementById(selectId);
        const row = select?.closest(".field-row");
        if (!row) return;

        const card = document.createElement("section");
        card.id = previewId;
        card.className = "setting-preview-card";
        card.hidden = true;
        card.setAttribute("aria-live", "polite");
        card.innerHTML = `
            <div class="setting-preview-media">
                <img alt="" loading="lazy" decoding="async">
            </div>
            <div class="setting-preview-copy">
                <div class="setting-preview-kicker">${icon("compass")}<span>Setting Preview</span></div>
                <strong class="setting-preview-title"></strong>
                <p class="setting-preview-note">Representative reference look — final generation can vary with subject, framing, lighting, and style.</p>
                <div class="setting-preview-meta"></div>
            </div>`;
        row.insertAdjacentElement("afterend", card);
    }

    function refreshAll() {
        refreshPreview("setting", "creativeSettingPreview");
        refreshPreview("catalogSetting", "catalogSettingPreview");
    }

    function refreshPreview(selectId, previewId) {
        const select = document.getElementById(selectId);
        const card = document.getElementById(previewId);
        if (!select || !card || !database) return hide(card);

        const option = select.selectedOptions?.[0];
        const id = option?.dataset?.id || option?.value || "";
        if (!id || option?.dataset?.placeholder === "true" || id === "manual-setting" || id === "manual_setting") return hide(card);

        const item = findSetting(id, option?.textContent || "");
        const previewUrl = String(item?.preview_url || item?.previewUrl || "").trim();
        if (!item || !previewUrl) return hide(card);

        const image = card.querySelector("img");
        const title = card.querySelector(".setting-preview-title");
        const meta = card.querySelector(".setting-preview-meta");
        if (!image || !title || !meta) return hide(card);

        image.onload = () => { card.hidden = false; card.dataset.loaded = "true"; };
        image.onerror = () => hide(card);
        image.alt = `${item.label || option.textContent || "Setting"} representative preview`;
        image.src = normalizePreviewUrl(previewUrl);
        title.textContent = item.label || option.textContent || "Setting preview";
        meta.innerHTML = buildMeta(item);
        card.hidden = false;
        card.dataset.loaded = "false";
    }

    function findSetting(id, label) {
        const collections = [database.settings, database.catalogSettings].filter(Array.isArray);
        for (const collection of collections) {
            const byId = collection.find(item => item?.id === id);
            if (byId) return byId;
        }
        const normalizedLabel = String(label || "").trim().toLowerCase();
        if (!normalizedLabel) return null;
        for (const collection of collections) {
            const byLabel = collection.find(item => String(item?.label || "").trim().toLowerCase() === normalizedLabel);
            if (byLabel) return byLabel;
        }
        return null;
    }

    function buildMeta(item) {
        const category = String(item.category || "").trim();
        const labelTokens = meaningfulTokens(item.label);
        const candidates = normalizeTags(item.tags)
            .filter(tag => !["setting", "indoor", "outdoor"].includes(tag.toLowerCase()))
            .filter(tag => normalizeText(tag) !== normalizeText(category))
            .filter(tag => !isCoveredByLabel(tag, labelTokens));

        const selectedTags = [];
        candidates.forEach(tag => {
            if (selectedTags.length >= MAX_META_PILLS - (category ? 1 : 0)) return;
            const tagTokens = meaningfulTokens(tag);
            if (!tagTokens.length) return;
            const duplicatesExistingConcept = selectedTags.some(existing => sharesConcept(tagTokens, meaningfulTokens(existing)));
            if (!duplicatesExistingConcept) selectedTags.push(tag);
        });

        const pills = [category, ...selectedTags].filter(Boolean).slice(0, MAX_META_PILLS);
        return pills.map(value => `<span>${escapeHtml(value)}</span>`).join("");
    }

    function normalizeTags(value) {
        if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean);
        return String(value || "").split(",").map(tag => tag.trim()).filter(Boolean);
    }

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .replace(/\s+/g, " ");
    }

    function meaningfulTokens(value) {
        const ignored = new Set(["the", "a", "an", "and", "with", "of", "in", "at", "for"]);
        return normalizeText(value).split(" ").filter(token => token && !ignored.has(token));
    }

    function isCoveredByLabel(tag, labelTokens) {
        const tagTokens = meaningfulTokens(tag);
        return Boolean(tagTokens.length && tagTokens.every(token => labelTokens.includes(token)));
    }

    function sharesConcept(leftTokens, rightTokens) {
        if (!leftTokens.length || !rightTokens.length) return false;
        return leftTokens.some(token => rightTokens.includes(token));
    }

    function normalizePreviewUrl(url) {
        const text = String(url || "").trim();
        const match = text.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
        if (match) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(match[1])}&sz=w1200`;
        return text;
    }

    function hide(card) {
        if (!card) return;
        card.hidden = true;
        card.dataset.loaded = "false";
        const image = card.querySelector("img");
        if (image) {
            image.onload = null;
            image.onerror = null;
            image.removeAttribute("src");
        }
    }

    function icon(name) {
        return global.PromptIcons?.svg ? global.PromptIcons.svg(name, "ui-icon") : "";
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    global.SettingPreview = { refresh: refreshAll };
})(window);
