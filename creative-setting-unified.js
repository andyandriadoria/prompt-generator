(function (global) {
    "use strict";

    const CACHE_KEY = "promptGenApiCache";
    let database = null;
    let loaderWrapped = false;
    let searchablePatched = false;
    let initialized = false;

    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        if (global.PromptDataLoader && global.SearchableSelectControl) {
            patchSearchableRefresh();
            wrapLoader();
            bootstrap();
            hydrateFromCache();
            return;
        }
        if (attempt > 120) return;
        global.setTimeout(() => waitForDependencies(attempt + 1), 60);
    }

    function patchSearchableRefresh() {
        if (searchablePatched) return;
        const prototype = global.SearchableSelectControl?.prototype;
        const originalRefresh = prototype?.refresh;
        if (!prototype || typeof originalRefresh !== "function") return;

        if (originalRefresh.__promptGenUnifiedSetting) {
            searchablePatched = true;
            return;
        }

        function unifiedRefresh(...args) {
            if (this?.select?.id === "setting") ensureUnifiedSettingOptions(this.select);
            return originalRefresh.apply(this, args);
        }

        unifiedRefresh.__promptGenUnifiedSetting = true;
        prototype.refresh = unifiedRefresh;
        searchablePatched = true;
    }

    function wrapLoader() {
        if (loaderWrapped || !global.PromptDataLoader) return;
        loaderWrapped = true;
        const originalLoad = global.PromptDataLoader.load.bind(global.PromptDataLoader);

        global.PromptDataLoader.load = async function (...args) {
            const result = await originalLoad(...args);
            database = result?.data || null;
            global.setTimeout(activateUnifiedSetting, 0);
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
        hideLegacySettingType();
        activateUnifiedSetting();

        global.addEventListener("promptgen:modechange", () => global.setTimeout(activateUnifiedSetting, 30));
        global.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "build") global.setTimeout(activateUnifiedSetting, 30);
        });

        global.setTimeout(activateUnifiedSetting, 160);
        global.setTimeout(activateUnifiedSetting, 520);
    }

    function hydrateFromCache(attempt = 0) {
        if (database?.settings?.length) return;
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            const cached = raw ? JSON.parse(raw) : null;
            const candidate = Array.isArray(cached?.settings) ? cached : cached?.data;
            if (candidate && Array.isArray(candidate.settings)) {
                database = candidate;
                activateUnifiedSetting();
                return;
            }
        } catch (_) {}

        if (attempt < 60) global.setTimeout(() => hydrateFromCache(attempt + 1), 120);
    }

    function hideLegacySettingType() {
        const input = document.querySelector('input[name="settingType"]');
        const row = input?.closest(".field-row");
        if (!row) return;
        row.hidden = true;
        row.dataset.legacySettingType = "true";
        row.setAttribute("aria-hidden", "true");
    }

    function activateUnifiedSetting() {
        hideLegacySettingType();
        patchSearchableRefresh();

        const select = document.getElementById("setting");
        if (!select || !Array.isArray(database?.settings)) return;

        const changed = ensureUnifiedSettingOptions(select);
        const hasSearchableUi = select.classList.contains("searchable-native-select");
        if (!changed || !hasSearchableUi) return;

        const legacyInput = document.querySelector('input[name="settingType"]:checked')
            || document.querySelector('input[name="settingType"]');
        legacyInput?.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function ensureUnifiedSettingOptions(select) {
        if (!select || !Array.isArray(database?.settings)) return false;

        const settings = database.settings.filter(isActiveSetting);
        if (isAlreadyUnified(select, settings)) return false;

        const previousId = select.selectedOptions?.[0]?.dataset?.id || "";
        select.innerHTML = "";

        const placeholder = new Option("-- Select Setting --", "");
        placeholder.dataset.placeholder = "true";
        select.append(placeholder);

        const groups = new Map();
        settings.forEach(item => {
            const category = String(item.category || "Other").trim() || "Other";
            if (!groups.has(category)) groups.set(category, []);
            groups.get(category).push(item);
        });

        groups.forEach((items, category) => {
            const optgroup = document.createElement("optgroup");
            optgroup.label = category;
            items.forEach(item => optgroup.append(createOption(item)));
            select.append(optgroup);
        });

        if (previousId && settings.some(item => item.id === previousId)) {
            const previousOption = [...select.options].find(option => option.dataset.id === previousId);
            if (previousOption) select.value = previousOption.value;
        }

        select.dataset.unifiedSetting = "true";
        return true;
    }

    function createOption(item) {
        const option = new Option(item.label || item.id || "Setting", item.id || "");
        option.dataset.id = item.id || "";
        option.dataset.category = item.category || "";
        option.dataset.tags = normalizeTags(item.tags).join(",");
        option.dataset.searchText = [
            item.prompt,
            item.features,
            item.description,
            item.type,
            item.audience
        ].filter(Boolean).join(" ");
        return option;
    }

    function isAlreadyUnified(select, settings) {
        const currentIds = [...select.options]
            .map(option => option.dataset.id || "")
            .filter(Boolean);
        if (currentIds.length !== settings.length) return false;
        return settings.every((item, index) => currentIds[index] === item.id);
    }

    function isActiveSetting(item) {
        const active = item?.active;
        if (active === undefined || active === null || active === "") return true;
        if (typeof active === "boolean") return active;
        return !["false", "0", "no", "off", "inactive"].includes(String(active).trim().toLowerCase());
    }

    function normalizeTags(value) {
        if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean);
        return String(value || "").split(",").map(tag => tag.trim()).filter(Boolean);
    }

    global.CreativeSettingUnified = {
        refresh: activateUnifiedSetting
    };
})(window);
