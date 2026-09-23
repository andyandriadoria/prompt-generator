(function (global) {
  "use strict";

  const MODE_GROUPS = {
    creative: [
      { title: "Subject", icon: "sparkles", ids: ["characterPreset", "subjectGender", "features", "outfit", "manualOutfitRow"] },
      { title: "Scene & Action", icon: "compass", ids: ["settingType", "setting", "action", "expression"] },
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
      { title: "Project", icon: "building", ids: ["archSketchInputType", "archSketchOutputRepresentation", "archSketchBuildingCategory", "archSketchBuildingType", "archSketchCustomBuildingRow", "archSketchSceneType"] },
      { title: "Representation", icon: "drafting", ids: ["archSketchStyle", "archSketchMedium", "archSketchPhotoRealismTarget", "archSketchTextSignagePolicy", "archSketchStyleCategory", "archSketchArchitectureStyle", "archSketchCustomArchitectureStyleRow", "archSketchHumanScale"] },
      { title: "Presentation", icon: "camera", ids: ["archSketchLighting", "archSketchMood", "archSketchCameraView", "archSketchAnnotationText", "archSketchAspectRatio"] }
    ]
  };

  const DNA_LABELS = {
    creative: ["Subject", "Scene", "Style", "Camera", "Light", "Frame", "Output"],
    outfit_catalog: ["Subject", "Scene", "Presentation", "Framing", "Preservation", "Frame", "Output"],
    reference_product_catalog: ["Product", "Presentation", "Preservation", "Framing", "Scene", "Frame", "Output"],
    reference_product_poster: ["Base Photo", "Product Info", "Poster Style", "Layout", "Text Fidelity", "Frame", "Output"],
    architectural_render: ["Reference", "Geometry", "Material", "Environment", "Realism", "View", "Output"],
    architectural_sketch: ["Project", "Architecture", "Sketch", "Surface", "Atmosphere", "View", "Output"]
  };

  const MODE_CARD_COPY = {
    creative: "Flexible scene and character builder.",
    outfit_catalog: "Preserve the original worn outfit.",
    reference_product_catalog: "Product-first catalog imagery.",
    reference_product_poster: "Poster design over an existing photo.",
    architectural_render: "Reference-first. Preserve an existing design with fidelity control.",
    architectural_sketch: "Concept-first. Develop ideas as sketch or architectural photography."
  };

  const WORKSTATION_VISUAL_ASSETS = {
    '[data-prompt-mode-id="creative"]': "assets/workstation/modes/creative.png",
    '[data-prompt-mode-id="outfit_catalog"]': "assets/workstation/modes/reference-outfit.png",
    '[data-prompt-mode-id="reference_product_catalog"]': "assets/workstation/modes/reference-product.png",
    '[data-prompt-mode-id="product_catalog"]': "assets/workstation/modes/reference-product.png",
    '[data-prompt-mode-id="reference_product_poster"]': "assets/workstation/modes/product-poster.png",
    '[data-prompt-mode-id="product_poster"]': "assets/workstation/modes/product-poster.png",
    '[data-prompt-mode-id="architectural_render"]': "assets/workstation/modes/architectural-render.png",
    '[data-prompt-mode-id="architectural_sketch"]': "assets/workstation/modes/architectural-sketch.png",
    '[data-style-preset-id="hyper-realistic-iphone"] .style-preset-icon': "assets/workstation/styles/hyper-realistic.png",
    '[data-style-preset-id="cinematic-movie-still"] .style-preset-icon': "assets/workstation/styles/cinematic.png",
    '[data-style-preset-id="fashion-editorial"] .style-preset-icon': "assets/workstation/styles/fashion-editorial.png",
    '[data-style-preset-id="indonesian-lifestyle-candid"] .style-preset-icon': "assets/workstation/styles/indonesian-lifestyle.png",
    '[data-style-preset-id="japanese-nostalgia-1980s"] .style-preset-icon': "assets/workstation/styles/japanese-nostalgia.png",
    '[data-style-preset-id="miniature-diorama"] .style-preset-icon': "assets/workstation/styles/miniature-diorama.png"
  };

  const ANALYSIS_INDEXES = {
    creative: [0, 1, 2, 3, 4, 6],
    outfit_catalog: [0, 1, 2, 3, 4, 6],
    reference_product_catalog: [0, 1, 2, 3, 4, 6],
    reference_product_poster: [0, 1, 2, 3, 4, 6],
    architectural_render: [0, 1, 3, 4, 5, 6],
    architectural_sketch: [0, 1, 2, 3, 5, 6]
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
    applyWorkstationVisualAssets();
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

    const subtitle = hero.querySelector(".subtitle");
    if (subtitle) subtitle.textContent = "AI Creative Workstation · Build better prompts. Create without limits.";

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

    applyModeCardPresentation();
    const grid = document.getElementById("promptModeGrid");
    if (grid && !grid.dataset.workstationCopyObserved) {
      grid.dataset.workstationCopyObserved = "true";
      new MutationObserver(() => {
        applyModeCardPresentation();
        applyWorkstationVisualAssets();
      }).observe(grid, { childList: true, subtree: true });
    }
  }

  function applyModeCardPresentation() {
    document.querySelectorAll("#promptModeGrid [data-prompt-mode-id]").forEach(card => {
      let mode = card.dataset.promptModeId || "";
      if (mode === "product_catalog") mode = "reference_product_catalog";
      if (mode === "product_poster") mode = "reference_product_poster";
      const description = card.querySelector("small");
      if (description && MODE_CARD_COPY[mode] && description.textContent !== MODE_CARD_COPY[mode]) {
        description.textContent = MODE_CARD_COPY[mode];
      }
    });
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
      new MutationObserver(() => {
        ensureCustomStyleCard();
        applyWorkstationVisualAssets();
      }).observe(grid, { childList: true });
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

  function workstationAssetVersion() {
    const modified = String(document.lastModified || "")
      .replace(/\D/g, "")
      .slice(0, 14);
    return modified || "1";
  }

  function applyWorkstationVisualAssets() {
    const version = workstationAssetVersion();
    Object.entries(WORKSTATION_VISUAL_ASSETS).forEach(([selector, path]) => {
      document.querySelectorAll(selector).forEach(node => {
        const next = `url("${path}?v=${version}")`;

        if (node.matches("[data-prompt-mode-id]")) {
          if (node.style.getPropertyValue("--workstation-mode-image") !== next) {
            node.style.setProperty("--workstation-mode-image", next);
          }
          node.style.removeProperty("background-image");
          return;
        }

        if (node.style.backgroundImage !== next) node.style.backgroundImage = next;
      });
    });
  }

  function enhancePromptForm() {
    const form = document.getElementById("promptForm");
    if (!form) return;
    form.classList.add("workstation-prompt-form");

    const buttons = form.querySelector(".button-group");
    if (buttons) buttons.classList.add("workstation-action-bar");

    arrangeKnownModeSections();
    placeSettingPreviews();
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
    if (intro) {
      intro.classList.add("workstation-mode-banner");
      intro.hidden = true;
    }

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
          child.id === "productCampaignFields") {
        extras.append(child);
      }
    });

    if (intro) intro.insertAdjacentElement("afterend", grid);
    else section.insertBefore(grid, section.firstChild);

    if (modeId === "architectural_sketch") {
      const advanced = document.createElement("details");
      advanced.className = "workstation-advanced-settings";
      advanced.innerHTML = `
        <summary>
          <span>${icon("settings")}</span>
          <strong>Advanced Settings</strong>
          <small>Site, feature emphasis, extra instruction, and optional representation controls</small>
          <i>${icon("chevron-down")}</i>
        </summary>
        <div class="workstation-advanced-body"></div>
      `;
      const advancedBody = advanced.querySelector(".workstation-advanced-body");
      ["archSketchLandscape", "archSketchFeatures", "archSketchExtraInstruction", "archSketchAdvanced"].forEach(id => {
        const row = resolveFieldRow(id);
        if (row) advancedBody.append(row);
      });
      grid.insertAdjacentElement("afterend", advanced);
    }

    if (extras.childElementCount) section.append(extras);

    section.querySelectorAll(".arch-sketch-tip").forEach(node => node.hidden = true);
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
      placeSettingPreviews();
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
      if (kicker) kicker.textContent = "";
      const titleGroup = heading.querySelector(".output-title-group");
      if (titleGroup && !titleGroup.querySelector(".workstation-output-subtitle")) {
        const subtitle = document.createElement("small");
        subtitle.className = "workstation-output-subtitle";
        subtitle.textContent = "Your generated prompt in real time.";
        titleGroup.append(subtitle);
      }

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
    placeSettingPreviews();
    updateDnaProgress();
    updateOutputIntelligence();
  }

  function updateDnaProgress() {
    const dna = document.getElementById("promptDna");
    if (!dna) return;

    const mode = currentModeId();
    const nodes = [...dna.querySelectorAll(".dna-node")];
    const photography = mode === "architectural_sketch" && valueOf("archSketchOutputRepresentation") === "architectural-photography";
    const labels = photography
      ? ["Project", "Architecture", "Photo", "Realism", "Atmosphere", "View", "Output"]
      : (DNA_LABELS[mode] || DNA_LABELS.creative);
    const states = dnaStatesForMode(mode);

    nodes.forEach((node, index) => {
      const label = node.querySelector("b");
      if (label) label.textContent = labels[index] || `Step ${index + 1}`;
      applyDnaState(node, states[index] || "empty");
    });

    const readiness = dnaReadiness(nodes);
    const count = dna.querySelector(".workstation-dna-count strong");
    if (count) count.textContent = `${readiness.ready} / ${nodes.length || 7}`;
  }

  function applyDnaState(node, state) {
    if (!node) return;
    node.dataset.readiness = state;
    node.classList.toggle("is-ready", state === "ready");
    node.classList.toggle("is-partial", state === "partial");
  }

  function dnaReadiness(nodes = [...document.querySelectorAll("#promptDna .dna-node")]) {
    const values = nodes.map(node => node.dataset.readiness || (node.classList.contains("is-ready") ? "ready" : node.classList.contains("is-partial") ? "partial" : "empty"));
    const ready = values.filter(value => value === "ready").length;
    const partial = values.filter(value => value === "partial").length;
    const score = values.length ? Math.round(((ready + partial * 0.5) / values.length) * 100) : 0;
    return { ready, partial, score, values };
  }

  function dnaStatesForMode(mode) {
    const outputReady = Boolean(valueOf("output"));
    const ratioReady = Boolean(findActiveRatio());

    if (mode === "outfit_catalog") {
      const subject = valueOf("catalogSubject");
      const customSubject = valueOf("catalogCustomSubject");
      const setting = valueOf("catalogSetting");
      const customSetting = valueOf("catalogCustomSetting");
      return [
        subject === "custom" ? stateOf(customSubject) : stateOf(subject),
        setting === "manual_setting" ? stateOf(customSetting) : stateOf(setting),
        stateOf(valueOf("catalogType")),
        anyState("catalogShot", "catalogPose"),
        stateOf(valueOf("preservationLevel")),
        ratioReady ? "ready" : "empty",
        outputReady ? "ready" : "empty"
      ];
    }

    if (mode === "reference_product_catalog") {
      return [
        stateOf(valueOf("productType")),
        stateOf(valueOf("productPresentation")),
        stateOf(valueOf("productPreservation")),
        anyState("productShot", "productComposition"),
        stateOf(valueOf("productSetting")),
        ratioReady ? "ready" : "empty",
        outputReady ? "ready" : "empty"
      ];
    }

    if (mode === "reference_product_poster") {
      return [
        "partial",
        stateOf(valueOf("posterProductInformation")),
        anyState("posterExtraInstruction"),
        "ready",
        valueOf("posterProductInformation") ? "ready" : "partial",
        ratioReady ? "ready" : "empty",
        outputReady ? "ready" : "empty"
      ];
    }

    if (mode === "architectural_render") {
      return [
        stateOf(valueOf("archInputType")),
        anyState("archBuildingType", "archCustomBuildingType", "archArchitectureStyle", "archCustomArchitectureStyle"),
        valueOf("archMaterials") ? "ready" : "partial",
        anyState("archLighting", "archAtmosphere", "archLandscape"),
        anyState("archFidelity", "archRealismTarget"),
        anyState("archCamera", "archAspectRatio"),
        outputReady ? "ready" : "empty"
      ];
    }

    if (mode === "architectural_sketch") {
      const photography = valueOf("archSketchOutputRepresentation") === "architectural-photography";
      return [
        anyState("archSketchBuildingType", "archSketchCustomBuildingType", "archSketchSceneType"),
        anyState("archSketchArchitectureStyle", "archSketchCustomArchitectureStyle"),
        photography
          ? stateOf(valueOf("archSketchOutputRepresentation"))
          : stateOf(valueOf("archSketchStyle")),
        photography
          ? stateOf(valueOf("archSketchPhotoRealismTarget"))
          : stateOf(valueOf("archSketchMedium")),
        anyState("archSketchLighting", "archSketchMood"),
        stateOf(valueOf("archSketchCameraView")),
        outputReady ? "ready" : "empty"
      ];
    }

    const character = valueOf("characterPreset");
    const subjectReady = character && character !== "custom" ? "ready" : stateOf(valueOf("features"));
    const styleBadge = document.getElementById("activeStyleBadge");
    return [
      subjectReady,
      stateOf(valueOf("setting")),
      !styleBadge?.hidden ? "ready" : (valueOf("cameraType") ? "partial" : "empty"),
      anyState("cameraAngle", "cameraType"),
      stateOf(valueOf("lighting")),
      ratioReady ? "ready" : "empty",
      outputReady ? "ready" : "empty"
    ];
  }

  function stateOf(value) {
    return String(value || "").trim() ? "ready" : "empty";
  }

  function anyState(...ids) {
    return ids.some(id => valueOf(id)) ? "ready" : "empty";
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
    const readiness = dnaReadiness(dnaNodes);
    const score = readiness.score;
    const promptLength = valueOf("output").length;
    output.classList.toggle("is-short-prompt", promptLength < 520);
    output.classList.toggle("is-medium-prompt", promptLength >= 520 && promptLength < 1200);
    output.classList.toggle("is-long-prompt", promptLength >= 1200);

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
      const indexes = ANALYSIS_INDEXES[currentModeId()] || ANALYSIS_INDEXES.creative;
      checks.innerHTML = indexes.map(index => dnaNodes[index]).filter(Boolean).map(node => {
        const state = node.dataset.readiness || "empty";
        const ready = state === "ready";
        const label = node.querySelector("b")?.textContent || "Prompt step";
        const suffix = ready ? "defined" : state === "partial" ? "partial" : "pending";
        return `<span class="${ready ? "is-ready" : state === "partial" ? "is-partial" : ""}"><i>${ready ? icon("check") : ""}</i>${escapeHtml(label)} ${suffix}</span>`;
      }).join("");
    }

    const structure = output.querySelector(".workstation-structure-list");
    if (structure) {
      structure.innerHTML = dnaNodes.map((node, index) => {
        const label = node.querySelector("b")?.textContent || `Step ${index + 1}`;
        const state = node.dataset.readiness || "empty";
        const stateLabel = state === "ready" ? "Ready" : state === "partial" ? "Partial" : "Incomplete";
        return `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(label)}</strong><small>${stateLabel}</small></div>`;
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

  function placeSettingPreviews() {
    [
      ["setting", "creativeSettingPreview"],
      ["catalogSetting", "catalogSettingPreview"]
    ].forEach(([selectId, previewId]) => {
      const select = document.getElementById(selectId);
      const preview = document.getElementById(previewId);
      const card = select?.closest(".workstation-detail-card");
      const body = card?.querySelector(".workstation-detail-fields");
      const row = select?.closest(".field-row, .fieldset-row, fieldset");
      if (!select || !preview || !body || !row) return;
      if (preview.parentElement !== body || preview.previousElementSibling !== row) {
        row.insertAdjacentElement("afterend", preview);
      }
    });
  }

  function currentModeId() {
    const mode = document.getElementById("activeModeBadge")?.dataset?.mode ||
      localStorage.getItem("promptGenPromptMode") ||
      "creative";
    if (mode === "product_catalog") return "reference_product_catalog";
    if (mode === "product_poster") return "reference_product_poster";
    return mode;
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
