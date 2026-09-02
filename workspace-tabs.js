(function () {
    "use strict";

    const STORAGE_KEY = "promptGenWorkspace";
    const WORKSPACES = [
        { id: "build", label: "Build", description: "Compose prompt", icon: "wand" },
        { id: "history", label: "History", description: "Saved sessions", icon: "history" }
    ];

    let activeWorkspace = "build";
    let tabButtons = [];
    let workspacePanes = [];

    loadWorkspaceAssets();
    document.addEventListener("DOMContentLoaded", initWorkspaceShell);

    function loadWorkspaceAssets() {
        loadStyle("prompt-history.css?v=4.5-history-1", "prompt-history-style");
        loadScript("prompt-history.js?v=4.5-history-1", "prompt-history-script");
        loadStyle("setting-preview.css?v=4.5-setting-preview-1", "setting-preview-style");
        loadScript("setting-preview.js?v=4.5-setting-preview-1", "setting-preview-script");
    }

    function loadStyle(href, key) {
        if (document.querySelector(`link[data-workspace-asset="${key}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.workspaceAsset = key;
        document.head.append(link);
    }

    function loadScript(src, key) {
        if (document.querySelector(`script[data-workspace-asset="${key}"]`)) return;
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.dataset.workspaceAsset = key;
        script.addEventListener("load", dispatchShellReady);
        document.head.append(script);
    }

    function dispatchShellReady() {
        window.dispatchEvent(new CustomEvent("promptgen:workspace-shell-ready"));
    }

    function initWorkspaceShell() {
        const appShell = document.querySelector(".app-shell");
        const hero = appShell?.querySelector(".hero");
        const buildPane = appShell?.querySelector(".main-grid");

        if (!appShell || !hero || !buildPane) return;
        if (document.querySelector("[data-workspace-tabs]")) return;

        prepareBuildPane(buildPane);

        const navigation = createWorkspaceNavigation();
        hero.insertAdjacentElement("afterend", navigation);

        const historyPane = createPlaceholderPane({
            id: "history",
            icon: "history",
            eyebrow: "Prompt Archive",
            title: "History workspace is loading local prompt sessions",
            description: "Recent explicit Generate actions, prompt previews, restore, copy, and delete controls are initializing in this browser.",
            phase: "Step 2"
        });

        buildPane.insertAdjacentElement("afterend", historyPane);

        tabButtons = [...navigation.querySelectorAll("[data-workspace-tab]")];
        workspacePanes = [...appShell.querySelectorAll("[data-workspace-pane]")];

        bindWorkspaceEvents(navigation);

        const storedWorkspace = readStoredWorkspace();
        setActiveWorkspace(storedWorkspace, { persist: false, focus: false, notify: false });

        dispatchShellReady();
    }

    function prepareBuildPane(buildPane) {
        buildPane.id = buildPane.id || "workspace-build";
        buildPane.dataset.workspacePane = "build";
        buildPane.setAttribute("role", "tabpanel");
        buildPane.setAttribute("aria-labelledby", "workspace-tab-build");
        buildPane.tabIndex = 0;
    }

    function createWorkspaceNavigation() {
        const nav = document.createElement("nav");
        nav.className = "workspace-shell-nav";
        nav.dataset.workspaceTabs = "true";
        nav.setAttribute("aria-label", "Prompt Gen workspace navigation");

        const tabList = document.createElement("div");
        tabList.className = "workspace-tabs";
        tabList.style.gridTemplateColumns = `repeat(${WORKSPACES.length}, minmax(0, 1fr))`;
        tabList.setAttribute("role", "tablist");
        tabList.setAttribute("aria-label", "Workspaces");

        WORKSPACES.forEach((workspace, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "workspace-tab";
            button.id = `workspace-tab-${workspace.id}`;
            button.dataset.workspaceTab = workspace.id;
            button.setAttribute("role", "tab");
            button.setAttribute("aria-controls", `workspace-${workspace.id}`);
            button.setAttribute("aria-selected", index === 0 ? "true" : "false");
            button.tabIndex = index === 0 ? 0 : -1;
            button.innerHTML = `
                <span class="workspace-tab-icon" aria-hidden="true">${iconSvg(workspace.icon)}</span>
                <span class="workspace-tab-copy">
                    <strong>${escapeHtml(workspace.label)}</strong>
                    <small>${escapeHtml(workspace.description)}</small>
                </span>
            `;
            tabList.append(button);
        });

        nav.append(tabList);
        return nav;
    }

    function createPlaceholderPane({ id, icon, eyebrow, title, description, phase }) {
        const pane = document.createElement("section");
        pane.id = `workspace-${id}`;
        pane.className = "workspace-pane workspace-placeholder";
        pane.dataset.workspacePane = id;
        pane.setAttribute("role", "tabpanel");
        pane.setAttribute("aria-labelledby", `workspace-tab-${id}`);
        pane.tabIndex = 0;
        pane.hidden = true;

        pane.innerHTML = `
            <div class="panel workspace-placeholder-panel">
                <div class="workspace-placeholder-icon" aria-hidden="true">${iconSvg(icon)}</div>
                <div class="workspace-placeholder-copy">
                    <div class="workspace-placeholder-meta">
                        <span>${escapeHtml(eyebrow)}</span>
                        <span class="workspace-placeholder-phase">${escapeHtml(phase)}</span>
                    </div>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(description)}</p>
                    <div class="workspace-foundation-status">
                        <span class="workspace-foundation-dot" aria-hidden="true"></span>
                        <span>Workspace foundation ready</span>
                    </div>
                </div>
            </div>
        `;

        return pane;
    }

    function bindWorkspaceEvents(navigation) {
        navigation.addEventListener("click", event => {
            const tab = event.target.closest("[data-workspace-tab]");
            if (!tab) return;
            setActiveWorkspace(tab.dataset.workspaceTab, { persist: true, focus: false, notify: true });
        });

        navigation.addEventListener("keydown", event => {
            const tab = event.target.closest("[data-workspace-tab]");
            if (!tab) return;

            const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
            if (!keys.includes(event.key)) return;

            event.preventDefault();
            const currentIndex = tabButtons.indexOf(tab);
            if (currentIndex < 0) return;

            let nextIndex = currentIndex;
            if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
            if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabButtons.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = tabButtons.length - 1;

            const nextTab = tabButtons[nextIndex];
            nextTab?.focus();
            setActiveWorkspace(nextTab?.dataset.workspaceTab, { persist: true, focus: false, notify: true });
        });
    }

    function setActiveWorkspace(workspaceId, options = {}) {
        const { persist = true, focus = false, notify = true } = options;
        const nextWorkspace = isValidWorkspace(workspaceId) ? workspaceId : "build";
        activeWorkspace = nextWorkspace;

        tabButtons.forEach(tab => {
            const isActive = tab.dataset.workspaceTab === nextWorkspace;
            tab.setAttribute("aria-selected", isActive ? "true" : "false");
            tab.tabIndex = isActive ? 0 : -1;
            tab.classList.toggle("is-active", isActive);
            if (isActive && focus) tab.focus();
        });

        workspacePanes.forEach(pane => {
            const isActive = pane.dataset.workspacePane === nextWorkspace;
            pane.hidden = !isActive;
            pane.classList.toggle("is-active", isActive);
        });

        document.body.dataset.workspace = nextWorkspace;
        if (persist) writeStoredWorkspace(nextWorkspace);

        if (notify) {
            window.dispatchEvent(new CustomEvent("promptgen:workspacechange", {
                detail: { workspace: nextWorkspace }
            }));
        }
    }

    function readStoredWorkspace() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return isValidWorkspace(stored) ? stored : "build";
        } catch (_) {
            return "build";
        }
    }

    function writeStoredWorkspace(workspaceId) {
        try {
            localStorage.setItem(STORAGE_KEY, workspaceId);
        } catch (_) {
            // Navigation remains usable when storage is unavailable.
        }
    }

    function isValidWorkspace(workspaceId) {
        return WORKSPACES.some(workspace => workspace.id === workspaceId);
    }

    function iconSvg(name) {
        if (window.PromptIcons?.svg) return window.PromptIcons.svg(name);
        return "";
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    window.PromptWorkspaceTabs = {
        getActive: () => activeWorkspace,
        setActive: workspaceId => setActiveWorkspace(workspaceId, { persist: true, focus: false, notify: true }),
        workspaces: WORKSPACES.map(workspace => ({ ...workspace }))
    };
})();
