(function () {
    "use strict";

    let database = null;
    let messageTimer = null;
    const elements = {};

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();
        restoreTheme();
        bindEvents();
        elements.apiUrlInput.value = PromptDataLoader.getApiUrl();
        await loadDatabase();
    }

    function cacheElements() {
        [
            "appTitle", "appSubtitle", "creatorName", "footerVersion",
            "themeToggle", "dataStatus", "dataStatusText",
            "apiUrlInput", "saveApiUrlBtn", "useFallbackBtn", "resetSourceBtn",
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
        elements.useFallbackBtn.addEventListener("click", selectFallbackSource);
        elements.resetSourceBtn.addEventListener("click", resetDataSource);

        elements.characterPreset.addEventListener("change", handleCharacterChange);
        elements.outfit.addEventListener("change", toggleManualOutfit);
        document.querySelectorAll('input[name="settingType"]').forEach(input => {
            input.addEventListener("change", () => {
                populateSettings();
                maybeGenerate();
            });
        });

        elements.randomPromptBtn.addEventListener("click", randomizePrompt);
        elements.generatePromptBtn.addEventListener("click", generatePrompt);
        elements.resetFormBtn.addEventListener("click", resetForm);
        elements.copyToClipboardBtn.addEventListener("click", copyPrompt);

        elements.promptForm.addEventListener("input", handleFormChange);
        elements.promptForm.addEventListener("change", handleFormChange);
    }

    async function loadDatabase() {
        setStatus("loading", "Loading database…");
        setControlsDisabled(true);

        try {
            const result = await PromptDataLoader.load();
            database = result.data;
            applyAppConfig();
            populateAllControls();
            setDefaults();
            setStatus(
                result.source === "api" ? "online" : "warning",
                result.message
            );
            generatePrompt();
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
        const title = config.appTitle || "Prompt Gen 4.0";
        elements.appTitle.textContent = title;
        document.title = title;
        elements.appSubtitle.textContent = config.subtitle || "Dynamic AI Image Prompt Builder";
        elements.creatorName.textContent = config.creatorName || "Ndoy Creator";
        elements.footerVersion.textContent = title;
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
            valueField: "prompt",
            groupField: "category"
        });
        populateSelect(elements.expression, database.expressions, {
            placeholder: "-- Select Facial Expression --",
            valueField: "prompt",
            groupField: "category"
        });
        populateSelect(elements.outfit, database.outfits, {
            placeholder: "-- Select Outfit --",
            valueField: "prompt",
            groupField: "category",
            afterPlaceholder: [{ value: "manual_outfit", label: "Enter custom outfit" }]
        });
        populateSelect(elements.cameraAngle, database.cameraAngles, {
            placeholder: "-- Select Camera Angle --",
            valueField: "prompt"
        });
        populateSelect(elements.lighting, database.lighting, {
            placeholder: "-- Select Lighting --",
            valueField: "prompt"
        });
        populateSelect(elements.cameraType, database.cameraStyles, {
            placeholder: "-- Select Camera Style --",
            valueField: "prompt"
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
        select.append(new Option(placeholder, placeholderValue));
        afterPlaceholder.forEach(item => select.append(new Option(item.label, item.value)));

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
                groupItems.forEach(item => {
                    const option = new Option(item.label, item[valueField] ?? item.id);
                    option.dataset.id = item.id || "";
                    optgroup.append(option);
                });
                select.append(optgroup);
            });
        } else {
            items.forEach(item => {
                const option = new Option(item.label, item[valueField] ?? item.id);
                option.dataset.id = item.id || "";
                select.append(option);
            });
        }
    }

    function populateSettings() {
        if (!database) return;
        const type = getRadioValue("settingType") || "outdoor";
        const previous = elements.setting.value;
        const items = database.settings.filter(item => String(item.type).toLowerCase() === type);
        populateSelect(elements.setting, items, {
            placeholder: `-- Select ${capitalize(type)} Setting --`,
            valueField: "prompt",
            groupField: "category"
        });
        if ([...elements.setting.options].some(option => option.value === previous)) {
            elements.setting.value = previous;
        }
        markFilled(elements.setting);
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
    }

    function handleCharacterChange(shouldGenerate = true) {
        const id = elements.characterPreset.value;
        const character = database?.characters.find(item => item.id === id);
        elements.features.value = character?.features || "";
        elements.characterPreset.dataset.gender = character?.gender || "";
        markFilled(elements.features);
        markFilled(elements.characterPreset);
        if (shouldGenerate) maybeGenerate();
    }

    function handleFormChange(event) {
        markFilled(event.target);
        if (event.target === elements.outfit) toggleManualOutfit();
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
        if (["true", "1", "yes"].includes(value)) {
            generatePrompt();
        }
    }

    function collectState() {
        const selectedCharacter = database.characters.find(
            item => item.id === elements.characterPreset.value
        );
        const outfit = elements.outfit.value === "manual_outfit"
            ? elements.manualOutfit.value.trim()
            : elements.outfit.value;

        return {
            config: database.config || {},
            features: elements.features.value.trim(),
            gender: elements.subjectGender.value,
            characterGender: selectedCharacter?.gender || "",
            action: elements.action.value,
            expression: elements.expression.value,
            outfit,
            setting: elements.setting.value,
            cameraAngle: elements.cameraAngle.value,
            lighting: elements.lighting.value,
            cameraType: elements.cameraType.value,
            aspectRatio: getRadioValue("aspectRatio")
        };
    }

    function generatePrompt() {
        if (!database) return;
        elements.output.value = PromptBuilder.build(collectState());
        elements.promptStats.textContent = `${elements.output.value.length} characters`;
        markFilled(elements.output);
    }

    function randomizePrompt() {
        if (!database) return;

        const character = randomItem(database.characters);
        elements.characterPreset.value = character?.id || "custom";
        handleCharacterChange(false);

        elements.action.value = randomOptionValue(elements.action);
        elements.expression.value = randomOptionValue(elements.expression);
        elements.outfit.value = randomOptionValue(elements.outfit, value => value !== "manual_outfit");
        toggleManualOutfit();

        setRadioValue("settingType", Math.random() < 0.5 ? "outdoor" : "indoor");
        populateSettings();
        elements.setting.value = randomOptionValue(elements.setting);
        elements.cameraAngle.value = randomOptionValue(elements.cameraAngle);
        elements.lighting.value = randomOptionValue(elements.lighting);
        elements.cameraType.value = randomOptionValue(elements.cameraType);

        const ratios = database.aspectRatios.map(item => item.value || item.label);
        setRadioValue("aspectRatio", randomItem(ratios));

        markAllFields();
        generatePrompt();
        showMessage("Random prompt generated.");
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
            showMessage("API URL saved.");
            await loadDatabase();
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
        await loadDatabase();
    }

    function setControlsDisabled(disabled) {
        elements.promptForm.querySelectorAll("input, select, textarea, button").forEach(el => {
            if (el !== elements.output) el.disabled = disabled;
        });
        elements.randomPromptBtn.disabled = disabled;
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
        if (!element || element.type === "radio") return;
        element.classList.toggle("is-filled", Boolean(String(element.value || "").trim()));
    }

    function restoreTheme() {
        const dark = localStorage.getItem("promptGenTheme") === "dark";
        document.body.classList.toggle("dark-mode", dark);
        updateThemeButton();
    }

    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem(
            "promptGenTheme",
            document.body.classList.contains("dark-mode") ? "dark" : "light"
        );
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
        messageTimer = setTimeout(() => {
            elements.messageBox.classList.remove("is-visible");
        }, 2200);
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

    function capitalize(value) {
        const text = String(value || "");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
})();
