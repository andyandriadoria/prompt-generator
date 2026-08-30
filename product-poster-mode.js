(function (global) {
    "use strict";

    const MODE_ID = "reference_product_poster";
    const PREVIEW_PARAM = "productPosterPreview";
    const FALLBACK_MODE = {
        id: MODE_ID,
        label: "Product Poster Builder",
        icon: "poster",
        description: "Add premium poster typography and product information to an existing photo without changing the original photograph."
    };

    const elements = {};
    let database = null;
    let posterActive = false;
    let initialized = false;
    let modeObserver = null;
    const requestedInitialMode = localStorage.getItem("promptGenPromptMode") || "";

    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        const ready = global.PromptDataLoader && global.ProductPosterPromptBuilder && global.PromptIcons;
        if (ready) return bootstrap();
        if (attempt > 80) return console.warn("Product Poster Builder dependencies did not become available.");
        global.setTimeout(() => waitForDependencies(attempt + 1), 100);
    }

    function bootstrap() {
        if (initialized) return;
        initialized = true;
        ensureStylesheet();
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
        else init();
    }

    async function init() {
        cacheBaseElements();
        if (!elements.promptForm || !elements.promptModeGrid) return;
        buildPosterFields();
        cachePosterElements();
        bindEvents();
        observePromptModes();
        await loadFeatureData();
    }

    function cacheBaseElements() {
        [
            "promptModeGrid", "creativeModeSections", "creativeFields", "catalogFields", "productFields", "promptForm",
            "activeModeBadge", "activeStyleBadge", "randomModeTitle", "randomModeHint", "randomPromptBtn",
            "outputTipTitle", "outputTipText", "generatePromptBtn", "resetFormBtn", "refreshDataBtn",
            "output", "promptStats", "messageBox", "dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"
        ].forEach(id => { elements[id] = document.getElementById(id); });
    }

    function cachePosterElements() {
        ["posterFields", "posterAspectRatio", "posterProductInformation", "posterExtraInstruction"].forEach(id => {
            elements[id] = document.getElementById(id);
        });
    }

    function ensureStylesheet() {
        if (document.querySelector('link[data-product-poster-style]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "product-poster.css?v=4.5-poster-1";
        link.dataset.productPosterStyle = "true";
        document.head.append(link);
    }

    function buildPosterFields() {
        if (document.getElementById("posterFields")) return;
        const anchor = document.getElementById("productFields") || document.getElementById("catalogFields");
        if (!anchor) return;

        const section = document.createElement("section");
        section.id = "posterFields";
        section.className = "mode-fields product-poster-fields";
        section.hidden = true;
        section.innerHTML = `
            <div class="poster-mode-intro">
                <span class="poster-mode-icon">${global.PromptIcons.svg("poster")}</span>
                <div>
                    <strong>Product Poster Builder</strong>
                    <p>Use one existing photograph as a locked base image, then add premium poster typography, product information, and monoline detail icons.</p>
                </div>
            </div>

            <div class="field-row">
                <label for="posterAspectRatio">Aspect Ratio</label>
                <select id="posterAspectRatio"><option value="">-- Select Aspect Ratio --</option></select>
                <p class="poster-field-help">If the selected ratio differs from the source photo, the prompt extends only the surrounding canvas instead of cropping the original photograph.</p>
            </div>

            <div class="field-row">
                <label for="posterProductInformation">Product Information</label>
                <textarea id="posterProductInformation" class="poster-info-textarea" placeholder="Brand: HEART TROOPS\nProduct Name: Reyan Koko\nPrice: IDR 489.000\n\nDetails:\n- Bahan: Premium Twill Crepe\n- Size: S / XL\n- Panjang: 77 / 78"></textarea>
                <p class="poster-field-help">Write the product information exactly as it should appear. Number of detail lines is flexible.</p>
            </div>

            <div class="field-row">
                <label for="posterExtraInstruction">Extra Instruction <span class="optional-label">optional</span></label>
                <textarea id="posterExtraInstruction" class="short-textarea" placeholder="Example: keep the typography concentrated in the left-side negative space"></textarea>
            </div>

            <div class="poster-preservation-note">
                <span>${global.PromptIcons.svg("shield")}</span>
                <div>
                    <strong>Locked base photograph</strong>
                    <p>The original model, outfit, product, background, lighting, shadows, framing, and camera angle remain unchanged. Only poster graphics are added.</p>
                </div>
            </div>
        `;
        anchor.insertAdjacentElement("afterend", section);
    }

    function bindEvents() {
        elements.promptModeGrid.addEventListener("click", handleModeClickCapture, true);
        elements.posterFields?.addEventListener("input", handlePosterFieldEvent);
        elements.posterFields?.addEventListener("change", handlePosterFieldEvent);
        elements.generatePromptBtn?.addEventListener("click", handleGenerateCapture, true);
        elements.resetFormBtn?.addEventListener("click", handleResetCapture, true);
        elements.refreshDataBtn?.addEventListener("click", () => global.setTimeout(() => loadFeatureData(), 900));
        global.addEventListener("promptgen:modechange", event => {
            if (event.detail?.mode !== MODE_ID && posterActive) deactivatePosterUi();
        });
    }

    function observePromptModes() {
        if (modeObserver) return;
        modeObserver = new MutationObserver(() => {
            ensurePosterModeCard();
            refreshModeCopy();
        });
        modeObserver.observe(elements.promptModeGrid, { childList: true });
    }

    async function loadFeatureData(options = {}) {
        try {
            const result = await global.PromptDataLoader.load(options);
            database = result.data;
            populateAspectRatios();
            ensurePosterModeCard();
            refreshModeCopy();
            document.body.classList.toggle("product-poster-ready", isFeatureReady());
        } catch (error) {
            console.warn("Product Poster Builder data load failed:", error);
        }
    }

    function isFeatureReady() {
        return Boolean(database && Array.isArray(database.aspectRatios) && database.aspectRatios.length);
    }

    function previewEnabled() {
        return new URLSearchParams(global.location.search).get(PREVIEW_PARAM) === "1";
    }

    function getModeDefinition() {
        return database?.promptModes?.find(item => item.id === MODE_ID) || (previewEnabled() && isFeatureReady() ? FALLBACK_MODE : null);
    }

    function ensurePosterModeCard() {
        if (!elements.promptModeGrid || !isFeatureReady()) return;
        const mode = getModeDefinition();
        let card = elements.promptModeGrid.querySelector(`[data-prompt-mode-id="${MODE_ID}"]`);
        if (!mode) {
            card?.remove();
            return;
        }
        if (!card) {
            card = document.createElement("button");
            card.type = "button";
            card.className = "prompt-mode-card poster-mode-card";
            card.dataset.promptModeId = MODE_ID;
            card.innerHTML = `<span class="prompt-mode-icon">${global.PromptIcons.svg(mode.icon || "poster")}</span><span><strong>${escapeHtml(mode.label || FALLBACK_MODE.label)}</strong><small>${escapeHtml(mode.description || FALLBACK_MODE.description)}</small></span><span class="prompt-mode-check">${global.PromptIcons.svg("check")}</span>`;
            elements.promptModeGrid.append(card);
        }
        if (posterActive || requestedInitialMode === MODE_ID) global.queueMicrotask(() => activatePosterMode(false));
    }

    function refreshModeCopy() {
        const copy = document.querySelector(".prompt-mode-head p");
        if (!copy || !getModeDefinition()) return;
        copy.textContent = "Creative builds scenes freely. Reference Outfit Catalog preserves worn clothing. Reference Product Catalog creates product-first commercial images. Product Poster Builder keeps the supplied photograph intact and adds poster design on top.";
    }

    function handleModeClickCapture(event) {
        const card = event.target.closest("[data-prompt-mode-id]");
        if (!card) return;
        const mode = card.dataset.promptModeId;
        if (mode === MODE_ID) {
            event.preventDefault();
            event.stopImmediatePropagation();
            activatePosterMode(true);
            return;
        }
        if (posterActive) deactivatePosterUi();
    }

    function activatePosterMode(notify = true) {
        if (!isFeatureReady() || !getModeDefinition()) return;

        if (global.ProductCatalogMode?.isActive?.()) {
            const creativeCard = elements.promptModeGrid?.querySelector('[data-prompt-mode-id="creative"]');
            creativeCard?.click();
        }

        posterActive = true;
        localStorage.setItem("promptGenPromptMode", MODE_ID);
        document.body.classList.add("product-poster-active");

        if (elements.creativeModeSections) elements.creativeModeSections.hidden = true;
        if (elements.creativeFields) elements.creativeFields.hidden = true;
        if (elements.catalogFields) elements.catalogFields.hidden = true;
        if (elements.productFields) elements.productFields.hidden = true;
        if (elements.posterFields) elements.posterFields.hidden = false;
        if (elements.activeStyleBadge) elements.activeStyleBadge.hidden = true;
        if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = true;

        if (elements.activeModeBadge) {
            elements.activeModeBadge.textContent = "Product Poster Builder";
            elements.activeModeBadge.dataset.mode = MODE_ID;
        }
        if (elements.randomModeTitle) elements.randomModeTitle.textContent = "Poster Builder";
        if (elements.randomModeHint) elements.randomModeHint.textContent = "Locked-photo poster composition";
        if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Product poster tip";
        if (elements.outputTipText) elements.outputTipText.textContent = "Attach the exact photograph you want to preserve. Enter product information exactly as it should appear; the generated prompt tells the image model to keep the original photo intact.";

        elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
            const active = card.dataset.promptModeId === MODE_ID;
            card.classList.toggle("is-active", active);
            card.setAttribute("aria-pressed", active ? "true" : "false");
        });

        generatePosterPrompt(false);
        global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode: MODE_ID } }));
        global.setTimeout(updatePosterDna, 60);
        if (notify) showMessage("Product Poster Builder mode selected.");
    }

    function deactivatePosterUi() {
        posterActive = false;
        document.body.classList.remove("product-poster-active");
        if (elements.posterFields) elements.posterFields.hidden = true;
        if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = false;
        resetBuildDnaLabels();
    }

    function resetBuildDnaLabels() {
        const labels = ["Subject", "Scene", "Style", "Framing", "Light"];
        [elements.dnaSubject, elements.dnaScene, elements.dnaStyle, elements.dnaCamera, elements.dnaLight].forEach((node, index) => {
            const label = node?.querySelector?.("b");
            if (label) label.textContent = labels[index];
        });
    }

    function populateAspectRatios() {
        if (!elements.posterAspectRatio || !database) return;
        elements.posterAspectRatio.innerHTML = "";
        const placeholder = new Option("-- Select Aspect Ratio --", "");
        placeholder.dataset.placeholder = "true";
        elements.posterAspectRatio.append(placeholder);
        (database.aspectRatios || []).forEach(item => {
            const value = item.value || item.label || item.id;
            const option = new Option(item.label || value, value);
            option.dataset.id = item.id || "";
            elements.posterAspectRatio.append(option);
        });
        const config = database.config || {};
        const preferred = config.defaultProductPosterAspectRatio || config.defaultProductAspectRatio || "4:5";
        if ([...elements.posterAspectRatio.options].some(option => option.value === preferred)) elements.posterAspectRatio.value = preferred;
    }

    function handlePosterFieldEvent() {
        if (!posterActive) return;
        updatePosterDna();
        if (asBoolean(database?.config?.autoGenerate, true)) generatePosterPrompt(false);
    }

    function collectState() {
        return {
            aspectRatio: elements.posterAspectRatio?.value || "4:5",
            productInformation: elements.posterProductInformation?.value?.trim() || "",
            extraInstruction: elements.posterExtraInstruction?.value?.trim() || ""
        };
    }

    function generatePosterPrompt(explicit = false) {
        if (!posterActive || !database) return "";
        const state = collectState();
        const prompt = global.ProductPosterPromptBuilder.build(state);
        if (elements.output) {
            elements.output.value = prompt;
            elements.output.classList.toggle("is-filled", Boolean(prompt));
        }
        if (elements.promptStats) elements.promptStats.textContent = `${prompt.length.toLocaleString()} characters`;
        updatePosterDna();
        if (explicit) {
            global.dispatchEvent(new CustomEvent("promptgen:postergenerated", { detail: { prompt, state } }));
        }
        return prompt;
    }

    function handleGenerateCapture(event) {
        if (!posterActive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        generatePosterPrompt(true);
        showMessage("Product poster prompt generated.");
    }

    function handleResetCapture(event) {
        if (!posterActive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        resetPosterForm();
    }

    function resetPosterForm() {
        const config = database?.config || {};
        const preferred = config.defaultProductPosterAspectRatio || config.defaultProductAspectRatio || "4:5";
        if (elements.posterAspectRatio) elements.posterAspectRatio.value = preferred;
        if (elements.posterProductInformation) elements.posterProductInformation.value = "";
        if (elements.posterExtraInstruction) elements.posterExtraInstruction.value = "";
        generatePosterPrompt(false);
        showMessage("Product poster form reset.");
    }

    function serializeState() {
        const state = collectState();
        return {
            posterAspectRatio: state.aspectRatio,
            posterProductInformation: state.productInformation,
            posterExtraInstruction: state.extraInstruction
        };
    }

    function restoreState(state = {}) {
        if (elements.posterAspectRatio) elements.posterAspectRatio.value = state.posterAspectRatio || state.aspectRatio || "4:5";
        if (elements.posterProductInformation) elements.posterProductInformation.value = state.posterProductInformation || state.productInformation || "";
        if (elements.posterExtraInstruction) elements.posterExtraInstruction.value = state.posterExtraInstruction || state.extraInstruction || "";
        generatePosterPrompt(false);
        return { missing: [] };
    }

    function updatePosterDna() {
        if (!posterActive) return;
        const nodes = [elements.dnaSubject, elements.dnaScene, elements.dnaStyle, elements.dnaCamera, elements.dnaLight];
        const labels = ["Base Photo", "Product Info", "Poster Style", "Ratio", "Text Fidelity"];
        const states = ["ready", elements.posterProductInformation?.value?.trim() ? "ready" : "partial", "ready", elements.posterAspectRatio?.value ? "ready" : "partial", "ready"];
        nodes.forEach((node, index) => {
            if (!node) return;
            const label = node.querySelector("b");
            if (label) label.textContent = labels[index];
            node.classList.toggle("is-ready", states[index] === "ready");
            node.classList.toggle("is-partial", states[index] === "partial");
        });
    }

    function showMessage(message) {
        const box = elements.messageBox || document.getElementById("messageBox");
        if (!box) return;
        box.textContent = message;
        box.classList.add("show");
        global.clearTimeout(showMessage.timer);
        showMessage.timer = global.setTimeout(() => box.classList.remove("show"), 2200);
    }

    function asBoolean(value, fallback = false) {
        if (typeof value === "boolean") return value;
        if (value == null || value === "") return fallback;
        return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    global.ProductPosterMode = {
        id: MODE_ID,
        isReady: isFeatureReady,
        isActive: () => posterActive,
        activate: () => activatePosterMode(true),
        generate: () => generatePosterPrompt(false),
        getState: serializeState,
        restoreState,
        refreshData: loadFeatureData
    };
})(window);
