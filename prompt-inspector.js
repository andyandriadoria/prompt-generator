(function () {
    "use strict";

    const READY = "ready";
    const PARTIAL = "partial";
    const MISSING = "missing";
    const OPTIONAL = "optional";

    let pane = null;
    let initialized = false;
    let frame = 0;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryInit, { once: true });
    } else {
        queueMicrotask(tryInit);
    }
    window.addEventListener("promptgen:workspace-shell-ready", tryInit);

    function tryInit() {
        if (initialized) return;
        pane = document.getElementById("workspace-inspect");
        if (!pane) return;
        initialized = true;
        buildWorkspace();
        bindEvents();
        observeSignals();
        schedule();
    }

    function buildWorkspace() {
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
                <section class="panel health-panel">
                    <div class="health-score-block">
                        <div class="health-score-ring" id="healthScoreRing" data-level="excellent"><span id="healthScore">0</span><small>/100</small></div>
                        <div class="health-score-copy">
                            <span class="inspector-section-label">Prompt Health</span>
                            <h3 id="promptHealthTitle">Waiting for Build state</h3>
                            <p id="healthSummary">Build a prompt to receive a structural review.</p>
                        </div>
                    </div>
                    <div class="health-metrics">
                        <div class="health-metric"><span>Completeness</span><strong id="completenessScore">0%</strong><div class="metric-track"><i id="completenessBar"></i></div></div>
                        <div class="health-metric"><span id="secondaryMetricLabel">Coherence</span><strong id="secondaryMetricScore">—</strong><div class="metric-track"><i id="secondaryMetricBar"></i></div></div>
                    </div>
                </section>

                <section class="panel inspector-context-panel">
                    <div class="inspector-panel-heading"><div><span class="inspector-section-label">Current Context</span><h3>Build snapshot</h3></div><span class="inspect-mode-badge" id="inspectModeBadge">Creative</span></div>
                    <dl class="context-list">
                        <div><dt>Prompt mode</dt><dd id="contextMode">—</dd></div>
                        <div><dt>Visual direction</dt><dd id="contextStyle">—</dd></div>
                        <div><dt>Output length</dt><dd id="contextLength">0 characters</dd></div>
                        <div><dt>Signal</dt><dd id="contextSignal">Waiting</dd></div>
                    </dl>
                </section>
            </div>

            <section class="panel dna-inspector-panel">
                <div class="inspector-panel-heading"><div><span class="inspector-section-label">Expanded Prompt DNA</span><h3>Structural coverage</h3></div><span class="dna-summary" id="dnaSummary">0 / 0 ready</span></div>
                <div class="expanded-dna-grid" id="expandedDnaGrid"></div>
            </section>

            <div class="inspector-grid inspector-lower-grid">
                <section class="panel findings-panel">
                    <div class="inspector-panel-heading"><div><span class="inspector-section-label">Findings</span><h3>What Prompt Gen sees</h3></div><span class="finding-count" id="findingCount">0 findings</span></div>
                    <div class="inspector-list" id="findingsList"></div>
                </section>
                <section class="panel improvements-panel">
                    <div class="inspector-panel-heading"><div><span class="inspector-section-label">Suggested Improvements</span><h3>Highest-value next moves</h3></div></div>
                    <div class="inspector-list" id="improvementsList"></div>
                </section>
            </div>

            <section class="panel prompt-signal-panel">
                <div class="inspector-panel-heading"><div><span class="inspector-section-label">Prompt Signal</span><h3>Output diagnostics</h3></div><span class="signal-badge" id="signalBadge">Waiting</span></div>
                <div class="signal-grid">
                    <div class="signal-stat"><span>Characters</span><strong id="signalCharacters">0</strong></div>
                    <div class="signal-stat"><span>Words</span><strong id="signalWords">0</strong></div>
                    <div class="signal-stat"><span>Duplicate clauses</span><strong id="signalDuplicates">0</strong></div>
                    <div class="signal-stat"><span>Mode fit</span><strong id="signalModeFit">—</strong></div>
                </div>
                <p class="signal-note" id="signalNote">Diagnostics will update from the current generated prompt.</p>
            </section>`;
    }

    function bindEvents() {
        byId("inspectorRefreshBtn")?.addEventListener("click", analyze);
        byId("inspectorBuildBtn")?.addEventListener("click", () => window.PromptWorkspaceTabs?.setActive("build"));

        window.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "inspect") analyze();
        });

        ["input", "change"].forEach(type => document.addEventListener(type, event => {
            if (event.target?.closest?.("#workspace-build")) schedule();
        }, true));

        document.addEventListener("click", event => {
            if (event.target?.closest?.("#workspace-build button, #workspace-build [data-prompt-mode-id], #workspace-build [data-style-preset-id]")) {
                setTimeout(schedule, 40);
            }
        }, true);
    }

    function observeSignals() {
        if (!window.MutationObserver) return;
        const observer = new MutationObserver(schedule);
        ["activeModeBadge", "activeStyleBadge", "compatibilityScore", "compatibilityLabel", "compatibilityResult", "promptStats"].map(byId).filter(Boolean).forEach(target => {
            observer.observe(target, { attributes: true, childList: true, characterData: true, subtree: true });
        });
    }

    function schedule() {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { frame = 0; analyze(); });
    }

    function analyze() {
        if (!initialized) return;
        render(currentMode() === "outfit_catalog" ? analyzeCatalog() : analyzeCreative());
    }

    function analyzeCreative() {
        const prompt = promptText();
        const compatibilityOn = Boolean(byId("compatibilityToggle")?.checked);
        const coherence = compatibilityOn ? clamp(parseInt(byId("compatibilityScore")?.textContent || "100", 10)) : null;
        const preset = activeStyle();
        const character = value("characterPreset");
        const features = value("features").trim();
        const outfit = value("outfit");
        const manualOutfit = value("manualOutfit").trim();
        const cameraStyle = value("cameraType");

        const dimensions = [
            dim("Subject", "sparkles", character && character !== "custom" ? READY : (features ? PARTIAL : MISSING), character && character !== "custom" ? selected("characterPreset") : (features ? "Custom physical features provided" : "No subject definition yet")),
            dim("Action", "wand", value("action") && value("expression") ? READY : (value("action") || value("expression") ? PARTIAL : MISSING), detail([selected("action"), selected("expression")], "Pose and expression are not defined")),
            dim("Outfit", "shirt", outfit && (outfit !== "manual_outfit" || manualOutfit) ? READY : (outfit === "manual_outfit" ? PARTIAL : MISSING), outfit === "manual_outfit" ? (manualOutfit || "Custom outfit is empty") : (selected("outfit") || "No outfit selected")),
            dim("Scene", "compass", value("setting") ? READY : MISSING, selected("setting") || "No setting selected"),
            dim("Style", "gem", preset ? READY : (cameraStyle ? PARTIAL : MISSING), preset || (selected("cameraType") ? `${selected("cameraType")} only` : "No visual direction selected")),
            dim("Framing", "film", value("cameraAngle") ? READY : (cameraStyle ? PARTIAL : MISSING), selected("cameraAngle") || (cameraStyle ? "Camera style set; angle still open" : "No camera direction")),
            dim("Light", "light", value("lighting") ? READY : MISSING, selected("lighting") || "No lighting selected"),
            dim("Ratio", "cube", checked("aspectRatio") ? READY : MISSING, checked("aspectRatio") || "No aspect ratio selected")
        ];

        const completeness = score(dimensions);
        const duplicates = duplicateClauses(prompt);
        let health = coherence === null ? completeness : Math.round(completeness * .65 + coherence * .35);
        health = Math.max(0, health - Math.min(8, duplicates.length * 2));

        const missing = dimensions.filter(x => x.state === MISSING);
        const partial = dimensions.filter(x => x.state === PARTIAL);
        const findings = [];
        const improvements = [];

        if (!prompt) findings.push(find("warning", "No generated prompt yet", "Generate or edit the Build state so Prompt Intelligence has output to evaluate."));
        if (coherence === null) findings.push(find("info", "Smart Compatibility is disabled", "Coherence is not included in Prompt Health while Smart Compatibility is off."));
        else if (coherence >= 90) findings.push(find("positive", "Strong combination coherence", `Smart Compatibility reports ${coherence}/100 for the current Creative setup.`));
        else if (coherence >= 75) findings.push(find("info", "Combination can improve", `Smart Compatibility is ${coherence}/100. Review its Build findings before finalizing.`));
        else findings.push(find("warning", "Weak combination coherence", `Smart Compatibility is ${coherence}/100. Resolve conflicting choices first.`));

        findings.push(missing.length
            ? find("warning", `${missing.length} structural area${missing.length === 1 ? " is" : "s are"} missing`, missing.slice(0, 4).map(x => x.label).join(", "))
            : find("positive", "Core structure is complete", "All primary Creative Prompt DNA areas have usable values."));

        if (partial.length) findings.push(find("info", `${partial.length} area${partial.length === 1 ? " is" : "s are"} partially defined`, partial.slice(0, 4).map(x => x.label).join(", ")));
        if (!preset) findings.push(find("info", "No Prompt Style Preset is active", cameraStyle ? "Camera Style adds direction, but a Style Preset would make the visual language more explicit." : "The prompt has no high-level visual direction yet."));
        if (duplicates.length) findings.push(find("warning", "Repeated clauses detected", `${duplicates.length} repeated long clause${duplicates.length === 1 ? "" : "s"} may add unnecessary emphasis.`));
        else if (prompt) findings.push(find("positive", "No obvious clause redundancy", "The current output does not contain repeated long clauses."));

        missing.slice(0, 3).forEach(x => improvements.push(creativeImprovement(x.label, false)));
        partial.slice(0, 2).forEach(x => { if (improvements.length < 4) improvements.push(creativeImprovement(x.label, true)); });
        if (coherence !== null && coherence < 85 && improvements.length < 4) improvements.push(improve("brain", "Resolve the lowest compatibility signal", "Return to Build and review Smart Compatibility messages before adding more detail."));
        if (!preset && improvements.length < 4) improvements.push(improve("palette", "Choose a visual direction", "Apply a Style Preset when you want camera, lighting, ratio, and style language to behave as one system."));
        if (!improvements.length) improvements.push(improve("check", "Structure is ready", "The current prompt has strong coverage. Refine only details that matter to the intended image."));

        return result("creative", "Creative Prompt Builder", preset || selected("cameraType") || "Custom / unstyled", dimensions, completeness, compatibilityOn ? "Coherence" : "Coherence off", coherence, health, findings, improvements, prompt, duplicates,
            completeness >= 75 ? "Strong" : completeness >= 50 ? "Partial" : "Weak",
            compatibilityOn ? "Prompt Health combines structural completeness and Smart Compatibility, with a small redundancy penalty for repeated clauses." : "Prompt Health currently reflects structural completeness because Smart Compatibility is disabled.");
    }

    function analyzeCatalog() {
        const prompt = promptText();
        const subject = value("catalogSubject");
        const subjectText = subject === "custom" ? value("catalogCustomSubject").trim() : selected("catalogSubject");
        const setting = value("catalogSetting");
        const settingText = setting === "manual_setting" ? value("catalogCustomSetting").trim() : selected("catalogSetting");
        const preservation = value("preservationLevel");
        const extra = value("catalogExtraInstruction").trim();
        const child = /\b(child|children|kid|kids|girl|boy|years?-old|young girl|young boy)\b/i.test(subjectText || "");

        const dimensions = [
            dim("Subject", "sparkles", subjectText ? READY : MISSING, subjectText || "No subject selected"),
            dim("Catalog Type", "gem", value("catalogType") ? READY : MISSING, selected("catalogType") || "No catalog direction selected"),
            dim("Preservation", "shield", preservation ? READY : MISSING, selected("preservationLevel") || "Outfit preservation is not selected"),
            dim("Scene", "compass", settingText ? READY : MISSING, settingText || "No setting selected"),
            dim("Pose", "wand", value("catalogPose") ? READY : MISSING, selected("catalogPose") || "No presentation pose selected"),
            dim("Shot", "film", value("catalogShot") ? READY : MISSING, selected("catalogShot") || "No shot type selected"),
            dim("Ratio", "cube", value("catalogAspectRatio") ? READY : MISSING, value("catalogAspectRatio") || "No aspect ratio selected"),
            dim("Extra Direction", "light", extra ? READY : OPTIONAL, extra || "Optional — no extra instruction")
        ];

        const required = dimensions.filter(x => x.state !== OPTIONAL);
        const completeness = score(required);
        const preservationScore = preservation ? 100 : 0;
        const duplicates = duplicateClauses(prompt);
        let health = Math.round(completeness * .75 + preservationScore * .25);
        health = Math.max(0, health - Math.min(8, duplicates.length * 2));
        const missing = required.filter(x => x.state === MISSING);
        const findings = [];
        const improvements = [];

        if (!prompt) findings.push(find("warning", "No generated catalog prompt yet", "Generate a catalog prompt so preservation wording and output structure can be inspected."));
        findings.push(preservation
            ? find("positive", "Outfit preservation guard is active", `${selected("preservationLevel") || "A preservation level"} is included in the current catalog setup.`)
            : find("warning", "Outfit preservation is missing", "Reference Outfit Catalog should not be finalized without an explicit preservation level."));
        findings.push(child
            ? find("positive", "Child-safe catalog guard is active", "The selected subject is recognized as a child and continues to use the existing child-safe workflow.")
            : find("info", "Standard catalog subject", "No child-specific presentation guard is required for the current subject."));
        findings.push(missing.length
            ? find("warning", `${missing.length} required catalog area${missing.length === 1 ? " is" : "s are"} missing`, missing.slice(0, 4).map(x => x.label).join(", "))
            : find("positive", "Catalog structure is complete", "All required Reference Outfit Catalog dimensions have usable values."));
        if (duplicates.length) findings.push(find("warning", "Repeated clauses detected", `${duplicates.length} repeated long clause${duplicates.length === 1 ? "" : "s"} should be reviewed for unnecessary duplication.`));
        else if (prompt) findings.push(find("positive", "No obvious clause redundancy", "The current catalog output does not contain repeated long clauses."));

        missing.slice(0, 4).forEach(x => improvements.push(catalogImprovement(x.label)));
        if (!extra && improvements.length < 4) improvements.push(improve("light", "Add extra direction only when needed", "Extra Instruction is optional. Use it for lighting or composition detail, not to rewrite outfit preservation rules."));
        if (!improvements.length) improvements.push(improve("check", "Catalog prompt is structurally ready", "Keep the reference image attached when using the generated prompt; no structural gap needs correction first."));

        return result("outfit_catalog", "Reference Outfit Catalog", selected("catalogType") || "Catalog direction not selected", dimensions, completeness, "Preservation Guard", preservationScore, health, findings, improvements, prompt, duplicates,
            completeness >= 85 && preservation ? "Strong" : completeness >= 55 ? "Partial" : "Weak",
            "Catalog Prompt Health prioritizes required workflow completeness and explicit outfit preservation. Optional extra direction does not reduce completeness.");
    }

    function render(a) {
        const meta = healthMeta(a.health);
        text("healthScore", a.health);
        text("promptHealthTitle", meta.title);
        text("healthSummary", meta.summary);
        byId("healthScoreRing")?.setAttribute("data-level", healthLevel(a.health));
        text("completenessScore", `${a.completeness}%`);
        bar("completenessBar", a.completeness);
        text("secondaryMetricLabel", a.secondaryLabel);
        text("secondaryMetricScore", a.secondaryScore === null ? "Not evaluated" : `${a.secondaryScore}%`);
        bar("secondaryMetricBar", a.secondaryScore || 0);
        text("inspectModeBadge", a.mode === "outfit_catalog" ? "Catalog" : "Creative");
        byId("inspectModeBadge")?.setAttribute("data-mode", a.mode);
        text("contextMode", a.modeLabel);
        text("contextStyle", a.visualDirection);
        text("contextLength", `${a.prompt.length.toLocaleString()} characters`);
        text("contextSignal", meta.signal);
        renderDna(a.dimensions);
        renderFindings(a.findings);
        renderImprovements(a.improvements);
        renderSignal(a);
    }

    function renderDna(items) {
        const grid = byId("expandedDnaGrid");
        if (!grid) return;
        text("dnaSummary", `${items.filter(x => x.state === READY).length} / ${items.filter(x => x.state !== OPTIONAL).length} ready`);
        grid.innerHTML = items.map(x => `<article class="dna-inspector-card" data-state="${esc(x.state)}"><div class="dna-inspector-card-head"><span class="dna-inspector-icon">${icon(x.icon)}</span><span class="dna-state-label">${stateLabel(x.state)}</span></div><strong>${esc(x.label)}</strong><p>${esc(x.detail)}</p></article>`).join("");
    }

    function renderFindings(items) {
        text("findingCount", `${items.length} finding${items.length === 1 ? "" : "s"}`);
        const list = byId("findingsList");
        if (list) list.innerHTML = items.slice(0, 5).map(x => `<article class="inspector-list-item" data-tone="${esc(x.tone)}"><span class="inspector-list-icon">${icon(x.tone === "positive" ? "check" : x.tone === "warning" ? "warning" : "info")}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p></div></article>`).join("");
    }

    function renderImprovements(items) {
        const list = byId("improvementsList");
        if (list) list.innerHTML = items.slice(0, 4).map((x, i) => `<article class="inspector-list-item improvement-item"><span class="improvement-index">${String(i + 1).padStart(2, "0")}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p></div><span class="improvement-icon">${icon(x.icon)}</span></article>`).join("");
    }

    function renderSignal(a) {
        const words = a.prompt ? a.prompt.split(/\s+/).filter(Boolean).length : 0;
        const signal = !a.prompt ? "Waiting" : a.duplicates.length ? "Review" : "Clean";
        text("signalCharacters", a.prompt.length.toLocaleString());
        text("signalWords", words.toLocaleString());
        text("signalDuplicates", a.duplicates.length);
        text("signalModeFit", a.modeFit);
        text("signalBadge", signal);
        byId("signalBadge")?.setAttribute("data-signal", signal.toLowerCase());
        text("signalNote", a.signalNote);
    }

    function creativeImprovement(label, partial) {
        const map = {
            Subject: improve("sparkles", partial ? "Strengthen subject definition" : "Define the subject", "Choose a Character Preset or provide enough custom physical features to anchor the image."),
            Action: improve("wand", "Complete pose and expression", "Add both body action and facial expression so the subject reads as one intentional moment."),
            Outfit: improve("shirt", partial ? "Finish the custom outfit" : "Choose the outfit", "Specify clothing so styling and scene compatibility can be evaluated."),
            Scene: improve("compass", "Anchor the scene", "Choose a setting so lighting, pose, outfit, and camera choices have a clear environment."),
            Style: improve("gem", "Define the visual language", "Choose a Style Preset or stronger camera direction to reduce ambiguity in the final look."),
            Framing: improve("film", "Set the framing", "Choose a camera angle or framing direction to control composition and subject emphasis."),
            Light: improve("light", "Specify lighting", "Add a lighting direction so mood, skin rendering, and environment are more predictable."),
            Ratio: improve("cube", "Choose an aspect ratio", "Set the intended output ratio before finalizing composition.")
        };
        return map[label] || improve("info", `Review ${label}`, "Return to Build and strengthen this prompt area.");
    }

    function catalogImprovement(label) {
        const map = {
            Subject: improve("sparkles", "Define the catalog subject", "Choose a catalog subject or complete the custom subject field."),
            "Catalog Type": improve("gem", "Choose the catalog direction", "Select the campaign/catalog type so presentation language is intentional."),
            Preservation: improve("shield", "Activate outfit preservation", "Select a preservation level before using a reference outfit prompt."),
            Scene: improve("compass", "Choose the catalog setting", "Select a curated scene or finish the custom setting description."),
            Pose: improve("wand", "Choose the presentation pose", "Set an age-appropriate, catalog-friendly pose for the subject."),
            Shot: improve("film", "Set the shot type", "Choose framing so the clothing is shown at the intended scale."),
            Ratio: improve("cube", "Set the aspect ratio", "Choose the final catalog output ratio before generating the image.")
        };
        return map[label] || improve("info", `Review ${label}`, "Return to Build and complete this required catalog area.");
    }

    function result(mode, modeLabel, visualDirection, dimensions, completeness, secondaryLabel, secondaryScore, health, findings, improvements, prompt, duplicates, modeFit, signalNote) {
        return { mode, modeLabel, visualDirection, dimensions, completeness, secondaryLabel, secondaryScore, health, findings, improvements, prompt, duplicates, modeFit, signalNote };
    }

    function dim(label, iconName, state, detailText) { return { label, icon: iconName, state, detail: detailText }; }
    function find(tone, title, detailText) { return { tone, title, detail: detailText }; }
    function improve(iconName, title, detailText) { return { icon: iconName, title, detail: detailText }; }
    function score(items) { return items.length ? Math.round(items.reduce((n, x) => n + (x.state === READY ? 1 : x.state === PARTIAL ? .5 : 0), 0) / items.length * 100) : 0; }

    function duplicateClauses(prompt) {
        if (!prompt) return [];
        const clauses = prompt.split(/[,.!?;:\n]+/).map(x => x.trim().toLowerCase().replace(/\s+/g, " ")).filter(x => x.split(" ").length >= 5);
        const counts = new Map();
        clauses.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
        return [...counts].filter(([, count]) => count > 1).map(([clause]) => clause);
    }

    function currentMode() {
        if (byId("activeModeBadge")?.dataset?.mode === "outfit_catalog") return "outfit_catalog";
        return byId("catalogFields") && !byId("catalogFields").hidden ? "outfit_catalog" : "creative";
    }
    function activeStyle() {
        const badge = byId("activeStyleBadge");
        if (!badge || badge.hidden) return "";
        const t = badge.textContent?.trim() || "";
        return /^no style$/i.test(t) ? "" : t;
    }
    function selected(id) {
        const option = byId(id)?.selectedOptions?.[0];
        if (!option || option.dataset?.placeholder === "true") return "";
        const t = option.textContent?.trim() || "";
        return /^--.*--$/.test(t) ? "" : t;
    }
    function value(id) { return byId(id)?.value || ""; }
    function checked(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value || ""; }
    function promptText() { return byId("output")?.value?.trim() || ""; }
    function detail(parts, fallback) { const x = parts.filter(Boolean); return x.length ? x.join(" · ") : fallback; }
    function healthLevel(n) { return n >= 90 ? "excellent" : n >= 75 ? "good" : n >= 55 ? "review" : "weak"; }
    function healthMeta(n) {
        if (n >= 90) return { title: "Excellent prompt structure", summary: "The current prompt is well-covered and requires only optional refinement.", signal: "Excellent" };
        if (n >= 75) return { title: "Strong prompt with room to refine", summary: "Most important structure is present; targeted improvements can make the result more predictable.", signal: "Strong" };
        if (n >= 55) return { title: "Usable but incomplete", summary: "The prompt has a workable foundation, but several missing or weak signals still matter.", signal: "Review" };
        return { title: "Build needs more structure", summary: "Important prompt dimensions are still missing or insufficiently defined.", signal: "Weak" };
    }
    function stateLabel(s) { return s === READY ? "Ready" : s === PARTIAL ? "Partial" : s === OPTIONAL ? "Optional" : "Missing"; }
    function clamp(n) { return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0; }
    function bar(id, n) { const el = byId(id); if (el) el.style.width = `${clamp(n || 0)}%`; }
    function text(id, v) { const el = byId(id); if (el) el.textContent = String(v ?? ""); }
    function byId(id) { return document.getElementById(id); }
    function icon(name) { return window.PromptIcons?.svg ? window.PromptIcons.svg(name) : ""; }
    function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

    window.PromptInspector = { refresh: analyze };
})();
