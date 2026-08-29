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
        if (database) {
            populate();
            enforceCatalogAudience();
        } else {
            global.setTimeout(() => {
                global.PromptDataLoader.load().then(result => {
                    captureDatabase(result.data);
                    enforceCatalogAudience();
                }).catch(() => {});
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
            return adaptCatalogPrompt(basePrompt, state, focusStyle);
        };
    }

    function captureDatabase(nextDatabase) {
        database = nextDatabase || null;
        if (!document.getElementById(SELECT_ID)) return;
        populate();
        global.setTimeout(enforceCatalogAudience, 20);
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
                <small class="help-text">Choose how the outfit stays visually dominant when the face should not be the focus. This can override conflicting shot framing.</small>
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
            option.dataset.searchText = [item.prompt, item.framing_hint, item.face_visibility, item.outfit_usage, item.tags].filter(Boolean).join(" ");
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

    function selectedCatalogSubject() {
        const select = document.getElementById("catalogSubject");
        if (!select) return null;
        const id = select.selectedOptions?.[0]?.dataset?.id || select.value || "";
        return (database?.catalogSubjects || []).find(item => item.id === id) || null;
    }

    function isChildCatalogSubject() {
        const subjectSelect = document.getElementById("catalogSubject");
        const custom = document.getElementById("catalogCustomSubject")?.value || "";
        if (!subjectSelect) return false;
        if (subjectSelect.value === "custom") {
            return /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(custom);
        }
        const item = selectedCatalogSubject();
        if (String(item?.age_group || item?.ageGroup || "").toLowerCase() === "child") return true;
        const text = [item?.label, item?.prompt].filter(Boolean).join(" ");
        return /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(text);
    }

    function isAdultCatalogSubject() {
        const subjectSelect = document.getElementById("catalogSubject");
        if (!subjectSelect) return false;
        if (subjectSelect.value === "custom") {
            const custom = document.getElementById("catalogCustomSubject")?.value || "";
            return /\b(adult|woman|man|lady|gentleman|mother|father)\b/i.test(custom) && !isChildCatalogSubject();
        }
        const item = selectedCatalogSubject();
        return String(item?.age_group || item?.ageGroup || "").toLowerCase() === "adult";
    }

    function enforceCatalogAudience() {
        if (!database || !isCatalogMode()) return;
        const typeSelect = document.getElementById("catalogType");
        if (!typeSelect) return;
        const selectedId = typeSelect.selectedOptions?.[0]?.dataset?.id || typeSelect.value || "";
        const current = (database.catalogTypes || []).find(item => item.id === selectedId);
        if (!current) return;

        const audience = String(current.audience || "all").toLowerCase();
        let replacement = null;

        if (isAdultCatalogSubject() && audience === "child") {
            replacement = (database.catalogTypes || []).find(item => item.id === "modest-clothing")
                || (database.catalogTypes || []).find(item => String(item.audience || "all").toLowerCase() === "all");
        } else if (isChildCatalogSubject() && audience === "adult") {
            replacement = (database.catalogTypes || []).find(item => String(item.audience || "").toLowerCase() === "child")
                || (database.catalogTypes || []).find(item => String(item.audience || "all").toLowerCase() === "all");
        }

        if (replacement && replacement.id !== selectedId) {
            setSelectById(typeSelect, replacement.id);
            typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
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

    function adaptCatalogPrompt(prompt, state, style) {
        const parts = String(prompt || "").split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
        if (!parts.length) return prompt;

        const presentation = buildPresentationParagraph(state, style);
        if (parts.length >= 2 && presentation) parts[1] = presentation;

        const focusBlock = buildFocusBlock(style);
        if (focusBlock && !parts.includes(focusBlock)) {
            if (parts.length >= 3) parts.splice(parts.length - 1, 0, focusBlock);
            else parts.push(focusBlock);
        }
        return parts.join("\n\n");
    }

    function buildPresentationParagraph(state, style) {
        const usage = String(style.outfit_usage || inferUsage(style.id)).toLowerCase();
        const subject = clean(state.subject) || "A person";
        const catalogType = clean(state.catalogType) || "a clothing catalog";
        const setting = clean(state.setting);
        const pose = stripTerminal(state.pose);
        const shot = stripTerminal(state.shot);
        const scene = setting ? `${catalogType} ${setting}` : catalogType;

        if (usage === "hanger-held") {
            return sentence(`The exact outfit from the reference image is displayed naturally on a refined hanger and held by one hand, photographed for ${scene}. Show the entire garment clearly with no person wearing it`);
        }

        if (usage === "held-front") {
            return sentence(`${subject} positioned behind the exact outfit from the reference image, photographed for ${scene}. The garment is held directly in front of the face and is not being worn`);
        }

        let body = `${subject} wearing the exact outfit from the reference image, photographed for ${scene}`;
        const useShot = style.id === "modest-full-outfit-no-face";
        const presentation = [pose, useShot ? shot : ""].filter(Boolean).join(", ");
        body = sentence(body);
        if (presentation) body += ` ${sentence(presentation)}`;
        return body;
    }

    function inferUsage(id) {
        if (id === "held-hanger-clean-lifestyle") return "hanger-held";
        if (id === "hidden-face-holding-outfit") return "held-front";
        return "worn";
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
                global.setTimeout(() => {
                    populate();
                    enforceCatalogAudience();
                }, 30);
            }
            if (event.target?.id === "catalogCustomSubject") {
                global.setTimeout(() => {
                    populate();
                    enforceCatalogAudience();
                }, 30);
            }
            if (event.target?.id === "catalogType") {
                global.setTimeout(enforceCatalogAudience, 20);
            }
            if (event.target?.id === SELECT_ID) {
                decorateInspectSoon();
            }
        });

        document.addEventListener("input", event => {
            if (event.target?.id === "catalogCustomSubject") {
                global.setTimeout(() => {
                    populate();
                    enforceCatalogAudience();
                }, 40);
            }
        });

        document.addEventListener("click", event => {
            if (event.target.closest("#randomPromptBtn") && isCatalogMode()) {
                global.setTimeout(() => {
                    enforceCatalogAudience();
                    randomizeFocusStyle();
                }, 50);
            }
            if (event.target.closest("#resetFormBtn")) {
                global.setTimeout(() => {
                    applyConfiguredDefault();
                    enforceCatalogAudience();
                }, 50);
            }
            if (event.target.closest("#generatePromptBtn") && isCatalogMode()) {
                global.setTimeout(() => patchLatestHistory(0), 80);
            }
            if (event.target.closest("#historyRestoreBtn")) {
                const id = document.querySelector(".history-item.is-active")?.dataset?.historyId || "";
                if (id) global.setTimeout(() => restoreFocusFromHistory(id), 100);
            }
            if (event.target.closest('[data-prompt-mode-id="outfit_catalog"]')) {
                global.setTimeout(enforceCatalogAudience, 40);
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

    function stripTerminal(value) {
        return clean(value).replace(/[.!?]+$/, "");
    }

    function clean(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function sentence(value) {
        const text = clean(value);
        if (!text) return "";
        const normalized = text.charAt(0).toUpperCase() + text.slice(1);
        return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    global.OutfitFocusStyle = {
        refresh: populate,
        getSelected: selectedFocusStyle,
        enforceAudience: enforceCatalogAudience
    };
})(window);
