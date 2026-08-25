(function (global) {
    "use strict";

    const MODE_ID = "reference_product_catalog";
    const PREVIEW_PARAM = "productCatalogPreview";
    const FALLBACK_MODE = {
        id: MODE_ID,
        label: "Reference Product Catalog",
        icon: "package",
        description: "Create product-focused catalog images while preserving the reference product exactly."
    };

    const requiredCollections = [
        "productTypes",
        "productPresentations",
        "productSettings",
        "productShots",
        "productCompositions",
        "productPreservationLevels"
    ];

    const elements = {};
    const searchable = new Map();
    let database = null;
    let productActive = false;
    let initialized = false;
    let modeObserver = null;
    const requestedInitialMode = localStorage.getItem("promptGenPromptMode") || "";

    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        const ready = global.PromptDataLoader && global.ProductCatalogPromptBuilder && global.PromptIcons;
        if (ready) return bootstrap();
        if (attempt > 80) return console.warn("Reference Product Catalog dependencies did not become available.");
        global.setTimeout(() => waitForDependencies(attempt + 1), 100);
    }

    async function bootstrap() {
        if (initialized) return;
        initialized = true;
        ensureStylesheet();
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", init, { once: true });
        } else {
            init();
        }
    }

    async function init() {
        cacheBaseElements();
        if (!elements.promptForm || !elements.promptModeGrid) return;
        buildProductFields();
        cacheProductElements();
        bindEvents();
        observePromptModes();
        await loadFeatureData();
    }

    function cacheBaseElements() {
        [
            "promptModeGrid", "creativeModeSections", "creativeFields", "catalogFields", "promptForm",
            "activeModeBadge", "activeStyleBadge", "randomModeTitle", "randomModeHint", "randomPromptBtn",
            "outputTipTitle", "outputTipText", "generatePromptBtn", "resetFormBtn", "refreshDataBtn",
            "output", "promptStats", "dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"
        ].forEach(id => { elements[id] = document.getElementById(id); });
    }

    function cacheProductElements() {
        [
            "productFields", "productType", "productPresentation", "productSetting", "productShot",
            "productComposition", "productWearContext", "productWearContextRow", "productPreservation",
            "productAspectRatio", "productTextOverlay", "productTextOverlayRow", "productCampaignFields",
            "productHeadline", "productHeadlineRow", "productTagline", "productTaglineRow",
            "productFooter", "productFooterRow", "productExtraInstruction", "productPreservationNote"
        ].forEach(id => { elements[id] = document.getElementById(id); });
    }

    function ensureStylesheet() {
        if (document.querySelector('link[data-product-catalog-style]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "product-catalog.css?v=4.5-product-1";
        link.dataset.productCatalogStyle = "true";
        document.head.append(link);
    }

    function buildProductFields() {
        if (document.getElementById("productFields")) return;
        const catalogFields = document.getElementById("catalogFields");
        if (!catalogFields) return;

        const section = document.createElement("section");
        section.id = "productFields";
        section.className = "mode-fields product-catalog-fields";
        section.hidden = true;
        section.innerHTML = `
            <div class="product-mode-intro">
                <span class="product-mode-icon">${global.PromptIcons.svg("package")}</span>
                <div>
                    <strong>Reference Product Catalog</strong>
                    <p>Attach one product reference image. The scene may change, but the original product must remain visually unchanged.</p>
                </div>
            </div>

            <div class="field-row"><label for="productType">Product Type</label><select id="productType"><option value="">-- Select Product Type --</option></select></div>
            <div class="field-row"><label for="productPresentation">Presentation Type</label><select id="productPresentation"><option value="">-- Select Presentation Type --</option></select></div>
            <div class="field-row"><label for="productSetting">Setting / Surface</label><select id="productSetting"><option value="">-- Select Product Setting --</option></select></div>
            <div class="field-row"><label for="productShot">Shot Type</label><select id="productShot"><option value="">-- Select Shot Type --</option></select></div>
            <div class="field-row"><label for="productComposition">Composition</label><select id="productComposition"><option value="">-- Select Composition --</option></select></div>

            <div class="field-row" id="productWearContextRow" hidden>
                <label for="productWearContext">Wear Context</label>
                <select id="productWearContext"><option value="">-- Select Wear Context --</option></select>
            </div>

            <div class="field-row"><label for="productPreservation">Product Preservation</label><select id="productPreservation"><option value="">-- Select Preservation Level --</option></select></div>
            <div class="field-row"><label for="productAspectRatio">Aspect Ratio</label><select id="productAspectRatio"><option value="">-- Select Aspect Ratio --</option></select></div>

            <div class="field-row" id="productTextOverlayRow" hidden>
                <label for="productTextOverlay">Campaign Text</label>
                <select id="productTextOverlay"><option value="">-- Select Text Layout --</option></select>
            </div>

            <div class="product-campaign-fields" id="productCampaignFields" hidden>
                <div class="field-row" id="productHeadlineRow" hidden>
                    <label for="productHeadline">Headline</label>
                    <input id="productHeadline" type="text" placeholder="Example: GOOD STYLE">
                </div>
                <div class="field-row" id="productTaglineRow" hidden>
                    <label for="productTagline">Tagline</label>
                    <input id="productTagline" type="text" placeholder="Example: Designed for everyday movement">
                </div>
                <div class="field-row" id="productFooterRow" hidden>
                    <label for="productFooter">Footer</label>
                    <input id="productFooter" type="text" placeholder="Example: New Collection 2026">
                </div>
            </div>

            <div class="field-row">
                <label for="productExtraInstruction">Extra Direction <span class="optional-label">optional</span></label>
                <textarea id="productExtraInstruction" class="short-textarea" placeholder="Example: warm window light, subtle editorial shadows, no extra props"></textarea>
            </div>

            <div class="product-preservation-note" id="productPreservationNote">
                <span>${global.PromptIcons.svg("shield")}</span>
                <div>
                    <strong>Product-first preservation</strong>
                    <p>Color, material, pattern, branding, shape, proportions, hardware, print placement, and other visible product details are preserved according to the selected product type.</p>
                </div>
            </div>
        `;
        catalogFields.insertAdjacentElement("afterend", section);
    }

    function bindEvents() {
        elements.promptModeGrid.addEventListener("click", handleModeClickCapture, true);
        elements.productFields.addEventListener("input", handleProductFieldEvent);
        elements.productFields.addEventListener("change", handleProductFieldEvent);
        elements.randomPromptBtn?.addEventListener("click", handleRandomCapture, true);
        elements.generatePromptBtn?.addEventListener("click", handleGenerateCapture, true);
        elements.resetFormBtn?.addEventListener("click", handleResetCapture, true);
        elements.refreshDataBtn?.addEventListener("click", () => {
            global.setTimeout(() => loadFeatureData(), 900);
        });
    }

    function observePromptModes() {
        if (modeObserver) return;
        modeObserver = new MutationObserver(() => ensureProductModeCard());
        modeObserver.observe(elements.promptModeGrid, { childList: true });
    }

    async function loadFeatureData(options = {}) {
        try {
            const result = await global.PromptDataLoader.load(options);
            database = result.data;
            populateAllProductControls();
            ensureProductModeCard();
            document.body.classList.toggle("product-catalog-ready", isFeatureReady());
        } catch (error) {
            console.warn("Reference Product Catalog data load failed:", error);
        }
    }

    function isFeatureReady() {
        return Boolean(database) && requiredCollections.every(key => Array.isArray(database[key]) && database[key].length > 0);
    }

    function previewEnabled() {
        return new URLSearchParams(global.location.search).get(PREVIEW_PARAM) === "1";
    }

    function getModeDefinition() {
        return database?.promptModes?.find(item => item.id === MODE_ID) || (previewEnabled() && isFeatureReady() ? FALLBACK_MODE : null);
    }

    function ensureProductModeCard() {
        if (!elements.promptModeGrid || !isFeatureReady()) return;
        const mode = getModeDefinition();
        let card = elements.promptModeGrid.querySelector(`[data-prompt-mode-id="${MODE_ID}"]`);

        if (!mode) {
            if (card) card.remove();
            return;
        }

        if (!card) {
            card = document.createElement("button");
            card.type = "button";
            card.className = "prompt-mode-card product-mode-card";
            card.dataset.promptModeId = MODE_ID;
            card.innerHTML = `<span class="prompt-mode-icon">${global.PromptIcons.svg(mode.icon || "package")}</span><span><strong>${escapeHtml(mode.label || FALLBACK_MODE.label)}</strong><small>${escapeHtml(mode.description || FALLBACK_MODE.description)}</small></span><span class="prompt-mode-check">${global.PromptIcons.svg("check")}</span>`;
            elements.promptModeGrid.append(card);
        }

        const copy = document.querySelector(".prompt-mode-head p");
        if (copy) copy.textContent = "Creative builds scenes freely. Reference Outfit Catalog preserves worn clothing. Reference Product Catalog creates product-first commercial images from a reference product.";

        if (productActive || requestedInitialMode === MODE_ID) {
            global.queueMicrotask(() => activateProductMode(false));
        }
    }

    function handleModeClickCapture(event) {
        const card = event.target.closest("[data-prompt-mode-id]");
        if (!card) return;
        const mode = card.dataset.promptModeId;

        if (mode === MODE_ID) {
            event.preventDefault();
            event.stopImmediatePropagation();
            activateProductMode(true);
            return;
        }

        if (productActive) {
            productActive = false;
            if (elements.productFields) elements.productFields.hidden = true;
            document.body.classList.remove("product-catalog-active");
            global.setTimeout(() => {
                global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode } }));
            }, 0);
        }
    }

    function activateProductMode(notify = true) {
        if (!isFeatureReady() || !getModeDefinition()) return;
        productActive = true;
        localStorage.setItem("promptGenPromptMode", MODE_ID);
        document.body.classList.add("product-catalog-active");

        if (elements.creativeModeSections) elements.creativeModeSections.hidden = true;
        if (elements.creativeFields) elements.creativeFields.hidden = true;
        if (elements.catalogFields) elements.catalogFields.hidden = true;
        if (elements.productFields) elements.productFields.hidden = false;
        if (elements.activeStyleBadge) elements.activeStyleBadge.hidden = true;

        if (elements.activeModeBadge) {
            elements.activeModeBadge.textContent = "Reference Product Catalog";
            elements.activeModeBadge.dataset.mode = MODE_ID;
        }
        if (elements.randomModeTitle) elements.randomModeTitle.textContent = "Product Random";
        if (elements.randomModeHint) elements.randomModeHint.textContent = "Builds a compatible product-first catalog setup";
        if (elements.randomPromptBtn) elements.randomPromptBtn.innerHTML = `${global.PromptIcons.svg("refresh")}<span class="button-label">Product Random</span>`;
        if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Reference product tip";
        if (elements.outputTipText) elements.outputTipText.textContent = "Attach one clear product reference image with the prompt. The presentation may change, but the original product itself should remain unchanged.";

        elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
            const active = card.dataset.promptModeId === MODE_ID;
            card.classList.toggle("is-active", active);
            card.setAttribute("aria-pressed", active ? "true" : "false");
        });

        syncSearchable();
        updateConditionals();
        generateProductPrompt(false);
        global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode: MODE_ID } }));
        if (notify) showMessage("Reference Product Catalog mode selected.");
    }

    function populateAllProductControls() {
        if (!database || !elements.productType) return;

        populateSelect(elements.productType, database.productTypes, { placeholder: "-- Select Product Type --", groupField: "category" });
        populateSelect(elements.productShot, database.productShots, { placeholder: "-- Select Shot Type --", groupField: "category" });
        populateSelect(elements.productComposition, database.productCompositions, { placeholder: "-- Select Composition --", groupField: "category" });
        populateSelect(elements.productPreservation, database.productPreservationLevels, { placeholder: "-- Select Preservation Level --", groupField: "category" });
        populateSelect(elements.productTextOverlay, database.productTextOverlays || [], { placeholder: "-- Select Text Layout --" });
        populateAspectRatios();

        const config = database.config || {};
        setSelectById(elements.productType, config.defaultProductType || "clothing");
        filterPresentationOptions(config.defaultProductPresentation || "hanging-product");
        setSelectById(elements.productShot, config.defaultProductShot || "full-product");
        setSelectById(elements.productComposition, config.defaultProductComposition || "single-product");
        setSelectById(elements.productPreservation, config.defaultProductPreservation || "exact-strict");
        elements.productAspectRatio.value = config.defaultProductAspectRatio || "4:5";
        setSelectById(elements.productTextOverlay, config.defaultProductTextOverlay || "none");
        updateConditionals();
        initOrRefreshSearchable();
    }

    function populateAspectRatios() {
        if (!elements.productAspectRatio) return;
        elements.productAspectRatio.innerHTML = "";
        const placeholder = new Option("-- Select Aspect Ratio --", "");
        placeholder.dataset.placeholder = "true";
        elements.productAspectRatio.append(placeholder);
        (database?.aspectRatios || []).forEach(item => {
            const value = item.value || item.label || item.id;
            const option = new Option(item.label || value, value);
            option.dataset.id = item.id || "";
            elements.productAspectRatio.append(option);
        });
    }

    function populateSelect(select, items, options = {}) {
        if (!select) return;
        const { placeholder = "-- Select --", groupField = "" } = options;
        select.innerHTML = "";
        const first = new Option(placeholder, "");
        first.dataset.placeholder = "true";
        select.append(first);

        const safeItems = Array.isArray(items) ? items : [];
        const appendItem = (parent, item) => {
            const option = new Option(item.label || item.id, item.id);
            option.dataset.id = item.id || "";
            option.dataset.category = item.category || "";
            option.dataset.searchText = [item.prompt, item.description, item.tags].filter(Boolean).join(" ");
            parent.append(option);
        };

        if (groupField) {
            const groups = new Map();
            safeItems.forEach(item => {
                const label = item[groupField] || "Other";
                if (!groups.has(label)) groups.set(label, []);
                groups.get(label).push(item);
            });
            groups.forEach((groupItems, label) => {
                const group = document.createElement("optgroup");
                group.label = label;
                groupItems.forEach(item => appendItem(group, item));
                select.append(group);
            });
        } else {
            safeItems.forEach(item => appendItem(select, item));
        }
    }

    function initOrRefreshSearchable() {
        const ids = [
            "productType", "productPresentation", "productSetting", "productShot", "productComposition",
            "productWearContext", "productPreservation", "productAspectRatio", "productTextOverlay"
        ];
        ids.forEach(id => {
            const select = elements[id];
            if (!select || !global.SearchableSelectControl) return;
            if (searchable.has(id)) searchable.get(id).refresh();
            else searchable.set(id, new global.SearchableSelectControl(select));
        });
    }

    function syncSearchable() {
        searchable.forEach(control => control.syncFromNative?.());
    }

    function refreshSearchable(ids) {
        ids.forEach(id => searchable.get(id)?.refresh?.());
    }

    function filterPresentationOptions(preferredId = "") {
        const typeId = selectedId(elements.productType) || database?.config?.defaultProductType || "clothing";
        const previous = preferredId || selectedId(elements.productPresentation);
        const items = (database?.productPresentations || []).filter(item => allows(item.allowed_product_types, typeId));
        populateSelect(elements.productPresentation, items, { placeholder: "-- Select Presentation Type --", groupField: "category" });
        const fallback = database?.config?.defaultProductPresentation || items[0]?.id || "";
        setSelectById(elements.productPresentation, items.some(item => item.id === previous) ? previous : fallback);
        refreshSearchable(["productPresentation"]);
        filterSettingOptions();
        filterWearContextOptions();
    }

    function filterSettingOptions(preferredId = "") {
        const typeId = selectedId(elements.productType);
        const presentationId = selectedId(elements.productPresentation);
        const previous = preferredId || selectedId(elements.productSetting);
        const items = (database?.productSettings || []).filter(item =>
            allows(item.allowed_product_types, typeId) && allows(item.allowed_presentations, presentationId)
        );
        populateSelect(elements.productSetting, items, { placeholder: "-- Select Product Setting --", groupField: "category" });
        const configured = database?.config?.defaultProductSetting || "minimal-studio";
        const fallback = items.some(item => item.id === configured) ? configured : items[0]?.id || "";
        setSelectById(elements.productSetting, items.some(item => item.id === previous) ? previous : fallback);
        refreshSearchable(["productSetting"]);
    }

    function filterWearContextOptions(preferredId = "") {
        const typeId = selectedId(elements.productType);
        const previous = preferredId || selectedId(elements.productWearContext);
        const items = (database?.productWearContexts || []).filter(item => allows(item.allowed_product_types, typeId));
        populateSelect(elements.productWearContext, items, { placeholder: "-- Select Wear Context --" });
        setSelectById(elements.productWearContext, items.some(item => item.id === previous) ? previous : items[0]?.id || "");
        refreshSearchable(["productWearContext"]);
    }

    function updateConditionals() {
        if (!database) return;
        const presentation = selectedItem(elements.productPresentation, database.productPresentations) || {};
        const needsWear = asBoolean(presentation.requires_wear_context, false);
        const supportsText = asBoolean(presentation.supports_text, false);

        elements.productWearContextRow.hidden = !needsWear;
        elements.productTextOverlayRow.hidden = !supportsText;
        if (!needsWear) elements.productWearContext.value = "";
        if (!supportsText) setSelectById(elements.productTextOverlay, "none");

        const overlay = selectedItem(elements.productTextOverlay, database.productTextOverlays) || {};
        const hasCampaignFields = supportsText && overlay.id && overlay.id !== "none";
        elements.productCampaignFields.hidden = !hasCampaignFields;
        elements.productHeadlineRow.hidden = !(hasCampaignFields && asBoolean(overlay.headline, false));
        elements.productTaglineRow.hidden = !(hasCampaignFields && asBoolean(overlay.tagline, false));
        elements.productFooterRow.hidden = !(hasCampaignFields && asBoolean(overlay.footer, false));
        syncSearchable();
    }

    function handleProductFieldEvent(event) {
        if (!productActive) return;
        event.stopPropagation();
        if (event.target?.classList?.contains("searchable-input")) return;

        if (event.type === "change") {
            if (event.target === elements.productType) {
                filterPresentationOptions();
                filterWearContextOptions();
            } else if (event.target === elements.productPresentation) {
                filterSettingOptions();
                filterWearContextOptions();
            }
            updateConditionals();
        }

        if (asBoolean(database?.config?.autoGenerate, true)) generateProductPrompt(false);
    }

    function collectState() {
        const presentation = selectedItem(elements.productPresentation, database.productPresentations) || {};
        const supportsText = asBoolean(presentation.supports_text, false);
        const needsWear = asBoolean(presentation.requires_wear_context, false);
        return {
            productType: selectedItem(elements.productType, database.productTypes) || {},
            presentation,
            setting: selectedItem(elements.productSetting, database.productSettings) || {},
            shot: selectedItem(elements.productShot, database.productShots) || {},
            composition: selectedItem(elements.productComposition, database.productCompositions) || {},
            wearContext: needsWear ? selectedItem(elements.productWearContext, database.productWearContexts) || {} : {},
            preservation: selectedItem(elements.productPreservation, database.productPreservationLevels) || {},
            aspectRatio: elements.productAspectRatio.value || database.config?.defaultProductAspectRatio || "4:5",
            textOverlay: supportsText ? selectedItem(elements.productTextOverlay, database.productTextOverlays) || {} : {},
            headline: elements.productHeadline.value.trim(),
            tagline: elements.productTagline.value.trim(),
            footer: elements.productFooter.value.trim(),
            extraInstruction: elements.productExtraInstruction.value.trim()
        };
    }

    function generateProductPrompt(explicit = false) {
        if (!productActive || !database) return "";
        const state = collectState();
        const prompt = global.ProductCatalogPromptBuilder.build(state);
        elements.output.value = prompt;
        elements.output.classList.toggle("is-filled", Boolean(prompt));
        elements.promptStats.textContent = `${prompt.length.toLocaleString()} characters`;
        updatePromptDna(state);
        if (explicit) {
            global.dispatchEvent(new CustomEvent("promptgen:productgenerated", { detail: { mode: MODE_ID, prompt, state: serializeState() } }));
        }
        return prompt;
    }

    function updatePromptDna(state) {
        const setNode = (node, status) => {
            if (!node) return;
            node.classList.toggle("is-ready", status === "ready");
            node.classList.toggle("is-partial", status === "partial");
        };
        setNode(elements.dnaSubject, state.productType?.id && state.preservation?.id ? "ready" : "partial");
        setNode(elements.dnaScene, state.presentation?.id && state.setting?.id ? "ready" : "partial");
        setNode(elements.dnaStyle, state.preservation?.id ? "ready" : "empty");
        setNode(elements.dnaCamera, state.shot?.id && state.composition?.id ? "ready" : "partial");
        setNode(elements.dnaLight, state.setting?.id ? "ready" : (state.extraInstruction ? "partial" : "empty"));
    }

    function handleGenerateCapture(event) {
        if (!productActive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        generateProductPrompt(true);
        showMessage("Product catalog prompt generated.");
    }

    function handleRandomCapture(event) {
        if (!productActive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        randomizeProductPrompt();
    }

    function handleResetCapture(event) {
        if (!productActive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        resetProductForm();
    }

    function randomizeProductPrompt() {
        const type = randomItem(database.productTypes);
        if (type) setSelectById(elements.productType, type.id);
        filterPresentationOptions();
        const presentations = getCurrentOptions(elements.productPresentation);
        if (presentations.length) setSelectById(elements.productPresentation, randomItem(presentations));
        filterSettingOptions();
        filterWearContextOptions();

        const presentationId = selectedId(elements.productPresentation);
        const typeId = selectedId(elements.productType);
        const compositionId = presentationId === "rack-collection"
            ? "collection"
            : typeId === "shoes" ? "pair" : "single-product";
        setSelectById(elements.productComposition, compositionId);
        setSelectById(elements.productPreservation, database.config?.defaultProductPreservation || "exact-strict");
        elements.productAspectRatio.value = database.config?.defaultProductAspectRatio || "4:5";

        const shotOptions = getCurrentOptions(elements.productShot);
        if (shotOptions.length) setSelectById(elements.productShot, randomItem(shotOptions));
        const settingOptions = getCurrentOptions(elements.productSetting);
        if (settingOptions.length) setSelectById(elements.productSetting, randomItem(settingOptions));
        if (selectedItem(elements.productPresentation, database.productPresentations)?.requires_wear_context) {
            const wearOptions = getCurrentOptions(elements.productWearContext);
            if (wearOptions.length) setSelectById(elements.productWearContext, randomItem(wearOptions));
        }
        setSelectById(elements.productTextOverlay, "none");
        elements.productHeadline.value = "";
        elements.productTagline.value = "";
        elements.productFooter.value = "";
        elements.productExtraInstruction.value = "";
        updateConditionals();
        syncSearchable();
        generateProductPrompt(false);
        showMessage("Product catalog setup randomized.");
    }

    function resetProductForm() {
        const config = database.config || {};
        setSelectById(elements.productType, config.defaultProductType || "clothing");
        filterPresentationOptions(config.defaultProductPresentation || "hanging-product");
        setSelectById(elements.productShot, config.defaultProductShot || "full-product");
        setSelectById(elements.productComposition, config.defaultProductComposition || "single-product");
        setSelectById(elements.productPreservation, config.defaultProductPreservation || "exact-strict");
        elements.productAspectRatio.value = config.defaultProductAspectRatio || "4:5";
        setSelectById(elements.productTextOverlay, config.defaultProductTextOverlay || "none");
        elements.productHeadline.value = "";
        elements.productTagline.value = "";
        elements.productFooter.value = "";
        elements.productExtraInstruction.value = "";
        updateConditionals();
        syncSearchable();
        generateProductPrompt(false);
        showMessage("Product catalog form reset.");
    }

    function serializeState() {
        return {
            productType: selectedId(elements.productType),
            productPresentation: selectedId(elements.productPresentation),
            productSetting: selectedId(elements.productSetting),
            productShot: selectedId(elements.productShot),
            productComposition: selectedId(elements.productComposition),
            productWearContext: selectedId(elements.productWearContext),
            productPreservation: selectedId(elements.productPreservation),
            productAspectRatio: elements.productAspectRatio.value,
            productTextOverlay: selectedId(elements.productTextOverlay),
            productHeadline: elements.productHeadline.value,
            productTagline: elements.productTagline.value,
            productFooter: elements.productFooter.value,
            productExtraInstruction: elements.productExtraInstruction.value
        };
    }

    function restoreState(state = {}) {
        if (!database) return { missing: ["Product database"] };
        const missing = [];
        restoreSelect(elements.productType, state.productType, "Product Type", missing);
        filterPresentationOptions(state.productPresentation);
        restoreSelect(elements.productPresentation, state.productPresentation, "Presentation", missing);
        filterSettingOptions(state.productSetting);
        restoreSelect(elements.productSetting, state.productSetting, "Product Setting", missing);
        restoreSelect(elements.productShot, state.productShot, "Product Shot", missing);
        restoreSelect(elements.productComposition, state.productComposition, "Composition", missing);
        filterWearContextOptions(state.productWearContext);
        restoreSelect(elements.productWearContext, state.productWearContext, "Wear Context", missing);
        restoreSelect(elements.productPreservation, state.productPreservation, "Preservation", missing);
        if (state.productAspectRatio && [...elements.productAspectRatio.options].some(option => option.value === state.productAspectRatio)) {
            elements.productAspectRatio.value = state.productAspectRatio;
        } else if (state.productAspectRatio) missing.push("Aspect Ratio");
        restoreSelect(elements.productTextOverlay, state.productTextOverlay, "Campaign Text", missing);
        elements.productHeadline.value = state.productHeadline || "";
        elements.productTagline.value = state.productTagline || "";
        elements.productFooter.value = state.productFooter || "";
        elements.productExtraInstruction.value = state.productExtraInstruction || "";
        updateConditionals();
        syncSearchable();
        generateProductPrompt(false);
        return { missing };
    }

    function restoreSelect(select, id, label, missing) {
        if (!id) return;
        if ([...select.options].some(option => option.dataset.id === id || option.value === id)) setSelectById(select, id);
        else missing.push(label);
    }

    function selectedItem(select, collection) {
        const id = selectedId(select);
        return id ? (collection || []).find(item => item.id === id) || null : null;
    }

    function selectedId(select) {
        return select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    }

    function setSelectById(select, id) {
        if (!select) return;
        if (!id) { select.value = ""; return; }
        const option = [...select.options].find(item => item.dataset.id === id || item.value === id);
        if (option) select.value = option.value;
    }

    function getCurrentOptions(select) {
        return [...(select?.options || [])].filter(option => option.value && !option.disabled).map(option => option.dataset.id || option.value);
    }

    function allows(value, target) {
        const list = parseList(value);
        if (!list.length || list.includes("all")) return true;
        return target ? list.includes(String(target).toLowerCase()) : true;
    }

    function parseList(value) {
        if (Array.isArray(value)) return value.map(item => String(item).trim().toLowerCase()).filter(Boolean);
        return String(value || "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
    }

    function asBoolean(value, fallback = false) {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value;
        return !["false", "0", "no", "off", "inactive"].includes(String(value).trim().toLowerCase());
    }

    function randomItem(items) {
        return Array.isArray(items) && items.length ? items[Math.floor(Math.random() * items.length)] : null;
    }

    function showMessage(text) {
        const box = document.getElementById("messageBox");
        if (!box) return;
        box.textContent = text;
        box.classList.add("is-visible");
        global.clearTimeout(showMessage.timer);
        showMessage.timer = global.setTimeout(() => box.classList.remove("is-visible"), 2600);
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>'\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;" }[char]));
    }

    global.ProductCatalogMode = {
        id: MODE_ID,
        isReady: isFeatureReady,
        isActive: () => productActive,
        activate: () => activateProductMode(true),
        generate: () => generateProductPrompt(false),
        getState: serializeState,
        restoreState,
        refreshData: loadFeatureData
    };
})(window);