(function (global) {
  "use strict";

  const MODE_ID = "architectural_sketch";
  const FALLBACK_MODE = {
    id: MODE_ID,
    label: "Architectural Sketch Builder",
    icon: "drafting",
    description: "Build hand-drawn architectural sketch prompts for concept studies, reference designs, and presentation-style architectural illustrations."
  };

  const FALLBACK_OPTIONS = {
    inputTypes: [{ id: "concept-prompt", label: "Concept Prompt", prompt: "" }],
    sceneTypes: [{ id: "exterior", label: "Exterior", prompt: "an exterior architectural view" }],
    sketchStyles: [{
      id: "watercolor-sketch",
      label: "Soft Watercolor Architectural Sketch",
      description: "Fine architectural ink with transparent watercolor washes and visible white paper.",
      prompt: "a soft watercolor architectural sketch with fine ink outlines, transparent layered washes, and generous white paper",
      line_rule: "Keep the ink drawing clearly visible beneath the watercolor",
      color_rule: "Use soft natural washes with restrained saturation and imperfect hand-painted edges",
      avoid: "Avoid heavy pencil shading and opaque digital painting"
    }],
    media: [{ id: "watercolor-paper", label: "Textured Watercolor Paper", prompt: "lightly textured watercolor paper with visible natural tooth and restrained surface variation" }],
    lineQualities: [{ id: "auto-follow-style", label: "Auto — Follow Sketch Style", prompt: "", description: "Use the selected Sketch Style's built-in line character and line hierarchy." }],
    colorTreatments: [{ id: "auto-follow-style", label: "Auto — Follow Sketch Style", prompt: "", description: "Use the selected Sketch Style's built-in color treatment and color rules." }],
    lighting: [{ id: "morning-light", label: "Morning Light", prompt: "soft morning light with gentle directional shadows" }],
    moods: [{ id: "calm", label: "Calm", prompt: "a calm, composed, and visually balanced architectural character" }],
    humanScale: [{ id: "none", label: "None", prompt: "" }],
    cameraViews: [{ id: "eye-level-perspective", label: "Eye-Level Perspective", prompt: "an eye-level architectural perspective with a natural human-scale viewpoint", scene_scope: "exterior,interior" }]
  };

  const LEGACY_SURFACE_ALIASES = {
    "cream-toned-paper": "white-sketchbook-paper",
    "presentation-board": "bristol-board"
  };

  const LEGACY_ATMOSPHERE_ALIASES = {
    "cozy": "intimate",
    "moody": "contemplative",
    "airy": "serene",
    "dramatic": "monumental",
    "rainy": "calm"
  };

  const LEGACY_ATMOSPHERE_CONTEXT = {
    "rainy": "light rain with subtle wet paving and wet-surface cues"
  };

  const LEGACY_VIEW_ALIASES = {
    "frontal-elevation": "frontal-perspective",
    "sketchbook-perspective": "eye-level-perspective"
  };

  const elements = {};
  const searchable = new Map();
  let database = null;
  let options = null;
  let taxonomy = null;
  let active = false;
  let initialized = false;
  let observer = null;
  const requestedInitialMode = localStorage.getItem("promptGenPromptMode") || "";

  waitForDependencies();

  function waitForDependencies(attempt = 0) {
    if (global.PromptDataLoader && global.ArchitecturalSketchPromptBuilder && global.ArchitecturalTaxonomy && global.PromptIcons) return bootstrap();
    if (attempt > 100) return console.warn("Architectural Sketch dependencies did not become available.");
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
    cacheSketchElements();
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

  function cacheSketchElements() {
    [
      "architecturalSketchFields", "archSketchInputType", "archSketchSceneType",
      "archSketchBuildingCategory", "archSketchBuildingType", "archSketchCustomBuildingType", "archSketchCustomBuildingRow",
      "archSketchStyleCategory", "archSketchArchitectureStyle", "archSketchCustomArchitectureStyle", "archSketchCustomArchitectureStyleRow",
      "archSketchStyle", "archSketchMedium", "archSketchLineQuality",
      "archSketchColorTreatment", "archSketchLighting", "archSketchMood", "archSketchLandscape",
      "archSketchFeatures", "archSketchHumanScale", "archSketchCameraView", "archSketchAspectRatio",
      "archSketchExtraInstruction", "archSketchStyleHint", "archSketchSurfaceHint", "archSketchTip", "archSketchAdvanced", "archSketchAdvancedState"
    ].forEach(id => elements[id] = document.getElementById(id));
  }

  function buildFields() {
    if (document.getElementById("architecturalSketchFields")) return;
    const anchor = document.getElementById("catalogFields");
    if (!anchor) return;

    const section = document.createElement("section");
    section.id = "architecturalSketchFields";
    section.className = "mode-fields architectural-sketch-fields";
    section.hidden = true;
    section.innerHTML = `
      <div class="arch-sketch-intro">
        <span class="arch-sketch-icon">${global.PromptIcons.svg("drafting")}</span>
        <div>
          <strong>Architectural Sketch Builder</strong>
          <p>Create hand-drawn architectural sketch prompts for concepts, design briefs, or existing architectural references.</p>
        </div>
      </div>

      <div class="field-row"><label for="archSketchInputType">Input Type</label><select id="archSketchInputType"></select></div>
      <div class="field-row"><label for="archSketchBuildingCategory">Building Category</label><select id="archSketchBuildingCategory"></select></div>
      <div class="field-row"><label for="archSketchBuildingType">Building Type</label><select id="archSketchBuildingType"></select></div>
      <div class="field-row arch-taxonomy-custom" id="archSketchCustomBuildingRow" hidden><label for="archSketchCustomBuildingType">Custom Building Type</label><input id="archSketchCustomBuildingType" type="text" placeholder="Example: mixed-use courtyard housing, tropical community pavilion"></div>
      <div class="field-row"><label for="archSketchSceneType">Scene Type</label><select id="archSketchSceneType"></select></div>
      <div class="field-row"><label for="archSketchStyle">Sketch Style</label><div><select id="archSketchStyle"></select><p class="help-text arch-sketch-style-hint" id="archSketchStyleHint"></p></div></div>
      <div class="field-row"><label for="archSketchMedium">Paper / Surface</label><div><select id="archSketchMedium"></select><p class="help-text arch-sketch-surface-hint" id="archSketchSurfaceHint"></p></div></div>

      <details class="arch-sketch-advanced" id="archSketchAdvanced">
        <summary>
          <span class="arch-sketch-advanced-title">Advanced Style Controls</span>
          <small id="archSketchAdvancedState">Line & color follow Sketch Style</small>
        </summary>
        <div class="arch-sketch-advanced-body">
          <p class="arch-sketch-advanced-help">Optional overrides. Leave both controls on Auto to use the line and color language built into the selected Sketch Style.</p>
          <div class="field-row"><label for="archSketchLineQuality">Line Character</label><select id="archSketchLineQuality"></select></div>
          <div class="field-row"><label for="archSketchColorTreatment">Color Treatment</label><select id="archSketchColorTreatment"></select></div>
        </div>
      </details>
      <div class="field-row"><label for="archSketchStyleCategory">Architectural Style Category</label><select id="archSketchStyleCategory"></select></div>
      <div class="field-row"><label for="archSketchArchitectureStyle">Architectural Style</label><select id="archSketchArchitectureStyle"></select></div>
      <div class="field-row arch-taxonomy-custom" id="archSketchCustomArchitectureStyleRow" hidden><label for="archSketchCustomArchitectureStyle">Custom Architectural Style</label><input id="archSketchCustomArchitectureStyle" type="text" placeholder="Example: tropical contemporary with subtle Japanese influence"></div>
      <div class="field-row"><label for="archSketchLighting">Lighting / Time</label><select id="archSketchLighting"></select></div>
      <div class="field-row"><label for="archSketchMood">Atmosphere / Character</label><div><select id="archSketchMood"></select><p class="help-text">Spatial character only; lighting stays in Lighting / Time and weather stays in Landscape / Context.</p></div></div>
      <div class="field-row"><label for="archSketchLandscape">Landscape / Context <span class="optional-label">optional</span></label><textarea id="archSketchLandscape" class="short-textarea" placeholder="Example: restrained tropical planting, stone paving, light rain, wet paving, urban sidewalk"></textarea></div>
      <div class="field-row"><label for="archSketchFeatures">Architectural Features <span class="optional-label">optional</span></label><textarea id="archSketchFeatures" class="short-textarea" placeholder="Example: deep overhang roof, vertical timber screens, arched openings, open courtyard"></textarea></div>
      <div class="field-row"><label for="archSketchHumanScale">Human Figure for Scale</label><select id="archSketchHumanScale"></select></div>
      <div class="field-row"><label for="archSketchCameraView">View / Projection</label><div><select id="archSketchCameraView"></select><p class="help-text">Options are filtered by Scene Type. Exterior and Interior use only compatible architectural views.</p></div></div>
      <div class="field-row"><label for="archSketchAspectRatio">Aspect Ratio</label><select id="archSketchAspectRatio"></select></div>
      <div class="field-row"><label for="archSketchExtraInstruction">Extra Instruction <span class="optional-label">optional</span></label><textarea id="archSketchExtraInstruction" class="short-textarea" placeholder="Example: emphasize the entrance canopy; avoid excessive foliage; no text labels"></textarea></div>

      <div class="arch-sketch-tip" id="archSketchTip">
        <span>${global.PromptIcons.svg("drafting")}</span>
        <div><strong>Architectural sketch logic</strong><p>Building and architectural style choices use the shared Architecture Taxonomy; category fields only filter the UI and do not enter the prompt. Sketch Style controls drawing language, Paper / Surface controls the drawing surface, and View / Projection follows Scene Type.</p></div>
      </div>
    `;

    const insertAfter = document.getElementById("architecturalRenderFields")
      || document.getElementById("posterFields")
      || document.getElementById("productFields")
      || anchor;
    insertAfter.insertAdjacentElement("afterend", section);
  }

  function bindEvents() {
    elements.promptModeGrid.addEventListener("click", event => {
      const card = event.target.closest("[data-prompt-mode-id]");
      if (!card) return;
      if (active && card.dataset.promptModeId !== MODE_ID) deactivate();
    }, true);

    elements.architecturalSketchFields.addEventListener("input", () => generate(false));
    elements.architecturalSketchFields.addEventListener("change", event => {
      if (event.target === elements.archSketchBuildingCategory) {
        updateBuildingTypeOptions({ selectedId: "" });
      }
      if (event.target === elements.archSketchBuildingType) {
        syncBuildingCustomUi();
      }
      if (event.target === elements.archSketchStyleCategory) {
        updateArchitectureStyleOptions({ selectedId: "" });
      }
      if (event.target === elements.archSketchArchitectureStyle) {
        syncArchitectureStyleCustomUi();
      }
      if (event.target === elements.archSketchStyle) {
        updateStyleHint();
        updateSurfaceHint();
      }
      if (event.target === elements.archSketchSceneType) {
        updateViewOptions({ applySceneDefault: true });
      }
      if (event.target === elements.archSketchMedium) updateSurfaceHint();
      if (event.target === elements.archSketchLineQuality || event.target === elements.archSketchColorTreatment) {
        updateAdvancedState();
      }
      generate(false);
    });

    elements.generatePromptBtn?.addEventListener("click", event => {
      if (!active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      generate(true);
      showMessage("Architectural sketch prompt generated.");
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

  async function loadFeatureData(loadOptions = {}) {
    try {
      const result = await global.PromptDataLoader.load(loadOptions);
      database = result.data;
      options = buildOptions(database.config || {});
      taxonomy = global.ArchitecturalTaxonomy.fromConfig(database.config || {});
      populateControls();
      ensureModeCard();
    } catch (error) {
      console.warn("Architectural Sketch data load failed:", error);
    }
  }

  function buildOptions(config) {
    return {
      inputTypes: parseList(config.architecturalSketchInputTypes, FALLBACK_OPTIONS.inputTypes),
      sceneTypes: parseList(config.architecturalSketchSceneTypes, FALLBACK_OPTIONS.sceneTypes),
      sketchStyles: parseList(config.architecturalSketchStyles, FALLBACK_OPTIONS.sketchStyles),
      media: parseList(config.architecturalSketchMedia, FALLBACK_OPTIONS.media),
      lineQualities: parseList(config.architecturalSketchLineQualities, FALLBACK_OPTIONS.lineQualities),
      colorTreatments: parseList(config.architecturalSketchColorTreatments, FALLBACK_OPTIONS.colorTreatments),
      lighting: parseList(config.architecturalSketchLighting, FALLBACK_OPTIONS.lighting),
      moods: parseList(config.architecturalSketchMoods, FALLBACK_OPTIONS.moods),
      humanScale: parseList(config.architecturalSketchHumanScale, FALLBACK_OPTIONS.humanScale),
      cameraViews: parseList(config.architecturalSketchCameraViews, FALLBACK_OPTIONS.cameraViews)
    };
  }

  function parseList(raw, fallback) {
    if (Array.isArray(raw)) return raw;
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) && parsed.length ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getModeDefinition() {
    return database?.promptModes?.find(item => item.id === MODE_ID) || null;
  }

  function ensureModeCard() {
    if (!database) return;
    const definition = getModeDefinition();
    let card = elements.promptModeGrid.querySelector(`[data-prompt-mode-id="${MODE_ID}"]`);
    if (!definition) {
      card?.remove();
      return;
    }

    if (!card) {
      card = document.createElement("button");
      card.type = "button";
      card.className = "prompt-mode-card architectural-sketch-mode-card";
      card.dataset.promptModeId = MODE_ID;
      card.innerHTML = `<span class="prompt-mode-icon">${global.PromptIcons.svg(definition.icon || FALLBACK_MODE.icon)}</span><span><strong>${escapeHtml(definition.label || FALLBACK_MODE.label)}</strong><small>${escapeHtml(definition.description || FALLBACK_MODE.description)}</small></span><span class="prompt-mode-check">${global.PromptIcons.svg("check")}</span>`;
      card.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        activate(true);
      });
      elements.promptModeGrid.append(card);
    }

    if (requestedInitialMode === MODE_ID && !active) queueMicrotask(() => activate(false));
  }

  function populateControls() {
    if (!database || !options) return;

    populateSelect(elements.archSketchInputType, options.inputTypes);
    populateTaxonomyControls();
    populateSelect(elements.archSketchSceneType, options.sceneTypes);
    populateSelect(elements.archSketchStyle, options.sketchStyles);
    populateSelect(elements.archSketchMedium, options.media);
    populateSelect(elements.archSketchLineQuality, options.lineQualities);
    populateSelect(elements.archSketchColorTreatment, options.colorTreatments);
    populateSelect(elements.archSketchLighting, options.lighting);
    populateSelect(elements.archSketchMood, options.moods);
    populateSelect(elements.archSketchHumanScale, options.humanScale);

    elements.archSketchAspectRatio.innerHTML = "";
    (database.aspectRatios || []).forEach(item => {
      const value = item.value || item.label || item.id;
      const option = new Option(item.label || value, value);
      option.dataset.id = item.id || "";
      elements.archSketchAspectRatio.append(option);
    });

    applyDefaults();
    initSearchable();
    updateStyleHint();
    updateSurfaceHint();
    updateAdvancedState();
    if (active) generate(false);
  }

  function populateSelect(select, items) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = "";
    (items || []).forEach(item => {
      const option = new Option(item.label || item.id, item.id);
      option.dataset.prompt = item.prompt || "";
      option.dataset.description = item.description || "";
      option.dataset.lineRule = item.line_rule || "";
      option.dataset.colorRule = item.color_rule || "";
      option.dataset.avoid = item.avoid || "";
      option.dataset.recommendedSurface = item.recommended_surface || "";
      option.dataset.sceneScope = item.scene_scope || "";
      option.dataset.id = item.id || "";
      select.append(option);
    });
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }

  function populateTaxonomyControls() {
    if (!taxonomy) return;
    const t = global.ArchitecturalTaxonomy;
    const buildingCategory = elements.archSketchBuildingCategory?.value || "";
    const buildingType = elements.archSketchBuildingType?.value || "";
    const styleCategory = elements.archSketchStyleCategory?.value || "";
    const architectureStyle = elements.archSketchArchitectureStyle?.value || "";

    t.populateCategorySelect(elements.archSketchBuildingCategory, taxonomy.buildingCategories, {
      placeholder: "Select Category...",
      selectedId: buildingCategory
    });
    updateBuildingTypeOptions({ selectedId: buildingType });

    t.populateCategorySelect(elements.archSketchStyleCategory, taxonomy.styleCategories, {
      placeholder: "Select Category...",
      selectedId: styleCategory
    });
    updateArchitectureStyleOptions({ selectedId: architectureStyle });
  }

  function refreshTaxonomyControl(id) {
    const control = searchable.get(id);
    control?.refresh?.();
    control?.syncFromNative?.();
  }

  function updateBuildingTypeOptions({ selectedId = "" } = {}) {
    if (!taxonomy) return;
    global.ArchitecturalTaxonomy.populateItemSelect(
      elements.archSketchBuildingType,
      taxonomy.buildingTypes,
      elements.archSketchBuildingCategory?.value || "",
      { placeholder: "Select Type...", selectedId, customLabel: "Custom…" }
    );
    syncBuildingCustomUi();
    refreshTaxonomyControl("archSketchBuildingType");
  }

  function updateArchitectureStyleOptions({ selectedId = "" } = {}) {
    if (!taxonomy) return;
    global.ArchitecturalTaxonomy.populateItemSelect(
      elements.archSketchArchitectureStyle,
      taxonomy.styleOptions,
      elements.archSketchStyleCategory?.value || "",
      { placeholder: "Select Style...", selectedId, customLabel: "Custom…" }
    );
    syncArchitectureStyleCustomUi();
    refreshTaxonomyControl("archSketchArchitectureStyle");
  }

  function syncBuildingCustomUi() {
    global.ArchitecturalTaxonomy.setCustomVisibility(
      elements.archSketchBuildingType,
      elements.archSketchCustomBuildingRow,
      elements.archSketchCustomBuildingType
    );
  }

  function syncArchitectureStyleCustomUi() {
    global.ArchitecturalTaxonomy.setCustomVisibility(
      elements.archSketchArchitectureStyle,
      elements.archSketchCustomArchitectureStyleRow,
      elements.archSketchCustomArchitectureStyle
    );
  }

  function applyDefaults() {
    const config = database?.config || {};
    setValue(elements.archSketchInputType, config.defaultArchitecturalSketchInputType || "concept-prompt");
    setValue(elements.archSketchBuildingCategory, config.defaultArchitecturalBuildingCategory || "");
    updateBuildingTypeOptions({ selectedId: "" });
    setValue(elements.archSketchStyleCategory, config.defaultArchitecturalStyleCategory || "");
    updateArchitectureStyleOptions({ selectedId: "" });
    setValue(elements.archSketchSceneType, config.defaultArchitecturalSketchSceneType || "exterior");
    setValue(elements.archSketchStyle, config.defaultArchitecturalSketchStyle || "watercolor-sketch");
    setValue(elements.archSketchMedium, config.defaultArchitecturalSketchMedium || "watercolor-paper");
    setValue(elements.archSketchLineQuality, config.defaultArchitecturalSketchLineQuality || "auto-follow-style");
    setValue(elements.archSketchColorTreatment, config.defaultArchitecturalSketchColorTreatment || "auto-follow-style");
    setValue(elements.archSketchLighting, config.defaultArchitecturalSketchLighting || "morning-light");
    setValue(elements.archSketchMood, config.defaultArchitecturalSketchMood || "calm");
    setValue(elements.archSketchHumanScale, config.defaultArchitecturalSketchHumanScale || "none");
    updateViewOptions({ applySceneDefault: true });
    setValue(elements.archSketchAspectRatio, config.defaultArchitecturalSketchAspectRatio || "4:5");
  }

  function sceneDefaultView(sceneId) {
    const config = database?.config || {};
    if (sceneId === "interior") {
      return config.defaultArchitecturalSketchInteriorView || "interior-corner";
    }
    return config.defaultArchitecturalSketchExteriorView
      || config.defaultArchitecturalSketchCameraView
      || "three-quarter-exterior";
  }

  function viewAppliesToScene(item, sceneId) {
    const raw = String(item?.scene_scope || "").trim();
    if (!raw) return true;
    return raw.split(",").map(value => value.trim()).filter(Boolean).includes(sceneId);
  }

  function updateViewOptions({ applySceneDefault = false, preferredValue = "" } = {}) {
    if (!elements.archSketchCameraView || !options) return;

    const sceneId = elements.archSketchSceneType?.value || database?.config?.defaultArchitecturalSketchSceneType || "exterior";
    const previous = preferredValue || elements.archSketchCameraView.value;
    const eligible = (options.cameraViews || []).filter(item => viewAppliesToScene(item, sceneId));

    populateSelect(elements.archSketchCameraView, eligible);

    const preferred = applySceneDefault ? sceneDefaultView(sceneId) : previous;
    setValue(elements.archSketchCameraView, preferred);

    if (!elements.archSketchCameraView.value && eligible[0]) {
      elements.archSketchCameraView.value = eligible[0].id;
    }

    const control = searchable.get("archSketchCameraView");
    control?.refresh?.();
    control?.syncFromNative?.();
  }

  function resolveViewForScene(value, sceneId) {
    const aliased = LEGACY_VIEW_ALIASES[value] || value;
    const eligible = (options?.cameraViews || []).filter(item => viewAppliesToScene(item, sceneId));
    if (eligible.some(item => item.id === aliased)) return aliased;
    return sceneDefaultView(sceneId);
  }

  function initSearchable() {
    [
      "archSketchInputType", "archSketchBuildingCategory", "archSketchBuildingType",
      "archSketchSceneType", "archSketchStyle", "archSketchMedium",
      "archSketchStyleCategory", "archSketchArchitectureStyle",
      "archSketchLineQuality", "archSketchColorTreatment", "archSketchLighting", "archSketchMood",
      "archSketchHumanScale", "archSketchCameraView", "archSketchAspectRatio"
    ].forEach(id => {
      const select = elements[id];
      if (!select || !global.SearchableSelectControl) return;
      if (searchable.has(id)) searchable.get(id).refresh();
      else searchable.set(id, new global.SearchableSelectControl(select));
    });
  }

  function setValue(select, value) {
    if (!select || value === undefined || value === null) return;
    const wanted = String(value);
    const option = [...select.options].find(item => item.value === wanted || item.dataset.id === wanted);
    if (option) select.value = option.value;
  }

  function selectedPrompt(select) {
    return select?.selectedOptions?.[0]?.dataset?.prompt || "";
  }

  function selectedLabel(select) {
    return select?.selectedOptions?.[0]?.textContent?.trim() || "";
  }

  function selectedMeta(select, key) {
    return select?.selectedOptions?.[0]?.dataset?.[key] || "";
  }

  function updateStyleHint() {
    if (!elements.archSketchStyleHint) return;
    const description = selectedMeta(elements.archSketchStyle, "description");
    const base = description || "Choose the primary visual language for the architectural sketch.";
    elements.archSketchStyleHint.textContent = `${base} Line and color follow this style by default.`;
  }

  function updateSurfaceHint() {
    if (!elements.archSketchSurfaceHint) return;

    const raw = selectedMeta(elements.archSketchStyle, "recommendedSurface");
    const recommendedIds = String(raw || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

    if (!recommendedIds.length) {
      elements.archSketchSurfaceHint.textContent = "Choose the physical drawing surface independently from the Sketch Style.";
      return;
    }

    const mediaById = new Map((options?.media || []).map(item => [item.id, item.label || item.id]));
    const labels = recommendedIds.map(id => mediaById.get(id)).filter(Boolean);
    if (!labels.length) {
      elements.archSketchSurfaceHint.textContent = "Choose the physical drawing surface independently from the Sketch Style.";
      return;
    }

    const current = elements.archSketchMedium?.value || "";
    const isRecommended = recommendedIds.includes(current);
    elements.archSketchSurfaceHint.textContent = isRecommended
      ? `Recommended for this style: ${labels.join(" · ")}. Current surface is a recommended match.`
      : `Recommended for this style: ${labels.join(" · ")}. You can still choose any surface.`;
  }

  function isAdvancedOverride(value) {
    return Boolean(value && value !== "auto-follow-style");
  }

  function updateAdvancedState() {
    if (!elements.archSketchAdvancedState) return;
    const lineOverride = isAdvancedOverride(elements.archSketchLineQuality?.value);
    const colorOverride = isAdvancedOverride(elements.archSketchColorTreatment?.value);
    const count = Number(lineOverride) + Number(colorOverride);

    if (!count) {
      elements.archSketchAdvancedState.textContent = "Line & color follow Sketch Style";
      elements.archSketchAdvanced?.classList.remove("has-overrides");
      return;
    }

    elements.archSketchAdvancedState.textContent = count === 2
      ? "2 custom overrides active"
      : "1 custom override active";
    elements.archSketchAdvanced?.classList.add("has-overrides");
  }

  function collectState() {
    const projectType = global.ArchitecturalTaxonomy.resolveValue(
      elements.archSketchBuildingType,
      elements.archSketchCustomBuildingType,
      taxonomy?.buildingTypes || []
    );
    const architectureStyle = global.ArchitecturalTaxonomy.resolveValue(
      elements.archSketchArchitectureStyle,
      elements.archSketchCustomArchitectureStyle,
      taxonomy?.styleOptions || []
    );

    return {
      inputType: elements.archSketchInputType.value,
      inputPrompt: selectedPrompt(elements.archSketchInputType),
      buildingCategory: elements.archSketchBuildingCategory.value,
      buildingType: elements.archSketchBuildingType.value,
      buildingTypeLabel: global.ArchitecturalTaxonomy.selectedLabel(elements.archSketchBuildingType, taxonomy?.buildingTypes || []),
      customBuildingType: elements.archSketchCustomBuildingType.value.trim(),
      projectType,
      sceneType: elements.archSketchSceneType.value,
      sceneLabel: selectedLabel(elements.archSketchSceneType),
      scenePrompt: selectedPrompt(elements.archSketchSceneType),
      styleCategory: elements.archSketchStyleCategory.value,
      architectureStyleId: elements.archSketchArchitectureStyle.value,
      customArchitectureStyle: elements.archSketchCustomArchitectureStyle.value.trim(),
      architectureStyle,
      sketchStyle: elements.archSketchStyle.value,
      sketchStyleLabel: selectedLabel(elements.archSketchStyle),
      sketchStylePrompt: selectedPrompt(elements.archSketchStyle),
      sketchStyleLineRule: selectedMeta(elements.archSketchStyle, "lineRule"),
      sketchStyleColorRule: selectedMeta(elements.archSketchStyle, "colorRule"),
      sketchStyleAvoid: selectedMeta(elements.archSketchStyle, "avoid"),
      medium: elements.archSketchMedium.value,
      mediumLabel: selectedLabel(elements.archSketchMedium),
      mediumPrompt: selectedPrompt(elements.archSketchMedium),
      lineQuality: elements.archSketchLineQuality.value,
      lineQualityPrompt: selectedPrompt(elements.archSketchLineQuality),
      lineQualityOverride: isAdvancedOverride(elements.archSketchLineQuality.value),
      colorTreatment: elements.archSketchColorTreatment.value,
      colorTreatmentPrompt: selectedPrompt(elements.archSketchColorTreatment),
      colorTreatmentOverride: isAdvancedOverride(elements.archSketchColorTreatment.value),
      lighting: elements.archSketchLighting.value,
      lightingPrompt: selectedPrompt(elements.archSketchLighting),
      mood: elements.archSketchMood.value,
      moodPrompt: selectedPrompt(elements.archSketchMood),
      landscape: elements.archSketchLandscape.value.trim(),
      features: elements.archSketchFeatures.value.trim(),
      humanScale: elements.archSketchHumanScale.value,
      humanScalePrompt: selectedPrompt(elements.archSketchHumanScale),
      cameraView: elements.archSketchCameraView.value,
      cameraPrompt: selectedPrompt(elements.archSketchCameraView),
      aspectRatio: elements.archSketchAspectRatio.value || "4:5",
      extraInstruction: elements.archSketchExtraInstruction.value.trim()
    };
  }

  function generate(explicit = false) {
    if (!active || !database) return "";
    const state = collectState();
    const prompt = global.ArchitecturalSketchPromptBuilder.build(state);
    elements.output.value = prompt;
    elements.output.classList.toggle("is-filled", Boolean(prompt));
    if (elements.promptStats) elements.promptStats.textContent = `${prompt.length.toLocaleString()} characters`;
    updateDna(state);
    if (explicit) global.dispatchEvent(new CustomEvent("promptgen:architecturalsketchgenerated", { detail: { prompt, state } }));
    return prompt;
  }

  function activate(notify = true) {
    if (!database || !getModeDefinition()) return;
    active = true;
    localStorage.setItem("promptGenPromptMode", MODE_ID);
    document.body.classList.add("architectural-sketch-active");

    ["creativeModeSections", "creativeFields", "catalogFields", "productFields", "posterFields", "architecturalRenderFields"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });

    elements.architecturalSketchFields.hidden = false;
    if (elements.activeStyleBadge) elements.activeStyleBadge.hidden = true;
    if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = true;

    if (elements.activeModeBadge) {
      elements.activeModeBadge.textContent = "Architectural Sketch Builder";
      elements.activeModeBadge.dataset.mode = MODE_ID;
    }
    if (elements.randomModeTitle) elements.randomModeTitle.textContent = "Architectural Sketch Controls";
    if (elements.randomModeHint) elements.randomModeHint.textContent = "Choose a sketch family first; it controls line and color by default. Then choose a drawing surface, context, and scene-aware View / Projection, or open Advanced for deliberate overrides.";
    if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Architectural sketch tip";
    if (elements.outputTipText) elements.outputTipText.textContent = "Sketch Style controls the default line and color language. Keep Advanced Style Controls on Auto for the intended style, or open them only when you want a deliberate line or color override.";
    updateStyleHint();
    updateSurfaceHint();
    updateAdvancedState();

    elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
      const on = card.dataset.promptModeId === MODE_ID;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });

    generate(false);
    global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode: MODE_ID } }));
    if (notify) showMessage("Architectural Sketch Builder selected.");
  }

  function deactivate() {
    if (!active) return;
    active = false;
    document.body.classList.remove("architectural-sketch-active");
    elements.architecturalSketchFields.hidden = true;
    if (elements.randomPromptBtn) elements.randomPromptBtn.hidden = false;
  }

  function reset() {
    elements.archSketchBuildingCategory.value = "";
    elements.archSketchCustomBuildingType.value = "";
    updateBuildingTypeOptions({ selectedId: "" });
    elements.archSketchStyleCategory.value = "";
    elements.archSketchCustomArchitectureStyle.value = "";
    updateArchitectureStyleOptions({ selectedId: "" });
    elements.archSketchLandscape.value = "";
    elements.archSketchFeatures.value = "";
    elements.archSketchExtraInstruction.value = "";
    applyDefaults();
    searchable.forEach(control => control.syncFromNative?.());
    if (elements.archSketchAdvanced) elements.archSketchAdvanced.open = false;
    updateStyleHint();
    updateSurfaceHint();
    updateAdvancedState();
    generate(false);
    showMessage("Architectural Sketch form reset.");
  }

  function serializeState() {
    const resolved = collectState();
    return {
      archSketchInputType: elements.archSketchInputType.value,
      archSketchBuildingCategory: elements.archSketchBuildingCategory.value,
      archSketchBuildingType: elements.archSketchBuildingType.value,
      archSketchCustomBuildingType: elements.archSketchCustomBuildingType.value,
      archSketchProjectType: resolved.projectType,
      archSketchSceneType: elements.archSketchSceneType.value,
      archSketchStyleCategory: elements.archSketchStyleCategory.value,
      archSketchArchitectureStyleId: elements.archSketchArchitectureStyle.value,
      archSketchCustomArchitectureStyle: elements.archSketchCustomArchitectureStyle.value,
      archSketchArchitectureStyle: resolved.architectureStyle,
      archSketchStyle: elements.archSketchStyle.value,
      archSketchMedium: elements.archSketchMedium.value,
      archSketchLineQuality: elements.archSketchLineQuality.value,
      archSketchColorTreatment: elements.archSketchColorTreatment.value,
      archSketchLighting: elements.archSketchLighting.value,
      archSketchMood: elements.archSketchMood.value,
      archSketchLandscape: elements.archSketchLandscape.value,
      archSketchFeatures: elements.archSketchFeatures.value,
      archSketchHumanScale: elements.archSketchHumanScale.value,
      archSketchCameraView: elements.archSketchCameraView.value,
      archSketchAspectRatio: elements.archSketchAspectRatio.value,
      archSketchExtraInstruction: elements.archSketchExtraInstruction.value
    };
  }

  function restoreState(state = {}) {
    const missing = [];
    setSelect("archSketchInputType", state.archSketchInputType, missing, "Input Type");

    const buildingRestore = global.ArchitecturalTaxonomy.deriveRestore({
      items: taxonomy?.buildingTypes || [],
      categoryId: state.archSketchBuildingCategory,
      itemId: state.archSketchBuildingType,
      customValue: state.archSketchCustomBuildingType,
      legacyValue: state.archSketchProjectType
    });
    setValue(elements.archSketchBuildingCategory, buildingRestore.categoryId);
    updateBuildingTypeOptions({ selectedId: buildingRestore.itemId });
    elements.archSketchCustomBuildingType.value = buildingRestore.customValue;
    syncBuildingCustomUi();

    setSelect("archSketchSceneType", state.archSketchSceneType, missing, "Scene Type");

    const styleRestore = global.ArchitecturalTaxonomy.deriveRestore({
      items: taxonomy?.styleOptions || [],
      categoryId: state.archSketchStyleCategory,
      itemId: state.archSketchArchitectureStyleId,
      customValue: state.archSketchCustomArchitectureStyle,
      legacyValue: state.archSketchArchitectureStyle
    });
    setValue(elements.archSketchStyleCategory, styleRestore.categoryId);
    updateArchitectureStyleOptions({ selectedId: styleRestore.itemId });
    elements.archSketchCustomArchitectureStyle.value = styleRestore.customValue;
    syncArchitectureStyleCustomUi();

    setSelect("archSketchStyle", state.archSketchStyle, missing, "Sketch Style");
    const restoredSurface = LEGACY_SURFACE_ALIASES[state.archSketchMedium] || state.archSketchMedium;
    setSelect("archSketchMedium", restoredSurface || database?.config?.defaultArchitecturalSketchMedium || "watercolor-paper", missing, "Paper / Surface");
    setSelect("archSketchLineQuality", state.archSketchLineQuality || "auto-follow-style", missing, "Line Quality");
    setSelect("archSketchColorTreatment", state.archSketchColorTreatment || "auto-follow-style", missing, "Color Treatment");
    setSelect("archSketchLighting", state.archSketchLighting, missing, "Lighting / Time");
    const restoredAtmosphere = LEGACY_ATMOSPHERE_ALIASES[state.archSketchMood] || state.archSketchMood;
    setSelect("archSketchMood", restoredAtmosphere || database?.config?.defaultArchitecturalSketchMood || "calm", missing, "Atmosphere / Character");
    const legacyContext = LEGACY_ATMOSPHERE_CONTEXT[state.archSketchMood] || "";
    const existingLandscape = String(state.archSketchLandscape || "").trim();
    const restoredLandscape = legacyContext && !/\brain\b|\bwet\b/i.test(existingLandscape)
      ? [existingLandscape, legacyContext].filter(Boolean).join("; ")
      : existingLandscape;
    setText("archSketchLandscape", restoredLandscape);
    setText("archSketchFeatures", state.archSketchFeatures);
    setSelect("archSketchHumanScale", state.archSketchHumanScale, missing, "Human Figure for Scale");
    const restoredView = resolveViewForScene(state.archSketchCameraView, elements.archSketchSceneType.value || "exterior");
    updateViewOptions({ preferredValue: restoredView });
    setSelect("archSketchCameraView", restoredView, missing, "View / Projection");
    setSelect("archSketchAspectRatio", state.archSketchAspectRatio, missing, "Aspect Ratio");
    setText("archSketchExtraInstruction", state.archSketchExtraInstruction);
    searchable.forEach(control => control.syncFromNative?.());
    updateStyleHint();
    updateSurfaceHint();
    updateAdvancedState();
    if (elements.archSketchAdvanced) {
      elements.archSketchAdvanced.open =
        isAdvancedOverride(elements.archSketchLineQuality?.value) ||
        isAdvancedOverride(elements.archSketchColorTreatment?.value);
    }
    generate(false);
    return { missing };
  }

  function updateDna(state) {
    if (!active) return;
    const labels = ["Project", "Architecture", "Sketch", "Surface", "Atmosphere"];
    const ready = [
      Boolean(state.projectType || state.inputType),
      Boolean(state.architectureStyle || state.sceneType),
      Boolean(state.sketchStyle),
      Boolean(state.medium && state.lineQuality),
      Boolean(state.lighting && state.mood)
    ];
    [elements.dnaSubject, elements.dnaScene, elements.dnaStyle, elements.dnaCamera, elements.dnaLight].forEach((node, index) => {
      if (!node) return;
      const label = node.querySelector("b");
      if (label) label.textContent = labels[index];
      node.classList.toggle("is-ready", ready[index]);
      node.classList.toggle("is-partial", !ready[index]);
    });
  }

  function setSelect(id, value, missing, label) {
    const select = document.getElementById(id);
    if (!select) {
      if (value) missing.push(label || id);
      return false;
    }
    const wanted = String(value || "");
    if (!wanted) return true;
    const option = [...select.options].find(item => item.value === wanted || item.dataset.id === wanted);
    if (!option) {
      missing.push(label || id);
      return false;
    }
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    searchable.get(id)?.syncFromNative?.();
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

  global.ArchitecturalSketchMode = {
    id: MODE_ID,
    isReady: () => Boolean(database && options),
    isActive: () => active,
    activate: () => activate(true),
    generate: () => generate(false),
    getState: serializeState,
    restoreState,
    refreshData: loadFeatureData
  };
})(window);
