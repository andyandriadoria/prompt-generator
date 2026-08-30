(function (global) {
    "use strict";

    const MODE_ID = "reference_product_poster";
    let defaultTemplate = "";
    let initialized = false;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        queueMicrotask(init);
    }

    async function init() {
        if (initialized) return;
        initialized = true;
        bindEvents();
        await refreshTemplate(false);
        waitForField();
    }

    function bindEvents() {
        global.addEventListener("promptgen:modechange", event => {
            if (event.detail?.mode !== MODE_ID) return;
            global.setTimeout(() => applyTemplate({ generate: true }), 30);
        });

        document.addEventListener("click", event => {
            if (event.target.closest?.("#resetFormBtn") && isPosterActive()) {
                global.setTimeout(() => applyTemplate({ generate: true, force: true }), 40);
            }

            if (event.target.closest?.("#refreshDataBtn")) {
                global.setTimeout(() => refreshTemplate(false), 1200);
            }
        }, true);
    }

    async function refreshTemplate(forceRefresh = false) {
        if (!global.PromptDataLoader?.load) return;
        try {
            const result = await global.PromptDataLoader.load(forceRefresh ? { forceRefresh: true } : {});
            defaultTemplate = String(result?.data?.config?.defaultProductPosterInformationTemplate || "").trim();
            applyTemplate({ generate: isPosterActive() });
        } catch (error) {
            console.warn("Product Poster default information template could not be loaded:", error);
        }
    }

    function waitForField(attempt = 0) {
        if (document.getElementById("posterProductInformation")) {
            applyTemplate({ generate: isPosterActive() });
            return;
        }
        if (attempt > 100) return;
        global.setTimeout(() => waitForField(attempt + 1), 100);
    }

    function applyTemplate(options = {}) {
        const textarea = document.getElementById("posterProductInformation");
        if (!textarea || !defaultTemplate) return false;
        if (!options.force && textarea.value.trim()) return false;

        textarea.value = defaultTemplate;
        textarea.classList.add("is-filled");

        if (options.generate && isPosterActive()) {
            global.ProductPosterMode?.generate?.();
        }
        return true;
    }

    function isPosterActive() {
        return Boolean(global.ProductPosterMode?.isActive?.()) || document.getElementById("activeModeBadge")?.dataset?.mode === MODE_ID;
    }

    global.ProductPosterDefaults = {
        refresh: () => refreshTemplate(true),
        apply: () => applyTemplate({ generate: true }),
        getTemplate: () => defaultTemplate
    };
})(window);