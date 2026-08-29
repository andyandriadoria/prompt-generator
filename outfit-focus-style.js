(function (global) {
    "use strict";

    const HISTORY_KEY = "promptGenHistoryV1";
    const SELECT_ID = "outfitFocusStyle";
    const ROW_ID = "outfitFocusStyleRow";

    let database = null;
    let searchableControl = null;
    let loaderWrapped = false;
    let builderWrapped = false;
    let initialized = false;

    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        const ready = global.PromptDataLoader && global.CatalogPromptBuilder && global.SearchableSelectControl;
        if (ready) {
            wrapLoader();
            wrapCatalogBuilder();
            return bootstrap();
        }
        if (attempt > 100) {
            console.warn("Outfit Focus Style dependencies did not become available.");
            return;
        }
        global.setTimeout(() => waitForDependencies(attempt + 1), 80);
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
        injectField();
        bindEvents();
        if (database) populate();
        else {
            global.setTimeout(() => {
                global.PromptDataLoader.load().then(result => captureDatabase(result.data)).catch(() => {});
            }, 250);
        }
    }

    function wrapLoader() {
        if (loaderWrapped) return;
        loaderWrapped = true;
        const originalLoad = global.PromptDataLoader.load.bind(global.PromptDataLoader);
        global.PromptDataLoader.load = async function (...args) {
            const result = await originalLoad(...args);
            captureDatabase(result.data);
            return result;
        };
    }

    function wrapCatalogBuilder() {
        if (builderWrapped) return;
        builderWrapped = true;
        const originalBuild = global.CatalogPromptBuilder.build.bind(global.CatalogPromptBuilder);
        global.CatalogPromptBuilder.build = function (state = {}) {
            const basePrompt = originalBuild(state);
            const focusStyle = selectedFocusStyle();
            if (!focusStyle) return basePrompt;
            return injectFocusBlock(basePrompt, focusStyle);
        };
    }

    function captureDatabase(nextDatabase) {
        database = nextDatabase || null;
        if (!document.getElementById(SELECT_ID)) return;
        populate();
    }

    function injectField() {
        if (document.getElementById(ROW_ID)) return;
        const shot = document.getElementById("catalogShot");
        if (!shot) return;

        const row = document.createElement("div");
        row.className = "field-row outfit-focus-style-row";
        row.id = ROW_ID;
        row.hidden = true;
        row.innerHTML = `
            <label for="${SELECT_ID}">Outfit Focus Style</label>
            <div>
                <select id="${SELECT_ID}"><option value="">-- Select Outfit Focus Style --</option></select>
                <small class="help-text">Choose how the outfit stays visually dominant when the face should not be the focus.</small>
            </div>`;

        const shotRow = shot.closest(".field-row");
        shotRow?.insertAdjacentElement("afterend", row);
    }

    function populate() {
        const select = document.getElementById(SELECT_ID);
        const row = document.getElementById(ROW_ID);
        if (!select || !row) return;

        const styles = availableStyles();
        if (!styles.length) {
            row.hidden = true;
            destroySearchable();
            return;
        }

        const previous = select.selectedOptions?.[0]?.dataset?.id || select.value || "";
        select.innerHTML = "";
        const placeholder = new Option("-- Select Outfit Focus Style --", "");
        placeholder.dataset.placeholder = "true";
        select.append(placeholder);

        styles.forEach(item => {
            const option = new Option(item.label || item.id, item.id);
            option.dataset.id = item.id || "";
            option.dataset.searchText = [item.prompt, item.framing_hint, item.face_visibility, item.tags].filter(Boolean).join(" ");
            select.append(option);
        });

        const configured = database?.config?.defaultOutfitFocusStyle || "headless-outfit-crop";
        const target = styles.some(item => item.id === previous)
            ? previous
            : styles.some(item => item.id === configured) ? configured : styles[0]?.id || "";
        setSelectById(select, target);
        row.hidden = false;
        initOrRefreshSearchable();
        decorateInspectSoon();
    }

    function availableStyles() {
        const styles = Array.isArray(database?.outfitFocusStyles) ? database.outfitFocusStyles : [];
        const child = isChildCatalogSubject();
        return styles.filter(item => !child || asBoolean(item.child_safe, true));
    }

    function isChildCatalogSubject() {
        const subjectSelect = document.getElementById("catalogSubject");
        const custom = document.getElementById("catalogCustomSubject")?.value || "";
        if (!subjectSelect) return false;
        if (subjectSelect.value === "custom") {
            return /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(custom);
        }
        const id = subjectSelect.selectedOptions?.[0]?.dataset?.id || subjectSelect.value;
        const item = (database?.catalogSubjects || []).find(row => row.id === id);
        const text = [item?.label, item?.prompt, item?.age_group, item?.ageGroup].filter(Boolean).join(" ");
        return /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(text);
    }

    function initOrRefreshSearchable() {
        const select = document.getElementById(SELECT_ID);
        if (!select) return;
        if (searchableControl) searchableControl.refresh();
        else searchableControl = new global.SearchableSelectControl(select);
    }

    function destroySearchable() {
        searchableControl?.destroy?.();
        searchableControl = null;
    }

    function selectedFocusStyle() {
        const select = document.getElementById(SELECT_ID);
        const id = select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
        return id ? (database?.outfitFocusStyles || []).find(item => item.id === id) || null : null;
    }

    function injectFocusBlock(prompt, style) {
        const block = buildFocusBlock(style);
        if (!block || String(prompt).includes(block)) return prompt;

        const parts = String(prompt || "").split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
        if (parts.length >= 3) parts.splice(parts.length - 1, 0, block);
        else parts.push(block);
        return parts.join("\n\n");
    }

    function buildFocusBlock(style) {
        const base = sentence(style.prompt || "");
        if (!base) return "";
        const visibility = visibilityDirective(style.face_visibility);
        const priority = "Keep the outfit, its silhouette, construction, fabric, pattern, and styling as the clear visual priority. Avoid beauty-portrait emphasis and do not make the face the focal point.";
        return [base, visibility, priority].filter(Boolean).join(" ");
    }

    function visibilityDirective(value) {
        const key = String(value || "").trim().toLowerCase();
        if (key === "hidden") return "The face must remain fully hidden in the final image.";
        if (key === "cropped") return "The full face must remain cropped out of the final frame.";
        if (key === "hidden-or-cropped") return "The face must remain cropped out, turned away, obscured, or otherwise not visible in the final image.";
        if (key === "none") return "Do not show a full face in the final image.";
        return "";
    }

    function bindEvents() {
        document.addEventListener("change", event => {
            if (event.target?.id === "catalogSubject") {
                global.setTimeout(populate, 20);
            }
            if (event.target?.id === SELECT_ID) {
                decorateInspectSoon();
            }
        });

        document.addEventListener("input", event => {
            if (event.target?.id === "catalogCustomSubject") {
                global.setTimeout(populate, 20);
            }
        });

        document.addEventListener("click", event => {
            if (event.target.closest("#randomPromptBtn") && isCatalogMode()) {
                global.setTimeout(randomizeFocusStyle, 30);
            }
            if (event.target.closest("#resetFormBtn")) {
                global.setTimeout(applyConfiguredDefault, 40);
            }
            if (event.target.closest("#generatePromptBtn") && isCatalogMode()) {
                global.setTimeout(() => patchLatestHistory(0), 80);
            }
            if (event.target.closest("#historyRestoreBtn")) {
                const id = document.querySelector(".history-item.is-active")?.dataset?.historyId || "";
                if (id) global.setTimeout(() => restoreFocusFromHistory(id), 100);
            }
        }, true);

        global.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "inspect") decorateInspectSoon();
        });
    }

    function randomizeFocusStyle() {
        const select = document.getElementById(SELECT_ID);
        const options = [...(select?.options || [])].filter(option => option.value);
        if (!options.length) return;
        const option = options[Math.floor(Math.random() * options.length)];
        select.value = option.value;
        searchableControl?.syncFromNative?.();
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function applyConfiguredDefault() {
        const select = document.getElementById(SELECT_ID);
        if (!select || !database) return;
        const configured = database.config?.defaultOutfitFocusStyle || "headless-outfit-crop";
        setSelectById(select, configured);
        searchableControl?.syncFromNative?.();
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function patchLatestHistory(attempt) {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            const items = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(items) || !items.length) {
                if (attempt < 3) global.setTimeout(() => patchLatestHistory(attempt + 1), 80);
                return;
            }
            const latest = items[0];
            if (latest?.mode !== "outfit_catalog" || Date.now() - Number(latest.timestamp || 0) > 10000) {
                if (attempt < 3) global.setTimeout(() => patchLatestHistory(attempt + 1), 80);
                return;
            }
            latest.state = latest.state || {};
            latest.state.outfitFocusStyle = document.getElementById(SELECT_ID)?.value || "";
            localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
            global.PromptHistory?.refresh?.();
        } catch (_) {}
    }

    function restoreFocusFromHistory(id) {
        try {
            const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
            const item = Array.isArray(items) ? items.find(entry => entry.id === id) : null;
            const saved = item?.state?.outfitFocusStyle;
            if (!saved) return;
            const select = document.getElementById(SELECT_ID);
            if (!select) return;
            setSelectById(select, saved);
            searchableControl?.syncFromNative?.();
            select.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (_) {}
    }

    function decorateInspectSoon() {
        global.PromptInspector?.refresh?.();
        global.setTimeout(decorateInspect, 60);
    }

    function decorateInspect() {
        if (!isCatalogMode()) return;
        const grid = document.getElementById("expandedDnaGrid");
        const summary = document.getElementById("dnaSummary");
        if (!grid || !summary) return;

        grid.querySelector("[data-outfit-focus-dna]")?.remove();
        const selected = selectedFocusStyle();
        const state = selected ? "ready" : "optional";
        const card = document.createElement("article");
        card.className = "dna-inspector-card";
        card.dataset.state = state;
        card.dataset.outfitFocusDna = "true";
        card.innerHTML = `<div class="dna-inspector-card-head"><span class="dna-inspector-icon">${global.PromptIcons?.svg?.("film") || ""}</span><span class="dna-state-label">${selected ? "Ready" : "Optional"}</span></div><strong>Outfit Focus</strong><p>${escapeHtml(selected?.label || "Optional — standard catalog framing")}</p>`;
        grid.append(card);

        const baseCards = [...grid.querySelectorAll(".dna-inspector-card:not([data-outfit-focus-dna])")];
        const ready = baseCards.filter(node => node.dataset.state === "ready").length + (selected ? 1 : 0);
        const required = baseCards.filter(node => node.dataset.state !== "optional").length + (selected ? 1 : 0);
        summary.textContent = `${ready} / ${required} ready`;
    }

    function isCatalogMode() {
        return document.getElementById("activeModeBadge")?.dataset?.mode === "outfit_catalog";
    }

    function setSelectById(select, id) {
        if (!select || !id) return;
        const option = [...select.options].find(item => item.dataset.id === id || item.value === id);
        if (option) select.value = option.value;
    }

    function asBoolean(value, fallback = false) {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value;
        return !["false", "0", "no", "off", "inactive"].includes(String(value).trim().toLowerCase());
    }

    function sentence(value) {
        const text = String(value || "").replace(/\s+/g, " ").trim();
        if (!text) return "";
        const normalized = text.charAt(0).toUpperCase() + text.slice(1);
        return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    global.OutfitFocusStyle = {
        refresh: populate,
        getSelected: selectedFocusStyle
    };
})(window);
