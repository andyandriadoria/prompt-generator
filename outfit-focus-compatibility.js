(function (global) {
    "use strict";

    const POV_STYLE_ID = "neck-down-selfie";
    const PHONE_COVERED_STYLE_ID = "modest-full-outfit-no-face";
    const HANGER_STYLE_ID = "held-hanger-clean-lifestyle";
    const HOLDING_STYLE_ID = "hidden-face-holding-outfit";
    const FULL_BODY_SHOT_ID = "full-body";

    const RULES = {
        [HANGER_STYLE_ID]: {
            disabledFields: {
                catalogSubject: "Not used for this presentation",
                catalogCustomSubject: "Not used for this presentation",
                catalogPose: "Controlled by Outfit Focus Style"
            }
        },
        [HOLDING_STYLE_ID]: {
            disabledFields: {
                catalogPose: "Controlled by Outfit Focus Style"
            }
        },
        [POV_STYLE_ID]: {
            forceShotId: FULL_BODY_SHOT_ID,
            disabledFields: {
                catalogPose: "Controlled by Outfit Focus Style",
                catalogShot: "Controlled by Outfit Focus Style · Full Body Visible"
            }
        },
        "headless-outfit-crop": {
            disabledFields: {}
        },
        [PHONE_COVERED_STYLE_ID]: {
            disabledFields: {
                catalogPose: "Controlled by Outfit Focus Style"
            }
        }
    };

    let builderWrapped = false;

    injectStyles();
    bindEvents();
    waitForFocusModule();

    function selectedId(select) {
        return select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    }

    function selectedFocusId() {
        return selectedId(document.getElementById("outfitFocusStyle"));
    }

    function setSelectById(select, id) {
        if (!select || !id) return false;
        const option = [...select.options].find(item => item.dataset.id === id || item.value === id);
        if (!option) return false;
        if (select.value === option.value) return false;
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function enforcePovOutfitSelfieShot() {
        const focusSelect = document.getElementById("outfitFocusStyle");
        const shotSelect = document.getElementById("catalogShot");
        if (!focusSelect || !shotSelect) return;
        if (selectedId(focusSelect) !== POV_STYLE_ID) return;
        setSelectById(shotSelect, FULL_BODY_SHOT_ID);
    }

    function applyFieldRelevance() {
        const styleId = selectedFocusId();
        const rule = RULES[styleId] || { disabledFields: {} };

        ["catalogSubject", "catalogCustomSubject", "catalogPose", "catalogShot"].forEach(enableField);
        Object.entries(rule.disabledFields || {}).forEach(([id, note]) => disableField(id, note));
    }

    function disableField(id, note) {
        const control = document.getElementById(id);
        if (!control) return;
        control.disabled = true;
        const row = control.closest(".field-row");
        if (!row) return;
        row.classList.add("is-focus-controlled");
        row.dataset.focusControlled = "true";
        row.querySelectorAll(".searchable-input, .searchable-clear").forEach(node => { node.disabled = true; });
        const wrapper = row.querySelector(".searchable-select");
        wrapper?.classList.add("is-disabled");
        let hint = row.querySelector(".focus-controlled-note");
        if (!hint) {
            hint = document.createElement("small");
            hint.className = "focus-controlled-note";
            const host = row.querySelector(":scope > div") || row;
            host.append(hint);
        }
        hint.textContent = note;
    }

    function enableField(id) {
        const control = document.getElementById(id);
        if (!control) return;
        control.disabled = false;
        const row = control.closest(".field-row");
        if (!row) return;
        row.classList.remove("is-focus-controlled");
        delete row.dataset.focusControlled;
        row.querySelectorAll(".searchable-input, .searchable-clear").forEach(node => { node.disabled = false; });
        row.querySelector(".searchable-select")?.classList.remove("is-disabled");
        row.querySelector(".focus-controlled-note")?.remove();
    }

    function syncFocusRules() {
        enforcePovOutfitSelfieShot();
        global.setTimeout(applyFieldRelevance, 0);
    }

    function bindEvents() {
        document.addEventListener("change", event => {
            const id = event.target?.id;
            if (id === "outfitFocusStyle" || id === "catalogShot") syncFocusRules();
        });

        document.addEventListener("click", event => {
            if (event.target.closest("#randomPromptBtn, #resetFormBtn, #historyRestoreBtn, [data-prompt-mode-id=\"outfit_catalog\"]")) {
                global.setTimeout(syncFocusRules, 80);
            }
        }, true);

        global.addEventListener("promptgen:modechange", event => {
            if (event.detail?.mode === "outfit_catalog") global.setTimeout(syncFocusRules, 40);
        });
    }

    function waitForFocusModule(attempt = 0) {
        syncFocusRules();
        if (global.OutfitFocusStyle && global.CatalogPromptBuilder?.build) {
            wrapBuilder();
            return;
        }
        if (attempt > 100) return;
        global.setTimeout(() => waitForFocusModule(attempt + 1), 80);
    }

    function wrapBuilder() {
        if (builderWrapped || global.CatalogPromptBuilder.__outfitFocusIntelligenceWrapped) return;
        builderWrapped = true;
        const originalBuild = global.CatalogPromptBuilder.build.bind(global.CatalogPromptBuilder);

        const intelligentBuild = function (state = {}) {
            const styleId = selectedFocusId();
            const adjusted = { ...state };
            const rule = RULES[styleId] || {};

            if (rule.disabledFields?.catalogPose) adjusted.pose = "";
            const prompt = originalBuild(adjusted);

            if (styleId === HANGER_STYLE_ID) return buildHangerPrompt(prompt, adjusted);
            if (styleId === HOLDING_STYLE_ID) return buildHoldingPrompt(prompt, adjusted);
            return prompt;
        };

        intelligentBuild.__outfitFocusIntelligenceWrapped = true;
        global.CatalogPromptBuilder.build = intelligentBuild;
        global.CatalogPromptBuilder.__outfitFocusIntelligenceWrapped = true;
    }

    function buildHangerPrompt(prompt, state) {
        const parts = splitPrompt(prompt);
        const intro = parts[0] || "";
        const closing = parts.at(-1) || "";
        const setting = clean(state.setting);
        const catalogType = clean(state.catalogType);
        const shot = stripTerminal(state.shot);

        let middle = "Display the exact outfit naturally on a refined hanger, held by one hand";
        if (catalogType) middle += `, photographed for ${catalogType}`;
        if (setting) middle += ` ${setting}`;
        middle = sentence(middle);
        middle += " Keep the entire garment clearly visible and neatly presented.";
        if (shot) middle += ` Use ${shot} framing while keeping the complete garment readable.`;
        middle += " Only the hand or part of the forearm may enter the frame; no model or wearer should be visible.";

        const quality = "Create clean premium fashion catalog photography with realistic fabric rendering, natural drape, refined commercial presentation, and subtle lifestyle warmth.";
        return [intro, middle, [quality, closing].filter(Boolean).join(" ")].filter(Boolean).join("\n\n");
    }

    function buildHoldingPrompt(prompt, state) {
        const parts = splitPrompt(prompt);
        const intro = parts[0] || "";
        const closing = parts.at(-1) || "";
        const subject = clean(state.subject) || "A person";
        const setting = clean(state.setting);
        const catalogType = clean(state.catalogType);
        const shot = stripTerminal(state.shot);

        let middle = `${subject} is positioned behind the exact outfit from the reference image`;
        if (catalogType) middle += `, photographed for ${catalogType}`;
        if (setting) middle += ` ${setting}`;
        middle = sentence(middle);
        middle += " The garment is held directly in front of the face so the face is fully obscured; the outfit itself is not being worn.";
        middle += " Keep the garment front clearly visible and make the clothing the main visual subject.";
        if (shot) middle += ` Use ${shot} framing where compatible with the held-garment presentation.`;

        return [intro, middle, closing].filter(Boolean).join("\n\n");
    }

    function splitPrompt(prompt) {
        return String(prompt || "").split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
    }

    function clean(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function stripTerminal(value) {
        return clean(value).replace(/[.!?]+$/, "");
    }

    function sentence(value) {
        const text = clean(value);
        if (!text) return "";
        const normalized = text.charAt(0).toUpperCase() + text.slice(1);
        return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
    }

    function injectStyles() {
        if (document.getElementById("outfit-focus-intelligence-style")) return;
        const style = document.createElement("style");
        style.id = "outfit-focus-intelligence-style";
        style.textContent = `
            .field-row.is-focus-controlled { opacity: .62; }
            .field-row.is-focus-controlled .searchable-input-wrap,
            .field-row.is-focus-controlled input,
            .field-row.is-focus-controlled select { cursor: not-allowed; }
            .focus-controlled-note {
                display: block;
                margin-top: 6px;
                font-size: 10px;
                line-height: 1.35;
                opacity: .72;
            }
            @media (max-width: 680px) {
                .focus-controlled-note { font-size: 11px; }
            }
        `;
        document.head.append(style);
    }

    global.OutfitFocusCompatibility = {
        enforcePovOutfitSelfieShot,
        applyFieldRelevance,
        sync: syncFocusRules
    };
})(window);
