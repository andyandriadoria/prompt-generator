(function (global) {
    "use strict";

    const MODE_ID = "reference_product_catalog";
    const PRODUCT_HISTORY_KEY = "promptGenProductHistoryV1";
    const MAIN_HISTORY_KEY = "promptGenHistoryV1";
    const MAX_PRODUCT_HISTORY = 50;

    let productHistory = [];
    let selectedProductHistoryId = "";
    let historyObserver = null;
    let refreshFrame = 0;

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
        global.addEventListener("promptgen:modechange", () => {
            scheduleBuildDnaLabels();
            scheduleInspectorRefresh();
        });

        global.addEventListener("promptgen:productgenerated", event => {
            saveProductHistory(event.detail || {});
            scheduleInspectorRefresh();
        });

        document.addEventListener("input", event => {
            if (!event.target?.closest?.("#productFields")) return;
            scheduleInspectorRefresh();
        }, true);

        document.addEventListener("change", event => {
            if (!event.target?.closest?.("#productFields")) return;
            scheduleInspectorRefresh();
        }, true);
    }

    function waitForWorkspace(attempt = 0) {
        const ready = global.PromptWorkspaceTabs && document.getElementById("workspace-history") && document.getElementById("workspace-inspect");
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
            if (event.detail?.workspace === "inspect") global.setTimeout(renderProductInspectorIfActive, 80);
        });

        renderProductHistory();
    }

    /* ----------------------------------------------------------------------
       Build Prompt DNA
       ---------------------------------------------------------------------- */

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

    /* ----------------------------------------------------------------------
       Product Inspector
       ---------------------------------------------------------------------- */

    function scheduleInspectorRefresh() {
        if (refreshFrame) cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => {
            refreshFrame = 0;
            if (global.PromptWorkspaceTabs?.getActive?.() === "inspect") {
                global.setTimeout(renderProductInspectorIfActive, 50);
            }
        });
    }

    function renderProductInspectorIfActive() {
        if (!isProductActive()) return;
        const prompt = value("output").trim();
        const dimensions = productDimensions();
        const required = dimensions.filter(item => item.state !== "optional");
        const readyCount = required.filter(item => item.state === "ready").length;
        const completeness = required.length ? Math.round(readyCount / required.length * 100) : 0;
        const preservationReady = Boolean(value("productPreservation"));
        const preservationScore = preservationReady ? 100 : 0;
        const duplicates = duplicateClauses(prompt);
        const health = clamp(Math.round(completeness * .8 + preservationScore * .2) - Math.min(8, duplicates.length * 2));
        const missing = required.filter(item => item.state !== "ready");
        const meta = healthMeta(health);

        text("healthScore", health);
        text("promptHealthTitle", meta.title);
        text("healthSummary", meta.summary);
        byId("healthScoreRing")?.setAttribute("data-level", healthLevel(health));
        text("completenessScore", `${completeness}%`);
        bar("completenessBar", completeness);
        text("secondaryMetricLabel", "Preservation");
        text("secondaryMetricScore", `${preservationScore}%`);
        bar("secondaryMetricBar", preservationScore);
        text("inspectModeBadge", "Product");
        byId("inspectModeBadge")?.setAttribute("data-mode", MODE_ID);
        text("contextMode", "Reference Product Catalog");
        text("contextStyle", selected("productPresentation") || "Product presentation not selected");
        text("contextLength", `${prompt.length.toLocaleString()} characters`);
        text("contextSignal", meta.signal);

        renderInspectorDna(dimensions);
        renderInspectorFindings(buildProductFindings(prompt, missing, preservationReady, duplicates));
        renderInspectorImprovements(buildProductImprovements(missing, preservationReady));
        renderInspectorSignal(prompt, duplicates, completeness, preservationReady);
    }

    function productDimensions() {
        const presentation = selected("productPresentation");
        const textOverlay = value("productTextOverlay");
        const campaignActive = presentation === "Campaign Poster" || value("productPresentation") === "campaign-poster";
        return [
            dim("Product", "package", value("productType") ? "ready" : "missing", selected("productType") || "No product type selected"),
            dim("Presentation", "gem", value("productPresentation") ? "ready" : "missing", presentation || "No presentation type selected"),
            dim("Preservation", "shield", value("productPreservation") ? "ready" : "missing", selected("productPreservation") || "Product preservation is not selected"),
            dim("Scene", "compass", value("productSetting") ? "ready" : "missing", selected("productSetting") || "No product setting selected"),
            dim("Shot", "film", value("productShot") ? "ready" : "missing", selected("productShot") || "No product shot selected"),
            dim("Composition", "cube", value("productComposition") ? "ready" : "missing", selected("productComposition") || "No product composition selected"),
            dim("Ratio", "cube", value("productAspectRatio") ? "ready" : "missing", value("productAspectRatio") || "No aspect ratio selected"),
            dim("Campaign Copy", "wand", campaignActive && textOverlay && textOverlay !== "none" ? "ready" : "optional", campaignActive ? (selected("productTextOverlay") || "Optional campaign typography") : "Optional — only used for Campaign Poster")
        ];
    }

    function buildProductFindings(prompt, missing, preservationReady, duplicates) {
        const findings = [];
        if (!prompt) findings.push(finding("warning", "No generated product prompt yet", "Generate the Product Catalog prompt so wording and preservation can be inspected."));
        findings.push(preservationReady
            ? finding("positive", "Product preservation guard is active", `${selected("productPreservation") || "A preservation level"} protects the visible reference-product details.`)
            : finding("warning", "Product preservation is missing", "Reference Product Catalog should not be finalized without an explicit preservation level."));
        findings.push(missing.length
            ? finding("warning", `${missing.length} required product area${missing.length === 1 ? " is" : "s are"} missing`, missing.slice(0, 4).map(item => item.label).join(", "))
            : finding("positive", "Product Catalog structure is complete", "All required Product Catalog dimensions have usable values."));
        if (duplicates.length) findings.push(finding("warning", "Repeated clauses detected", `${duplicates.length} repeated long clause${duplicates.length === 1 ? "" : "s"} should be reviewed.`));
        else if (prompt) findings.push(finding("positive", "Prompt flow is clean", "The current three-block product prompt has no obvious repeated long clauses."));
        const composition = value("productComposition");
        if (["pair", "set", "collection"].includes(composition)) {
            findings.push(finding("positive", "Multi-product preservation is enabled", "The prompt adds composition-aware preservation language for pairs, sets, or collections."));
        }
        return findings;
    }

    function buildProductImprovements(missing, preservationReady) {
        const map = {
            Product: ["package", "Choose the product type", "Product type controls the preservation vocabulary for clothing, jewelry, shoes, accessories, and other products."],
            Presentation: ["gem", "Choose the presentation", "Select how the product should be displayed before refining the scene."],
            Preservation: ["shield", "Activate product preservation", "Use Exact Strict for the recommended balance between scene freedom and reference fidelity."],
            Scene: ["compass", "Choose the product setting", "Select a surface or environment compatible with the current product and presentation."],
            Shot: ["film", "Set the product framing", "Choose Full Product, Medium, Close-Up, or Macro Detail according to the catalog goal."],
            Composition: ["cube", "Define product count", "Choose Single, Pair, Set, or Collection so the prompt preserves the correct number of items."],
            Ratio: ["cube", "Set the aspect ratio", "Choose the intended final catalog format before generating the image."]
        };
        const improvements = missing.slice(0, 4).map(item => {
            const entry = map[item.label] || ["info", `Review ${item.label}`, "Complete this Product Catalog area in Build."];
            return improvement(...entry);
        });
        if (!preservationReady && !missing.some(item => item.label === "Preservation")) {
            improvements.unshift(improvement("shield", "Strengthen product preservation", "Select a preservation level before using a reference product."));
        }
        if (!improvements.length) improvements.push(improvement("check", "Product prompt is structurally ready", "Attach the reference image with the generated prompt; no required Product Catalog gap needs correction first."));
        return improvements;
    }

    function renderInspectorDna(items) {
        const grid = byId("expandedDnaGrid");
        if (!grid) return;
        const required = items.filter(item => item.state !== "optional");
        text("dnaSummary", `${required.filter(item => item.state === "ready").length} / ${required.length} ready`);
        grid.innerHTML = items.map(item => `<article class="dna-inspector-card" data-state="${esc(item.state)}"><div class="dna-inspector-card-head"><span class="dna-inspector-icon">${icon(item.icon)}</span><span class="dna-state-label">${stateLabel(item.state)}</span></div><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p></article>`).join("");
    }

    function renderInspectorFindings(items) {
        text("findingCount", `${items.length} finding${items.length === 1 ? "" : "s"}`);
        const list = byId("findingsList");
        if (!list) return;
        list.innerHTML = items.slice(0, 5).map(item => `<article class="inspector-list-item" data-tone="${esc(item.tone)}"><span class="inspector-list-icon">${icon(item.tone === "positive" ? "check" : item.tone === "warning" ? "warning" : "info")}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div></article>`).join("");
    }

    function renderInspectorImprovements(items) {
        const list = byId("improvementsList");
        if (!list) return;
        list.innerHTML = items.slice(0, 4).map((item, index) => `<article class="inspector-list-item improvement-item"><span class="improvement-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div><span class="improvement-icon">${icon(item.icon)}</span></article>`).join("");
    }

    function renderInspectorSignal(prompt, duplicates, completeness, preservationReady) {
        const words = prompt ? prompt.split(/\s+/).filter(Boolean).length : 0;
        const signal = !prompt ? "Waiting" : duplicates.length ? "Review" : "Clean";
        text("signalCharacters", prompt.length.toLocaleString());
        text("signalWords", words.toLocaleString());
        text("signalDuplicates", duplicates.length);
        text("signalModeFit", completeness >= 85 && preservationReady ? "Strong" : completeness >= 55 ? "Partial" : "Weak");
        text("signalBadge", signal);
        byId("signalBadge")?.setAttribute("data-signal", signal.toLowerCase());
        text("signalNote", "Product Catalog Prompt Health prioritizes product-preservation fidelity, required presentation structure, and clean three-block prompt flow.");
    }

    /* ----------------------------------------------------------------------
       Product History
       ---------------------------------------------------------------------- */

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
        historyObserver = new MutationObserver(() => {
            if (global.PromptWorkspaceTabs?.getActive?.() === "history") scheduleProductHistoryRender();
        });
        historyObserver.observe(list, { childList: true, subtree: false });
    }

    let historyRenderTimer = 0;
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

        const noResults = list.querySelector(".history-no-results");
        if (filterValue === MODE_ID) {
            [...list.children].forEach(child => {
                if (!child.matches("[data-product-history-group]")) child.hidden = true;
            });
            if (noResults) noResults.hidden = true;
            text("historyBrowserCount", `${filtered.length} item${filtered.length === 1 ? "" : "s"}`);
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
        byId("historyPreviewMeta").hidden = false;
        text("historyPreviewTime", formatDateTime(item.timestamp));
        text("historyPreviewStyle", item.styleLabel || "Product Catalog");
        text("historyPreviewLength", `${item.prompt.length.toLocaleString()} characters`);
        byId("historyPromptPreview").value = item.prompt;
        ["historyRestoreBtn", "historyCopyBtn", "historyDeleteBtn"].forEach(id => { if (byId(id)) byId(id).disabled = false; });
    }

    function restoreSelectedProductHistory() {
        const item = productHistory.find(entry => entry.id === selectedProductHistoryId);
        if (!item || !global.ProductCatalogMode?.isReady?.()) return setHistoryStatus("Product Catalog Build data is not ready. Refresh the page and try again.", "error");
        global.PromptWorkspaceTabs?.setActive?.("build");
        global.ProductCatalogMode.activate?.();
        global.setTimeout(() => {
            const result = global.ProductCatalogMode.restoreState?.(item.state || {}) || { missing: [] };
            global.ProductCatalogMode.generate?.();
            global.PromptInspector?.refresh?.();
            const missing = result.missing || [];
            setHistoryStatus(missing.length ? `Restored with ${missing.length} unavailable saved option${missing.length === 1 ? "" : "s"}.` : "Product Catalog session restored to Build.", missing.length ? "warning" : "success");
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
            byId("historyPromptPreview").value = "";
        }
        setHistoryStatus("Product Catalog history item deleted.", "success");
    }

    function updateCombinedHistoryCount() {
        const baseCount = Number(global.PromptHistory?.count?.() || 0);
        const total = baseCount + productHistory.length;
        text("historyCount", total);
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

    /* ----------------------------------------------------------------------
       Shared helpers
       ---------------------------------------------------------------------- */

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
    function bar(id, number) { const el = byId(id); if (el) el.style.width = `${clamp(number)}%`; }
    function clamp(number) { return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0; }
    function icon(name) { return global.PromptIcons?.svg ? global.PromptIcons.svg(name) : ""; }
    function dim(label, iconName, state, detail) { return { label, icon: iconName, state, detail }; }
    function finding(tone, title, detail) { return { tone, title, detail }; }
    function improvement(iconName, title, detail) { return { icon: iconName, title, detail }; }
    function stateLabel(state) { return state === "ready" ? "Ready" : state === "optional" ? "Optional" : "Missing"; }
    function healthLevel(number) { return number >= 90 ? "excellent" : number >= 75 ? "good" : number >= 55 ? "review" : "weak"; }
    function healthMeta(number) {
        if (number >= 90) return { title: "Excellent product prompt structure", summary: "Product preservation and presentation structure are ready for final use.", signal: "Excellent" };
        if (number >= 75) return { title: "Strong product prompt with room to refine", summary: "Most required Product Catalog signals are present; targeted refinement can improve predictability.", signal: "Strong" };
        if (number >= 55) return { title: "Usable but incomplete", summary: "The product prompt has a workable foundation, but some required presentation signals are still missing.", signal: "Review" };
        return { title: "Product setup needs more structure", summary: "Important product-preservation or catalog presentation dimensions are still missing.", signal: "Weak" };
    }
    function duplicateClauses(prompt) {
        if (!prompt) return [];
        const clauses = prompt.split(/[,.!?;:\n]+/).map(item => item.trim().toLowerCase().replace(/\s+/g, " ")).filter(item => item.split(" ").length >= 5);
        const counts = new Map();
        clauses.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
        return [...counts].filter(([, count]) => count > 1).map(([clause]) => clause);
    }
    function validProductHistoryItem(item) { return item && item.mode === MODE_ID && typeof item.id === "string" && typeof item.timestamp === "number" && typeof item.prompt === "string"; }
    function createId() { return global.crypto?.randomUUID ? crypto.randomUUID() : `pg-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
    function excerpt(prompt) { const textValue = String(prompt || "").replace(/\s+/g, " ").trim(); return textValue.length > 118 ? `${textValue.slice(0, 115)}…` : textValue; }
    function formatTime(timestamp) { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)); }
    function formatDateTime(timestamp) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)); }
    function cssEscape(valueToEscape) { return global.CSS?.escape ? CSS.escape(String(valueToEscape)) : String(valueToEscape).replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
    function esc(valueToEscape) { return String(valueToEscape ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }

    global.ProductCatalogWorkspace = {
        refreshInspector: renderProductInspectorIfActive,
        refreshHistory: renderProductHistory,
        historyCount: () => productHistory.length
    };
})(window);