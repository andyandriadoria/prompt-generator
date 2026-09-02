(function (global) {
    "use strict";

    const LEGACY_SETTING_ALIASES = {
        "hotel-lobby": "indoor-hotel-lobby-indoor",
        "hotel-room": "indoor-hotel-room-indoor",
        "fitting-room": "indoor-fitting-room-indoor",
        "front-cafe": "outdoor-front-cafe-outdoor",
        "urban-architecture-stairs": "outdoor-urban-architecture-stairs-outdoor-indoor",
        "modern-courtyard": "outdoor-modern-courtyard-garden-outdoor",
        "outdoor-cafe-courtyard": "outdoor-modern-outdoor-cafe-coutyard",
        "city-park": "outdoor-city-park-outdoor",
        "tropical-garden": "outdoor-tropical-garden-walkway-with-modern-architecture-outdoor",
        "front-porch": "outdoor-front-porch-outdoor",
        "upscale-urban-street": "outdoor-upscale-urban-street-outdoor",
        "mall": "indoor-mall-indoor",
        "modern-gallery": "indoor-minimalist-art-gallery-indoor"
    };

    function sentence(text) {
        const clean = String(text || "").trim().replace(/\s+/g, " ");
        if (!clean) return "";
        return /[.!?]$/.test(clean) ? clean : `${clean}.`;
    }

    function paragraph(text) {
        return String(text || "")
            .replace(/\s+([,.!?])/g, "$1")
            .replace(/\.{2,}/g, ".")
            .trim();
    }

    function replaceTokens(text, state) {
        return String(text || "")
            .replace(/\{\{aspect_ratio\}\}/gi, state.aspectRatio || "4:5")
            .replace(/\{\{subject\}\}/gi, state.subject || "the subject")
            .replace(/\{\{catalog_type\}\}/gi, state.catalogType || "a clothing catalog");
    }

    function build(state) {
        const preservation = state.preservation || {};
        const intro = replaceTokens(
            preservation.intro_prompt || preservation.introPrompt ||
            "Without changing the existing outfit in any way, including its exact color, fabric, pattern, texture, cut, proportions, and every original detail, create a photorealistic image in a {{aspect_ratio}} aspect ratio.",
            state
        );

        const subject = String(state.subject || "A person").trim();
        const catalogType = String(state.catalogType || "a clothing catalog").trim();
        const setting = String(state.setting || "").trim();
        const pose = String(state.pose || "Natural pose").trim();
        const shot = String(state.shot || "medium shot").trim();

        let body = `${subject} wearing the exact outfit from the reference image, photographed for ${catalogType}`;
        if (setting) body += ` ${setting}`;
        body = sentence(body);

        const presentation = [pose, state.ageAppropriate ? "age-appropriate presentation" : "", shot]
            .filter(Boolean)
            .map(item => item.replace(/[.]+$/, ""))
            .join(", ");
        if (presentation) body += ` ${sentence(presentation)}`;

        const closingParts = [];
        if (state.closingStyle) closingParts.push(sentence(state.closingStyle));
        const closing = replaceTokens(
            preservation.closing_prompt || preservation.closingPrompt ||
            "No text, no accessories that alter the outfit, and no modification or distortion of the clothing.",
            state
        );
        if (closing) closingParts.push(sentence(closing));
        if (state.extraInstruction) closingParts.push(sentence(state.extraInstruction));

        return [paragraph(sentence(intro)), paragraph(body), paragraph(closingParts.join(" "))]
            .filter(Boolean)
            .join("\n\n");
    }

    function installSharedSettingsSource() {
        if (global.__PROMPT_GEN_SHARED_SETTINGS__) return;
        global.__PROMPT_GEN_SHARED_SETTINGS__ = true;

        const wrapLoader = loader => {
            if (!loader || loader.__sharedSettingsWrapped) return loader;
            const originalLoad = loader.load.bind(loader);
            loader.load = async function (...args) {
                const result = await originalLoad(...args);
                applySharedSettings(result?.data);
                return result;
            };
            loader.__sharedSettingsWrapped = true;
            return loader;
        };

        if (global.PromptDataLoader) {
            global.PromptDataLoader = wrapLoader(global.PromptDataLoader);
            return;
        }

        let pendingLoader;
        Object.defineProperty(global, "PromptDataLoader", {
            configurable: true,
            enumerable: true,
            get() {
                return pendingLoader;
            },
            set(value) {
                pendingLoader = wrapLoader(value);
                Object.defineProperty(global, "PromptDataLoader", {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: pendingLoader
                });
            }
        });
    }

    function applySharedSettings(data) {
        if (!data || data.__sharedSettingsApplied) return data;

        const primary = Array.isArray(data.settings) ? data.settings : [];
        const legacy = Array.isArray(data.catalogSettings) ? data.catalogSettings : [];
        const shared = [...primary];
        const byId = new Map(shared.map(item => [item.id, item]));
        const activeAliases = {};

        legacy.forEach(item => {
            if (!item?.id) return;
            const aliasTarget = LEGACY_SETTING_ALIASES[item.id];
            if (aliasTarget && byId.has(aliasTarget)) {
                activeAliases[item.id] = aliasTarget;
                return;
            }
            if (byId.has(item.id)) return;

            const normalized = {
                ...item,
                type: item.type || inferSettingType(item),
                category: item.category || "Other"
            };
            shared.push(normalized);
            byId.set(normalized.id, normalized);
        });

        data.settings = shared;
        data.catalogSettings = shared;
        data.settingAliases = activeAliases;
        data.__sharedSettingsApplied = true;

        if (data.config?.defaultCatalogSetting && activeAliases[data.config.defaultCatalogSetting]) {
            data.config.defaultCatalogSetting = activeAliases[data.config.defaultCatalogSetting];
        }

        migrateHistorySettingIds(activeAliases);
        return data;
    }

    function inferSettingType(item) {
        const tags = Array.isArray(item?.tags) ? item.tags.join(" ") : String(item?.tags || "");
        const category = String(item?.category || "");
        const text = `${tags} ${category} ${item?.label || ""}`.toLowerCase();
        if (/\boutdoor\b|\bveranda\b|\bporch\b|\bcourtyard\b|\bstreet\b|\bpark\b|\bterrace\b/.test(text)) return "outdoor";
        return "indoor";
    }

    function migrateHistorySettingIds(aliases) {
        if (!aliases || !Object.keys(aliases).length) return;
        try {
            const key = "promptGenHistoryV1";
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const items = JSON.parse(raw);
            if (!Array.isArray(items)) return;

            let changed = false;
            items.forEach(item => {
                const savedId = item?.state?.catalogSetting;
                if (!savedId || !aliases[savedId]) return;
                item.state.catalogSetting = aliases[savedId];
                changed = true;
            });
            if (changed) localStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.warn("Unable to migrate legacy catalog setting IDs:", error);
        }
    }

    global.CatalogPromptBuilder = { build };
    installSharedSettingsSource();

    // Reference Outfit Catalog extension. Kept separate so the base builder stays compact.
    if (!document.querySelector('script[data-outfit-focus-style]')) {
        const extension = document.createElement("script");
        extension.src = "outfit-focus-style.js?v=4.5-outfit-focus-1";
        extension.dataset.outfitFocusStyle = "true";
        document.head.append(extension);
    }

    // Layout controller: keep presentation-level controls before dependent pose/framing fields.
    if (!document.querySelector('script[data-outfit-focus-layout]')) {
        const layout = document.createElement("script");
        layout.src = "outfit-focus-layout.js?v=4.5-outfit-focus-layout-1";
        layout.dataset.outfitFocusLayout = "true";
        document.head.append(layout);
    }

    // Compatibility + field-intelligence layer for Outfit Focus styles.
    if (!document.querySelector('script[data-outfit-focus-compatibility]')) {
        const compatibility = document.createElement("script");
        compatibility.src = "outfit-focus-compatibility.js?v=4.5-outfit-focus-4";
        compatibility.dataset.outfitFocusCompatibility = "true";
        document.head.append(compatibility);
    }

    // Mannequin presentation layer for Reference Outfit Catalog.
    if (!document.querySelector('script[data-mannequin-catalog]')) {
        const mannequin = document.createElement("script");
        mannequin.src = "mannequin-catalog.js?v=4.5-mannequin-3";
        mannequin.dataset.mannequinCatalog = "true";
        document.head.append(mannequin);
    }
})(window);
