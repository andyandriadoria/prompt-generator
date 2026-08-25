(function () {
    "use strict";

    const READY = "ready";
    const PARTIAL = "partial";
    const MISSING = "missing";
    const OPTIONAL = "optional";

    let pane = null;
    let scheduledFrame = 0;

    document.addEventListener("DOMContentLoaded", initPromptInspector);

    function initPromptInspector() {
        pane = document.getElementById("workspace-inspect");
        if (!pane) return;

        buildInspectorWorkspace();
        bindInspectorEvents();
        observeBuildSignals();
        scheduleAnalysis();
    }

    function buildInspectorWorkspace() {
        pane.classList.remove("workspace-placeholder");
        pane.classList.add("inspector-workspace");
        pane.innerHTML = `
            <div class="inspector-head panel">
                <div class="inspector-head-copy">
                    <span class="inspector-kicker"><span class="inspector-kicker-icon">${icon("brain")}</span>Prompt Intelligence · v1</span>
                    <h2>Inspect the structure behind your prompt</h2>
                    <p>Analyze completeness, coherence, prompt structure, and the highest-value improvements without changing your Build state.</p>
                </div>
                <div class="inspector-head-actions">
                    <button type="button" class="ghost-button inspector-action" id="inspectorRefreshBtn">${icon("refresh")}<span>Refresh Analysis</span></button>
                    <button type="button" class="primary-button inspector-action" id="inspectorBuildBtn">${icon("wand")}<span>Back to Build</span></button>
                </div>
            </div>

            <div class="inspector-grid">
                <section class="panel health-panel" aria-labelledby="promptHealthTitle">
                    <div class="health-score-block">
                        <div class="health-score-ring" id="healthScoreRing" data-level="excellent">
                            <span id="healthScore">0</span>
                            <small>/100</small>
                        </div>
                        <div class="health-score-copy">
                            <span class="inspector-section-label">Prompt Health</span>
                            <h3 id="promptHealthTitle">Waiting for Build state</h3>
                            <p id="healthSummary">Build a prompt to receive a structural review.</p>
                        </div>
                    </div>
                    <div class="health-metrics">
                        <div class="health-metric">
                            <span>Completeness</span>
                            <strong id="completenessScore">0%</strong>
                            <div class="metric-track"><i id="completenessBar"></i></div>
                        </div>
                        <div class="health-metric">
                            <span id="secondaryMetricLabel">Coherence</span>
                            <strong id="secondaryMetricScore">—</strong>
                            <div class="metric-track"><i id="secondaryMetricBar"></i></div>
                        </div>
                    </div>
                </section>

                <section class="panel inspector-context-panel" aria-labelledby="inspectContextTitle">
                    <div class="inspector-panel-heading">
                        <div>
                            <span class="inspector-section-label">Current Context</span>
                            <h3 id="inspectContextTitle">Build snapshot</h3>
                        </div>
                        <span class="inspect-mode-badge" id="inspectModeBadge">Creative</span>
                    </div>
                    <dl class="context-list">
                        <div><dt>Prompt mode</dt><dd id="contextMode">—</dd></div>
                        <div><dt>Visual direction</dt><dd id="contextStyle">—</dd></div>
                        <div><dt>Output length</dt><dd id="contextLength">0 characters</dd></div>
                        <div><dt>Signal</dt><dd id="contextSignal">Waiting</dd></div>
                    </dl>
                </section>
            </div>

            <section class="panel dna-inspector-panel" aria-labelledby="expandedDnaTitle">
                <div class="inspector-panel-heading">
                    <div>
                        <span class="inspector-section-label">Expanded Prompt DNA</span>
                        <h3 id="expandedDnaTitle">Structural coverage</h3>
                    </div>
                    <span class="dna-summary" id="dnaSummary">0 / 0 ready</span>
                </div>
                <div class="expanded-dna-grid" id="expandedDnaGrid"></div>
            </section>

            <div class="inspector-grid inspector-lower-grid">
                <section class="panel findings-panel" aria-labelledby="findingsTitle">
                    <div class="inspector-panel-heading">
                        <div>
                            <span class="inspector-section-label">Findings</span>
                            <h3 id="findingsTitle">What Prompt Gen sees</h3>
                        </div>
                        <span class="finding-count" id="findingCount">0 findings</span>
                    </div>
                    <div class="inspector-list" id="findingsList"></div>
                </section>

                <section class="panel improvements-panel" aria-labelledby="improvementsTitle">
                    <div class="inspector-panel-heading">
                        <div>
                            <span class="inspector-section-label">Suggested Improvements</span>
                            <h3 id="improvementsTitle">Highest-value next moves</h3>
                        </div>
                    </div>
                    <div class="inspector-list" id="improvementsList"></div>
                </section>
            </div>

            <section class="panel prompt-signal-panel" aria-labelledby="promptSignalTitle">
                <div class="inspector-panel-heading">
                    <div>
                        <span class="inspector-section-label">Prompt Signal</span>
                        <h3 id="promptSignalTitle">Output diagnostics</h3>
                    </div>
                    <span class="signal-badge" id="signalBadge">Waiting</span>
                </div>
                <div class="signal-grid">
                    <div class="signal-stat"><span>Characters</span><strong id="signalCharacters">0</strong></div>
                    <div class="signal-stat"><span>Words</span><strong id="signalWords">0</strong></div>
                    <div class="signal-stat"><span>Duplicate clauses</span><strong id="signalDuplicates">0</strong></div>
                    <div class="signal-stat"><span>Mode fit</span><strong id="signalModeFit">—</strong></div>
                </div>
                <p class="signal-note" id="signalNote">Diagnostics will update from the current generated prompt.</p>
            </section>
        `;
    }

    function bindInspectorEvents() {
        document.getElementById("inspectorRefreshBtn")?.addEventListener("click", analyzeAndRender);
        document.getElementById("inspectorBuildBtn")?.addEventListener("click", () => {
            window.PromptWorkspaceTabs?.setActive("build");
        });

        window.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "inspect") analyzeAndRender();
        });

        document.addEventListener("input", event => {
            if (event.target?.closest?.("#workspace-build")) scheduleAnalysis();
        }, true);

        document.addEventListener("change", event => {
            if (event.target?.closest?.("#workspace-build")) scheduleAnalysis();
        }, true);

        document.addEventListener("click", event => {
            if (event.target?.closest?.("#workspace-build button, #workspace-build [data-prompt-mode-id], #workspace-build [data-style-preset-id]")) {
                window.setTimeout(scheduleAnalysis, 40);
            }
        }, true);
    }

    function observeBuildSignals() {
        const targets = [
            document.getElementById("activeModeBadge"),
            document.getElementById("activeStyleBadge"),
            document.getElementById("compatibilityScore"),
            document.getElementById("compatibilityLabel"),
            document.getElementById("compatibilityResult"),
            document.getElementById("promptStats")
        ].filter(Boolean);

        if (!targets.length || !window.MutationObserver) return;

        const observer = new MutationObserver(scheduleAnalysis);
        targets.forEach(target => observer.observe(target, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        }));
    }

    function scheduleAnalysis() {
        if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
        scheduledFrame = requestAnimationFrame(() => {
            scheduledFrame = 0;
            analyzeAndRender();
        });
    }

    function analyzeAndRender() {
        if (!pane) return;

        const mode = getCurrentMode();
        const analysis = mode === "outfit_catalog"
            ? analyzeCatalog()
            : analyzeCreative();

        renderAnalysis(analysis);
    }

    function analyzeCreative() {
        const prompt = getPromptText();
        const compatibilityEnabled = Boolean(byId("compatibilityToggle")?.checked);
        const compatibilityScore = compatibilityEnabled
            ? clampNumber(parseInt(byId("compatibilityScore")?.textContent || "100", 10), 0, 100)
            : null;

        const characterPreset = value("characterPreset");
        const features = value("features").trim();
        const subjectReady = characterPreset && characterPreset !== "custom";
        const subjectPartial = !subjectReady && Boolean(features);

        const pose = value("action");
        const expression = value("expression");
        const outfit = value("outfit");
        const manualOutfit = value("manualOutfit").trim();
        const setting = value("setting");
        const cameraAngle = value("cameraAngle");
        const cameraStyle = value("cameraType");
        const lighting = value("lighting");
        const ratio = checkedValue("aspectRatio");
        const activeStyle = getActiveStyleLabel();

        const dimensions = [
            dimension("Subject", "sparkles", subjectReady ? READY : (subjectPartial ? PARTIAL : MISSING), subjectReady ? selectedLabel("characterPreset") : (subjectPartial ? "Custom physical features provided" : "No subject definition yet")),
            dimension("Action", "wand", pose && expression ? READY : (pose || expression ? PARTIAL : MISSING), joinDetail([selectedLabel("action"), selectedLabel("expression")], "Pose and expression are not defined")),
            dimension("Outfit", "shirt", outfit && (outfit !== "manual_outfit" || manualOutfit) ? READY : (outfit === "manual_outfit" ? PARTIAL : MISSING), outfit === "manual_outfit" ? (manualOutfit || "Custom outfit is empty") : (selectedLabel("outfit") || "No outfit selected")),
            dimension("Scene", "compass", setting ? READY : MISSING, selectedLabel("setting") || "No setting selected"),
            dimension("Style", "gem", activeStyle ? READY : (cameraStyle ? PARTIAL : MISSING), activeStyle || (selectedLabel("cameraType") ? `${selectedLabel("cameraType")} only` : "No visual direction selected")),
            dimension("Framing", "film", cameraAngle ? READY : (cameraStyle ? PARTIAL : MISSING), selectedLabel("cameraAngle") || (selectedLabel("cameraType") ? "Camera style set; angle still open" : "No camera direction")),
            dimension("Light", "light", lighting ? READY : MISSING, selectedLabel("lighting") || "No lighting selected"),
            dimension("Ratio", "cube", ratio ? READY : MISSING, ratio || "No aspect ratio selected")
        ];

        const completeness = scoreDimensions(dimensions);
        let health = compatibilityScore === null
            ? completeness
            : Math.round((completeness * 0.65) + (compatibilityScore * 0.35));

        const duplicates = findDuplicateClauses(prompt);
        if (duplicates.length) health = Math.max(0, health - Math.min(8, duplicates.length * 2));

        const findings = [];
        const improvements = [];
        const missing = dimensions.filter(item => item.state === MISSING);
        const partial = dimensions.filter(item => item.state === PARTIAL);

        if (!prompt) {
            findings.push(finding("warning", "No generated prompt yet", "Generate or edit the Build state so Prompt Intelligence has output to evaluate."));
        }

        if (compatibilityScore === null) {
            findings.push(finding("info", "Smart Compatibility is disabled", "Coherence is not included in Prompt Health while Smart Compatibility is off."));
        } else if (compatibilityScore >= 90) {
            findings.push(finding("positive", "Strong combination coherence", `Smart Compatibility reports ${compatibilityScore}/100 for the current Creative setup.`));
        } else if (compatibilityScore >= 75) {
            findings.push(finding("info", "Combination is usable but can improve", `Smart Compatibility is ${compatibilityScore}/100. Review its Build findings before finalizing.`));
        } else {
            findings.push(finding("warning", "Weak combination coherence", `Smart Compatibility is ${compatibilityScore}/100. Resolve conflicting scene, style, outfit, or technical choices first.`));
        }

        if (missing.length) {
            findings.push(finding("warning", `${missing.length} structural area${missing.length === 1 ? " is" : "s are"} still missing`, missing.slice(0, 4).map(item => item.label).join(", ")));
        } else {
            findings.push(finding("positive", "Core structure is complete", "All primary Creative Prompt DNA areas have usable values."));
        }

        if (partial.length) {
            findings.push(finding("info", `${partial.length} area${partial.length === 1 ? " is" : "s are"} only partially defined`, partial.slice(0, 4).map(item => item.label).join(", ")));
        }

        if (!activeStyle) {
            findings.push(finding("info", "No Prompt Style Preset is active", cameraStyle ? "Camera Style provides some direction, but a Style Preset would make the visual language more explicit." : "The prompt has no high-level visual direction yet."));
        }

        if (duplicates.length) {
            findings.push(finding("warning", "Repeated clauses detected", `Prompt output contains ${duplicates.length} repeated clause${duplicates.length === 1 ? "" : "s"}. This may add unnecessary emphasis.`));
        } else if (prompt) {
            findings.push(finding("positive", "No obvious clause redundancy", "The current output does not contain repeated long clauses."));
        }

        missing.slice(0, 3).forEach(item => improvements.push(improvementForCreative(item.label)));
        partial.slice(0, 2).forEach(item => {
            if (improvements.length < 4) improvements.push(improvementForCreative(item.label, true));
        });

        if (compatibilityScore !== null && compatibilityScore < 85 && improvements.length < 4) {
            improvements.push(improvement("brain", "Resolve the lowest compatibility signal", "Return to Build and review Smart Compatibility messages before adding more detail."));
        }
        if (!activeStyle && improvements.length < 4) {
            improvements.push(improvement("palette", "Choose a visual direction", "Apply a Style Preset if you want camera, lighting, ratio, and style language to behave as one system."));
        }
        if (!improvements.length) {
            improvements.push(improvement("check", "Structure is ready", "The current prompt has strong coverage. Refine only the details that matter to the intended image."));
        }

        return {
            mode: "creative",
            modeLabel: "Creative Prompt Builder",
            visualDirection: activeStyle || selectedLabel("cameraType") || "Custom / unstyled",
            dimensions,
            completeness,
            secondaryLabel: compatibilityEnabled ? "Coherence" : "Coherence off",
            secondaryScore: compatibilityScore,
            health,
            findings: findings.slice(0, 5),
            improvements: improvements.slice(0, 4),
            prompt,
            duplicates,
            modeFit: completeness >= 75 ? "Strong" : (completeness >= 50 ? "Partial" : "Weak"),
            signalNote: compatibilityEnabled
                ? "Prompt Health combines structural completeness and Smart Compatibility, with a small redundancy penalty when repeated clauses are found."
                : "Prompt Health currently reflects structural completeness because Smart Compatibility is disabled."
        };
    }

    function analyzeCatalog() {
        const prompt = getPromptText();
        const subject = value("catalogSubject");
        const customSubject = value("catalogCustomSubject").trim();
        const type = value("catalogType");
        const preservation = value("preservationLevel");
        const setting = value("catalogSetting");
        const customSetting = value("catalogCustomSetting").trim();
        const pose = value("catalogPose");
        const shot = value("catalogShot");
        const ratio = value("catalogAspectRatio");
        const extra = value("catalogExtraInstruction").trim();

        const subjectReady = subject === "custom" ? Boolean(customSubject) : Boolean(subject);
        const settingReady = setting === "manual_setting" ? Boolean(customSetting) : Boolean(setting);
        const isChild = detectChildSubject(subject === "custom" ? customSubject : selectedLabel("catalogSubject"));

        const dimensions = [
            dimension("Subject", "sparkles", subjectReady ? READY : MISSING, subject === "custom" ? (customSubject || "Custom subject is empty") : (selectedLabel("catalogSubject") || "No subject selected")),
            dimension("Catalog Type", "gem", type ? READY : MISSING, selectedLabel("catalogType") || "No catalog direction selected"),
            dimension("Preservation", "shield", preservation ? READY : MISSING, selectedLabel("preservationLevel") || "Outfit preservation is not selected"),
            dimension("Scene", "compass", settingReady ? READY : MISSING, setting === "manual_setting" ? (customSetting || "Custom setting is empty") : (selectedLabel("catalogSetting") || "No setting selected")),
            dimension("Pose", "wand", pose ? READY : MISSING, selectedLabel("catalogPose") || "No presentation pose selected"),
            dimension("Shot", "film", shot ? READY : MISSING, selectedLabel("catalogShot") || "No shot type selected"),
            dimension("Ratio", "cube", ratio ? READY : MISSING, ratio || "No aspect ratio selected"),
            dimension("Extra Direction", "light", extra ? READY : OPTIONAL, extra || "Optional — no extra instruction")
        ];

        const requiredDimensions = dimensions.filter(item => item.state !== OPTIONAL);
        const completeness = scoreDimensions(requiredDimensions);
        const preservationScore = preservation ? 100 : 0;
        let health = Math.round((completeness * 0.75) + (preservationScore * 0.25));

        const duplicates = findDuplicateClauses(prompt);
        if (duplicates.length) health = Math.max(0, health - Math.min(8, duplicates.length * 2));

        const findings = [];
        const improvements = [];
        const missing = requiredDimensions.filter(item => item.state === MISSING);

        if (!prompt) {
            findings.push(finding("warning", "No generated catalog prompt yet", "Generate a catalog prompt so preservation wording and output structure can be inspected."));
        }

        if (preservation) {
            findings.push(finding("positive", "Outfit preservation guard is active", `${selectedLabel("preservationLevel") || "A preservation level"} is included in the current catalog setup.`));
        } else {
            findings.push(finding("warning", "Outfit preservation is missing", "Reference Outfit Catalog should not be finalized without an explicit preservation level."));
        }

        if (isChild) {
            findings.push(finding("positive", "Child-safe catalog guard is active", "The selected subject is recognized as a child; catalog type and pose choices are filtered by the existing child-safe workflow."));
        } else {
            findings.push(finding("info", "Standard catalog subject", "No child-specific presentation guard is required for the current subject."));
        }

        if (missing.length) {
            findings.push(finding("warning", `${missing.length} required catalog area${missing.length === 1 ? " is" : "s are"} missing`, missing.slice(0, 4).map(item => item.label).join(", ")));
        } else {
            findings.push(finding("positive", "Catalog structure is complete", "All required Reference Outfit Catalog dimensions have usable values."));
        }

        if (duplicates.length) {
            findings.push(finding("warning", "Repeated clauses detected", `Prompt output contains ${duplicates.length} repeated clause${duplicates.length === 1 ? "" : "s"}. Review whether preservation wording is being unnecessarily duplicated.`));
        } else if (prompt) {
            findings.push(finding("positive", "No obvious clause redundancy", "The current catalog output does not contain repeated long clauses."));
        }

        missing.slice(0, 4).forEach(item => improvements.push(improvementForCatalog(item.label)));
        if (!extra && improvements.length < 4) {
            improvements.push(improvement("light", "Add extra direction only when needed", "Extra Instruction is optional. Use it for lighting or composition detail, not to rewrite the outfit preservation rules."));
        }
        if (!improvements.length) {
            improvements.push(improvement("check", "Catalog prompt is structurally ready", "Keep the reference image attached when using the generated prompt; no structural gap needs correction first."));
        }

        return {
            mode: "outfit_catalog",
            modeLabel: "Reference Outfit Catalog",
            visualDirection: selectedLabel("catalogType") || "Catalog direction not selected",
            dimensions,
            completeness,
            secondaryLabel: "Preservation Guard",
            secondaryScore: preservationScore,
            health,
            findings: findings.slice(0, 5),
            improvements: improvements.slice(0, 4),
            prompt,
            duplicates,
            modeFit: completeness >= 85 && preservation ? "Strong" : (completeness >= 55 ? "Partial" : "Weak"),
            signalNote: "Catalog Prompt Health prioritizes required workflow completeness and explicit outfit preservation. Optional extra direction does not reduce completeness."
        };
    }

    function renderAnalysis(analysis) {
        const healthLevel = getHealthLevel(analysis.health);
        const healthMeta = getHealthMeta(analysis.health);

        text("healthScore", analysis.health);
        text("promptHealthTitle", healthMeta.title);
        text("healthSummary", healthMeta.summary);
        byId("healthScoreRing")?.setAttribute("data-level", healthLevel);

        text("completenessScore", `${analysis.completeness}%`);
        setBar("completenessBar", analysis.completeness);

        text("secondaryMetricLabel", analysis.secondaryLabel);
        text("secondaryMetricScore", analysis.secondaryScore === null ? "Not evaluated" : `${analysis.secondaryScore}%`);
        setBar("secondaryMetricBar", analysis.secondaryScore === null ? 0 : analysis.secondaryScore);

        text("inspectModeBadge", analysis.mode === "outfit_catalog" ? "Catalog" : "Creative");
        byId("inspectModeBadge")?.setAttribute("data-mode", analysis.mode);
        text("contextMode", analysis.modeLabel);
        text("contextStyle", analysis.visualDirection);
        text("contextLength", `${analysis.prompt.length.toLocaleString()} characters`);
        text("contextSignal", healthMeta.signal);

        renderDna(analysis.dimensions);
        renderFindings(analysis.findings);
        renderImprovements(analysis.improvements);
        renderSignal(analysis);
    }

    function renderDna(dimensions) {
        const grid = byId("expandedDnaGrid");
        if (!grid) return;

        const readyCount = dimensions.filter(item => item.state === READY).length;
        const requiredCount = dimensions.filter(item => item.state !== OPTIONAL).length;
        text("dnaSummary", `${readyCount} / ${requiredCount} ready`);

        grid.innerHTML = dimensions.map(item => `
            <article class="dna-inspector-card" data-state="${escapeHtml(item.state)}">
                <div class="dna-inspector-card-head">
                    <span class="dna-inspector-icon">${icon(item.icon)}</span>
                    <span class="dna-state-label">${stateLabel(item.state)}</span>
                </div>
                <strong>${escapeHtml(item.label)}</strong>
                <p>${escapeHtml(item.detail)}</p>
            </article>
        `).join("");
    }

    function renderFindings(findings) {
        const list = byId("findingsList");
        if (!list) return;
        text("findingCount", `${findings.length} finding${findings.length === 1 ? "" : "s"}`);

        list.innerHTML = findings.map(item => `
            <article class="inspector-list-item" data-tone="${escapeHtml(item.tone)}">
                <span class="inspector-list-icon">${icon(toneIcon(item.tone))}</span>
                <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div>
            </article>
        `).join("");
    }

    function renderImprovements(improvements) {
        const list = byId("improvementsList");
        if (!list) return;

        list.innerHTML = improvements.map((item, index) => `
            <article class="inspector-list-item improvement-item">
                <span class="improvement-index">${String(index + 1).padStart(2, "0")}</span>
                <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div>
                <span class="improvement-icon">${icon(item.icon)}</span>
            </article>
        `).join("");
    }

    function renderSignal(analysis) {
        const prompt = analysis.prompt;
        const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
        const signal = !prompt ? "Waiting" : (analysis.duplicates.length ? "Review" : "Clean");

        text("signalCharacters", prompt.length.toLocaleString());
        text("signalWords", words.toLocaleString());
        text("signalDuplicates", analysis.duplicates.length);
        text("signalModeFit", analysis.modeFit);
        text("signalBadge", signal);
        byId("signalBadge")?.setAttribute("data-signal", signal.toLowerCase());
        text("signalNote", analysis.signalNote);
    }

    function improvementForCreative(label, partial = false) {
        const map = {
            Subject: improvement("sparkles", partial ? "Strengthen subject definition" : "Define the subject", "Choose a Character Preset or provide enough custom physical features to anchor the image."),
            Action: improvement("wand", "Complete pose and expression", "Add both body action and facial expression so the subject reads as one intentional moment."),
            Outfit: improvement("shirt", partial ? "Finish the custom outfit" : "Choose the outfit", "Specify clothing before finalizing so styling and scene compatibility can be evaluated."),
            Scene: improvement("compass", "Anchor the scene", "Choose a setting so lighting, pose, outfit, and camera choices have a clear environment."),
            Style: improvement("gem", "Define the visual language", "Choose a Style Preset or a stronger camera direction to reduce ambiguity in the final look."),
            Framing: improvement("film", "Set the framing", "Choose a camera angle or framing direction to control composition and subject emphasis."),
            Light: improvement("light", "Specify lighting", "Add a lighting direction so mood, skin rendering, and environment are more predictable."),
            Ratio: improvement("cube", "Choose an aspect ratio", "Set the intended output ratio before finalizing composition."),
        };
        return map[label] || improvement("info", `Review ${label}`, "Return to Build and strengthen this partially defined prompt area.");
    }

    function improvementForCatalog(label) {
        const map = {
            Subject: improvement("sparkles", "Define the catalog subject", "Choose a catalog subject or complete the custom subject field."),
            "Catalog Type": improvement("gem", "Choose the catalog direction", "Select the campaign/catalog type so the closing presentation language is intentional."),
            Preservation: improvement("shield", "Activate outfit preservation", "Select a preservation level before using a reference outfit prompt."),
            Scene: improvement("compass", "Choose the catalog setting", "Select a curated scene or finish the custom setting description."),
            Pose: improvement("wand", "Choose the presentation pose", "Set an age-appropriate, catalog-friendly pose for the subject."),
            Shot: improvement("film", "Set the shot type", "Choose framing so the clothing is shown at the intended scale."),
            Ratio: improvement("cube", "Set the aspect ratio", "Choose the final catalog output ratio before generating the image."),
        };
        return map[label] || improvement("info", `Review ${label}`, "Return to Build and complete this required catalog area.");
    }

    function dimension(label, iconName, state, detail) {
        return { label, icon: iconName, state, detail };
    }

    function finding(tone, title, detail) {
        return { tone, title, detail };
    }

    function improvement(iconName, title, detail) {
        return { icon: iconName, title, detail };
    }

    function scoreDimensions(dimensions) {
        if (!dimensions.length) return 0;
        const total = dimensions.reduce((sum, item) => {
            if (item.state === READY) return sum + 1;
            if (item.state === PARTIAL) return sum + 0.5;
            return sum;
        }, 0);
        return Math.round((total / dimensions.length) * 100);
    }

    function findDuplicateClauses(prompt) {
        if (!prompt) return [];
        const clauses = prompt
            .split(/[,.!?;:\n]+/)
            .map(item => item.trim().toLowerCase().replace(/\s+/g, " "))
            .filter(item => item.split(" ").length >= 5);

        const counts = new Map();
        clauses.forEach(clause => counts.set(clause, (counts.get(clause) || 0) + 1));
        return [...counts.entries()].filter(([, count]) => count > 1).map(([clause]) => clause);
    }

    function detectChildSubject(subjectText) {
        return /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(subjectText || "");
    }

    function getCurrentMode() {
        const mode = byId("activeModeBadge")?.dataset?.mode;
        if (mode === "outfit_catalog") return "outfit_catalog";
        if (byId("catalogFields") && !byId("catalogFields").hidden) return "outfit_catalog";
        return "creative";
    }

    function getActiveStyleLabel() {
        const badge = byId("activeStyleBadge");
        if (!badge || badge.hidden) return "";
        const textValue = badge.textContent?.trim() || "";
        return textValue && !/^no style$/i.test(textValue) ? textValue : "";
    }

    function getPromptText() {
        return byId("output")?.value?.trim() || "";
    }

    function selectedLabel(id) {
        const element = byId(id);
        if (!element || !element.selectedOptions?.length) return "";
        const option = element.selectedOptions[0];
        if (option.dataset?.placeholder === "true") return "";
        const label = option.textContent?.trim() || "";
        if (/^--.*--$/.test(label)) return "";
        return label;
    }

    function value(id) {
        return byId(id)?.value || "";
    }

    function checkedValue(name) {
        return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
    }

    function joinDetail(parts, fallback) {
        const usable = parts.filter(Boolean);
        return usable.length ? usable.join(" · ") : fallback;
    }

    function getHealthLevel(score) {
        if (score >= 90) return "excellent";
        if (score >= 75) return "good";
        if (score >= 55) return "review";
        return "weak";
    }

    function getHealthMeta(score) {
        if (score >= 90) return { title: "Excellent prompt structure", summary: "The current prompt is well-covered and requires only optional refinement.", signal: "Excellent" };
        if (score >= 75) return { title: "Strong prompt with room to refine", summary: "Most important structure is present; targeted improvements can make the result more predictable.", signal: "Strong" };
        if (score >= 55) return { title: "Usable but incomplete", summary: "The prompt has a workable foundation, but several missing or weak signals still matter.", signal: "Review" };
        return { title: "Build needs more structure", summary: "Important prompt dimensions are still missing or insufficiently defined.", signal: "Weak" };
    }

    function stateLabel(state) {
        if (state === READY) return "Ready";
        if (state === PARTIAL) return "Partial";
        if (state === OPTIONAL) return "Optional";
        return "Missing";
    }

    function toneIcon(tone) {
        if (tone === "positive") return "check";
        if (tone === "warning") return "warning";
        return "info";
    }

    function setBar(id, score) {
        const bar = byId(id);
        if (!bar) return;
        bar.style.width = `${clampNumber(score || 0, 0, 100)}%`;
    }

    function text(id, valueToSet) {
        const element = byId(id);
        if (element) element.textContent = String(valueToSet ?? "");
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function clampNumber(number, min, max) {
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
    }

    function icon(name) {
        return window.PromptIcons?.svg ? window.PromptIcons.svg(name) : "";
    }

    function escapeHtml(valueToEscape) {
        return String(valueToEscape ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character]));
    }

    window.PromptInspector = {
        refresh: analyzeAndRender
    };
})();
