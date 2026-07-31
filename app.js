(function () {
    "use strict";

    let database = null;
    let messageTimer = null;
    let initializedOnce = false;
    const elements = {};
    const searchable = new Map();

    const SEARCHABLE_CONFIG = {
        characterPreset: { type: "character", collection: "characters" },
        action: { type: "pose", collection: "poses" },
        expression: { type: "expression", collection: "expressions" },
        outfit: { type: "outfit", collection: "outfits" },
        setting: { type: "setting", collection: "settings" },
        cameraAngle: { type: "cameraAngle", collection: "cameraAngles" },
        lighting: { type: "lighting", collection: "lighting" },
        cameraType: { type: "cameraType", collection: "cameraStyles" }
    };

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();
        restoreTheme();
        restoreSmartPreferences();
        bindEvents();
        elements.apiUrlInput.value = PromptDataLoader.getApiUrl();
        await loadDatabase();
    }

    function cacheElements() {
        [
            "appTitle", "appSubtitle", "creatorName", "footerVersion",
            "themeToggle", "dataStatus", "dataStatusText",
            "apiUrlInput", "saveApiUrlBtn", "refreshDataBtn", "useFallbackBtn", "resetSourceBtn",
            "compatibilityToggle", "compatibilityMode", "compatibilityResult",
            "compatibilityScore", "compatibilityLabel", "compatibilityHint", "compatibilityMessages",
            "promptForm", "characterPreset", "subjectGender", "features",
            "action", "expression", "outfit", "manualOutfit", "manualOutfitRow",
            "setting", "cameraAngle", "lighting", "cameraType", "aspectRatioGroup",
            "randomPromptBtn", "generatePromptBtn", "resetFormBtn",
            "copyToClipboardBtn", "output", "promptStats", "messageBox"
        ].forEach(id => {
            elements[id] = document.getElementById(id);
        });
    }

    function bindEvents() {
        elements.themeToggle.addEventListener("click", toggleTheme);
        elements.saveApiUrlBtn.addEventListener("click", saveApiSource);
        elements.refreshDataBtn.addEventListener("click", () => loadDatabase({ forceRefresh: true }));
        elements.useFallbackBtn.addEventListener("click", selectFallbackSource);
        elements.resetSourceBtn.addEventListener("click", resetDataSource);

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

        elements.randomPromptBtn.addEventListener("click", smartRandomizePrompt);
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
            initOrRefreshSearchableControls();
            setDefaults();
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
        const title = config.appTitle || "Prompt Gen 4.1";
        elements.appTitle.textContent = title;
        document.title = title;
        elements.appSubtitle.textContent = config.subtitle || "Smart AI Image Prompt Builder";
        elements.creatorName.textContent = config.creatorName || "Ndoy Creator";
        elements.footerVersion.textContent = title;

        if (!initializedOnce && localStorage.getItem("promptGenSmartCompatibility") === null) {
            elements.compatibilityToggle.checked = asBoolean(config.smartCompatibility, true);
        }
        if (!initializedOnce && !localStorage.getItem("promptGenCompatibilityMode")) {
            elements.compatibilityMode.value = optionExists(elements.compatibilityMode, config.compatibilityMode)
                ? config.compatibilityMode
                : "prioritize";
        }
        updateToggleLabel();
    }

    function populateAllControls() {
        populateSelect(elements.characterPreset, database.characters, {
            placeholder: "-- Custom Character --",
            placeholderValue: "custom",
            valueField: "id",
            groupField: "category"
        });
        populateSelect(elements.action, database.poses, {
            placeholder: "-- Select Pose / Action --",
            valueField: "id",
            groupField: "category"
        });
        populateSelect(elements.expression, database.expressions, {
            placeholder: "-- Select Facial Expression --",
            valueField: "id",
            groupField: "category"
        });
        populateSelect(elements.outfit, database.outfits, {
            placeholder: "-- Select Outfit --",
            valueField: "id",
            groupField: "category",
            afterPlaceholder: [{ value: "manual_outfit", label: "Enter custom outfit", id: "manual-outfit" }]
        });
        populateSelect(elements.cameraAngle, database.cameraAngles, {
            placeholder: "-- Select Camera Angle --",
            valueField: "id",
            groupField: "category"
        });
        populateSelect(elements.lighting, database.lighting, {
            placeholder: "-- Select Lighting --",
            valueField: "id",
            groupField: "category"
        });
        populateSelect(elements.cameraType, database.cameraStyles, {
            placeholder: "-- Select Camera Style --",
            valueField: "id",
            groupField: "category"
        });
        populateAspectRatios();
        populateSettings();
    }

    function populateSelect(select, items, options = {}) {
        const {
            placeholder = "-- Select --",
            placeholderValue = "",
            valueField = "id",
            groupField = "",
            afterPlaceholder = []
        } = options;

        select.innerHTML = "";
        const placeholderOption = new Option(placeholder, placeholderValue);
        placeholderOption.dataset.placeholder = "true";
        select.append(placeholderOption);
        afterPlaceholder.forEach(item => {
            const option = new Option(item.label, item.value);
            option.dataset.id = item.id || "";
            option.dataset.tags = item.tags || "manual,custom";
            select.append(option);
        });

        const addOption = (parent, item) => {
            const option = new Option(item.label, item[valueField] ?? item.id);
            option.dataset.id = item.id || "";
            option.dataset.category = item.category || "";
            option.dataset.tags = normalizeTags(item.tags).join(",");
            option.dataset.gender = item.gender || "";
            option.dataset.type = item.type || "";
            option.dataset.searchText = item.prompt || item.features || "";
            parent.append(option);
        };

        if (groupField) {
            const groups = new Map();
            items.forEach(item => {
                const groupName = item[groupField] || "Other";
                if (!groups.has(groupName)) groups.set(groupName, []);
                groups.get(groupName).push(item);
            });
            groups.forEach((groupItems, groupName) => {
                const optgroup = document.createElement("optgroup");
                optgroup.label = groupName;
                groupItems.forEach(item => addOption(optgroup, item));
                select.append(optgroup);
            });
        } else {
            items.forEach(item => addOption(select, item));
        }
    }

    function populateSettings() {
        if (!database) return;
        const type = getRadioValue("settingType") || "outdoor";
        const previousId = elements.setting.selectedOptions[0]?.dataset.id || "";
        const items = database.settings.filter(item => String(item.type).toLowerCase() === type);
        populateSelect(elements.setting, items, {
            placeholder: `-- Select ${capitalize(type)} Setting --`,
            valueField: "id",
            groupField: "category"
        });
        if (previousId) setSelectByItemId(elements.setting, previousId);
        markFilled(elements.setting);
        searchable.get("setting")?.refresh();
    }

    function populateAspectRatios() {
        elements.aspectRatioGroup.innerHTML = "";
        database.aspectRatios.forEach(item => {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "aspectRatio";
            input.value = item.value || item.label;
            label.append(input, document.createTextNode(` ${item.label}`));
            elements.aspectRatioGroup.append(label);
        });
    }

    function initOrRefreshSearchableControls() {
        const enabled = asBoolean(database?.config?.searchableDropdowns, true);
        if (!enabled || typeof SearchableSelectControl !== "function") return;
        Object.keys(SEARCHABLE_CONFIG).forEach(id => {
            if (searchable.has(id)) {
                searchable.get(id).refresh();
            } else {
                searchable.set(id, new SearchableSelectControl(elements[id]));
            }
        });
    }

    function syncAllSearchable() {
        searchable.forEach(control => control.syncFromNative());
    }

    function setDefaults() {
        const config = database.config || {};
        elements.characterPreset.value = optionExists(elements.characterPreset, config.defaultCharacter)
            ? config.defaultCharacter
            : "custom";
        elements.subjectGender.value = optionExists(elements.subjectGender, config.defaultGender)
            ? config.defaultGender
            : "auto";
        setRadioValue("settingType", config.defaultSettingType || "outdoor");
        populateSettings();
        setRadioValue("aspectRatio", config.defaultAspectRatio || "9:16");
        handleCharacterChange(false);
        toggleManualOutfit();
        markAllFields();
        syncAllSearchable();
    }

    function handleCharacterChange(shouldGenerate = true) {
        const id = elements.characterPreset.value;
        const character = database?.characters.find(item => item.id === id);
        elements.features.value = character?.features || "";
        elements.characterPreset.dataset.gender = character?.gender || "";
        markFilled(elements.features);
        markFilled(elements.characterPreset);
        searchable.get("characterPreset")?.syncFromNative();
        updateCompatibility();
        if (shouldGenerate) maybeGenerate();
    }

    function handleFormChange(event) {
        if (event.target.classList?.contains("searchable-input")) return;
        markFilled(event.target);
        if (event.target === elements.outfit) toggleManualOutfit();
        updateCompatibility();
        maybeGenerate();
    }

    function toggleManualOutfit() {
        const visible = elements.outfit.value === "manual_outfit";
        elements.manualOutfitRow.hidden = !visible;
        if (!visible) {
            elements.manualOutfit.value = "";
            markFilled(elements.manualOutfit);
        }
    }

    function maybeGenerate() {
        const value = String(database?.config?.autoGenerate ?? "TRUE").toLowerCase();
        if (["true", "1", "yes"].includes(value)) generatePrompt();
    }

    function collectState() {
        const selectedCharacter = getSelectedItem(elements.characterPreset, database.characters);
        const selectedPose = getSelectedItem(elements.action, database.poses);
        const selectedExpression = getSelectedItem(elements.expression, database.expressions);
        const selectedOutfit = getSelectedItem(elements.outfit, database.outfits);
        const selectedSetting = getSelectedItem(elements.setting, database.settings);
        const selectedCameraAngle = getSelectedItem(elements.cameraAngle, database.cameraAngles);
        const selectedLighting = getSelectedItem(elements.lighting, database.lighting);
        const selectedCameraType = getSelectedItem(elements.cameraType, database.cameraStyles);
        const outfit = elements.outfit.value === "manual_outfit"
            ? elements.manualOutfit.value.trim()
            : selectedOutfit?.prompt || "";
        return {
            config: database.config || {},
            features: elements.features.value.trim(),
            gender: elements.subjectGender.value,
            characterGender: selectedCharacter?.gender || "",
            action: selectedPose?.prompt || "",
            expression: selectedExpression?.prompt || "",
            outfit,
            setting: selectedSetting?.prompt || "",
            cameraAngle: selectedCameraAngle?.prompt || "",
            lighting: selectedLighting?.prompt || "",
            cameraType: selectedCameraType?.prompt || "",
            aspectRatio: getRadioValue("aspectRatio")
        };
    }

    function buildCompatibilitySelection() {
        const gender = effectiveGender();
        let character = getSelectedItem(elements.characterPreset, database.characters);
        if (!character) {
            character = {
                id: "custom",
                label: "Custom Character",
                gender,
                tags: ["character", gender, ...CompatibilityEngine.inferTagsFromText(elements.features.value)]
            };
        }

        let outfit = getSelectedItem(elements.outfit, database.outfits);
        if (elements.outfit.value === "manual_outfit" && elements.manualOutfit.value.trim()) {
            outfit = {
                id: "manual-outfit",
                label: "Manual Outfit",
                prompt: elements.manualOutfit.value.trim(),
                tags: ["outfit", "manual", ...CompatibilityEngine.inferTagsFromText(elements.manualOutfit.value)]
            };
        }

        return {
            character,
            pose: getSelectedItem(elements.action, database.poses),
            expression: getSelectedItem(elements.expression, database.expressions),
            outfit,
            setting: getSelectedItem(elements.setting, database.settings)
        };
    }

    function updateCompatibility() {
        if (!database || typeof CompatibilityEngine !== "object") return;
        const enabled = elements.compatibilityToggle.checked;
        const mode = elements.compatibilityMode.value || "prioritize";
        const selection = buildCompatibilitySelection();

        if (!enabled) {
            searchable.forEach(control => control.resetCompatibility());
            renderCompatibility({
                score: 100,
                level: "great",
                label: "Smart Compatibility is off",
                messages: []
            }, selection, false);
            return;
        }

        const result = CompatibilityEngine.evaluate(database, selection);
        renderCompatibility(result, selection, true);

        const targets = [
            ["action", "pose", database.poses],
            ["expression", "expression", database.expressions],
            ["outfit", "outfit", database.outfits],
            ["setting", "setting", database.settings.filter(item => String(item.type).toLowerCase() === (getRadioValue("settingType") || "outdoor"))]
        ];

        targets.forEach(([controlId, targetType, candidates]) => {
            const ranking = CompatibilityEngine.rankCandidates(database, selection, targetType, candidates);
            searchable.get(controlId)?.setCompatibility(ranking, mode);
        });

        ["characterPreset", "cameraAngle", "lighting", "cameraType"].forEach(id => {
            searchable.get(id)?.setCompatibility(new Map(), "all");
        });
    }

    function renderCompatibility(result, selection, enabled) {
        elements.compatibilityScore.textContent = String(result.score);
        elements.compatibilityLabel.textContent = result.label;
        elements.compatibilityResult.dataset.level = result.level;
        const selectedCount = [selection.pose, selection.expression, selection.outfit, selection.setting].filter(Boolean).length;
        elements.compatibilityHint.textContent = !enabled
            ? "All options are shown in their original order."
            : selectedCount < 2
                ? "Choose more elements to receive a meaningful compatibility assessment."
                : result.messages.length
                    ? "Review the suggestions below or choose a higher-scoring option from a searchable dropdown."
                    : "Your current pose, outfit, expression, and setting work well together.";

        elements.compatibilityMessages.innerHTML = "";
        result.messages.forEach(item => {
            const li = document.createElement("li");
            li.className = `is-${item.severity}`;
            li.textContent = item.text;
            elements.compatibilityMessages.append(li);
        });
    }

    function generatePrompt() {
        if (!database) return;
        elements.output.value = PromptBuilder.build(collectState());
        elements.promptStats.textContent = `${elements.output.value.length} characters`;
        markFilled(elements.output);
    }

    function smartRandomizePrompt() {
        if (!database) return;

        const character = randomItem(database.characters);
        elements.characterPreset.value = character?.id || "custom";
        handleCharacterChange(false);

        let selection = buildCompatibilitySelection();
        const pose = pickCompatibleCandidate("pose", database.poses, selection);
        setSelectByItemId(elements.action, pose?.id);
        selection = { ...selection, pose };

        const outfit = pickCompatibleCandidate("outfit", database.outfits, selection);
        setSelectByItemId(elements.outfit, outfit?.id);
        toggleManualOutfit();
        selection = { ...selection, outfit };

        const setting = pickCompatibleCandidate("setting", database.settings, selection);
        if (setting) {
            setRadioValue("settingType", setting.type || "outdoor");
            populateSettings();
            setSelectByItemId(elements.setting, setting.id);
            selection = { ...selection, setting };
        }

        const expression = pickCompatibleCandidate("expression", database.expressions, selection);
        setSelectByItemId(elements.expression, expression?.id);

        elements.cameraAngle.value = randomOptionValue(elements.cameraAngle);
        elements.lighting.value = randomOptionValue(elements.lighting);
        elements.cameraType.value = randomOptionValue(elements.cameraType);
        const ratios = database.aspectRatios.map(item => item.value || item.label);
        setRadioValue("aspectRatio", randomItem(ratios));

        markAllFields();
        syncAllSearchable();
        updateCompatibility();
        generatePrompt();
        showMessage("Smart random prompt generated.");
    }

    function pickCompatibleCandidate(type, candidates, selection) {
        if (!Array.isArray(candidates) || !candidates.length) return null;
        const ranking = CompatibilityEngine.rankCandidates(database, selection, type, candidates);
        const scored = candidates
            .map(item => ({ item, result: ranking.get(item.id) }))
            .sort((a, b) => (b.result?.score ?? 100) - (a.result?.score ?? 100));
        const bestScore = scored[0]?.result?.score ?? 100;
        const pool = scored
            .filter(entry => !entry.result?.blocked && (entry.result?.score ?? 100) >= Math.max(70, bestScore - 12))
            .slice(0, 24);
        return randomItem(pool.length ? pool : scored)?.item || null;
    }

    function resetForm() {
        elements.promptForm.reset();
        elements.features.value = "";
        elements.manualOutfit.value = "";
        elements.output.value = "";
        elements.promptStats.textContent = "0 characters";
        elements.characterPreset.value = "custom";
        elements.subjectGender.value = database?.config?.defaultGender || "auto";
        setRadioValue("settingType", database?.config?.defaultSettingType || "outdoor");
        populateSettings();
        setRadioValue("aspectRatio", database?.config?.defaultAspectRatio || "9:16");
        toggleManualOutfit();
        markAllFields();
        syncAllSearchable();
        updateCompatibility();
        showMessage("Form reset.");
    }

    async function copyPrompt() {
        const text = elements.output.value.trim();
        if (!text) {
            showMessage("Generate a prompt first.");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            elements.output.focus();
            elements.output.select();
            document.execCommand("copy");
        }
        showMessage("Prompt copied to clipboard.");
    }

    async function saveApiSource() {
        try {
            PromptDataLoader.saveApiUrl(elements.apiUrlInput.value);
            showMessage("API URL saved. Refreshing data…");
            await loadDatabase({ forceRefresh: true });
        } catch (error) {
            showMessage(error.message);
        }
    }

    async function selectFallbackSource() {
        PromptDataLoader.forceFallback();
        showMessage("Fallback source selected.");
        await loadDatabase();
    }

    async function resetDataSource() {
        PromptDataLoader.resetSource();
        elements.apiUrlInput.value = PromptDataLoader.getApiUrl();
        showMessage("Data source reset.");
        await loadDatabase({ forceRefresh: true });
    }

    function setControlsDisabled(disabled) {
        elements.promptForm.querySelectorAll("input, select, textarea, button").forEach(el => {
            if (el !== elements.output) el.disabled = disabled;
        });
        elements.randomPromptBtn.disabled = disabled;
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
        const dark = localStorage.getItem("promptGenTheme") === "dark";
        document.body.classList.toggle("dark-mode", dark);
        updateThemeButton();
    }

    function restoreSmartPreferences() {
        const enabled = localStorage.getItem("promptGenSmartCompatibility");
        if (enabled !== null) elements.compatibilityToggle.checked = enabled === "true";
        const mode = localStorage.getItem("promptGenCompatibilityMode");
        if (mode && optionExists(elements.compatibilityMode, mode)) elements.compatibilityMode.value = mode;
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

    function updateThemeButton() {
        elements.themeToggle.textContent = document.body.classList.contains("dark-mode")
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
    }

    function showMessage(text) {
        clearTimeout(messageTimer);
        elements.messageBox.textContent = text;
        elements.messageBox.classList.add("is-visible");
        messageTimer = setTimeout(() => elements.messageBox.classList.remove("is-visible"), 2400);
    }

    function getSelectedItem(select, collection) {
        const id = select.selectedOptions[0]?.dataset.id || "";
        return id ? collection.find(item => item.id === id) || null : null;
    }

    function setSelectByItemId(select, id) {
        if (!id) {
            select.value = "";
            return;
        }
        const option = [...select.options].find(item => item.dataset.id === id);
        if (option) select.value = option.value;
    }

    function effectiveGender() {
        if (elements.subjectGender.value !== "auto") return elements.subjectGender.value;
        const character = getSelectedItem(elements.characterPreset, database.characters);
        return character?.gender || PromptBuilder.inferGender(elements.features.value);
    }

    function getRadioValue(name) {
        return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
    }

    function setRadioValue(name, value) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
            input.checked = input.value === value;
        });
    }

    function optionExists(select, value) {
        return [...select.options].some(option => option.value === value);
    }

    function randomOptionValue(select, predicate = () => true) {
        const options = [...select.options].filter(option => option.value && !option.disabled && predicate(option.value));
        return randomItem(options)?.value || "";
    }

    function randomItem(items) {
        if (!Array.isArray(items) || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    }

    function normalizeTags(value) {
        if (Array.isArray(value)) return value.map(String);
        return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
    }

    function asBoolean(value, fallback = false) {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value;
        return !["false", "0", "no", "off"].includes(String(value).trim().toLowerCase());
    }

    function capitalize(value) {
        const text = String(value || "");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
})();
