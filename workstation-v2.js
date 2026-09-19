(function (global) {
  "use strict";

  const MODE_PREVIEWS = {
    creative: "assets/settings/indoor-sunlit-neutral-minimalist-interior.png",
    outfit_catalog: "assets/settings/indoor-clean-fashion-atelier-studio.png",
    product_catalog: "assets/settings/indoor-textile-gallery-display-niche.png",
    product_poster: "assets/settings/outdoor-7-eleven-store.jpg",
    architectural_render: "assets/settings/outdoor-contemporary-boutique-hotel-courtyard.png",
    architectural_sketch: "assets/settings/outdoor-contemporary-garden-pavilion.png"
  };

  const MODE_GROUPS = {
    creative: [
      { title: "Subject", icon: "sparkles", ids: ["characterPreset", "subjectGender", "features", "action", "expression", "outfit", "manualOutfitRow"] },
      { title: "Scene", icon: "compass", ids: ["settingType", "setting"] },
      { title: "Camera & Technical", icon: "camera", ids: ["cameraAngle", "lighting", "cameraType", "aspectRatioGroup"] }
    ],
    outfit_catalog: [
      { title: "Subject", icon: "shirt", ids: ["catalogSubject", "catalogCustomSubjectRow", "catalogType"] },
      { title: "Presentation", icon: "palette", ids: ["catalogSetting", "catalogCustomSettingRow", "catalogPose", "catalogShot"] },
      { title: "Preservation", icon: "shield", ids: ["preservationLevel", "catalogAspectRatio", "catalogExtraInstruction"] }
    ],
    product_catalog: [
      { title: "Product", icon: "package", ids: ["productType", "productComposition", "productPreservation"] },
      { title: "Presentation", icon: "palette", ids: ["productPresentation", "productSetting", "productWearContextRow"] },
      { title: "Framing & Output", icon: "camera", ids: ["productShot", "productAspectRatio", "productTextOverlayRow", "productExtraInstruction"] }
    ],
    product_poster: [
      { title: "Product Information", icon: "poster", ids: ["posterProductInformation"] },
      { title: "Poster Direction", icon: "palette", ids: ["posterExtraInstruction"] },
      { title: "Base Photograph", icon: "shield", ids: [] }
    ],
    architectural_render: [
      { title: "Project", icon: "building", ids: ["archInputType", "archBuildingCategory", "archBuildingType", "archCustomBuildingRow", "archFidelity"] },
      { title: "Design & Realism", icon: "palette", ids: ["archRealismTarget", "archStyleCategory", "archArchitectureStyle", "archCustomArchitectureStyleRow", "archMaterials"] },
      { title: "Environment & View", icon: "camera", ids: ["archLighting", "archAtmosphere", "archLandscape", "archCamera", "archAspectRatio", "archExtraInstruction"] }
    ],
    architectural_sketch: [
      { title: "Project", icon: "building", ids: ["archSketchInputType", "archSketchBuildingCategory", "archSketchBuildingType", "archSketchCustomBuildingRow", "archSketchSceneType"] },
      { title: "Sketch", icon: "drafting", ids: ["archSketchStyle", "archSketchMedium", "archSketchStyleCategory", "archSketchArchitectureStyle", "archSketchCustomArchitectureStyleRow", "archSketchHumanScale"] },
      { title: "Presentation", icon: "camera", ids: ["archSketchLighting", "archSketchMood", "archSketchLandscape", "archSketchFeatures", "archSketchCameraView", "archSketchAnnotationText", "archSketchAspectRatio", "archSketchExtraInstruction", "archSketchAdvanced"] }
    ]
  };

  let initialized = false;
  let activeOutputTab = "prompt";
  let analysisTimer = 0;
  let promptFormObserver = null;

  document.addEventListener("DOMContentLoaded", init);
  global.addEventListener("promptgen:workspace-shell-ready", init);

  function init() {
    if (initialized) return;
    const appShell = document.querySelector(".app-shell");
    const hero = appShell?.querySelector(".hero");
    const mainGrid = appShell?.querySelector(".main-grid");
    const controls = mainGrid?.querySelector(".controls-panel");
    const output = mainGrid?.querySelector(".output-panel");
    const workspaceNav = appShell?.querySelector(".workspace-shell-nav") || document.querySelector(".workspace-shell-nav");

    if (!appShell || !hero || !mainGrid || !controls || !output || !workspaceNav) {
      setTimeout(init, 80);
      return;
    }

    initialized = true;
    document.body.classList.add("workstation-v2");

    createSidebar(appShell, workspaceNav);
    enhanceTopbar(hero);
    enhanceBuildWorkspace(controls, output);
    enhancePromptModePanel();
    enhanceStylePanel();
    enhancePromptForm();
    enhanceOutputPanel(output);
    arrangeKnownModeSections();
    observeDynamicModeSections();
    bindGlobalRefreshes();
    updateWorkstationState();
  }

  function icon(name) {
    return global.PromptIcons?.svg?.(name) || "";
  }

  function createSidebar(appShell, workspaceNav) {
    if (document.querySelector(".workstation-sidebar")) return;

    const sidebar = document.createElement("aside");
    sidebar.className = "workstation-sidebar";
    sidebar.setAttribute("aria-label", "Prompt Gen navigation");
    sidebar.innerHTML = `
      <button type="button" class="workstation-sidebar-brand" aria-label="Prompt Gen home"><span>PG</span></button>
      <div class="workstation-sidebar-main"></div>
      <div class="workstation-sidebar-tools">
        <button type="button" class="workstation-side-action" data-workstation-action="database">
          <span class="workstation-side-icon">${icon("database")}</span><span>Database</span>
        </button>
        <button type="button" class="workstation-side-action" data-workstation-action="settings">
          <span class="workstation-side-icon">${icon("settings")}</span><span>Settings</span>
        </button>
      </div>
      <div class="workstation-sidebar-foot">
        <span>Turn ideas<br>into visuals<br>with better<br>prompts.</span>
        <i></i>
        <small>Prompt Gen 4.5</small>
      </div>
    `;

    const main = sidebar.querySelector(".workstation-sidebar-main");
    main.append(workspaceNav);

    workspaceNav.querySelectorAll("[data-workspace-tab]").forEach(button => {
      const copy = button.querySelector(".workspace-tab-copy");
      const strong = copy?.querySelector("strong");
      const small = copy?.querySelector("small");
      if (button.dataset.workspaceTab === "saved" && strong) strong.textContent = "Library";
      if (small) small.remove();
    });

    document.body.insertBefore(sidebar, appShell);

    sidebar.addEventListener("click", event => {
      const action = event.target.closest("[data-workstation-action]")?.dataset.workstationAction;
      if (action === "database") toggleDatabaseDrawer();
      if (action === "settings") toggleSettingsDrawer();
    });

    createUtilityDrawers();
  }

  function createUtilityDrawers() {
    if (!document.querySelector(".workstation-scrim")) {
      const scrim = document.createElement("button");
      scrim.type = "button";
      scrim.className = "workstation-scrim";
      scrim.setAttribute("aria-label", "Close panel");
      scrim.addEventListener("click", closeUtilityDrawers);
      document.body.append(scrim);
    }

    if (!document.querySelector(".workstation-settings-drawer")) {
      const drawer = document.createElement("aside");
      drawer.className = "workstation-settings-drawer";
      drawer.innerHTML = `
        <div class="workstation-drawer-head">
          <div><span>Interface</span><strong>Settings</strong></div>
          <button type="button" class="workstation-drawer-close" aria-label="Close settings">${icon("close")}</button>
        </div>
        <div class="workstation-drawer-card">
          <span class="workstation-drawer-label">Appearance</span>
          <strong>Light / Dark workspace</strong>
          <p>Use the production Obsidian appearance toggle.</p>
          <button type="button" class="workstation-drawer-button" data-settings-action="appearance">Toggle appearance</button>
        </div>
        <div class="workstation-drawer-card">
          <span class="workstation-drawer-label">Data</span>
          <strong>Refresh Google Sheets</strong>
          <p>Fetch the latest content while preserving production config.js.</p>
          <button type="button" class="workstation-drawer-button" data-settings-action="refresh">Refresh Now</button>
        </div>
      `;
      document.body.append(drawer);
      drawer.querySelector(".workstation-drawer-close")?.addEventListener("click", closeUtilityDrawers);
      drawer.addEventListener("click", event => {
        const action = event.target.closest("[data-settings-action]")?.dataset.settingsAction;
        if (action === "appearance") document.getElementById("themeToggle")?.click();
        if (action === "refresh") document.getElementById("refreshDataBtn")?.click();
      });
    }
  }

  function toggleDatabaseDrawer() {
    const details = document.querySelector(".database-settings");
    if (!details) return;
    closeUtilityDrawers();
    details.open = true;
    document.body.classList.add("workstation-database-open");
  }

  function toggleSettingsDrawer() {
    closeUtilityDrawers();
    document.body.classList.add("workstation-settings-open");
  }

  function closeUtilityDrawers() {
    document.body.classList.remove("workstation-database-open", "workstation-settings-open");
  }

  function enhanceTopbar(hero) {
    hero.classList.add("workstation-topbar");

    if (!hero.querySelector(".workstation-topbar-tool")) {
      const tool = document.createElement("span");
      tool.className = "workstation-topbar-tool";
      tool.innerHTML = icon("wand");
      hero.querySelector(".hero-brand")?.insertBefore(tool, hero.querySelector(".hero-copy"));
    }

    if (!hero.querySelector(".workstation-profile")) {
      const creator = document.getElementById("creatorName")?.textContent?.trim() || "Ndoy Creator";
      const profile = document.createElement("div");
      profile.className = "workstation-profile";
      profile.innerHTML = `
        <span class="workstation-avatar">${escapeHtml(creator.charAt(0).toUpperCase())}</span>
        <span class="workstation-profile-copy"><strong>${escapeHtml(creator)}</strong><small>Creative Studio</small></span>
        <span class="workstation-profile-chevron">${icon("chevron-down")}</span>
      `;
      hero.querySelector(".hero-actions")?.append(profile);
    }
  }

  function enhanceBuildWorkspace(controls, output) {
    controls.classList.add("workstation-canvas");
    output.classList.add("workstation-live-output");

    if (!controls.querySelector(".workstation-build-heading")) {
      const heading = document.createElement("header");
      heading.className = "workstation-build-heading";
      heading.innerHTML = `
        <div>
          <span class="workstation-build-eyebrow">CREATIVE INSTRUMENT PANEL</span>
          <h2>Build Your Prompt</h2>
          <p>Structure. Style. Generate. Turn your ideas into incredible visuals.</p>
        </div>
        <span class="workstation-scribble">A bigger<br>creative you<i></i></span>
      `;
      controls.insertBefore(heading, controls.firstChild);
    }

    const dna = document.getElementById("promptDna");
    const heading = controls.querySelector(".workstation-build-heading");
    if (dna && heading && dna.parentElement !== controls) {
      heading.insertAdjacentElement("afterend", dna);
    }
    enhanceDna(dna);

    const workspaceBar = controls.querySelector(".workspace-bar");
    if (workspaceBar) workspaceBar.classList.add("workstation-legacy-console");

    const promptForm = document.getElementById("promptForm");
    if (promptForm && !controls.querySelector(".workstation-details-head")) {
      const detailsHead = document.createElement("div");
      detailsHead.className = "workstation-details-head";
      detailsHead.innerHTML = `
        <div class="workstation-section-number">3</div>
        <div class="workstation-section-copy">
          <span>PROMPT DETAILS</span>
          <p>Fine-tune the details to shape your perfect prompt.</p>
        </div>
        <div class="workstation-quick-fill"></div>
      `;
      promptForm.insertAdjacentElement("beforebegin", detailsHead);

      const actions = controls.querySelector(".workspace-actions");
      if (actions) detailsHead.querySelector(".workstation-quick-fill")?.append(actions);
    }
  }

  function enhanceDna(dna) {
    if (!dna) return;
    dna.classList.add("workstation-dna");

    const head = dna.querySelector(".prompt-dna-head");
    if (head) {
      head.innerHTML = `<span>PROMPT DNA</span><small>Build step by step<br>for better results.</small>`;
    }

    const grid = dna.querySelector(".prompt-dna-grid");
    if (grid && !document.getElementById("dnaFrame")) {
      grid.insertAdjacentHTML("beforeend", `
        <span class="dna-node" id="dnaFrame"><i></i><b>Frame</b></span>
        <span class="dna-node" id="dnaOutput"><i></i><b>Output</b></span>
      `);
    }

    if (!dna.querySelector(".workstation-dna-count")) {
      const count = document.createElement("div");
      count.className = "workstation-dna-count";
      count.innerHTML = `<strong>0 / 7</strong><span>Build step by step<br>for better results.</span>`;
      dna.append(count);
    }

    const observer = new MutationObserver(updateDnaProgress);
    dna.querySelectorAll(".dna-node").forEach(node => observer.observe(node, { attributes: true, attributeFilter: ["class"] }));
  }

  function enhancePromptModePanel() {
    const panel = document.querySelector(".prompt-mode-panel");
    if (!panel) return;
    panel.classList.add("workstation-step-panel", "workstation-mode-step");

    const head = panel.querySelector(".prompt-mode-head");
    if (head && !head.querySelector(".workstation-step-number")) {
      head.insertAdjacentHTML("afterbegin", `<span class="workstation-step-number">1</span>`);
    }

    const eyebrow = panel.querySelector(".mini-eyebrow");
    if (eyebrow) eyebrow.textContent = "PROMPT MODE";
    const title = panel.querySelector("h2");
    if (title) title.textContent = "Choose how you want to build your prompt.";
    const copy = panel.querySelector(".prompt-mode-head p");
    if (copy) copy.textContent = "";
  }

  function enhanceStylePanel() {
    const panel = document.querySelector(".style-presets");
    if (!panel) return;
    panel.classList.add("workstation-step-panel", "workstation-style-step");

    const head = panel.querySelector(".style-presets-head");
    if (head && !head.querySelector(".workstation-step-number")) {
      head.insertAdjacentHTML("afterbegin", `<span class="workstation-step-number">2</span>`);
    }

    const eyebrow = panel.querySelector(".mini-eyebrow");
    if (eyebrow) eyebrow.textContent = "STYLE DNA";
    const title = panel.querySelector("h2");
    if (title) title.textContent = "Choose a visual style preset or customize your own.";
    const copy = panel.querySelector(".style-presets-head p");
    if (copy) copy.textContent = "";

    const clear = document.getElementById("clearStylePresetBtn");
    if (clear) clear.textContent = "Clear Style";

    ensureCustomStyleCard();
    const grid = document.getElementById("stylePresetGrid");
    if (grid && !grid.dataset.workstationObserved) {
      grid.dataset.workstationObserved = "true";
      new MutationObserver(ensureCustomStyleCard).observe(grid, { childList: true });
    }
  }

  function ensureCustomStyleCard() {
    const grid = document.getElementById("stylePresetGrid");
    if (!grid || grid.querySelector(".workstation-custom-style-card")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "workstation-custom-style-card";
    button.innerHTML = `
      <span class="workstation-custom-plus">+</span>
      <strong>Create<br>Custom Style</strong>
    `;
    button.addEventListener("click", () => {
      document.getElementById("clearStylePresetBtn")?.click();
      document.getElementById("promptForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    grid.append(button);
  }

  function enhancePromptForm() {
    const form = document.getElementById("promptForm");
    if (!form) return;
    form.classList.add("workstation-prompt-form");

    const buttons = form.querySelector(".button-group");
    if (buttons) buttons.classList.add("workstation-action-bar");

    arrangeKnownModeSections();
  }

  function arrangeKnownModeSections() {
    arrangeModeSection(document.getElementById("creativeFields"), "creative");
    arrangeModeSection(document.getElementById("catalogFields"), "outfit_catalog");
    arrangeModeSection(document.getElementById("productFields"), "product_catalog");
    arrangeModeSection(document.getElementById("posterFields"), "product_poster");
    arrangeModeSection(document.getElementById("architecturalRenderFields"), "architectural_render");
    arrangeModeSection(document.getElementById("architecturalSketchFields"), "architectural_sketch");
  }

  function arrangeModeSection(section, modeId) {
    if (!section || section.dataset.workstationArranged === "true") return;
    const groups = MODE_GROUPS[modeId];
    if (!groups) return;

    section.dataset.workstationArranged = "true";
    section.classList.add("workstation-mode-fields");

    const intro = [...section.children].find(child =>
      child.classList?.contains("catalog-mode-intro") ||
      child.classList?.contains("product-mode-intro") ||
      child.classList?.contains("poster-mode-intro") ||
      child.classList?.contains("arch-mode-intro") ||
      child.classList?.contains("arch-sketch-intro")
    );
    if (intro) intro.classList.add("workstation-mode-banner");

    const grid = document.createElement("div");
    grid.className = "workstation-detail-grid";

    groups.forEach(group => {
      const card = document.createElement("section");
      card.className = "workstation-detail-card";
      card.innerHTML = `
        <header><span class="workstation-detail-icon">${icon(group.icon)}</span><strong>${escapeHtml(group.title)}</strong></header>
        <div class="workstation-detail-fields"></div>
      `;
      const body = card.querySelector(".workstation-detail-fields");

      group.ids.forEach(id => {
        const row = resolveFieldRow(id);
        if (row && !body.contains(row)) body.append(row);
      });

      if (modeId === "product_poster" && group.title === "Base Photograph") {
        const note = section.querySelector(".poster-preservation-note");
        if (note) body.append(note);
      }

      if (modeId === "architectural_sketch" && group.title === "Presentation") {
        const advanced = document.getElementById("archSketchAdvanced");
        if (advanced) body.append(advanced);
      }

      grid.append(card);
    });

    const leftovers = [...section.children].filter(child =>
      child !== intro &&
      child !== grid &&
      !child.classList?.contains("workstation-detail-grid")
    );

    const extras = document.createElement("div");
    extras.className = "workstation-detail-extras";
    leftovers.forEach(child => {
      if (child.classList?.contains("field-row") ||
          child.classList?.contains("fieldset-row") ||
          child.classList?.contains("catalog-safety-note") ||
          child.classList?.contains("product-preservation-note") ||
          child.classList?.contains("arch-fidelity-note") ||
          child.classList?.contains("arch-sketch-tip") ||
          child.id === "productCampaignFields") {
        extras.append(child);
      }
    });

    if (intro) intro.insertAdjacentElement("afterend", grid);
    else section.insertBefore(grid, section.firstChild);
    if (extras.childElementCount) section.append(extras);
  }

  function resolveFieldRow(id) {
    if (id === "settingType") {
      return document.querySelector('input[name="settingType"]')?.closest(".field-row, .fieldset-row, fieldset") || null;
    }
    const node = document.getElementById(id);
    if (!node) return null;
    if (node.matches(".field-row, .fieldset-row, fieldset, details")) return node;
    return node.closest(".field-row, .fieldset-row, fieldset, details") || node;
  }

  function observeDynamicModeSections() {
    const form = document.getElementById("promptForm");
    if (!form || promptFormObserver) return;

    promptFormObserver = new MutationObserver(() => {
      arrangeKnownModeSections();
      updateWorkstationState();
    });
    promptFormObserver.observe(form, { childList: true, subtree: true });
  }

  function enhanceOutputPanel(output) {
    if (output.dataset.workstationEnhanced === "true") return;
    output.dataset.workstationEnhanced = "true";

    const heading = output.querySelector(".output-heading");
    if (heading) {
      const title = heading.querySelector(".output-title-group strong");
      if (title) title.textContent = "Live Output";
      const kicker = heading.querySelector(".output-kicker");
      if (kicker) kicker.textContent = "GENERATED PROMPT";

      if (!heading.querySelector(".workstation-output-copy")) {
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "workstation-output-copy";
        copy.setAttribute("aria-label", "Copy prompt");
        copy.innerHTML = icon("copy");
        copy.addEventListener("click", () => document.getElementById("copyToClipboardBtn")?.click());
        heading.append(copy);
      }
    }

    const editor = output.querySelector(".output-editor-shell");
    if (!editor) return;

    const tabs = document.createElement("div");
    tabs.className = "workstation-output-tabs";
    tabs.innerHTML = `
      <button type="button" class="is-active" data-output-tab="prompt">Prompt</button>
      <button type="button" data-output-tab="structure">Structure</button>
      <button type="button" data-output-tab="metadata">Metadata</button>
    `;

    const tabShell = document.createElement("div");
    tabShell.className = "workstation-output-tab-shell";

    const promptPane = document.createElement("div");
    promptPane.className = "workstation-output-pane is-active";
    promptPane.dataset.outputPane = "prompt";
    editor.parentElement.insertBefore(tabShell, editor);
    promptPane.append(editor);
    tabShell.append(promptPane);

    const structurePane = document.createElement("div");
    structurePane.className = "workstation-output-pane";
    structurePane.dataset.outputPane = "structure";
    structurePane.innerHTML = `<div class="workstation-structure-list"></div>`;
    tabShell.append(structurePane);

    const metadataPane = document.createElement("div");
    metadataPane.className = "workstation-output-pane";
    metadataPane.dataset.outputPane = "metadata";
    metadataPane.innerHTML = `<div class="workstation-metadata-grid"></div>`;
    tabShell.append(metadataPane);

    tabShell.insertAdjacentElement("beforebegin", tabs);

    tabs.addEventListener("click", event => {
      const button = event.target.closest("[data-output-tab]");
      if (!button) return;
      activeOutputTab = button.dataset.outputTab;
      tabs.querySelectorAll("[data-output-tab]").forEach(item => item.classList.toggle("is-active", item === button));
      tabShell.querySelectorAll("[data-output-pane]").forEach(pane => pane.classList.toggle("is-active", pane.dataset.outputPane === activeOutputTab));
      updateOutputIntelligence();
    });

    const analysis = document.createElement("section");
    analysis.className = "workstation-analysis-card";
    analysis.innerHTML = `
      <header><span class="workstation-analysis-icon">${icon("brain")}</span><strong>Prompt Analysis</strong></header>
      <div class="workstation-analysis-body">
        <div class="workstation-analysis-ring"><span>0%</span></div>
        <div class="workstation-analysis-copy"><strong>Building prompt</strong><p>Complete the prompt DNA to improve readiness.</p></div>
      </div>
      <div class="workstation-analysis-checks"></div>
    `;
    tabShell.insertAdjacentElement("afterend", analysis);

    const preview = document.createElement("section");
    preview.className = "workstation-preview-card";
    preview.innerHTML = `
      <header><span>${icon("image")}</span><strong>Visual Preview</strong><small>Reference cue</small></header>
      <div class="workstation-preview-media"><img alt="Visual direction preview"></div>
      <p>This is a visual direction cue for the active mode, not generated output.</p>
    `;
    analysis.insertAdjacentElement("afterend", preview);

    const tip = output.querySelector(".output-tip");
    if (tip) tip.classList.add("workstation-output-tip");
  }

  function bindGlobalRefreshes() {
    global.addEventListener("promptgen:modechange", () => {
      arrangeKnownModeSections();
      updateWorkstationState();
    });
    global.addEventListener("promptgen:workspacechange", updateWorkstationState);
    document.addEventListener("input", scheduleUpdate, true);
    document.addEventListener("change", scheduleUpdate, true);

    const modeGrid = document.getElementById("promptModeGrid");
    if (modeGrid) {
      new MutationObserver(updateWorkstationState).observe(modeGrid, { childList: true, subtree: true, attributes: true });
    }

    const output = document.getElementById("output");
    if (output) {
      analysisTimer = global.setInterval(updateWorkstationState, 700);
    }
  }

  function scheduleUpdate() {
    global.clearTimeout(scheduleUpdate.timer);
    scheduleUpdate.timer = global.setTimeout(updateWorkstationState, 40);
  }

  function updateWorkstationState() {
    updateDnaProgress();
    updateOutputIntelligence();
    updatePreview();
  }

  function updateDnaProgress() {
    const dna = document.getElementById("promptDna");
    if (!dna) return;

    const frame = document.getElementById("dnaFrame");
    const outputNode = document.getElementById("dnaOutput");
    const ratioReady = Boolean(findActiveRatio());
    const promptReady = Boolean(document.getElementById("output")?.value?.trim());

    toggleDnaNode(frame, ratioReady);
    toggleDnaNode(outputNode, promptReady);

    const nodes = [...dna.querySelectorAll(".dna-node")];
    const ready = nodes.filter(node => node.classList.contains("is-ready")).length;
    const count = dna.querySelector(".workstation-dna-count strong");
    if (count) count.textContent = `${ready} / ${nodes.length || 7}`;
  }

  function toggleDnaNode(node, ready) {
    if (!node) return;
    node.classList.toggle("is-ready", ready);
    node.classList.toggle("is-partial", !ready);
  }

  function findActiveRatio() {
    const candidates = [
      document.querySelector('input[name="aspectRatio"]:checked')?.value,
      valueOf("catalogAspectRatio"),
      valueOf("productAspectRatio"),
      valueOf("posterAspectRatio"),
      valueOf("archAspectRatio"),
      valueOf("archSketchAspectRatio")
    ];
    return candidates.find(Boolean) || "";
  }

  function updateOutputIntelligence() {
    const output = document.querySelector(".workstation-live-output");
    if (!output) return;

    const dnaNodes = [...document.querySelectorAll("#promptDna .dna-node")];
    const readyCount = dnaNodes.filter(node => node.classList.contains("is-ready")).length;
    const completeness = dnaNodes.length ? Math.round((readyCount / dnaNodes.length) * 100) : 0;

    const coreScore = Number(document.getElementById("compatibilityScore")?.textContent || "");
    const activeMode = currentModeId();
    const score = ["creative", "outfit_catalog"].includes(activeMode) && Number.isFinite(coreScore) && coreScore > 0
      ? Math.round((coreScore * 0.65) + (completeness * 0.35))
      : completeness;

    const ring = output.querySelector(".workstation-analysis-ring");
    if (ring) {
      ring.style.setProperty("--score", String(Math.max(0, Math.min(100, score))));
      const value = ring.querySelector("span");
      if (value) value.textContent = `${score}%`;
    }

    const label = score >= 90 ? "Excellent match" : score >= 72 ? "Strong structure" : score >= 50 ? "Good foundation" : "Build in progress";
    const analysisCopy = output.querySelector(".workstation-analysis-copy");
    if (analysisCopy) {
      analysisCopy.querySelector("strong").textContent = label;
      analysisCopy.querySelector("p").textContent = score >= 90
        ? "Well-structured, detailed, and ready to generate."
        : "Complete the remaining prompt DNA for a stronger result.";
    }

    const checks = output.querySelector(".workstation-analysis-checks");
    if (checks) {
      checks.innerHTML = dnaNodes.slice(0, 6).map(node => {
        const ready = node.classList.contains("is-ready");
        const label = node.querySelector("b")?.textContent || "Prompt step";
        return `<span class="${ready ? "is-ready" : ""}"><i>${ready ? icon("check") : ""}</i>${escapeHtml(label)} ${ready ? "defined" : "pending"}</span>`;
      }).join("");
    }

    const structure = output.querySelector(".workstation-structure-list");
    if (structure) {
      structure.innerHTML = dnaNodes.map((node, index) => {
        const label = node.querySelector("b")?.textContent || `Step ${index + 1}`;
        const ready = node.classList.contains("is-ready");
        return `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(label)}</strong><small>${ready ? "Ready" : "Incomplete"}</small></div>`;
      }).join("");
    }

    const metadata = output.querySelector(".workstation-metadata-grid");
    if (metadata) {
      const mode = document.getElementById("activeModeBadge")?.textContent?.trim() || "Creative";
      const style = document.getElementById("activeStyleBadge")?.hidden
        ? "Auto / mode controlled"
        : document.getElementById("activeStyleBadge")?.textContent?.trim() || "Auto";
      const stats = document.getElementById("promptStats")?.textContent?.trim() || "0 characters";
      const ratio = findActiveRatio() || "Auto";
      metadata.innerHTML = [
        ["Mode", mode],
        ["Style", style],
        ["Frame", ratio],
        ["Length", stats],
        ["Readiness", `${score}%`],
        ["Source", document.getElementById("dataStatusText")?.textContent?.trim() || "Database"]
      ].map(([key, value]) => `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
    }
  }

  function updatePreview() {
    const image = document.querySelector(".workstation-preview-media img");
    if (!image) return;
    const mode = currentModeId();
    const next = MODE_PREVIEWS[mode] || MODE_PREVIEWS.creative;
    if (!image.src.endsWith(next)) image.src = next;
    image.classList.toggle("is-sketch", mode === "architectural_sketch");
  }

  function currentModeId() {
    return document.getElementById("activeModeBadge")?.dataset?.mode ||
      localStorage.getItem("promptGenPromptMode") ||
      "creative";
  }

  function valueOf(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }
})(window);
