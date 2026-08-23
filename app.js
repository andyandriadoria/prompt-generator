(function () {
    "use strict";

    let database = null;
    let initializedOnce = false;
    let messageTimer = null;
    let currentMode = "creative";
    let activeStylePresetId = "";
    const elements = {};
    const searchable = new Map();

    const MODE_FALLBACKS = [
        { id: "creative", label: "Creative Prompt Builder", icon: "✨", description: "Flexible character, scene, style, camera, and lighting builder.", active: true, sort: 1 },
        { id: "outfit_catalog", label: "Reference Outfit Catalog", icon: "👗", description: "Strict reference-image fashion prompts that preserve the original outfit.", active: true, sort: 2 }
    ];

    const SEARCHABLE_CONFIG = {
        characterPreset: { type: "character", collection: "characters", smart: true },
        action: { type: "pose", collection: "poses", smart: true },
        expression: { type: "expression", collection: "expressions", smart: true },
        outfit: { type: "outfit", collection: "outfits", smart: true },
        setting: { type: "setting", collection: "settings", smart: true },
        cameraAngle: { type: "cameraAngle", collection: "cameraAngles", smart: true },
        lighting: { type: "lighting", collection: "lighting", smart: true },
        cameraType: { type: "cameraType", collection: "cameraStyles", smart: true },
        catalogSubject: { collection: "catalogSubjects" },
        catalogType: { collection: "catalogTypes" },
        preservationLevel: { collection: "preservationLevels" },
        catalogSetting: { collection: "catalogSettings" },
        catalogPose: { collection: "catalogPoses" },
        catalogShot: { collection: "catalogShots" }
    };

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();
        restoreTheme();
        restorePreferences();
        bindEvents();
        elements.apiUrlInput.value = PromptDataLoader.getApiUrl();
        await loadDatabase();
    }

    function cacheElements() {
        [
            "appTitle", "appSubtitle", "creatorName", "footerVersion",
            "themeToggle", "dataStatus", "dataStatusText",
            "apiUrlInput", "saveApiUrlBtn", "refreshDataBtn", "useFallbackBtn", "resetSourceBtn",
            "promptModeGrid", "creativeModeSections", "creativeFields", "catalogFields",
            "randomModeTitle", "randomModeHint", "activeModeBadge", "outputTipTitle", "outputTipText",
            "compatibilityToggle", "compatibilityMode", "compatibilityResult", "compatibilityScore",
            "compatibilityLabel", "compatibilityHint", "compatibilityMessages",
            "stylePresetGrid", "stylePresetSummary", "stylePresetSummaryIcon",
            "stylePresetSummaryTitle", "stylePresetSummaryText", "clearStylePresetBtn",
            "includeNegativePrompt", "activeStyleBadge",
            "promptForm", "characterPreset", "subjectGender", "features", "action", "expression",
            "outfit", "manualOutfit", "manualOutfitRow", "setting", "cameraAngle", "lighting",
            "cameraType", "aspectRatioGroup",
            "catalogSubject", "catalogCustomSubject", "catalogCustomSubjectRow", "catalogType",
            "preservationLevel", "catalogSetting", "catalogCustomSetting", "catalogCustomSettingRow",
            "catalogPose", "catalogShot", "catalogAspectRatio", "catalogExtraInstruction", "catalogSafetyNote",
            "randomPromptBtn", "generatePromptBtn", "resetFormBtn", "copyToClipboardBtn",
            "output", "promptStats", "messageBox"
        ].forEach(id => { elements[id] = document.getElementById(id); });
    }

    function bindEvents() {
        elements.themeToggle.addEventListener("click", toggleTheme);
        elements.saveApiUrlBtn.addEventListener("click", saveApiSource);
        elements.refreshDataBtn.addEventListener("click", () => loadDatabase({ forceRefresh: true }));
        elements.useFallbackBtn.addEventListener("click", selectFallbackSource);
        elements.resetSourceBtn.addEventListener("click", resetDataSource);

        elements.promptModeGrid.addEventListener("click", event => {
            const card = event.target.closest("[data-prompt-mode-id]");
            if (card) setPromptMode(card.dataset.promptModeId, true);
        });

        elements.clearStylePresetBtn.addEventListener("click", () => clearStylePreset(true));
        elements.stylePresetGrid.addEventListener("click", event => {
            const card = event.target.closest("[data-style-preset-id]");
            if (card) selectStylePreset(card.dataset.stylePresetId, true);
        });
        document.querySelectorAll('input[name="styleApplyMode"]').forEach(input => {
            input.addEventListener("change", () => localStorage.setItem("promptGenStyleApplyMode", input.value));
        });
        elements.includeNegativePrompt.addEventListener("change", () => {
            localStorage.setItem("promptGenIncludeNegativePrompt", elements.includeNegativePrompt.checked ? "true" : "false");
            maybeGenerate();
        });

        elements.compatibilityToggle.addEventListener("change", () => {
            localStorage.setItem("promptGenSmartCompatibility", elements.compatibilityToggle.checked ? "true" : "false");
            updateToggleLabel();
            updateCompatibility();
        });
        elements.compatibilityMode.addEventListener("change", () => {
            localStorage.setItem("promptGenCompatibilityMode", elements.compatibilityMode.value);
            updateCompatibility();
        });

        elements.characterPreset.addEventListener("change", handleCharacterChange);
        elements.outfit.addEventListener("change", toggleManualOutfit);
        document.querySelectorAll('input[name="settingType"]').forEach(input => {
            input.addEventListener("change", () => {
                populateSettings();
                updateCompatibility();
                maybeGenerate();
            });
        });

        elements.catalogSubject.addEventListener("change", () => {
            toggleCatalogCustomRows();
            refreshCatalogCompatibility();
            maybeGenerate();
        });
        elements.catalogSetting.addEventListener("change", () => {
            toggleCatalogCustomRows();
            maybeGenerate();
        });

        elements.randomPromptBtn.addEventListener("click", randomizeCurrentMode);
        elements.generatePromptBtn.addEventListener("click", generatePrompt);
        elements.resetFormBtn.addEventListener("click", resetForm);
        elements.copyToClipboardBtn.addEventListener("click", copyPrompt);
        elements.promptForm.addEventListener("input", handleFormChange);
        elements.promptForm.addEventListener("change", handleFormChange);
    }

    async function loadDatabase(options = {}) {
        setStatus("loading", options.forceRefresh ? "Refreshing Google Sheets…" : "Loading database…");
        setControlsDisabled(true);
        try {
            const result = await PromptDataLoader.load(options);
            database = result.data;
            applyAppConfig();
            populateAllControls();
            renderPromptModes();
            renderStylePresets();
            initOrRefreshSearchableControls();
            setDefaults();
            setPromptMode(localStorage.getItem("promptGenPromptMode") || database.config?.defaultPromptMode || "creative", false);
            setStatus(result.source === "api" ? "online" : "warning", result.message);
            generatePrompt();
            updateCompatibility();
            initializedOnce = true;
            if (options.forceRefresh) showMessage("Database refreshed from Google Sheets.");
        } catch (error) {
            console.error(error);
            setStatus("error", "Database failed to load");
            showMessage(error.message || "Database failed to load.");
        } finally {
            setControlsDisabled(false);
        }
    }

    function applyAppConfig() {
        const config = database.config || {};
        const title = config.appTitle || "Prompt Gen 4.3";
        elements.appTitle.textContent = title;
        document.title = title;
        elements.appSubtitle.textContent = config.subtitle || "Multi-Mode Prompt Builder";
        elements.creatorName.textContent = config.creatorName || "Ndoy Creator";
        elements.footerVersion.textContent = title;

        if (!initializedOnce && localStorage.getItem("promptGenSmartCompatibility") === null) {
            elements.compatibilityToggle.checked = asBoolean(config.smartCompatibility, true);
        }
        if (!initializedOnce && !localStorage.getItem("promptGenCompatibilityMode")) {
            elements.compatibilityMode.value = optionExists(elements.compatibilityMode, config.compatibilityMode)
                ? config.compatibilityMode : "prioritize";
        }
        if (!initializedOnce && !localStorage.getItem("promptGenStyleApplyMode")) {
            setRadioValue("styleApplyMode", config.styleApplyMode || "replace");
        }
        if (!initializedOnce && localStorage.getItem("promptGenIncludeNegativePrompt") === null) {
            elements.includeNegativePrompt.checked = asBoolean(config.includeNegativePrompt, false);
        }
        updateToggleLabel();
    }

    function populateAllControls() {
        populateSelect(elements.characterPreset, database.characters, { placeholder: "-- Custom Character --", placeholderValue: "custom", groupField: "category" });
        populateSelect(elements.action, database.poses, { placeholder: "-- Select Pose / Action --", groupField: "category" });
        populateSelect(elements.expression, database.expressions, { placeholder: "-- Select Facial Expression --", groupField: "category" });
        populateSelect(elements.outfit, database.outfits, {
            placeholder: "-- Select Outfit --", groupField: "category",
            afterPlaceholder: [{ value: "manual_outfit", label: "Enter custom outfit", id: "manual-outfit", tags: "manual,custom" }]
        });
        populateSelect(elements.cameraAngle, database.cameraAngles, { placeholder: "-- Select Camera Angle --", groupField: "category" });
        populateSelect(elements.lighting, database.lighting, { placeholder: "-- Select Lighting --", groupField: "category" });
        populateSelect(elements.cameraType, database.cameraStyles, { placeholder: "-- Select Camera Style --", groupField: "category" });
        populateAspectRatios();
        populateSettings();
        populateCatalogControls();
    }

    function populateCatalogControls() {
        populateSelect(elements.catalogSubject, database.catalogSubjects, { placeholder: "-- Custom Subject --", placeholderValue: "custom", groupField: "category" });
        populateSelect(elements.catalogType, database.catalogTypes, { placeholder: "-- Select Catalog Type --", groupField: "category" });
        populateSelect(elements.preservationLevel, database.preservationLevels, { placeholder: "-- Select Preservation Level --", groupField: "category" });
        populateSelect(elements.catalogSetting, database.catalogSettings, {
            placeholder: "-- Select Catalog Setting --", groupField: "category",
            afterPlaceholder: [{ value: "manual_setting", label: "Enter custom setting", id: "manual-setting", tags: "manual,custom" }]
        });
        populateSelect(elements.catalogPose, database.catalogPoses, { placeholder: "-- Select Catalog Pose --", groupField: "category" });
        populateSelect(elements.catalogShot, database.catalogShots, { placeholder: "-- Select Shot Type --", groupField: "category" });

        const ratios = (database.aspectRatios || []).map(item => ({ ...item, prompt: item.value || item.label }));
        populateSelect(elements.catalogAspectRatio, ratios, { placeholder: "-- Select Aspect Ratio --" });
        [...elements.catalogAspectRatio.options].forEach(option => {
            if (option.dataset.id) {
                const item = database.aspectRatios.find(row => row.id === option.dataset.id);
                option.value = item?.value || item?.label || option.value;
            }
        });
        toggleCatalogCustomRows();
    }

    function populateSelect(select, items, options = {}) {
        if (!select) return;
        const { placeholder = "-- Select --", placeholderValue = "", groupField = "", afterPlaceholder = [] } = options;
        select.innerHTML = "";
        const placeholderOption = new Option(placeholder, placeholderValue);
        placeholderOption.dataset.placeholder = "true";
        select.append(placeholderOption);
        afterPlaceholder.forEach(item => {
            const option = new Option(item.label, item.value);
            option.dataset.id = item.id || "";
            option.dataset.tags = item.tags || "";
            option.dataset.searchText = item.label || "";
            select.append(option);
        });

        const addOption = (parent, item) => {
            const option = new Option(item.label, item.id);
            option.dataset.id = item.id || "";
            option.dataset.category = item.category || "";
            option.dataset.tags = normalizeTags(item.tags).join(",");
            option.dataset.searchText = [item.prompt, item.features, item.description, item.type, item.audience].filter(Boolean).join(" ");
            parent.append(option);
        };

        const safeItems = Array.isArray(items) ? items : [];
        if (groupField) {
            const groups = new Map();
            safeItems.forEach(item => {
                const group = item[groupField] || "Other";
                if (!groups.has(group)) groups.set(group, []);
                groups.get(group).push(item);
            });
            groups.forEach((groupItems, label) => {
                const optgroup = document.createElement("optgroup");
                optgroup.label = label;
                groupItems.forEach(item => addOption(optgroup, item));
                select.append(optgroup);
            });
        } else {
            safeItems.forEach(item => addOption(select, item));
        }
    }

    function populateSettings() {
        const type = getRadioValue("settingType") || "outdoor";
        const previousId = elements.setting.selectedOptions[0]?.dataset.id || "";
        const items = (database.settings || []).filter(item => String(item.type || "outdoor").toLowerCase() === type);
        populateSelect(elements.setting, items, { placeholder: "-- Select Setting --", groupField: "category" });
        if (previousId && items.some(item => item.id === previousId)) setSelectByItemId(elements.setting, previousId);
        searchable.get("setting")?.refresh();
    }

    function populateAspectRatios() {
        elements.aspectRatioGroup.innerHTML = "";
        (database.aspectRatios || []).forEach(item => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "aspectRatio";
            input.value = item.value || item.label;
            label.append(input, document.createTextNode(` ${item.label}`));
            elements.aspectRatioGroup.append(label);
        });
    }

    function renderPromptModes() {
        const modes = (database.promptModes?.length ? database.promptModes : MODE_FALLBACKS)
            .filter(item => ["creative", "outfit_catalog"].includes(item.id));
        elements.promptModeGrid.innerHTML = "";
        modes.forEach(mode => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "prompt-mode-card";
            button.dataset.promptModeId = mode.id;
            button.innerHTML = `<span class="prompt-mode-icon">${escapeHtml(mode.icon || "✨")}</span><span><strong>${escapeHtml(mode.label)}</strong><small>${escapeHtml(mode.description || "")}</small></span><span class="prompt-mode-check">✓</span>`;
            elements.promptModeGrid.append(button);
        });
    }

    function setPromptMode(mode, notify = true) {
        const next = mode === "outfit_catalog" ? "outfit_catalog" : "creative";
        currentMode = next;
        localStorage.setItem("promptGenPromptMode", currentMode);
        const isCatalog = currentMode === "outfit_catalog";
        elements.creativeModeSections.hidden = isCatalog;
        elements.creativeFields.hidden = isCatalog;
        elements.catalogFields.hidden = !isCatalog;
        elements.activeStyleBadge.hidden = isCatalog || !activeStylePresetId;
        elements.activeModeBadge.textContent = isCatalog ? "Reference Outfit Catalog" : "Creative";
        elements.activeModeBadge.dataset.mode = currentMode;
        elements.randomModeTitle.textContent = isCatalog ? "Catalog Random" : "Smart Random";
        elements.randomModeHint.textContent = isCatalog ? "Builds a safe, coherent catalog setup" : "Builds a more coherent combination";
        elements.randomPromptBtn.textContent = isCatalog ? "🎲 Catalog Random" : "🎲 Smart Random";
        elements.outputTipTitle.textContent = isCatalog ? "Reference outfit tip" : "Smart tip";
        elements.outputTipText.textContent = isCatalog
            ? "Attach the clothing reference image when using the prompt. Strict preservation language is automatically included."
            : "Select a style card first, then use searchable dropdowns. Smart Compatibility will prioritize choices that fit the active style.";
        elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
            card.classList.toggle("is-active", card.dataset.promptModeId === currentMode);
            card.setAttribute("aria-pressed", card.dataset.promptModeId === currentMode ? "true" : "false");
        });
        if (isCatalog) refreshCatalogCompatibility();
        else updateCompatibility();
        syncAllSearchable();
        generatePrompt();
        if (notify) showMessage(isCatalog ? "Reference Outfit Catalog mode selected." : "Creative Prompt Builder selected.");
    }

    function initOrRefreshSearchableControls() {
        Object.entries(SEARCHABLE_CONFIG).forEach(([id]) => {
            const select = elements[id];
            if (!select) return;
            if (searchable.has(id)) searchable.get(id).refresh();
            else searchable.set(id, new SearchableSelectControl(select));
        });
    }

    function syncAllSearchable() {
        searchable.forEach(control => control.syncFromNative());
    }

    function setDefaults() {
        const config = database.config || {};
        elements.characterPreset.value = config.defaultCharacter || "custom";
        elements.subjectGender.value = config.defaultGender || "auto";
        setRadioValue("settingType", config.defaultSettingType || "outdoor");
        populateSettings();
        setRadioValue("aspectRatio", config.defaultAspectRatio || "9:16");

        const storedStyle = localStorage.getItem("promptGenStylePreset") || "";
        if (storedStyle && database.stylePresets?.some(item => item.id === storedStyle)) selectStylePreset(storedStyle, true, false);

        setSelectByItemId(elements.catalogSubject, config.defaultCatalogSubject || "young-indonesian-hijabi-girl");
        setSelectByItemId(elements.preservationLevel, config.defaultPreservationLevel || "exact-strict");
        setSelectByItemId(elements.catalogSetting, config.defaultCatalogSetting || "luxury-living-room");
        elements.catalogAspectRatio.value = config.defaultCatalogAspectRatio || "4:5";
        setSelectByItemId(elements.catalogType, config.defaultCatalogType || "modest-children");
        setSelectByItemId(elements.catalogShot, config.defaultCatalogShot || "medium-shot");
        setSelectByItemId(elements.catalogPose, config.defaultCatalogPose || "natural-pose");
        refreshCatalogCompatibility();
        toggleManualOutfit();
        toggleCatalogCustomRows();
        markAllFields();
        syncAllSearchable();
    }

    function handleCharacterChange() {
        const character = getSelectedItem(elements.characterPreset, database.characters);
        if (character) {
            elements.features.value = character.features || "";
            if (elements.subjectGender.value === "auto" && character.gender) elements.subjectGender.dataset.inferred = character.gender;
        } else if (elements.characterPreset.value === "custom") {
            elements.subjectGender.dataset.inferred = "";
        }
        markFilled(elements.features);
        updateCompatibility();
        maybeGenerate();
    }

    function handleFormChange(event) {
        if (!event.target || event.target.classList?.contains("searchable-input")) return;
        markFilled(event.target);
        if (currentMode === "outfit_catalog") {
            if (event.target === elements.catalogSubject) refreshCatalogCompatibility();
            toggleCatalogCustomRows();
        } else {
            updateCompatibility();
        }
        maybeGenerate();
    }

    function toggleManualOutfit() {
        const manual = elements.outfit.value === "manual_outfit";
        elements.manualOutfitRow.hidden = !manual;
        if (!manual) elements.manualOutfit.value = "";
    }

    function toggleCatalogCustomRows() {
        elements.catalogCustomSubjectRow.hidden = elements.catalogSubject.value !== "custom";
        elements.catalogCustomSettingRow.hidden = elements.catalogSetting.value !== "manual_setting";
    }

    function maybeGenerate() {
        if (asBoolean(database?.config?.autoGenerate, true)) generatePrompt();
    }

    function collectCreativeState() {
        const selectedCharacter = getSelectedItem(elements.characterPreset, database.characters);
        const selectedPose = getSelectedItem(elements.action, database.poses);
        const selectedExpression = getSelectedItem(elements.expression, database.expressions);
        const selectedOutfit = getSelectedItem(elements.outfit, database.outfits);
        const selectedSetting = getSelectedItem(elements.setting, database.settings);
        const selectedCameraAngle = getSelectedItem(elements.cameraAngle, database.cameraAngles);
        const selectedLighting = getSelectedItem(elements.lighting, database.lighting);
        const selectedCameraType = getSelectedItem(elements.cameraType, database.cameraStyles);
        const selectedStylePreset = getActiveStylePreset();
        return {
            config: database.config || {},
            stylePreset: selectedStylePreset,
            includeNegativePrompt: elements.includeNegativePrompt.checked,
            features: elements.features.value.trim(),
            gender: elements.subjectGender.value,
            characterGender: selectedCharacter?.gender || "",
            action: selectedPose?.prompt || "",
            expression: selectedExpression?.prompt || "",
            outfit: elements.outfit.value === "manual_outfit" ? elements.manualOutfit.value.trim() : selectedOutfit?.prompt || "",
            setting: selectedSetting?.prompt || "",
            cameraAngle: selectedCameraAngle?.prompt || "",
            lighting: selectedLighting?.prompt || "",
            cameraType: selectedCameraType?.prompt || "",
            aspectRatio: getRadioValue("aspectRatio")
        };
    }

    function collectCatalogState() {
        const subjectItem = getSelectedItem(elements.catalogSubject, database.catalogSubjects);
        const typeItem = getSelectedItem(elements.catalogType, database.catalogTypes);
        const preservation = getSelectedItem(elements.preservationLevel, database.preservationLevels) || {};
        const settingItem = getSelectedItem(elements.catalogSetting, database.catalogSettings);
        const poseItem = getSelectedItem(elements.catalogPose, database.catalogPoses);
        const shotItem = getSelectedItem(elements.catalogShot, database.catalogShots);
        const isChild = subjectItem ? isChildSubject(subjectItem) : /\b(child|kid|girl|boy|years?-old)\b/i.test(elements.catalogCustomSubject.value);
        return {
            subject: elements.catalogSubject.value === "custom" ? elements.catalogCustomSubject.value.trim() : subjectItem?.prompt || "",
            catalogType: typeItem?.prompt || "a clothing catalog",
            preservation,
            setting: elements.catalogSetting.value === "manual_setting" ? elements.catalogCustomSetting.value.trim() : settingItem?.prompt || "",
            pose: poseItem?.prompt || "Natural pose",
            shot: shotItem?.prompt || "medium shot",
            aspectRatio: elements.catalogAspectRatio.value || database.config?.defaultCatalogAspectRatio || "4:5",
            ageAppropriate: isChild,
            closingStyle: typeItem?.closing_prompt || typeItem?.closingPrompt || (isChild ? "Family-friendly children's fashion photography" : "Professional fashion photography"),
            extraInstruction: elements.catalogExtraInstruction.value.trim()
        };
    }

    function generatePrompt() {
        if (!database) return;
        const prompt = currentMode === "outfit_catalog"
            ? CatalogPromptBuilder.build(collectCatalogState())
            : PromptBuilder.build(collectCreativeState());
        elements.output.value = prompt;
        elements.promptStats.textContent = `${prompt.length.toLocaleString()} characters`;
        markFilled(elements.output);
    }

    function buildCompatibilitySelection() {
        return {
            character: getSelectedItem(elements.characterPreset, database.characters),
            pose: getSelectedItem(elements.action, database.poses),
            expression: getSelectedItem(elements.expression, database.expressions),
            outfit: getSelectedItem(elements.outfit, database.outfits),
            setting: getSelectedItem(elements.setting, database.settings),
            cameraAngle: getSelectedItem(elements.cameraAngle, database.cameraAngles),
            lighting: getSelectedItem(elements.lighting, database.lighting),
            cameraType: getSelectedItem(elements.cameraType, database.cameraStyles),
            style: getActiveStylePreset()
        };
    }

    function updateCompatibility() {
        if (!database || currentMode !== "creative") return;
        const enabled = elements.compatibilityToggle.checked;
        const selection = buildCompatibilitySelection();
        if (!enabled) {
            renderCompatibility({ score: 100, level: "great", label: "Smart Compatibility off", messages: [] }, selection, false);
            Object.keys(SEARCHABLE_CONFIG).forEach(id => { if (SEARCHABLE_CONFIG[id].smart) searchable.get(id)?.resetCompatibility(); });
            return;
        }
        const result = CompatibilityEngine.evaluate(database, selection);
        renderCompatibility(result, selection, true);
        const mode = elements.compatibilityMode.value;
        Object.entries(SEARCHABLE_CONFIG).forEach(([id, config]) => {
            if (!config.smart) return;
            const control = searchable.get(id);
            const candidates = database[config.collection] || [];
            if (!control || !candidates.length) return;
            const ranking = CompatibilityEngine.rankCandidates(database, selection, config.type, candidates);
            control.setCompatibility(ranking, mode);
        });
    }

    function renderCompatibility(result, selection, enabled) {
        elements.compatibilityResult.dataset.level = result.level || "great";
        elements.compatibilityScore.textContent = String(result.score ?? 100);
        elements.compatibilityLabel.textContent = result.label || "Compatible";
        const selectedCount = [selection.pose, selection.expression, selection.outfit, selection.setting, selection.style].filter(Boolean).length;
        elements.compatibilityHint.textContent = !enabled
            ? "Enable Smart Compatibility to prioritize coherent combinations."
            : selectedCount < 2 ? "Choose more fields to receive stronger compatibility guidance."
            : selection.style ? `Current choices are evaluated against “${selection.style.label}”.` : "Current pose, outfit, setting, and technical choices are being evaluated.";
        elements.compatibilityMessages.innerHTML = "";
        (result.messages || []).slice(0, 4).forEach(message => {
            const li = document.createElement("li");
            li.dataset.severity = message.severity || "info";
            li.textContent = message.text;
            elements.compatibilityMessages.append(li);
        });
    }

    function refreshCatalogCompatibility() {
        if (!database) return;
        const subject = getSelectedItem(elements.catalogSubject, database.catalogSubjects);
        const child = subject ? isChildSubject(subject) : false;
        const previousType = elements.catalogType.selectedOptions[0]?.dataset.id || "";
        const previousPose = elements.catalogPose.selectedOptions[0]?.dataset.id || "";

        const types = (database.catalogTypes || []).filter(item => {
            if (!child) return true;
            return ["child", "all", "family"].includes(String(item.audience || "all").toLowerCase());
        });
        const poses = (database.catalogPoses || []).filter(item => !child || asBoolean(item.child_safe, true));
        populateSelect(elements.catalogType, types, { placeholder: "-- Select Catalog Type --", groupField: "category" });
        populateSelect(elements.catalogPose, poses, { placeholder: "-- Select Catalog Pose --", groupField: "category" });
        if (previousType && types.some(item => item.id === previousType)) setSelectByItemId(elements.catalogType, previousType);
        else if (child) setSelectByItemId(elements.catalogType, database.config?.defaultCatalogType || "modest-children");
        if (previousPose && poses.some(item => item.id === previousPose)) setSelectByItemId(elements.catalogPose, previousPose);
        else setSelectByItemId(elements.catalogPose, database.config?.defaultCatalogPose || "natural-pose");
        searchable.get("catalogType")?.refresh();
        searchable.get("catalogPose")?.refresh();
        elements.catalogSafetyNote.dataset.active = child ? "true" : "false";
    }

    function isChildSubject(item) {
        return asBoolean(item.child_safe, false) || String(item.age_group || "").toLowerCase() === "child";
    }

    function renderStylePresets() {
        const presets = Array.isArray(database?.stylePresets) ? database.stylePresets : [];
        elements.stylePresetGrid.innerHTML = "";
        if (!presets.length) {
            const empty = document.createElement("p");
            empty.className = "help-text";
            empty.textContent = "No active style presets found in the database.";
            elements.stylePresetGrid.append(empty);
            return;
        }
        presets.forEach(preset => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "style-preset-card";
            card.dataset.stylePresetId = preset.id;
            const ratio = findLabel(database.aspectRatios, preset.aspect_ratio_id);
            const lighting = findLabel(database.lighting, preset.lighting_id);
            card.innerHTML = `<span class="style-preset-icon">${escapeHtml(preset.icon || "✨")}</span><span class="style-preset-copy"><strong>${escapeHtml(preset.label)}</strong><small>${escapeHtml(preset.description || "")}</small><span class="style-preset-meta">${ratio ? `<span>${escapeHtml(ratio)}</span>` : ""}${lighting ? `<span>${escapeHtml(lighting)}</span>` : ""}</span></span>`;
            elements.stylePresetGrid.append(card);
        });
        updateStylePresetUI();
    }

    function getActiveStylePreset() {
        return database?.stylePresets?.find(item => item.id === activeStylePresetId) || null;
    }

    function selectStylePreset(id, applySettings = true, notify = true) {
        const preset = database?.stylePresets?.find(item => item.id === id);
        if (!preset) return;
        activeStylePresetId = id;
        localStorage.setItem("promptGenStylePreset", id);
        if (applySettings) applyStyleTechnicalSettings(preset);
        updateStylePresetUI();
        updateCompatibility();
        generatePrompt();
        if (notify) showMessage(`${preset.label} applied.`);
    }

    function applyStyleTechnicalSettings(preset) {
        const mode = getRadioValue("styleApplyMode") || "replace";
        const applySelect = (select, id) => {
            if (!id || (mode === "merge" && select.value)) return;
            setSelectByItemId(select, id);
        };
        applySelect(elements.cameraType, preset.camera_style_id || preset.cameraStyleId);
        applySelect(elements.cameraAngle, preset.camera_angle_id || preset.cameraAngleId);
        applySelect(elements.lighting, preset.lighting_id || preset.lightingId);
        const ratioId = preset.aspect_ratio_id || preset.aspectRatioId;
        const ratio = database.aspectRatios?.find(item => item.id === ratioId);
        if (ratio && (mode === "replace" || !getRadioValue("aspectRatio"))) setRadioValue("aspectRatio", ratio.value || ratio.label);
        syncAllSearchable();
    }

    function clearStylePreset(notify = true) {
        activeStylePresetId = "";
        localStorage.removeItem("promptGenStylePreset");
        updateStylePresetUI();
        updateCompatibility();
        generatePrompt();
        if (notify) showMessage("Style preset cleared.");
    }

    function updateStylePresetUI() {
        const preset = getActiveStylePreset();
        elements.stylePresetGrid.querySelectorAll("[data-style-preset-id]").forEach(card => {
            card.classList.toggle("is-active", card.dataset.stylePresetId === preset?.id);
        });
        elements.stylePresetSummary.dataset.active = preset ? "true" : "false";
        elements.stylePresetSummaryIcon.textContent = preset?.icon || "✨";
        elements.stylePresetSummaryTitle.textContent = preset?.label || "No style selected";
        elements.stylePresetSummaryText.textContent = preset?.description || "Choose a style card to shape the visual language and technical settings.";
        elements.activeStyleBadge.hidden = currentMode === "outfit_catalog" || !preset;
        elements.activeStyleBadge.textContent = preset ? `${preset.icon || "✨"} ${preset.label}` : "No style";
    }

    function randomizeCurrentMode() {
        if (!database) return;
        if (currentMode === "outfit_catalog") randomizeCatalogPrompt();
        else smartRandomizeCreativePrompt();
    }

    function smartRandomizeCreativePrompt() {
        const character = randomItem(database.characters);
        if (character) setSelectByItemId(elements.characterPreset, character.id);
        handleCharacterChange();
        let selection = buildCompatibilitySelection();
        const pose = pickCompatibleCandidate("pose", database.poses, selection);
        setSelectByItemId(elements.action, pose?.id); selection = { ...selection, pose };
        const outfit = pickCompatibleCandidate("outfit", database.outfits, selection);
        setSelectByItemId(elements.outfit, outfit?.id); selection = { ...selection, outfit };
        const setting = pickCompatibleCandidate("setting", database.settings, selection);
        if (setting) {
            setRadioValue("settingType", setting.type || "outdoor");
            populateSettings();
            setSelectByItemId(elements.setting, setting.id);
            selection = { ...selection, setting };
        }
        const expression = pickCompatibleCandidate("expression", database.expressions, selection);
        setSelectByItemId(elements.expression, expression?.id);
        const activeStyle = getActiveStylePreset();
        if (activeStyle) applyStyleTechnicalSettings(activeStyle);
        else {
            elements.cameraAngle.value = randomOptionValue(elements.cameraAngle);
            elements.lighting.value = randomOptionValue(elements.lighting);
            elements.cameraType.value = randomOptionValue(elements.cameraType);
            setRadioValue("aspectRatio", randomItem(database.aspectRatios.map(item => item.value || item.label)) || "9:16");
        }
        markAllFields(); syncAllSearchable(); updateCompatibility(); generatePrompt();
        showMessage("Smart random prompt generated.");
    }

    function randomizeCatalogPrompt() {
        const subject = randomItem(database.catalogSubjects);
        if (subject) setSelectByItemId(elements.catalogSubject, subject.id);
        refreshCatalogCompatibility();
        const child = subject ? isChildSubject(subject) : false;
        const types = (database.catalogTypes || []).filter(item => !child || ["child", "all", "family"].includes(String(item.audience || "all").toLowerCase()));
        const poses = (database.catalogPoses || []).filter(item => !child || asBoolean(item.child_safe, true));
        setSelectByItemId(elements.catalogType, randomItem(types)?.id || database.config?.defaultCatalogType);
        setSelectByItemId(elements.preservationLevel, database.config?.defaultPreservationLevel || "exact-strict");
        setSelectByItemId(elements.catalogSetting, randomItem(database.catalogSettings)?.id);
        setSelectByItemId(elements.catalogPose, randomItem(poses)?.id || database.config?.defaultCatalogPose);
        setSelectByItemId(elements.catalogShot, randomItem(database.catalogShots)?.id || database.config?.defaultCatalogShot);
        elements.catalogAspectRatio.value = database.config?.defaultCatalogAspectRatio || "4:5";
        elements.catalogExtraInstruction.value = "";
        toggleCatalogCustomRows(); markAllFields(); syncAllSearchable(); generatePrompt();
        showMessage("Catalog prompt generated with safe matching choices.");
    }

    function pickCompatibleCandidate(type, candidates, selection) {
        if (!Array.isArray(candidates) || !candidates.length) return null;
        const ranking = CompatibilityEngine.rankCandidates(database, selection, type, candidates);
        const scored = candidates.map(item => ({ item, result: ranking.get(item.id) }))
            .sort((a, b) => (b.result?.rankingScore ?? b.result?.score ?? 100) - (a.result?.rankingScore ?? a.result?.score ?? 100));
        const best = scored[0]?.result?.rankingScore ?? scored[0]?.result?.score ?? 100;
        const pool = scored.filter(entry => !entry.result?.blocked && (entry.result?.rankingScore ?? entry.result?.score ?? 100) >= Math.max(70, best - 12)).slice(0, 24);
        return randomItem(pool.length ? pool : scored)?.item || null;
    }

    function resetForm() {
        elements.promptForm.reset();
        elements.features.value = "";
        elements.manualOutfit.value = "";
        elements.catalogCustomSubject.value = "";
        elements.catalogCustomSetting.value = "";
        elements.catalogExtraInstruction.value = "";
        elements.characterPreset.value = "custom";
        activeStylePresetId = "";
        localStorage.removeItem("promptGenStylePreset");
        updateStylePresetUI();
        setDefaults();
        refreshCatalogCompatibility();
        updateCompatibility();
        generatePrompt();
        showMessage("Form reset.");
    }

    async function copyPrompt() {
        const text = elements.output.value.trim();
        if (!text) return showMessage("Generate a prompt first.");
        try { await navigator.clipboard.writeText(text); }
        catch {
            elements.output.focus(); elements.output.select(); document.execCommand("copy");
        }
        showMessage("Prompt copied to clipboard.");
    }

    async function saveApiSource() {
        try {
            PromptDataLoader.saveApiUrl(elements.apiUrlInput.value);
            showMessage("API URL saved. Refreshing data…");
            await loadDatabase({ forceRefresh: true });
        } catch (error) { showMessage(error.message); }
    }
    async function selectFallbackSource() { PromptDataLoader.forceFallback(); showMessage("Fallback source selected."); await loadDatabase(); }
    async function resetDataSource() { PromptDataLoader.resetSource(); elements.apiUrlInput.value = PromptDataLoader.getApiUrl(); showMessage("Data source reset."); await loadDatabase({ forceRefresh: true }); }

    function setControlsDisabled(disabled) {
        elements.promptForm.querySelectorAll("input, select, textarea, button").forEach(el => { if (el !== elements.output) el.disabled = disabled; });
        [elements.randomPromptBtn, elements.clearStylePresetBtn, elements.includeNegativePrompt].forEach(el => { if (el) el.disabled = disabled; });
        elements.promptModeGrid.querySelectorAll("button").forEach(button => { button.disabled = disabled; });
        elements.stylePresetGrid.querySelectorAll("button").forEach(button => { button.disabled = disabled; });
        searchable.forEach(control => control.setDisabled(disabled));
    }

    function setStatus(type, text) {
        elements.dataStatus.classList.remove("is-online", "is-warning", "is-error");
        if (type === "online") elements.dataStatus.classList.add("is-online");
        if (type === "warning") elements.dataStatus.classList.add("is-warning");
        if (type === "error") elements.dataStatus.classList.add("is-error");
        elements.dataStatusText.textContent = text;
    }

    function markAllFields() {
        elements.promptForm.querySelectorAll("input, select, textarea").forEach(markFilled);
        markFilled(elements.output);
    }
    function markFilled(element) {
        if (!element || element.type === "radio" || element.classList?.contains("searchable-input")) return;
        element.classList.toggle("is-filled", Boolean(String(element.value || "").trim()));
    }

    function restoreTheme() {
        document.body.classList.toggle("dark-mode", localStorage.getItem("promptGenTheme") === "dark");
        updateThemeButton();
    }
    function restorePreferences() {
        const enabled = localStorage.getItem("promptGenSmartCompatibility");
        if (enabled !== null) elements.compatibilityToggle.checked = enabled === "true";
        const mode = localStorage.getItem("promptGenCompatibilityMode");
        if (mode && optionExists(elements.compatibilityMode, mode)) elements.compatibilityMode.value = mode;
        const styleMode = localStorage.getItem("promptGenStyleApplyMode");
        if (styleMode) setRadioValue("styleApplyMode", styleMode);
        const includeNegative = localStorage.getItem("promptGenIncludeNegativePrompt");
        if (includeNegative !== null) elements.includeNegativePrompt.checked = includeNegative === "true";
        updateToggleLabel();
    }
    function updateToggleLabel() {
        const label = elements.compatibilityToggle.closest("label")?.querySelector(".toggle-label");
        if (label) label.textContent = elements.compatibilityToggle.checked ? "Enabled" : "Disabled";
    }
    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("promptGenTheme", document.body.classList.contains("dark-mode") ? "dark" : "light");
        updateThemeButton();
    }
    function updateThemeButton() { elements.themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode"; }

    function showMessage(text) {
        clearTimeout(messageTimer);
        elements.messageBox.textContent = text;
        elements.messageBox.classList.add("is-visible");
        messageTimer = setTimeout(() => elements.messageBox.classList.remove("is-visible"), 2600);
    }

    function getSelectedItem(select, collection) {
        const id = select?.selectedOptions?.[0]?.dataset?.id || "";
        return id ? (collection || []).find(item => item.id === id) || null : null;
    }
    function setSelectByItemId(select, id) {
        if (!select) return;
        if (!id) { select.value = ""; return; }
        const option = [...select.options].find(item => item.dataset.id === id);
        if (option) select.value = option.value;
    }
    function getRadioValue(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value || ""; }
    function setRadioValue(name, value) { document.querySelectorAll(`input[name="${name}"]`).forEach(input => { input.checked = input.value === value; }); }
    function optionExists(select, value) { return [...select.options].some(option => option.value === value); }
    function randomOptionValue(select) { return randomItem([...select.options].filter(option => option.value && !option.disabled))?.value || ""; }
    function randomItem(items) { return Array.isArray(items) && items.length ? items[Math.floor(Math.random() * items.length)] : null; }
    function normalizeTags(value) { return Array.isArray(value) ? value.map(String) : String(value || "").split(",").map(item => item.trim()).filter(Boolean); }
    function asBoolean(value, fallback = false) {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value;
        return !["false", "0", "no", "off", "inactive"].includes(String(value).trim().toLowerCase());
    }
    function findLabel(collection, id) { return (collection || []).find(item => item.id === id)?.label || ""; }
    function escapeHtml(value) {
        return String(value || "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
    }
})();
