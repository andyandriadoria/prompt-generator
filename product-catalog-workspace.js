(function (global) {
    "use strict";

    const MODE_ID = "reference_product_catalog";
    const PRODUCT_HISTORY_KEY = "promptGenProductHistoryV1";
    const MAIN_HISTORY_KEY = "promptGenHistoryV1";
    const MAX_PRODUCT_HISTORY = 50;

    let productHistory = [];
    let selectedProductHistoryId = "";
    let historyObserver = null;
    let historyRenderTimer = 0;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        queueMicrotask(init);
    }

    function init() {
        bindProductSignals();
        scheduleBuildDnaLabels();
        waitForWorkspace();
    }

    function bindProductSignals() {
        global.addEventListener("promptgen:modechange", scheduleBuildDnaLabels);
        global.addEventListener("promptgen:productgenerated", event => saveProductHistory(event.detail || {}));
    }

    function waitForWorkspace(attempt = 0) {
        const ready = global.PromptWorkspaceTabs && document.getElementById("workspace-history");
        if (ready) return initWorkspaceBridge();
        if (attempt > 100) return;
        global.setTimeout(() => waitForWorkspace(attempt + 1), 100);
    }

    function initWorkspaceBridge() {
        loadProductHistory();
        enhanceHistoryFilter();
        bindHistoryEvents();
        observeHistory();

        global.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "history") global.setTimeout(renderProductHistory, 80);
        });

        renderProductHistory();
    }

    function scheduleBuildDnaLabels() {
        global.setTimeout(updateBuildDnaLabels, 30);
    }

    function updateBuildDnaLabels() {
        const active = isProductActive();
        const labels = active
            ? ["Product", "Presentation", "Preservation", "Framing", "Scene"]
            : ["Subject", "Scene", "Style", "Framing", "Light"];
        ["dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"].forEach((id, index) => {
            const label = document.querySelector(`#${id} b`);
            if (label) label.textContent = labels[index];
        });
    }

    function enhanceHistoryFilter() {
        const filter = byId("historyModeFilter");
        if (!filter || [...filter.options].some(option => option.value === MODE_ID)) return;
        filter.append(new Option("Product Catalog", MODE_ID));
        filter.addEventListener("change", () => global.setTimeout(renderProductHistory, 20));
        byId("historySearch")?.addEventListener("input", () => global.setTimeout(renderProductHistory, 20));
    }

    function bindHistoryEvents() {
        document.addEventListener("click", event => {
            const item = event.target.closest?.("[data-product-history-id]");
            if (item) {
                event.preventDefault();
                event.stopImmediatePropagation();
                selectProductHistory(item.dataset.productHistoryId);
                return;
            }

            if (event.target.closest?.("#historyRestoreBtn") && selectedProductHistoryId) {
                event.preventDefault();
                event.stopImmediatePropagation();
                restoreSelectedProductHistory();
                return;
            }

            if (event.target.closest?.("#historyCopyBtn") && selectedProductHistoryId) {
                event.preventDefault();
                event.stopImmediatePropagation();
                copySelectedProductHistory();
                return;
            }

            if (event.target.closest?.("#historyDeleteBtn") && selectedProductHistoryId) {
                event.preventDefault();
                event.stopImmediatePropagation();
                deleteSelectedProductHistory();
                return;
            }

            if (event.target.closest?.("#historyClearBtn") && productHistory.length) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (!global.confirm("Clear all locally saved Prompt Gen history on this browser?")) return;
                try {
                    localStorage.removeItem(MAIN_HISTORY_KEY);
                    localStorage.removeItem(PRODUCT_HISTORY_KEY);
                } catch (_) {}
                productHistory = [];
                selectedProductHistoryId = "";
                global.PromptHistory?.refresh?.();
                global.setTimeout(renderProductHistory, 30);
                return;
            }

            if (event.target.closest?.(".history-item:not([data-product-history-id])")) {
                selectedProductHistoryId = "";
            }
        }, true);
    }

    function observeHistory() {
        const list = byId("historyList");
        if (!list || historyObserver) return;
        historyObserver = new MutationObserver(mutations => {
            const externalChange = mutations.some(mutation => {
                const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
                return nodes.some(node => node.nodeType === 1 && !node.matches?.("[data-product-history-group]"));
            });
            if (externalChange && global.PromptWorkspaceTabs?.getActive?.() === "history") scheduleProductHistoryRender();
        });
        historyObserver.observe(list, { childList: true, subtree: false });
    }

    function scheduleProductHistoryRender() {
        clearTimeout(historyRenderTimer);
        historyRenderTimer = setTimeout(renderProductHistory, 25);
    }

    function saveProductHistory(detail) {
        const prompt = String(detail.prompt || "").trim();
        if (!prompt) return;
        loadProductHistory();
        const state = detail.state || global.ProductCatalogMode?.getState?.() || {};
        const item = {
            id: createId(),
            timestamp: Date.now(),
            mode: MODE_ID,
            modeLabel: "Reference Product Catalog",
            styleLabel: [selected("productType"), selected("productPresentation")].filter(Boolean).join(" · ") || "Product Catalog",
            prompt,
            state
        };
        item.fingerprint = JSON.stringify({ mode: item.mode, prompt: item.prompt, state: item.state });

        if (productHistory[0]?.fingerprint === item.fingerprint) {
            item.id = productHistory[0].id;
            productHistory[0] = item;
        } else {
            productHistory.unshift(item);
            productHistory = productHistory.slice(0, MAX_PRODUCT_HISTORY);
        }

        selectedProductHistoryId = item.id;
        writeProductHistory();
        updateCombinedHistoryCount();
        if (global.PromptWorkspaceTabs?.getActive?.() === "history") renderProductHistory();
    }

    function loadProductHistory() {
        try {
            const raw = localStorage.getItem(PRODUCT_HISTORY_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            productHistory = Array.isArray(parsed) ? parsed.filter(validProductHistoryItem).slice(0, MAX_PRODUCT_HISTORY) : [];
        } catch (_) {
            productHistory = [];
        }
    }

    function writeProductHistory() {
        try {
            localStorage.setItem(PRODUCT_HISTORY_KEY, JSON.stringify(productHistory.slice(0, MAX_PRODUCT_HISTORY)));
        } catch (_) {}
    }

    function renderProductHistory() {
        const list = byId("historyList");
        const filter = byId("historyModeFilter");
        if (!list || !filter) return;

        loadProductHistory();
        list.querySelector("[data-product-history-group]")?.remove();

        const query = value("historySearch").trim().toLowerCase();
        const filterValue = filter.value || "all";
        const showProduct = filterValue === "all" || filterValue === MODE_ID;
        const filtered = productHistory.filter(item => !query || [item.prompt, item.modeLabel, item.styleLabel].join(" ").toLowerCase().includes(query));
        const baseVisibleItems = [...list.querySelectorAll(".history-item:not([data-product-history-id])")].filter(item => !item.closest("[hidden]") && !item.hidden).length;
        const noResults = list.querySelector(".history-no-results");

        if (filterValue === MODE_ID) {
            [...list.children].forEach(child => {
                if (!child.matches("[data-product-history-group]")) child.hidden = true;
            });
            if (noResults) noResults.hidden = true;
        } else {
            [...list.children].forEach(child => { child.hidden = false; });
        }

        if (showProduct && filtered.length) {
            const section = document.createElement("section");
            section.className = "history-day-group product-history-group";
            section.dataset.productHistoryGroup = "true";
            section.innerHTML = `<div class="history-day-label"><span>Product Catalog</span><small>${filtered.length}</small></div><div class="history-day-items"></div>`;
            const entries = section.querySelector(".history-day-items");

            filtered.forEach(item => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "history-item product-history-item";
                button.dataset.productHistoryId = item.id;
                button.classList.toggle("is-active", item.id === selectedProductHistoryId);
                button.setAttribute("aria-pressed", item.id === selectedProductHistoryId ? "true" : "false");
                button.innerHTML = `<span class="history-item-icon product-history-icon">${icon("package")}</span><span class="history-item-copy"><span class="history-item-topline"><strong>Product</strong><time>${esc(formatTime(item.timestamp))}</time></span><span class="history-item-style">${esc(item.styleLabel || "Product Catalog")}</span><span class="history-item-excerpt">${esc(excerpt(item.prompt))}</span></span>`;
                entries.append(button);
            });

            list.append(section);
        }

        const visibleProductCount = showProduct ? filtered.length : 0;
        const visibleCombined = filterValue === MODE_ID ? visibleProductCount : baseVisibleItems + visibleProductCount;
        text("historyBrowserCount", `${visibleCombined} item${visibleCombined === 1 ? "" : "s"}`);

        const empty = byId("historyEmpty");
        if (empty) empty.hidden = visibleCombined > 0 || getCombinedStoredCount() > 0;
        if (noResults) noResults.hidden = visibleCombined > 0;

        updateCombinedHistoryCount();
        if (selectedProductHistoryId) renderProductPreview();
    }

    function selectProductHistory(id) {
        if (!productHistory.some(item => item.id === id)) return;
        selectedProductHistoryId = id;
        document.querySelectorAll(".history-item").forEach(item => item.classList.remove("is-active"));
        document.querySelector(`[data-product-history-id="${cssEscape(id)}"]`)?.classList.add("is-active");
        renderProductPreview();
    }

    function renderProductPreview() {
        const item = productHistory.find(entry => entry.id === selectedProductHistoryId);
        if (!item) return;
        text("historyPreviewTitle", item.modeLabel);
        text("historyPreviewMode", "Product");
        byId("historyPreviewMode")?.setAttribute("data-mode", MODE_ID);
        const meta = byId("historyPreviewMeta");
        if (meta) meta.hidden = false;
        text("historyPreviewTime", formatDateTime(item.timestamp));
        text("historyPreviewStyle", item.styleLabel || "Product Catalog");
        text("historyPreviewLength", `${item.prompt.length.toLocaleString()} characters`);
        const preview = byId("historyPromptPreview");
        if (preview) preview.value = item.prompt;
        ["historyRestoreBtn", "historyCopyBtn", "historyDeleteBtn"].forEach(id => { if (byId(id)) byId(id).disabled = false; });
    }

    function restoreSelectedProductHistory() {
        const item = productHistory.find(entry => entry.id === selectedProductHistoryId);
        if (!item || !global.ProductCatalogMode?.isReady?.()) {
            setHistoryStatus("Product Catalog Build data is not ready. Refresh the page and try again.", "error");
            return;
        }

        global.PromptWorkspaceTabs?.setActive?.("build");
        global.ProductCatalogMode.activate?.();
        global.setTimeout(() => {
            const result = global.ProductCatalogMode.restoreState?.(item.state || {}) || { missing: [] };
            global.ProductCatalogMode.generate?.();
            const missing = result.missing || [];
            setHistoryStatus(
                missing.length ? `Restored with ${missing.length} unavailable saved option${missing.length === 1 ? "" : "s"}.` : "Product Catalog session restored to Build.",
                missing.length ? "warning" : "success"
            );
        }, 40);
    }

    async function copySelectedProductHistory() {
        const item = productHistory.find(entry => entry.id === selectedProductHistoryId);
        if (!item) return;
        try {
            await navigator.clipboard.writeText(item.prompt);
            setHistoryStatus("Prompt copied to clipboard.", "success");
        } catch (_) {
            setHistoryStatus("Could not copy the prompt.", "error");
        }
    }

    function deleteSelectedProductHistory() {
        const index = productHistory.findIndex(entry => entry.id === selectedProductHistoryId);
        if (index < 0) return;
        productHistory.splice(index, 1);
        selectedProductHistoryId = productHistory[index]?.id || productHistory[index - 1]?.id || "";
        writeProductHistory();
        renderProductHistory();
        if (!selectedProductHistoryId) {
            text("historyPreviewTitle", "Select a saved prompt");
            text("historyPreviewMode", "—");
            const preview = byId("historyPromptPreview");
            if (preview) preview.value = "";
        }
        setHistoryStatus("Product Catalog history item deleted.", "success");
    }

    function getCombinedStoredCount() {
        return Number(global.PromptHistory?.count?.() || 0) + productHistory.length;
    }

    function updateCombinedHistoryCount() {
        const total = getCombinedStoredCount();
        text("historyCount", total);
        const clearButton = byId("historyClearBtn");
        if (clearButton) clearButton.disabled = total === 0;
        const tab = byId("workspace-tab-history");
        if (!tab) return;
        let badge = tab.querySelector(".workspace-tab-count");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "workspace-tab-count";
            tab.append(badge);
        }
        badge.textContent = total > 99 ? "99+" : String(total);
        badge.hidden = total === 0;
    }

    function setHistoryStatus(message, tone) {
        const status = byId("historyStatus");
        if (!status) return;
        status.textContent = message || "";
        status.dataset.tone = tone || "info";
    }

    function isProductActive() {
        return Boolean(global.ProductCatalogMode?.isActive?.()) || byId("activeModeBadge")?.dataset?.mode === MODE_ID;
    }

    function selected(id) {
        const option = byId(id)?.selectedOptions?.[0];
        if (!option || option.dataset?.placeholder === "true") return "";
        const label = option.textContent?.trim() || "";
        return /^--.*--$/.test(label) ? "" : label;
    }

    function value(id) { return byId(id)?.value || ""; }
    function byId(id) { return document.getElementById(id); }
    function text(id, next) { const el = byId(id); if (el) el.textContent = String(next ?? ""); }
    function icon(name) { return global.PromptIcons?.svg ? global.PromptIcons.svg(name) : ""; }
    function validProductHistoryItem(item) { return item && item.mode === MODE_ID && typeof item.id === "string" && typeof item.timestamp === "number" && typeof item.prompt === "string"; }
    function createId() { return global.crypto?.randomUUID ? crypto.randomUUID() : `pg-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
    function excerpt(prompt) { const compact = String(prompt || "").replace(/\s+/g, " ").trim(); return compact.length > 118 ? `${compact.slice(0, 115)}…` : compact; }
    function formatTime(timestamp) { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)); }
    function formatDateTime(timestamp) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)); }
    function cssEscape(valueToEscape) { return global.CSS?.escape ? CSS.escape(String(valueToEscape)) : String(valueToEscape).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
    function esc(valueToEscape) { return String(valueToEscape ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }

    global.ProductCatalogWorkspace = {
        refreshHistory: renderProductHistory,
        historyCount: () => productHistory.length
    };
})(window);
