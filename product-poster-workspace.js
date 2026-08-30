(function (global) {
    "use strict";

    const MODE_ID = "reference_product_poster";
    const HISTORY_KEY = "promptGenHistoryV1";
    const MAX_HISTORY = 50;
    let selectedPosterHistoryId = "";
    let refreshFrame = 0;

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else queueMicrotask(init);

    function init() {
        bindSignals();
        waitForWorkspace();
    }

    function bindSignals() {
        global.addEventListener("promptgen:postergenerated", event => saveHistory(event.detail || {}));
        global.addEventListener("promptgen:modechange", () => {
            scheduleBuildDna();
            scheduleInspectorRefresh();
        });

        document.addEventListener("input", event => {
            if (!event.target?.closest?.("#posterFields")) return;
            scheduleBuildDna();
            scheduleInspectorRefresh();
        }, true);
        document.addEventListener("change", event => {
            if (!event.target?.closest?.("#posterFields")) return;
            scheduleBuildDna();
            scheduleInspectorRefresh();
        }, true);

        document.addEventListener("click", event => {
            const item = event.target.closest?.(".history-item[data-history-id]");
            if (item) {
                const entry = readHistory().find(row => row.id === item.dataset.historyId);
                selectedPosterHistoryId = entry?.mode === MODE_ID ? entry.id : "";
                return;
            }

            if (event.target.closest?.("#historyRestoreBtn") && selectedPosterHistoryId) {
                const entry = readHistory().find(row => row.id === selectedPosterHistoryId && row.mode === MODE_ID);
                if (!entry) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                restorePosterHistory(entry);
            }
        }, true);
    }

    function waitForWorkspace(attempt = 0) {
        if (global.PromptWorkspaceTabs && document.getElementById("workspace-history") && document.getElementById("workspace-inspect")) {
            enhanceHistoryFilter();
            global.addEventListener("promptgen:workspacechange", event => {
                if (event.detail?.workspace === "history") global.setTimeout(enhanceHistoryFilter, 40);
                if (event.detail?.workspace === "inspect") global.setTimeout(renderInspectorIfActive, 80);
            });
            scheduleBuildDna();
            return;
        }
        if (attempt > 100) return;
        global.setTimeout(() => waitForWorkspace(attempt + 1), 100);
    }

    function enhanceHistoryFilter() {
        const filter = byId("historyModeFilter");
        if (!filter || [...filter.options].some(option => option.value === MODE_ID)) return;
        filter.append(new Option("Product Poster", MODE_ID));
    }

    function saveHistory(detail) {
        const prompt = String(detail.prompt || "").trim();
        if (!prompt) return;
        const state = detail.state || global.ProductPosterMode?.getState?.() || {};
        const timestamp = Date.now();
        const item = {
            id: `poster-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp,
            mode: MODE_ID,
            modeLabel: "Product Poster Builder",
            styleLabel: state.aspectRatio || state.posterAspectRatio || "Product Poster",
            prompt,
            state: {
                posterAspectRatio: state.aspectRatio || state.posterAspectRatio || "4:5",
                posterProductInformation: state.productInformation || state.posterProductInformation || "",
                posterExtraInstruction: state.extraInstruction || state.posterExtraInstruction || ""
            }
        };
        item.fingerprint = JSON.stringify({ mode: item.mode, prompt: item.prompt, state: item.state });

        const items = readHistory();
        if (items[0]?.fingerprint === item.fingerprint) {
            item.id = items[0].id;
            items[0] = item;
        } else {
            items.unshift(item);
        }
        writeHistory(items.slice(0, MAX_HISTORY));
        selectedPosterHistoryId = item.id;
        global.PromptHistory?.refresh?.();
        global.dispatchEvent(new CustomEvent("promptgen:historychange", { detail: { count: items.length } }));
    }

    function restorePosterHistory(item) {
        global.PromptWorkspaceTabs?.setActive?.("build");
        const card = document.querySelector(`[data-prompt-mode-id="${MODE_ID}"]`);
        if (!card) {
            setHistoryStatus("Product Poster Builder is not ready. Refresh the database and try again.", "error");
            return;
        }
        card.click();
        global.setTimeout(() => {
            global.ProductPosterMode?.restoreState?.(item.state || {});
            global.ProductPosterMode?.generate?.();
            setHistoryStatus("Product Poster session restored to Build.", "success");
        }, 40);
    }

    function readHistory() {
        try {
            const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function writeHistory(items) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
            return true;
        } catch (_) {
            return false;
        }
    }

    function setHistoryStatus(message, tone) {
        const node = byId("historyStatus");
        if (!node) return;
        node.textContent = message;
        node.dataset.tone = tone || "";
    }

    function scheduleBuildDna() {
        global.setTimeout(updateBuildDna, 70);
    }

    function updateBuildDna() {
        if (!isPosterActive()) return;
        const nodes = ["dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"].map(byId);
        const labels = ["Base Photo", "Product Info", "Poster Style", "Ratio", "Text Fidelity"];
        const states = [true, Boolean(value("posterProductInformation").trim()), true, Boolean(value("posterAspectRatio")), true];
        nodes.forEach((node, index) => {
            if (!node) return;
            const label = node.querySelector("b");
            if (label) label.textContent = labels[index];
            node.classList.toggle("is-ready", states[index]);
            node.classList.toggle("is-partial", !states[index] && index === 1);
        });
    }

    function scheduleInspectorRefresh() {
        if (refreshFrame) cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => {
            refreshFrame = 0;
            if (global.PromptWorkspaceTabs?.getActive?.() === "inspect") global.setTimeout(renderInspectorIfActive, 80);
        });
    }

    function renderInspectorIfActive() {
        if (!isPosterActive()) return;
        const prompt = value("output").trim();
        const infoReady = Boolean(value("posterProductInformation").trim());
        const ratioReady = Boolean(value("posterAspectRatio"));
        const completeness = Math.round(([infoReady, ratioReady].filter(Boolean).length / 2) * 100);
        const health = clamp(Math.round(completeness * 0.7 + 30));
        const meta = health >= 90
            ? { title: "Poster prompt is ready", summary: "The locked-photo preservation rules, aspect ratio, and supplied product text are structurally ready.", signal: "Strong" }
            : { title: "Poster prompt needs input", summary: "Complete the product information and aspect ratio before final use.", signal: "Partial" };

        text("healthScore", health);
        text("promptHealthTitle", meta.title);
        text("healthSummary", meta.summary);
        byId("healthScoreRing")?.setAttribute("data-level", health >= 90 ? "great" : health >= 70 ? "good" : "review");
        text("completenessScore", `${completeness}%`);
        bar("completenessBar", completeness);
        text("secondaryMetricLabel", "Photo Lock");
        text("secondaryMetricScore", "100%");
        bar("secondaryMetricBar", 100);
        text("inspectModeBadge", "Poster");
        byId("inspectModeBadge")?.setAttribute("data-mode", MODE_ID);
        text("contextMode", "Product Poster Builder");
        text("contextStyle", value("posterAspectRatio") ? `Premium Editorial · ${value("posterAspectRatio")}` : "Premium Editorial");
        text("contextLength", `${prompt.length.toLocaleString()} characters`);
        text("contextSignal", meta.signal);

        const dims = [
            dim("Base Photo", "poster", "ready", "Original photograph is treated as a locked base layer."),
            dim("Product Info", "info", infoReady ? "ready" : "missing", infoReady ? "Manual product text supplied exactly as written." : "Product Information is empty."),
            dim("Aspect Ratio", "cube", ratioReady ? "ready" : "missing", ratioReady ? value("posterAspectRatio") : "No target ratio selected."),
            dim("Poster Style", "gem", "ready", "Premium editorial boutique poster system is built into the master prompt."),
            dim("Text Fidelity", "shield", "ready", "Prompt forbids changing names, prices, numbers, measurements, spelling, or supplied information."),
            dim("Extra Instruction", "wand", value("posterExtraInstruction").trim() ? "ready" : "optional", value("posterExtraInstruction").trim() || "Optional")
        ];
        renderDna(dims);
        renderFindings(prompt, infoReady, ratioReady);
        renderImprovements(infoReady, ratioReady);
        renderSignal(prompt, completeness);
    }

    function renderDna(items) {
        const grid = byId("expandedDnaGrid");
        if (!grid) return;
        const required = items.filter(item => item.state !== "optional");
        text("dnaSummary", `${required.filter(item => item.state === "ready").length} / ${required.length} ready`);
        grid.innerHTML = items.map(item => `<article class="dna-inspector-card" data-state="${esc(item.state)}"><div class="dna-inspector-card-head"><span class="dna-inspector-icon">${icon(item.icon)}</span><span class="dna-state-label">${item.state === "ready" ? "Ready" : item.state === "optional" ? "Optional" : "Missing"}</span></div><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p></article>`).join("");
    }

    function renderFindings(prompt, infoReady, ratioReady) {
        const findings = [
            ["positive", "Original photograph is protected", "The prompt uses locked-base-photo language and prevents cropping, reframing, retouching, or alteration inside the original image."],
            ["positive", "Aspect-ratio conflict is resolved", "When the target ratio differs, only canvas outside the original frame may be extended; the source photograph stays intact."],
            infoReady ? ["positive", "Product text is supplied", "All supplied product information is instructed to remain exactly as written."] : ["warning", "Product Information is empty", "Add Brand, Product Name, Price, and any flexible Details in the manual text box."],
            ratioReady ? ["positive", "Target ratio is defined", value("posterAspectRatio")] : ["warning", "Aspect Ratio is missing", "Select the final poster ratio."],
            prompt ? ["positive", "Poster master prompt is generated", "The current output is ready to use with the source photograph."] : ["warning", "No generated poster prompt", "Generate the prompt before final use."]
        ];
        text("findingCount", `${findings.length} findings`);
        const list = byId("findingsList");
        if (list) list.innerHTML = findings.map(row => `<article class="inspector-list-item" data-tone="${row[0]}"><span class="inspector-list-icon">${icon(row[0] === "positive" ? "check" : "warning")}</span><div><strong>${esc(row[1])}</strong><p>${esc(row[2])}</p></div></article>`).join("");
    }

    function renderImprovements(infoReady, ratioReady) {
        const items = [];
        if (!infoReady) items.push(["info", "Add product information", "Enter the exact Brand, Product Name, Price, and flexible Details text you want printed on the poster."]);
        if (!ratioReady) items.push(["cube", "Choose the final aspect ratio", "The builder will preserve the source photo and extend surrounding canvas only when necessary."]);
        if (!items.length) items.push(["check", "Poster prompt is structurally ready", "Attach the original photograph and use the generated prompt without changing the supplied product text."]);
        const list = byId("improvementsList");
        if (list) list.innerHTML = items.map((item, index) => `<article class="inspector-list-item improvement-item"><span class="improvement-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(item[1])}</strong><p>${esc(item[2])}</p></div><span class="improvement-icon">${icon(item[0])}</span></article>`).join("");
    }

    function renderSignal(prompt, completeness) {
        const words = prompt ? prompt.split(/\s+/).filter(Boolean).length : 0;
        text("signalCharacters", prompt.length.toLocaleString());
        text("signalWords", words.toLocaleString());
        text("signalDuplicates", "0");
        text("signalModeFit", completeness === 100 ? "Strong" : "Partial");
        text("signalBadge", completeness === 100 ? "Clean" : "Review");
        byId("signalBadge")?.setAttribute("data-signal", completeness === 100 ? "clean" : "review");
        text("signalNote", "Product Poster Prompt Health prioritizes locked-photo preservation, exact supplied text, target aspect ratio, and clean premium poster hierarchy.");
    }

    function isPosterActive() {
        return Boolean(global.ProductPosterMode?.isActive?.()) || byId("activeModeBadge")?.dataset?.mode === MODE_ID;
    }

    function dim(label, iconName, state, detail) { return { label, icon: iconName, state, detail }; }
    function byId(id) { return document.getElementById(id); }
    function value(id) { return byId(id)?.value || ""; }
    function text(id, valueToSet) { const node = byId(id); if (node) node.textContent = valueToSet; }
    function bar(id, valueToSet) { const node = byId(id); if (node) node.style.width = `${clamp(valueToSet)}%`; }
    function clamp(valueToClamp) { return Math.max(0, Math.min(100, Number(valueToClamp) || 0)); }
    function icon(name) { return global.PromptIcons?.svg?.(name) || ""; }
    function esc(valueToEscape) {
        return String(valueToEscape ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }
})(window);
