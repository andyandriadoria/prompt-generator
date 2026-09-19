(function (global) {
  "use strict";

  const MODE_ID = "architectural_render";
  const STRICT_STYLE_LABEL = "Follow Reference / Do Not Restyle";
  const FALLBACK = {
    id: MODE_ID,
    label: "Architectural Render",
    icon: "building",
    description: "Turn architectural references into controlled photorealistic render prompts while preserving the original design."
  };

  const elements = {};
  const searchable = new Map();
  const allowedCameraIds = new Set([
    "aerial-view-top-down", "birds-eye-view-shot", "eye-level-shot",
    "ground-level-shot", "long-shot", "overhead-shot", "side-view-shot"
  ]);

  let database = null;
  let active = false;
  let initialized = false;
  let observer = null;
  let lastEditableArchitectureStyle = "";
  const requestedInitialMode = localStorage.getItem("promptGenPromptMode") || "";

  waitForDependencies();

  function waitForDependencies(attempt = 0) {
    if (global.PromptDataLoader && global.ArchitecturalRenderPromptBuilder && global.PromptIcons) return bootstrap();
    if (attempt > 100) return console.warn("Architectural Render dependencies did not become available.");
    setTimeout(() => waitForDependencies(attempt + 1), 80);
  }

  function bootstrap() {
    if (initialized) return;
    initialized = true;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  }

  async function init() {
    cacheBaseElements();
    if (!elements.promptForm || !elements.promptModeGrid) return;
    buildFields();
    cacheArchElements();
    bindEvents();
    observePromptModes();
    await loadFeatureData();
  }

  function cacheBaseElements() {
    [
      "promptModeGrid", "creativeModeSections", "creativeFields", "catalogFields", "productFields", "posterFields",
      "promptForm", "activeModeBadge", "activeStyleBadge", "randomModeTitle", "randomModeHint",
      "randomPromptBtn", "outputTipTitle", "outputTipText", "generatePromptBtn", "resetFormBtn",
      "refreshDataBtn", "output", "promptStats", "messageBox",
      "dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"
    ].forEach(id => elements[id] = document.getElementById(id));
  }

  function cacheArchElements() {
    [
      "architecturalRenderFields", "archInputType", "archProjectType", "archFidelity", "archRealismTarget", "archArchitectureStyle",
      "archMaterials", "archLighting", "archAtmosphere", "archLandscape", "archCamera",
      "archAspectRatio", "archExtraInstruction", "archFidelityNote"
    ].forEach(id => elements[id] = document.getElementById(id));
  }

  function buildFields() {
    if (document.getElementById("architecturalRenderFields")) return;
    const anchor = document.getElementById("catalogFields");
    if (!anchor) return;

    const section = document.createElement("section");
    section.id = "architecturalRenderFields";
    section.className = "mode-fields architectural-render-fields";
    section.hidden = true;
    section.innerHTML = `
      <div class="arch-mode-intro">
        <span class="arch-mode-icon">${global.PromptIcons.svg("building")}</span>
        <div>
          <strong>Architectural Render</strong>
          <p>Build a prompt for ChatGPT or another image model from an architectural reference. Geometry preservation is controlled by Design Fidelity.</p>
        </div>
      </div>

      <div class="field-row">
        <label for="archInputType">Input Type</label>
        <select id="archInputType">
          <option value="reference-image">Reference Image / Existing Design</option>
          <option value="sketch-linework">Sketch / Linework</option>
          <option value="massing-model">Massing / Clay Model</option>
          <option value="existing-photo">Existing Building Photo</option>
        </select>
      </div>

      <div class="field-row">
        <label for="archProjectType">Project Type</label>
        <input id="archProjectType" type="text" placeholder="Example: private residence, housing estate, mosque, commercial facade">
      </div>

      <div class="field-row">
        <label for="archFidelity">Design Fidelity</label>
        <select id="archFidelity">
          <option value="strict">STRICT — Preserve Design Exactly</option>
          <option value="balanced">Balanced — Preserve Design, Refine Presentation</option>
          <option value="creative">Creative — Controlled Design Development</option>
        </select>
      </div>

      <div class="field-row">
        <label for="archRealismTarget">Realism Target</label>
        <select id="archRealismTarget">
          <option value="photoreal-archviz">Photoreal Archviz — Polished Presentation</option>
          <option value="hyper-real-photo" selected>Hyper-Real Architectural Photo</option>
          <option value="documentary-site-photo">Documentary Site Photo — Natural & Honest</option>
        </select>
      </div>

      <div class="field-row">
        <label for="archArchitectureStyle">Architecture Style</label>
        <input id="archArchitectureStyle" type="text" placeholder="Example: modern tropical, contemporary minimalist">
      </div>

      <div class="field-row">
        <label for="archMaterials">Building Materials</label>
        <textarea id="archMaterials" class="short-textarea" placeholder="Example: warm white plaster, natural stone, teak screens, clear low-iron glazing"></textarea>
      </div>

      <div class="field-row">
        <label for="archLighting">Lighting</label>
        <select id="archLighting"><option value="">-- Select Lighting --</option></select>
      </div>

      <div class="field-row">
        <label for="archAtmosphere">Weather / Atmosphere</label>
        <input id="archAtmosphere" type="text" placeholder="Example: clear humid morning, soft overcast, after rain">
      </div>

      <div class="field-row">
        <label for="archLandscape">Landscape / Site</label>
        <textarea id="archLandscape" class="short-textarea" placeholder="Example: restrained tropical planting, grass, stone paving, existing site contours"></textarea>
      </div>

      <div class="field-row">
        <label for="archCamera">Camera / View</label>
        <select id="archCamera"><option value="preserve-reference-view">Preserve Reference View</option></select>
      </div>
<div class="field-row">
        <label for="archAspectRatio">Aspect Ratio</label>
        <select id="archAspectRatio"><option value="">-- Select Aspect Ratio --</option></select>
      </div>
<div class="field-row">
        <label for="archExtraInstruction">Extra Instruction <span class="optional-label">optional</span></label>
        <textarea id="archExtraInstruction" class="short-textarea" placeholder="Example: preserve the existing gate and boundary wall; no people; keep the road level unchanged"></textarea>
      </div>

      <div class="arch-fidelity-note" id="archFidelityNote">
        <span>${global.PromptIcons.svg("shield")}</span>
        <div>
          <strong>Strict geometry lock</strong>
          <p>Geometry, massing, openings, structure, levels, roof form, and source perspective stay unchanged. Materials, light, landscape, and realism may be enhanced without redesigning the architecture.</p>
        </div>
      </div>
    `;

    const insertAfter = document.getElementById("posterFields") || document.getElementById("productFields") || anchor;
    insertAfter.insertAdjacentElement("afterend", section);
  }

  function bindEvents() {
    elements.promptModeGrid.addEventListener("click", event => {
      const card = event.target.closest("[data-prompt-mode-id]");
      if (!card) return;
      if (active && card.dataset.promptModeId !== MODE_ID) deactivate();
    }, true);

    elements.architecturalRenderFields.addEventListener("input", handleFieldChange);
    elements.architecturalRenderFields.addEventListener("change", handleFieldChange);

    elements.generatePromptBtn?.addEventListener("click", event => {
      if (!active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      generate(true);
      showMessage("Architectural render prompt generated.");
    }, true);

    elements.resetFormBtn?.addEventListener("click", event => {
      if (!active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      reset();
    }, true);

    elements.randomPromptBtn?.addEventListener("click", event => {
      if (!active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    elements.refreshDataBtn?.addEventListener("click", () => setTimeout(() => loadFeatureData({ forceRefresh: false }), 900));
  }

  function observePromptModes() {
    if (observer) return;
    observer = new MutationObserver(ensureModeCard);
    observer.observe(elements.promptModeGrid, { childList: true });
  }

  async function loadFeatureData(options = {}) {
    try {
      const result = await global.PromptDataLoader.load(options);
      database = result.data;
      populateControls();
      ensureModeCard();
    } catch (error) {
      console.warn("Architectural Render data load failed:", error);
    }
  }

  function isReady() {
    return Boolean(database && Array.isArray(database.lighting) && Array.isArray(database.cameraAngles) && Array.isArray(database.aspectRatios));
  }

  function getModeDefinition() {
    return database?.promptModes?.find(item => item.id === MODE_ID) || null;
  }

  function ensureModeCard() {
    if (!isReady()) return;
    const definition = getModeDefinition();
    let card = elements.promptModeGrid.querySelector(`[data-prompt-mode-id="${MODE_ID}"]`);

    if (!definition) {
      card?.remove();
      return;
    }

    if (!card) {
      card = document.createElement("button");
      card.type = "button";
      card.className = "prompt-mode-card architectural-render-mode-card";
      card.dataset.promptModeId = MODE_ID;
      card.innerHTML = `<span class="prompt-mode-icon">${global.PromptIcons.svg(definition.icon || "building")}</span><span><strong>${escapeHtml(definition.label || FALLBACK.label)}</strong><small>${escapeHtml(definition.description || FALLBACK.description)}</small></span><span class="prompt-mode-check">${global.PromptIcons.svg("check")}</span>`;
      card.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        activate(true);
      });
      elements.promptModeGrid.append(card);
    }

    const copy = document.querySelector(".prompt-mode-head p");
    if (copy) copy.textContent = "Choose a builder for creative scenes, strict fashion or product references, poster layouts, or architectural visualization.";

    if (requestedInitialMode === MODE_ID && !active) queueMicrotask(() => activate(false));
  }

  function populateControls() {
    if (!database || !elements.archLighting) return;

    populateSelect(elements.archLighting,
      (database.lighting || []).filter(item => !/\bher body\b/i.test(String(item.prompt || ""))),
      "-- Select Lighting --"
    );

    const cameraOptions = (database.cameraAngles || []).filter(item => allowedCameraIds.has(item.id));
    populateSelect(elements.archCamera, cameraOptions, "Preserve Reference View", true);

    elements.archAspectRatio.innerHTML = "";
    const placeholder = new Option("-- Select Aspect Ratio --", "");
    placeholder.dataset.placeholder = "true";
    elements.archAspectRatio.append(placeholder);
    (database.aspectRatios || []).forEach(item => {
      const value = item.value || item.label || item.id;
      const option = new Option(item.label || value, value);
      option.dataset.id = item.id || "";
      elements.archAspectRatio.append(option);
    });

    if (!elements.archAspectRatio.value) {
      const preferred = [...elements.archAspectRatio.options].find(option => option.value === "16:9")
        || [...elements.archAspectRatio.options].find(option => option.value === database.config?.defaultAspectRatio);
      if (preferred) elements.archAspectRatio.value = preferred.value;
    }

    setSelectById(elements.archLighting, "daylight");
    elements.archInputType.value = elements.archInputType.value || "reference-image";
    elements.archFidelity.value = elements.archFidelity.value || "strict";
    elements.archRealismTarget.value = elements.archRealismTarget.value || "hyper-real-photo";

    initSearchable();
    updateFidelityUi();
    if (active) generate(false);
  }

  function populateSelect(select, items, placeholder, preserveReference = false) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = "";
    const first = new Option(placeholder, preserveReference ? "preserve-reference-view" : "");
    first.dataset.placeholder = preserveReference ? "false" : "true";
    select.append(first);
    (items || []).forEach(item => {
      const option = new Option(item.label || item.id, item.id);
      option.dataset.id = item.id || "";
      option.dataset.category = item.category || "";
      option.dataset.tags = Array.isArray(item.tags) ? item.tags.join(",") : String(item.tags || "");
      option.dataset.searchText = [item.prompt, item.description].filter(Boolean).join(" ");
      select.append(option);
    });
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }

  function initSearchable() {
    ["archLighting", "archCamera", "archAspectRatio"].forEach(id => {
      const select = elements[id];
      if (!select || !global.SearchableSelectControl) return;
      if (searchable.has(id)) searchable.get(id).refresh();
      else searchable.set(id, new global.SearchableSelectControl(select));
    });
  }

  function selectedItem(select, collection) {
    const id = select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    return (collection || []).find(item => item.id === id) || null;
  }

  function handleFieldChange(event) {
    if (event?.target === elements.archArchitectureStyle && elements.archFidelity.value !== "strict") {
      lastEditableArchitectureStyle = elements.archArchitectureStyle.value;
    }
    updateFidelityUi();
    generate(false);
  }

  function updateFidelityUi() {
    if (!elements.archFidelity || !elements.archCamera || !elements.archArchitectureStyle) return;
    const strict = elements.archFidelity.value === "strict";

    if (strict) {
      const currentStyle = elements.archArchitectureStyle.value.trim();
      if (currentStyle && currentStyle !== STRICT_STYLE_LABEL) lastEditableArchitectureStyle = currentStyle;

      elements.archArchitectureStyle.value = STRICT_STYLE_LABEL;
      elements.archArchitectureStyle.disabled = true;
      elements.archArchitectureStyle.title = "Controlled by STRICT Design Fidelity";

      elements.archCamera.value = "preserve-reference-view";
      elements.archCamera.disabled = true;
    } else {
      const wasLocked = elements.archArchitectureStyle.disabled;
      elements.archArchitectureStyle.disabled = false;
      elements.archArchitectureStyle.title = "";
      if (wasLocked && elements.archArchitectureStyle.value === STRICT_STYLE_LABEL) {
        elements.archArchitectureStyle.value = lastEditableArchitectureStyle;
      }
      elements.archCamera.disabled = false;
    }

    searchable.get("archCamera")?.setDisabled?.(strict);
    searchable.get("archCamera")?.syncFromNative?.();

    const note = elements.archFidelityNote;
    if (!note) return;
    const copy = note.querySelector("p");
    const title = note.querySelector("strong");
    if (strict) {
      title.textContent = "Strict geometry lock";
      copy.textContent = "Architecture Style and Camera / View are controlled automatically. Geometry, massing, openings, structure, levels, roof form, framing, and source perspective stay unchanged.";
    } else if (elements.archFidelity.value === "balanced") {
      title.textContent = "Balanced design control";
      copy.textContent = "Core geometry and architectural identity stay intact while restrained style refinements and alternate framing are available.";
    } else {
      title.textContent = "Controlled design development";
      copy.textContent = "Core massing and project identity remain recognizable while architecture style, materials, landscape, mood, and framing may follow your directions.";
    }
  }

  function collectState() {
    const lighting = selectedItem(elements.archLighting, database?.lighting);
    const strict = elements.archFidelity.value === "strict";
    const camera = elements.archCamera.value === "preserve-reference-view"
      ? "preserve the original reference viewpoint and perspective"
      : selectedItem(elements.archCamera, database?.cameraAngles)?.prompt || elements.archCamera.selectedOptions[0]?.textContent || "";

    return {
      inputType: elements.archInputType.value,
      projectType: elements.archProjectType.value.trim(),
      fidelity: elements.archFidelity.value,
      realismTarget: elements.archRealismTarget.value || "hyper-real-photo",
      architectureStyle: strict ? "" : elements.archArchitectureStyle.value.trim(),
      materials: elements.archMaterials.value.trim(),
      lighting: lighting?.prompt || lighting?.label || "",
      atmosphere: elements.archAtmosphere.value.trim(),
      landscape: elements.archLandscape.value.trim(),
      camera: strict ? "" : camera,
      cameraId: elements.archCamera.value,
      aspectRatio: elements.archAspectRatio.value || "16:9",
      extraInstruction: elements.archExtraInstruction.value.trim()
    };
  }

  function generate(explicit = false) {
    if (!active || !database) return "";
    const state = collectState();
    const prompt = global.ArchitecturalRenderPromptBuilder.build(state);
    elements.output.value = prompt;
    elements.output.classList.toggle("is-filled", Boolean(prompt));
    if (elements.promptStats) elements.promptStats.textContent = `${prompt.length.toLocaleString()} characters`;
    updateDna(state);
    if (explicit) global.dispatchEvent(new CustomEvent("promptgen:architecturalrendergenerated", { detail: { prompt, state } }));
    return prompt;
  }

  function activate(notify = true) {
    if (!isReady() || !getModeDefinition()) return;
    active = true;
    localStorage.setItem("promptGenPromptMode", MODE_ID);
    document.body.classList.add("architectural-render-active");

    ["creativeModeSections", "creativeFields", "catalogFields", "productFields", "posterFields"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });
    elements.architecturalRenderFields.hidden = false;
    if (elements.activeStyleBadge) elements.activeStyleBadge.hidden = true;
    if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = true;

    if (elements.activeModeBadge) {
      elements.activeModeBadge.textContent = "Architectural Render";
      elements.activeModeBadge.dataset.mode = MODE_ID;
    }
    if (elements.randomModeTitle) elements.randomModeTitle.textContent = "Architectural Controls";
    if (elements.randomModeHint) elements.randomModeHint.textContent = "Reference-driven geometry, material, environment, camera, and realism controls";
    if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Architectural reference tip";
    if (elements.outputTipText) elements.outputTipText.textContent = "Attach the architectural reference image together with this prompt. STRICT fidelity keeps geometry, massing, openings, levels, roof form, and perspective unchanged.";

    elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
      const on = card.dataset.promptModeId === MODE_ID;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });

    updateFidelityUi();
    generate(false);
    global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode: MODE_ID } }));
    setTimeout(() => updateDna(collectState()), 70);
    if (notify) showMessage("Architectural Render mode selected.");
  }

  function deactivate() {
    if (!active) return;
    active = false;
    document.body.classList.remove("architectural-render-active");
    elements.architecturalRenderFields.hidden = true;
    if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = false;
  }

  function reset() {
    elements.archInputType.value = "reference-image";
    elements.archProjectType.value = "";
    elements.archFidelity.value = "strict";
    elements.archRealismTarget.value = "hyper-real-photo";
    lastEditableArchitectureStyle = "";
    elements.archArchitectureStyle.value = "";
    elements.archMaterials.value = "";
    setSelectById(elements.archLighting, "daylight");
    elements.archAtmosphere.value = "";
    elements.archLandscape.value = "";
    elements.archCamera.value = "preserve-reference-view";
    if ([...elements.archAspectRatio.options].some(option => option.value === "16:9")) elements.archAspectRatio.value = "16:9";
    elements.archExtraInstruction.value = "";
    searchable.forEach(control => control.syncFromNative?.());
    updateFidelityUi();
    generate(false);
    showMessage("Architectural Render form reset.");
  }

  function serializeState() {
    return {
      archInputType: elements.archInputType.value,
      archProjectType: elements.archProjectType.value,
      archFidelity: elements.archFidelity.value,
      archRealismTarget: elements.archRealismTarget.value,
      archArchitectureStyle: elements.archFidelity.value === "strict" ? lastEditableArchitectureStyle : elements.archArchitectureStyle.value,
      archMaterials: elements.archMaterials.value,
      archLighting: elements.archLighting.value,
      archAtmosphere: elements.archAtmosphere.value,
      archLandscape: elements.archLandscape.value,
      archCamera: elements.archCamera.value,
      archAspectRatio: elements.archAspectRatio.value,
      archExtraInstruction: elements.archExtraInstruction.value
    };
  }

  function restoreState(state = {}) {
    const missing = [];
    const fidelity = state.archFidelity || "strict";

    setSelect("archInputType", state.archInputType || "reference-image", missing, "Input Type");
    setText("archProjectType", state.archProjectType);
    setSelect("archFidelity", fidelity, missing, "Design Fidelity");
    setSelect("archRealismTarget", state.archRealismTarget || "hyper-real-photo", missing, "Realism Target");

    if (fidelity === "strict") {
      const savedStyle = String(state.archArchitectureStyle || "").trim();
      lastEditableArchitectureStyle = savedStyle && savedStyle !== STRICT_STYLE_LABEL ? savedStyle : "";
    } else {
      lastEditableArchitectureStyle = String(state.archArchitectureStyle || "");
      setText("archArchitectureStyle", lastEditableArchitectureStyle);
    }

    setText("archMaterials", state.archMaterials);
    setSelect("archLighting", state.archLighting, missing, "Lighting");
    setText("archAtmosphere", state.archAtmosphere);
    setText("archLandscape", state.archLandscape);
    setSelect("archCamera", state.archCamera || "preserve-reference-view", missing, "Camera / View");
    setSelect("archAspectRatio", state.archAspectRatio || "16:9", missing, "Aspect Ratio");
    setText("archExtraInstruction", state.archExtraInstruction);

    searchable.forEach(control => control.syncFromNative?.());
    updateFidelityUi();
    generate(false);
    return { missing };
  }

  function updateDna(state) {
    if (!active) return;
    const labels = ["Reference", "Geometry", "Material", "Environment", "Realism"];
    const ready = [
      true,
      Boolean(state.fidelity),
      Boolean(state.materials || state.architectureStyle),
      Boolean(state.atmosphere || state.landscape),
      Boolean(state.realismTarget)
    ];
    [elements.dnaSubject, elements.dnaScene, elements.dnaStyle, elements.dnaCamera, elements.dnaLight].forEach((node, index) => {
      if (!node) return;
      const label = node.querySelector("b");
      if (label) label.textContent = labels[index];
      node.classList.toggle("is-ready", ready[index]);
      node.classList.toggle("is-partial", !ready[index]);
    });
  }

  function populateNativeSync(select) {
    searchable.get(select.id)?.syncFromNative?.();
  }

  function setSelectById(select, id) {
    if (!select || !id) return false;
    const option = [...select.options].find(item => item.value === id || item.dataset.id === id);
    if (!option) return false;
    select.value = option.value;
    populateNativeSync(select);
    return true;
  }

  function setSelect(id, value, missing, label) {
    const select = document.getElementById(id);
    if (!select) {
      if (value) missing.push(label || id);
      return false;
    }
    const wanted = String(value || "");
    const option = [...select.options].find(item => item.value === wanted || item.dataset.id === wanted);
    if (!option && wanted) {
      missing.push(label || id);
      return false;
    }
    select.value = option ? option.value : "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    populateNativeSync(select);
    return true;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.value = String(value ?? "");
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function showMessage(message) {
    const box = elements.messageBox || document.getElementById("messageBox");
    if (!box) return;
    box.textContent = message;
    box.classList.add("is-visible");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => box.classList.remove("is-visible"), 2200);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  global.ArchitecturalRenderMode = {
    id: MODE_ID,
    isReady,
    isActive: () => active,
    activate: () => activate(true),
    generate: () => generate(false),
    getState: serializeState,
    restoreState,
    refreshData: loadFeatureData
  };
})(window);
