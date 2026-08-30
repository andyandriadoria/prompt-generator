(function (global) {
    "use strict";

    const MANNEQUIN_SUBJECT_IDS = new Set(["adult-mannequin", "child-mannequin"]);
    const MANNEQUIN_POSE_PREFIX = "mannequin-";
    const DEFAULT_MANNEQUIN_POSE = "mannequin-standing-display";
    const DEFAULT_HUMAN_POSE = "natural-pose";
    const FOCUS_SELECT_ID = "outfitFocusStyle";

    let builderWrapped = false;
    let syncTimer = 0;

    injectStyles();
    bindEvents();
    waitForDependencies();

    function waitForDependencies(attempt = 0) {
        const ready = global.CatalogPromptBuilder
            && global.OutfitFocusStyle
            && global.OutfitFocusCompatibility;
        if (ready) {
            wrapBuilder();
            scheduleSync(40);
            return;
        }
        if (attempt > 120) {
            console.warn("Mannequin Catalog dependencies did not become available.");
            return;
        }
        global.setTimeout(() => waitForDependencies(attempt + 1), 80);
    }

    function wrapBuilder() {
        if (builderWrapped || global.CatalogPromptBuilder.__mannequinCatalogWrapped) return;
        builderWrapped = true;
        const originalBuild = global.CatalogPromptBuilder.build.bind(global.CatalogPromptBuilder);

        const mannequinBuild = function (state = {}) {
            if (!isMannequinState(state)) return originalBuild(state);
            return buildMannequinPrompt(state);
        };

        mannequinBuild.__mannequinCatalogWrapped = true;
        global.CatalogPromptBuilder.build = mannequinBuild;
        global.CatalogPromptBuilder.__mannequinCatalogWrapped = true;
    }

    function buildMannequinPrompt(state) {
        const preservation = state.preservation || {};
        const aspectRatio = clean(state.aspectRatio) || "4:5";
        const subject = clean(state.subject) || (isChildMannequinState(state)
            ? "A premium faceless child mannequin"
            : "A premium faceless adult mannequin");
        const catalogType = clean(state.catalogType) || "a clothing catalog";
        const setting = clean(state.setting);
        const pose = stripTerminal(state.pose);
        const shot = stripTerminal(state.shot);
        const child = isChildMannequinState(state);

        const introTemplate = preservation.intro_prompt || preservation.introPrompt ||
            "Without changing the existing outfit in any way, including its exact color, fabric, pattern, texture, cut, proportions, and every original detail, create a photorealistic image in a {{aspect_ratio}} aspect ratio.";
        const intro = sentence(String(introTemplate).replace(/\{\{aspect_ratio\}\}/gi, aspectRatio));

        let presentation = `${subject} dressed in the exact outfit from the reference image, photographed for ${catalogType}`;
        if (setting) presentation += ` ${setting}`;
        presentation = sentence(presentation);

        const displayParts = [];
        if (pose) displayParts.push(sentence(pose));
        if (shot) displayParts.push(sentence(shot));
        displayParts.push(child
            ? "Use a clearly artificial child mannequin with a smooth featureless head, age-appropriate child proportions, and a composed static posture appropriate to the selected setting."
            : "Use a clearly artificial adult mannequin with a smooth featureless head and a composed static posture appropriate to the selected setting.");
        displayParts.push("Do not give the mannequin realistic skin, facial features, hair, expression, or human identity. Keep the mannequin visually secondary to the clothing.");
        displayParts.push("Keep the outfit, its silhouette, construction, fabric, pattern, texture, color, cut, proportions, layering, and styling as the clear visual priority.");

        const quality = child
            ? "Create clean premium childwear fashion photography with refined composition appropriate to the selected catalog or campaign type and setting, while keeping the presentation age-appropriate."
            : "Create clean premium fashion photography with refined composition appropriate to the selected catalog or campaign type and setting.";
        const closingTemplate = preservation.closing_prompt || preservation.closingPrompt ||
            "No text, no accessories that alter the outfit, and no modification or distortion of the clothing.";
        const closing = [quality, sentence(closingTemplate), sentence(state.extraInstruction)]
            .filter(Boolean)
            .join(" ");

        return [intro, [presentation, ...displayParts].filter(Boolean).join(" "), closing]
            .map(paragraph)
            .filter(Boolean)
            .join("\n\n");
    }

    function isMannequinState(state = {}) {
        const subjectId = selectedSubjectId();
        if (MANNEQUIN_SUBJECT_IDS.has(subjectId)) return true;
        return /\bmannequin\b/i.test(clean(state.subject));
    }

    function isChildMannequinState(state = {}) {
        const subjectId = selectedSubjectId();
        if (subjectId === "child-mannequin") return true;
        return /\bchild\s+mannequin\b/i.test(clean(state.subject));
    }

    function selectedSubjectId() {
        const select = document.getElementById("catalogSubject");
        return select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    }

    function isCurrentMannequinSubject() {
        const id = selectedSubjectId();
        if (MANNEQUIN_SUBJECT_IDS.has(id)) return true;
        if (id === "custom" || !id) {
            const custom = document.getElementById("catalogCustomSubject")?.value || "";
            return /\bmannequin\b/i.test(custom);
        }
        return false;
    }

    function isMannequinPoseId(id) {
        return String(id || "").startsWith(MANNEQUIN_POSE_PREFIX);
    }

    function selectedPoseId() {
        const select = document.getElementById("catalogPose");
        return select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    }

    function normalizePoseSelection() {
        const select = document.getElementById("catalogPose");
        if (!select) return;
        const mannequin = isCurrentMannequinSubject();
        const current = selectedPoseId();
        const invalid = current && (mannequin ? !isMannequinPoseId(current) : isMannequinPoseId(current));
        const empty = !current;
        if (!invalid && !empty) return;

        const target = mannequin ? DEFAULT_MANNEQUIN_POSE : DEFAULT_HUMAN_POSE;
        const option = [...select.options].find(item => (item.dataset.id || item.value) === target);
        if (!option) return;
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function syncFocusAvailability() {
        const select = document.getElementById(FOCUS_SELECT_ID);
        if (!select) return;
        const mannequin = isCurrentMannequinSubject();
        const row = select.closest(".field-row");
        const wrapper = row?.querySelector(".searchable-select");
        const input = wrapper?.querySelector(".searchable-input");
        const clear = wrapper?.querySelector(".searchable-clear");

        if (mannequin) {
            if (select.value) {
                select.value = "";
                select.dispatchEvent(new Event("change", { bubbles: true }));
            }
            select.disabled = true;
            if (input) input.disabled = true;
            if (clear) clear.disabled = true;
            wrapper?.classList.add("is-disabled");
            row?.classList.add("is-mannequin-controlled");
            let note = row?.querySelector(".mannequin-controlled-note");
            if (row && !note) {
                note = document.createElement("small");
                note.className = "mannequin-controlled-note";
                row.append(note);
            }
            if (note) note.textContent = "Not used for mannequin subjects. Mannequin presentation is controlled by Pose / Presentation.";
            return;
        }

        select.disabled = false;
        if (input) input.disabled = false;
        if (clear) clear.disabled = false;
        wrapper?.classList.remove("is-disabled");
        row?.classList.remove("is-mannequin-controlled");
        row?.querySelector(".mannequin-controlled-note")?.remove();
    }

    function filterSearchablePoseMenu() {
        const select = document.getElementById("catalogPose");
        const row = select?.closest(".field-row");
        const wrapper = row?.querySelector(".searchable-select");
        const menu = wrapper?.querySelector(".searchable-menu");
        if (!select || !menu) return;

        const mannequin = isCurrentMannequinSubject();
        const optionByLabel = new Map();
        [...select.options].forEach(option => optionByLabel.set(option.textContent.trim(), option));

        [...menu.querySelectorAll(".searchable-option")].forEach(button => {
            const label = button.querySelector(".searchable-option-label")?.textContent?.trim() || "";
            const option = optionByLabel.get(label);
            const id = option?.dataset?.id || option?.value || "";
            const visible = !id || (mannequin ? isMannequinPoseId(id) : !isMannequinPoseId(id));
            button.hidden = !visible;
        });

        const children = [...menu.children];
        children.forEach((node, index) => {
            if (!node.classList?.contains("searchable-group")) return;
            let hasVisibleOption = false;
            for (let i = index + 1; i < children.length; i += 1) {
                const next = children[i];
                if (next.classList?.contains("searchable-group")) break;
                if (next.classList?.contains("searchable-option") && !next.hidden) {
                    hasVisibleOption = true;
                    break;
                }
            }
            node.hidden = !hasVisibleOption;
        });
    }

    function updatePoseHelper() {
        const select = document.getElementById("catalogPose");
        const row = select?.closest(".field-row");
        if (!row) return;
        let note = row.querySelector(".mannequin-pose-note");
        if (isCurrentMannequinSubject()) {
            if (!note) {
                note = document.createElement("small");
                note.className = "mannequin-pose-note";
                row.append(note);
            }
            note.textContent = "Mannequin options are grouped as Display Pose, Presentation Style, and Mannequin Arrangement. Neutral options adapt to the selected setting; Boutique Window remains a location-specific choice.";
        } else {
            note?.remove();
        }
    }

    function syncAll() {
        normalizePoseSelection();
        global.setTimeout(() => {
            syncFocusAvailability();
            updatePoseHelper();
            filterSearchablePoseMenu();
        }, 40);
    }

    function scheduleSync(delay = 70) {
        global.clearTimeout(syncTimer);
        syncTimer = global.setTimeout(syncAll, delay);
    }

    function bindEvents() {
        document.addEventListener("change", event => {
            const id = event.target?.id;
            if (["catalogSubject", "catalogCustomSubject", "catalogPose", FOCUS_SELECT_ID].includes(id)) {
                scheduleSync(id === "catalogSubject" ? 110 : 70);
            }
        });

        document.addEventListener("input", event => {
            if (event.target?.id === "catalogCustomSubject") scheduleSync(100);
            if (event.target?.closest?.(".field-row")?.querySelector?.("#catalogPose")) {
                global.setTimeout(filterSearchablePoseMenu, 0);
            }
        }, true);

        document.addEventListener("pointerdown", event => {
            if (event.target?.closest?.(".field-row")?.querySelector?.("#catalogPose")) {
                global.setTimeout(filterSearchablePoseMenu, 0);
            }
        }, true);

        document.addEventListener("click", event => {
            if (event.target.closest?.("#randomPromptBtn, #resetFormBtn, #historyRestoreBtn, [data-prompt-mode-id=\"outfit_catalog\"]")) {
                scheduleSync(140);
            }
        }, true);

        global.addEventListener("promptgen:modechange", event => {
            if (event.detail?.mode === "outfit_catalog") scheduleSync(100);
        });
    }

    function sentence(value) {
        const text = clean(value);
        if (!text) return "";
        return /[.!?]$/.test(text) ? text : `${text}.`;
    }

    function paragraph(value) {
        return clean(value)
            .replace(/\s+([,.!?])/g, "$1")
            .replace(/\.{2,}/g, ".");
    }

    function stripTerminal(value) {
        return clean(value).replace(/[.!?]+$/, "");
    }

    function clean(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function injectStyles() {
        if (document.getElementById("mannequin-catalog-style")) return;
        const style = document.createElement("style");
        style.id = "mannequin-catalog-style";
        style.textContent = `
            .field-row.is-mannequin-controlled { opacity: .62; }
            .mannequin-controlled-note,
            .mannequin-pose-note {
                display: block;
                grid-column: 2;
                margin-top: 6px;
                color: var(--muted);
                font-size: 10px;
                line-height: 1.4;
            }
            @media (max-width: 680px) {
                .mannequin-controlled-note,
                .mannequin-pose-note {
                    grid-column: 1 / -1;
                    font-size: 11px;
                }
            }
        `;
        document.head.append(style);
    }

    global.MannequinCatalog = {
        isActiveSubject: isCurrentMannequinSubject,
        sync: syncAll,
        build: buildMannequinPrompt
    };
})(window);
