(function () {
    "use strict";

    const STORAGE_KEY = "promptGenHistoryV1";
    const MAX_ITEMS = 50;

    let pane = null;
    let initialized = false;
    let items = [];
    let selectedId = "";
    let suppressCapture = false;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryInit, { once: true });
    } else {
        queueMicrotask(tryInit);
    }
    window.addEventListener("promptgen:workspace-shell-ready", tryInit);

    function tryInit() {
        if (initialized) return;
        pane = document.getElementById("workspace-history");
        if (!pane) return;
        initialized = true;
        buildWorkspace();
        bindEvents();
        loadHistory();
        render();
    }

    function buildWorkspace() {
        pane.classList.remove("workspace-placeholder");
        pane.classList.add("history-workspace");
        pane.innerHTML = `
            <div class="history-head panel">
                <div class="history-head-copy">
                    <span class="history-kicker"><span>${icon("history")}</span>Prompt History · Local</span>
                    <h2>Return to prompts worth keeping</h2>
                    <p>Only explicit Generate Prompt actions are saved. Auto-generated previews stay temporary so History remains useful instead of noisy.</p>
                </div>
                <div class="history-head-actions">
                    <div class="history-capacity"><strong id="historyCount">0</strong><span>/ ${MAX_ITEMS} saved</span></div>
                    <button type="button" class="ghost-button history-clear-button" id="historyClearBtn">${icon("reset")}<span>Clear History</span></button>
                </div>
            </div>

            <div class="history-layout">
                <section class="panel history-browser" aria-labelledby="historyBrowserTitle">
                    <div class="history-browser-head">
                        <div>
                            <span class="history-section-label">Sessions</span>
                            <h3 id="historyBrowserTitle">Recent prompts</h3>
                        </div>
                        <span class="history-browser-count" id="historyBrowserCount">0 items</span>
                    </div>

                    <div class="history-toolbar">
                        <label class="history-search-wrap">
                            <span class="history-search-icon">${icon("search")}</span>
                            <input type="search" id="historySearch" placeholder="Search prompt history" autocomplete="off">
                        </label>
                        <select id="historyModeFilter" aria-label="Filter prompt mode">
                            <option value="all">All modes</option>
                            <option value="creative">Creative</option>
                            <option value="outfit_catalog">Catalog</option>
                        </select>
                    </div>

                    <div class="history-list" id="historyList"></div>
                    <div class="history-empty" id="historyEmpty" hidden>
                        <span>${icon("history")}</span>
                        <strong>No saved prompts yet</strong>
                        <p>Use Generate Prompt in Build. The completed state will appear here automatically.</p>
                        <button type="button" class="primary-button" id="historyEmptyBuildBtn">${icon("wand")}<span>Go to Build</span></button>
                    </div>
                </section>

                <aside class="panel history-preview" aria-labelledby="historyPreviewTitle">
                    <div class="history-preview-head">
                        <div>
                            <span class="history-section-label">Preview</span>
                            <h3 id="historyPreviewTitle">Select a saved prompt</h3>
                        </div>
                        <span class="history-preview-mode" id="historyPreviewMode">—</span>
                    </div>

                    <div class="history-preview-meta" id="historyPreviewMeta" hidden>
                        <div><span>Saved</span><strong id="historyPreviewTime">—</strong></div>
                        <div><span>Style</span><strong id="historyPreviewStyle">—</strong></div>
                        <div><span>Length</span><strong id="historyPreviewLength">—</strong></div>
                    </div>

                    <div class="history-editor-shell">
                        <div class="history-editor-topline"><span>history/prompt.txt</span><span id="historyPreviewStatus">LOCAL</span></div>
                        <textarea id="historyPromptPreview" readonly placeholder="Choose an item from History to preview its prompt."></textarea>
                    </div>

                    <div class="history-preview-actions">
                        <button type="button" class="primary-button" id="historyRestoreBtn" disabled>${icon("refresh")}<span>Restore to Build</span></button>
                        <button type="button" class="secondary-button" id="historyCopyBtn" disabled>${icon("copy")}<span>Copy</span></button>
                        <button type="button" class="ghost-button history-delete-button" id="historyDeleteBtn" disabled>${icon("close")}<span>Delete</span></button>
                    </div>
                    <p class="history-status" id="historyStatus" role="status" aria-live="polite"></p>
                </aside>
            </div>
        `;
    }

    function bindEvents() {
        document.addEventListener("click", event => {
            if (!event.target.closest("#generatePromptBtn")) return;
            if (suppressCapture) {
                suppressCapture = false;
                return;
            }
            window.setTimeout(captureCurrentPrompt, 0);
        });

        document.getElementById("historyList")?.addEventListener("click", event => {
            const item = event.target.closest("[data-history-id]");
            if (!item) return;
            selectItem(item.dataset.historyId);
        });

        document.getElementById("historySearch")?.addEventListener("input", renderList);
        document.getElementById("historyModeFilter")?.addEventListener("change", renderList);
        document.getElementById("historyRestoreBtn")?.addEventListener("click", restoreSelected);
        document.getElementById("historyCopyBtn")?.addEventListener("click", copySelected);
        document.getElementById("historyDeleteBtn")?.addEventListener("click", deleteSelected);
        document.getElementById("historyClearBtn")?.addEventListener("click", clearHistory);
        document.getElementById("historyEmptyBuildBtn")?.addEventListener("click", () => window.PromptWorkspaceTabs?.setActive("build"));

        window.addEventListener("promptgen:workspacechange", event => {
            if (event.detail?.workspace === "history") {
                loadHistory();
                render();
            }
        });

        window.addEventListener("storage", event => {
            if (event.key !== STORAGE_KEY) return;
            loadHistory();
            render();
        });
    }

    function captureCurrentPrompt() {
        const prompt = document.getElementById("output")?.value?.trim() || "";
        if (!prompt) return;

        const snapshot = createSnapshot(prompt);
        if (!snapshot) return;

        loadHistory();
        const fingerprint = makeFingerprint(snapshot);
        const existingFirst = items[0];

        if (existingFirst && existingFirst.fingerprint === fingerprint) {
            snapshot.id = existingFirst.id;
            snapshot.fingerprint = fingerprint;
            items[0] = snapshot;
        } else {
            snapshot.fingerprint = fingerprint;
            items.unshift(snapshot);
            items = items.slice(0, MAX_ITEMS);
        }

        selectedId = snapshot.id;
        if (!writeHistory(items)) return;

        render();
        setStatus("Prompt saved to local History.", "success");
        window.dispatchEvent(new CustomEvent("promptgen:historychange", { detail: { count: items.length } }));
    }

    function createSnapshot(prompt) {
        const mode = getCurrentMode();
        const common = {
            styleApplyMode: checkedValue("styleApplyMode"),
            includeNegativePrompt: Boolean(document.getElementById("includeNegativePrompt")?.checked),
            compatibilityEnabled: Boolean(document.getElementById("compatibilityToggle")?.checked),
            compatibilityMode: value("compatibilityMode")
        };

        const state = mode === "outfit_catalog"
            ? {
                catalogSubject: value("catalogSubject"),
                catalogCustomSubject: value("catalogCustomSubject"),
                catalogType: value("catalogType"),
                preservationLevel: value("preservationLevel"),
                catalogSetting: value("catalogSetting"),
                catalogCustomSetting: value("catalogCustomSetting"),
                catalogPose: value("catalogPose"),
                catalogShot: value("catalogShot"),
                catalogAspectRatio: value("catalogAspectRatio"),
                catalogExtraInstruction: value("catalogExtraInstruction")
            }
            : {
                characterPreset: value("characterPreset"),
                subjectGender: value("subjectGender"),
                features: value("features"),
                action: value("action"),
                expression: value("expression"),
                outfit: value("outfit"),
                manualOutfit: value("manualOutfit"),
                settingType: checkedValue("settingType"),
                setting: value("setting"),
                cameraAngle: value("cameraAngle"),
                lighting: value("lighting"),
                cameraType: value("cameraType"),
                aspectRatio: checkedValue("aspectRatio"),
                stylePresetId: document.querySelector("[data-style-preset-id].is-active")?.dataset?.stylePresetId || "",
                ...common
            };

        const timestamp = Date.now();
        return {
            id: createId(timestamp),
            timestamp,
            mode,
            modeLabel: mode === "outfit_catalog" ? "Reference Outfit Catalog" : "Creative Prompt Builder",
            styleLabel: getStyleLabel(mode),
            prompt,
            state
        };
    }

    function restoreSelected() {
        const item = items.find(entry => entry.id === selectedId);
        if (!item) return;

        const modeCard = document.querySelector(`[data-prompt-mode-id="${cssEscape(item.mode)}"]`);
        if (!modeCard) {
            setStatus("Build data is not ready yet. Refresh the page and try again.", "error");
            return;
        }

        window.PromptWorkspaceTabs?.setActive("build");
        modeCard.click();

        const missing = [];
        if (item.mode === "outfit_catalog") restoreCatalog(item.state || {}, missing);
        else restoreCreative(item.state || {}, missing);

        suppressCapture = true;
        document.getElementById("generatePromptBtn")?.click();
        window.PromptInspector?.refresh?.();

        if (missing.length) {
            setStatus(`Restored with ${missing.length} unavailable saved option${missing.length === 1 ? "" : "s"}: ${missing.slice(0, 3).join(", ")}.`, "warning");
        } else {
            setStatus("Saved session restored to Build.", "success");
        }
    }

    function restoreCreative(state, missing) {
        setRadio("styleApplyMode", state.styleApplyMode || "replace");
        setCheckbox("includeNegativePrompt", state.includeNegativePrompt);
        setCheckbox("compatibilityToggle", state.compatibilityEnabled);
        setSelect("compatibilityMode", state.compatibilityMode || "prioritize", missing, "Compatibility mode");

        if (state.stylePresetId) {
            const card = document.querySelector(`[data-style-preset-id="${cssEscape(state.stylePresetId)}"]`);
            if (card) card.click();
            else missing.push("Style Preset");
        } else {
            document.getElementById("clearStylePresetBtn")?.click();
        }

        setSelect("characterPreset", state.characterPreset || "custom", missing, "Character");
        setSelect("subjectGender", state.subjectGender || "auto", missing, "Subject / Pronoun");
        setText("features", state.features || "");
        setSelect("action", state.action || "", missing, "Pose / Action");
        setSelect("expression", state.expression || "", missing, "Expression");
        setSelect("outfit", state.outfit || "", missing, "Outfit");
        setText("manualOutfit", state.manualOutfit || "");
        setRadio("settingType", state.settingType || "outdoor");
        setSelect("setting", state.setting || "", missing, "Setting");
        setSelect("cameraAngle", state.cameraAngle || "", missing, "Camera Angle");
        setSelect("lighting", state.lighting || "", missing, "Lighting");
        setSelect("cameraType", state.cameraType || "", missing, "Camera Style");
        setRadio("aspectRatio", state.aspectRatio || "");
    }

    function restoreCatalog(state, missing) {
        setSelect("catalogSubject", state.catalogSubject || "custom", missing, "Subject");
        setText("catalogCustomSubject", state.catalogCustomSubject || "");
        setSelect("catalogType", state.catalogType || "", missing, "Catalog Type");
        setSelect("preservationLevel", state.preservationLevel || "", missing, "Preservation");
        setSelect("catalogSetting", state.catalogSetting || "", missing, "Catalog Setting");
        setText("catalogCustomSetting", state.catalogCustomSetting || "");
        setSelect("catalogPose", state.catalogPose || "", missing, "Catalog Pose");
        setSelect("catalogShot", state.catalogShot || "", missing, "Catalog Shot");
        setSelect("catalogAspectRatio", state.catalogAspectRatio || "", missing, "Aspect Ratio");
        setText("catalogExtraInstruction", state.catalogExtraInstruction || "");
    }

    function copySelected() {
        const item = items.find(entry => entry.id === selectedId);
        if (!item?.prompt) return;
        copyText(item.prompt).then(ok => {
            setStatus(ok ? "Prompt copied to clipboard." : "Could not copy the prompt.", ok ? "success" : "error");
        });
    }

    function deleteSelected() {
        if (!selectedId) return;
        const index = items.findIndex(entry => entry.id === selectedId);
        if (index < 0) return;
        items.splice(index, 1);
        selectedId = items[index]?.id || items[index - 1]?.id || items[0]?.id || "";
        if (!writeHistory(items)) return;
        render();
        setStatus("History item deleted.", "success");
        window.dispatchEvent(new CustomEvent("promptgen:historychange", { detail: { count: items.length } }));
    }

    function clearHistory() {
        if (!items.length) return;
        if (!window.confirm("Clear all locally saved Prompt Gen history on this browser?")) return;
        items = [];
        selectedId = "";
        if (!writeHistory(items)) return;
        render();
        setStatus("Local prompt history cleared.", "success");
        window.dispatchEvent(new CustomEvent("promptgen:historychange", { detail: { count: 0 } }));
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            items = Array.isArray(parsed) ? parsed.filter(isValidItem).slice(0, MAX_ITEMS) : [];
        } catch (_) {
            items = [];
            setStatus("Local History could not be read in this browser.", "error");
        }

        if (selectedId && !items.some(item => item.id === selectedId)) selectedId = "";
        if (!selectedId && items.length) selectedId = items[0].id;
    }

    function writeHistory(nextItems) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems.slice(0, MAX_ITEMS)));
            return true;
        } catch (_) {
            setStatus("History could not be saved. Browser storage may be unavailable or full.", "error");
            return false;
        }
    }

    function render() {
        updateCounts();
        renderList();
        renderPreview();
    }

    function renderList() {
        const list = document.getElementById("historyList");
        const empty = document.getElementById("historyEmpty");
        if (!list || !empty) return;

        const query = document.getElementById("historySearch")?.value?.trim().toLowerCase() || "";
        const modeFilter = document.getElementById("historyModeFilter")?.value || "all";
        const filtered = items.filter(item => {
            const modeMatch = modeFilter === "all" || item.mode === modeFilter;
            if (!modeMatch) return false;
            if (!query) return true;
            return [item.prompt, item.modeLabel, item.styleLabel].filter(Boolean).join(" ").toLowerCase().includes(query);
        });

        document.getElementById("historyBrowserCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
        list.innerHTML = "";
        empty.hidden = filtered.length > 0 || items.length > 0;

        if (!filtered.length) {
            if (items.length) {
                list.innerHTML = `<div class="history-no-results"><span>${icon("search")}</span><strong>No matching history</strong><p>Try another search or mode filter.</p></div>`;
            }
            return;
        }

        const groups = groupByDay(filtered);
        groups.forEach(group => {
            const section = document.createElement("section");
            section.className = "history-day-group";
            section.innerHTML = `<div class="history-day-label"><span>${escapeHtml(group.label)}</span><small>${group.items.length}</small></div>`;
            const entries = document.createElement("div");
            entries.className = "history-day-items";

            group.items.forEach(item => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "history-item";
                button.dataset.historyId = item.id;
                button.classList.toggle("is-active", item.id === selectedId);
                button.setAttribute("aria-pressed", item.id === selectedId ? "true" : "false");
                button.innerHTML = `
                    <span class="history-item-icon">${icon(item.mode === "outfit_catalog" ? "shirt" : "sparkles")}</span>
                    <span class="history-item-copy">
                        <span class="history-item-topline"><strong>${escapeHtml(item.mode === "outfit_catalog" ? "Catalog" : "Creative")}</strong><time>${escapeHtml(formatTime(item.timestamp))}</time></span>
                        <span class="history-item-style">${escapeHtml(item.styleLabel || "Custom / unstyled")}</span>
                        <span class="history-item-excerpt">${escapeHtml(makeExcerpt(item.prompt))}</span>
                    </span>
                `;
                entries.append(button);
            });

            section.append(entries);
            list.append(section);
        });
    }

    function renderPreview() {
        const item = items.find(entry => entry.id === selectedId);
        const hasItem = Boolean(item);
        const preview = document.getElementById("historyPromptPreview");
        const meta = document.getElementById("historyPreviewMeta");

        document.getElementById("historyRestoreBtn").disabled = !hasItem;
        document.getElementById("historyCopyBtn").disabled = !hasItem;
        document.getElementById("historyDeleteBtn").disabled = !hasItem;
        meta.hidden = !hasItem;

        if (!item) {
            document.getElementById("historyPreviewTitle").textContent = "Select a saved prompt";
            document.getElementById("historyPreviewMode").textContent = "—";
            preview.value = "";
            return;
        }

        document.getElementById("historyPreviewTitle").textContent = item.modeLabel;
        document.getElementById("historyPreviewMode").textContent = item.mode === "outfit_catalog" ? "Catalog" : "Creative";
        document.getElementById("historyPreviewMode").dataset.mode = item.mode;
        document.getElementById("historyPreviewTime").textContent = formatDateTime(item.timestamp);
        document.getElementById("historyPreviewStyle").textContent = item.styleLabel || "Custom / unstyled";
        document.getElementById("historyPreviewLength").textContent = `${item.prompt.length.toLocaleString()} characters`;
        preview.value = item.prompt;
    }

    function selectItem(id) {
        if (!items.some(item => item.id === id)) return;
        selectedId = id;
        renderList();
        renderPreview();
    }

    function updateCounts() {
        const count = items.length;
        document.getElementById("historyCount").textContent = String(count);
        const clearButton = document.getElementById("historyClearBtn");
        if (clearButton) clearButton.disabled = count === 0;
        updateTabCount(count);
    }

    function updateTabCount(count) {
        const tab = document.getElementById("workspace-tab-history");
        if (!tab) return;
        let badge = tab.querySelector(".workspace-tab-count");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "workspace-tab-count";
            tab.append(badge);
        }
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count === 0;
    }

    function groupByDay(source) {
        const groups = [];
        const map = new Map();
        source.forEach(item => {
            const date = new Date(item.timestamp);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!map.has(key)) {
                const group = { key, label: relativeDayLabel(date), items: [] };
                map.set(key, group);
                groups.push(group);
            }
            map.get(key).items.push(item);
        });
        return groups;
    }

    function relativeDayLabel(date) {
        const today = startOfDay(new Date());
        const target = startOfDay(date);
        const diff = Math.round((today - target) / 86400000);
        if (diff === 0) return "Today";
        if (diff === 1) return "Yesterday";
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(date);
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function formatTime(timestamp) {
        return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
    }

    function formatDateTime(timestamp) {
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
    }

    function setSelect(id, nextValue, missing, label) {
        const element = document.getElementById(id);
        if (!element) return false;
        const desired = String(nextValue ?? "");
        const exists = [...element.options].some(option => option.value === desired);
        if (!exists && desired) {
            missing.push(label || id);
            return false;
        }
        element.value = exists ? desired : "";
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function setText(id, nextValue) {
        const element = document.getElementById(id);
        if (!element) return;
        element.value = String(nextValue ?? "");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setCheckbox(id, checked) {
        const element = document.getElementById(id);
        if (!element) return;
        element.checked = Boolean(checked);
        element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setRadio(name, nextValue) {
        if (!nextValue) return false;
        const inputs = [...document.querySelectorAll(`input[name="${cssEscape(name)}"]`)];
        const target = inputs.find(input => input.value === String(nextValue));
        if (!target) return false;
        target.checked = true;
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function checkedValue(name) {
        return document.querySelector(`input[name="${cssEscape(name)}"]:checked`)?.value || "";
    }

    function value(id) {
        return document.getElementById(id)?.value || "";
    }

    function getCurrentMode() {
        const badgeMode = document.getElementById("activeModeBadge")?.dataset?.mode;
        if (badgeMode === "outfit_catalog") return "outfit_catalog";
        if (document.getElementById("catalogFields") && !document.getElementById("catalogFields").hidden) return "outfit_catalog";
        return "creative";
    }

    function getStyleLabel(mode) {
        if (mode === "outfit_catalog") return selectedLabel("catalogType") || "Catalog";
        const badge = document.getElementById("activeStyleBadge");
        if (badge && !badge.hidden && badge.textContent.trim()) return badge.textContent.trim();
        return selectedLabel("cameraType") || "Custom / unstyled";
    }

    function selectedLabel(id) {
        const element = document.getElementById(id);
        const option = element?.selectedOptions?.[0];
        if (!option || option.dataset?.placeholder === "true") return "";
        const text = option.textContent?.trim() || "";
        return /^--.*--$/.test(text) ? "" : text;
    }

    function makeFingerprint(snapshot) {
        return JSON.stringify({ mode: snapshot.mode, prompt: snapshot.prompt, state: snapshot.state });
    }

    function createId(timestamp) {
        if (window.crypto?.randomUUID) return crypto.randomUUID();
        return `pg-${timestamp}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function makeExcerpt(prompt) {
        const compact = String(prompt || "").replace(/\s+/g, " ").trim();
        return compact.length > 118 ? `${compact.slice(0, 115)}…` : compact;
    }

    function isValidItem(item) {
        return item && typeof item.id === "string" && typeof item.timestamp === "number" && typeof item.prompt === "string" && ["creative", "outfit_catalog"].includes(item.mode);
    }

    async function copyText(text) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (_) {
            // Fall back to a temporary textarea below.
        }

        try {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.append(textarea);
            textarea.select();
            const ok = document.execCommand("copy");
            textarea.remove();
            return ok;
        } catch (_) {
            return false;
        }
    }

    function setStatus(message, tone = "info") {
        const status = document.getElementById("historyStatus");
        if (!status) return;
        status.textContent = message || "";
        status.dataset.tone = tone;
    }

    function icon(name) {
        return window.PromptIcons?.svg ? window.PromptIcons.svg(name) : "";
    }

    function cssEscape(valueToEscape) {
        if (window.CSS?.escape) return CSS.escape(String(valueToEscape));
        return String(valueToEscape).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }

    function escapeHtml(valueToEscape) {
        return String(valueToEscape ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    window.PromptHistory = {
        refresh: () => { loadHistory(); render(); },
        capture: captureCurrentPrompt,
        count: () => items.length
    };
})();
