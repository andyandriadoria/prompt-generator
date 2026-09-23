(function (global) {
  "use strict";

  const MODE_ID = "architectural_sketch";
  const FALLBACK_MODE = {
    id: MODE_ID,
    label: "Architectural Concept Builder",
    icon: "drafting",
    description: "Concept-first architectural development for ideas, briefs, or references, with output as Sketch Presentation or Architectural Photography."
  };

  const FALLBACK_OPTIONS = {
    inputTypes: [{ id: "concept-prompt", label: "Concept Prompt", prompt: "" }],
    outputRepresentations: [
      { id: "sketch-presentation", label: "Sketch Presentation", prompt: "hand-drawn architectural sketch presentation" },
      { id: "architectural-photography", label: "Architectural Photography", prompt: "architectural photography" }
    ],
    photoRealismTargets: [
      { id: "hyper-real-architectural-photo", label: "Hyper-Real Architectural Photo", prompt: "hyper realistic photography" },
      { id: "natural-documentary-architectural-photo", label: "Natural Documentary Architectural Photo", prompt: "natural documentary architectural photograph" },
      { id: "editorial-architectural-photo", label: "Editorial Architectural Photo", prompt: "editorial architectural photograph" }
    ],
    textSignagePolicies: [
      { id: "no-invented-text", label: "No Invented Text — Preserve Existing", prompt: "do not invent new readable text, logos, brand names, storefront names, slogans, dates, signatures, or decorative lettering; when a provided reference contains existing legible architectural signage or text, preserve it only where visible and supported, otherwise keep sign panels neutral or blank rather than fabricating characters" },
      { id: "preserve-reference-text", label: "Preserve Reference Signage / Text", prompt: "when the reference image contains existing legible signage, numbers, or architectural text, preserve its placement and content as closely as possible; do not replace, rewrite, translate, restyle, or add new wording; if exact lettering cannot be supported, prefer neutral or blank areas over invented text" },
      { id: "allow-functional-signage", label: "Allow Functional Architectural Signage", prompt: "allow restrained functional architectural signage, room numbers, address markers, or wayfinding only where spatially appropriate; keep text visually secondary and plausible, and do not invent brand logos, storefront brands, slogans, campaign copy, or decorative lettering" },
      { id: "blank-signage-no-text", label: "Blank Signage — No Text", prompt: "do not add any readable text, pseudo-text, labels, logos, captions, dates, signatures, watermarks, slogans, brand names, or decorative lettering; if signage panels or signboards are part of the architecture, keep them completely blank with no invented characters or symbols" }
    ],
    sceneTypes: [{ id: "exterior", label: "Exterior", prompt: "an exterior architectural view", recommended_lighting: "morning-light" }],
    sketchStyles: [{
      id: "watercolor-sketch",
      label: "Soft Watercolor Architectural Sketch",
      description: "Fine architectural ink with transparent watercolor washes and visible white paper.",
      prompt: "a soft watercolor architectural sketch with fine ink outlines, transparent layered washes, and generous white paper",
      line_rule: "Keep the ink drawing clearly visible beneath the watercolor",
      color_rule: "Use soft natural washes with restrained saturation and imperfect hand-painted edges",
      avoid: "Avoid heavy pencil shading and opaque digital painting",
      recommended_surface: "watercolor-paper",
      recommended_human: "minimal-scale-figures"
    }],
    media: [{ id: "watercolor-paper", label: "Textured Watercolor Paper", prompt: "lightly textured watercolor paper with visible natural tooth and restrained surface variation" }],
    lineQualities: [{ id: "auto-follow-style", label: "Auto — Follow Sketch Style", prompt: "", description: "Use the selected Sketch Style's built-in line character and line hierarchy." }],
    colorTreatments: [{ id: "auto-follow-style", label: "Auto — Follow Sketch Style", prompt: "", description: "Use the selected Sketch Style's built-in color treatment and color rules." }],
    lighting: [{ id: "morning-light", label: "Morning Light", prompt: "soft morning light with gentle directional shadows" }],
    moods: [{ id: "calm", label: "Calm", prompt: "a calm, composed, and visually balanced architectural character" }],
    humanScale: [
      { id: "none", label: "None", prompt: "" },
      { id: "minimal-scale-figures", label: "Sparse Scale Figures", prompt: "include a few sparse human figures only for architectural scale, kept visually secondary to the architecture" }
    ],
    annotationTexts: [{ id: "no-text", label: "None — No Text or Annotations", prompt: "", description: "Default clean-output mode that suppresses generated text and signage." }],
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

  const LEGACY_HUMAN_SCALE_ALIASES = {
    "casual-people-scale": "small-human-group"
  };

  const NON_PHOTOGRAPHIC_VIEW_IDS = new Set([
    "axonometric-isometric",
    "orthographic-elevation",
    "section-perspective",
    "sketchbook-perspective"
  ]);
  const NON_PHOTOGRAPHIC_HUMAN_IDS = new Set(["silhouette-figures"]);

  const elements = {};
  const searchable = new Map();
  let database = null;
  let options = null;
  let taxonomy = null;
  const smartDefaults = {
    surfaceTouched: false,
    lightingTouched: false,
    viewTouched: false,
    restoring: false,
    applying: false
  };
  const sketchRandomState = {
    applying: false,
    manualFields: new Set()
  };
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
      "architecturalSketchFields", "archSketchInputType", "archSketchOutputRepresentation", "archSketchSceneType",
      "archSketchBuildingCategory", "archSketchBuildingType", "archSketchCustomBuildingType", "archSketchCustomBuildingRow", "archSketchBuildingCategoryHint", "archSketchBuildingTypeHint",
      "archSketchStyleCategory", "archSketchArchitectureStyle", "archSketchCustomArchitectureStyle", "archSketchCustomArchitectureStyleRow", "archSketchStyleCategoryHint", "archSketchArchitectureStyleHint",
      "archSketchStyle", "archSketchStyleRow", "archSketchMedium", "archSketchMediumRow", "archSketchPhotoRealismTarget", "archSketchPhotoRealismTargetRow", "archSketchPhotoRealismTargetHint", "archSketchTextSignagePolicy", "archSketchTextSignagePolicyRow", "archSketchTextSignageHint", "archSketchWorkflowHint", "archSketchOutputRepresentationHint", "archSketchLineQuality",
      "archSketchColorTreatment", "archSketchLighting", "archSketchMood", "archSketchLandscape",
      "archSketchFeatures", "archSketchFeaturesHint", "archSketchHumanScale", "archSketchCameraView", "archSketchCameraViewHint", "archSketchAnnotationText", "archSketchAnnotationTextRow", "archSketchAnnotationTextHint", "archSketchAspectRatio",
      "archSketchExtraInstruction", "archSketchStyleHint", "archSketchSurfaceHint", "archSketchLightingHint", "archSketchHumanScaleHint",
      "archSketchTip", "archSketchAdvanced", "archSketchAdvancedState"
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
          <strong>Architectural Concept Builder</strong>
          <p>Create concept-driven architectural prompts as hand-drawn sketch presentations or architectural photography.</p>
        </div>
      </div>

      <div class="field-row"><label for="archSketchInputType">Input Type</label><div><select id="archSketchInputType"></select><p class="help-text" id="archSketchWorkflowHint">Concept-first workflow. Use this mode to develop an idea, brief, or reference into a new representation.</p></div></div>
      <div class="field-row"><label for="archSketchOutputRepresentation">Output Representation</label><div><select id="archSketchOutputRepresentation"></select><p class="help-text" id="archSketchOutputRepresentationHint">Choose Sketch Presentation or Architectural Photography.</p></div></div>
      <div class="field-row"><label for="archSketchBuildingCategory">Building Category</label><div><select id="archSketchBuildingCategory"></select><p class="help-text arch-taxonomy-help" id="archSketchBuildingCategoryHint"></p></div></div>
      <div class="field-row"><label for="archSketchBuildingType">Building Type</label><div><select id="archSketchBuildingType"></select><p class="help-text arch-taxonomy-help" id="archSketchBuildingTypeHint"></p></div></div>
      <div class="field-row arch-taxonomy-custom" id="archSketchCustomBuildingRow" hidden><label for="archSketchCustomBuildingType">Custom Building Type</label><input id="archSketchCustomBuildingType" type="text" placeholder="Example: mixed-use courtyard housing, tropical community pavilion"></div>
      <div class="field-row"><label for="archSketchSceneType">Scene Type</label><select id="archSketchSceneType"></select></div>
      <div class="field-row" id="archSketchStyleRow"><label for="archSketchStyle">Sketch Style</label><div><select id="archSketchStyle"></select><p class="help-text arch-sketch-style-hint" id="archSketchStyleHint"></p></div></div>
      <div class="field-row" id="archSketchMediumRow"><label for="archSketchMedium">Paper / Surface</label><div><select id="archSketchMedium"></select><p class="help-text arch-sketch-surface-hint" id="archSketchSurfaceHint"></p></div></div>
      <div class="field-row" id="archSketchPhotoRealismTargetRow" hidden><label for="archSketchPhotoRealismTarget">Photo Realism Target</label><div><select id="archSketchPhotoRealismTarget"></select><p class="help-text" id="archSketchPhotoRealismTargetHint"></p></div></div>
      <div class="field-row" id="archSketchTextSignagePolicyRow" hidden><label for="archSketchTextSignagePolicy">Text / Signage Policy</label><div><select id="archSketchTextSignagePolicy"></select><p class="help-text" id="archSketchTextSignageHint">Photography-only control. Default blocks invented lettering without forcing existing reference signage to disappear.</p></div></div>

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
      <div class="field-row"><label for="archSketchStyleCategory">Architectural Style Category</label><div><select id="archSketchStyleCategory"></select><p class="help-text arch-taxonomy-help" id="archSketchStyleCategoryHint"></p></div></div>
      <div class="field-row"><label for="archSketchArchitectureStyle">Architectural Style</label><div><select id="archSketchArchitectureStyle"></select><p class="help-text arch-taxonomy-help" id="archSketchArchitectureStyleHint"></p></div></div>
      <div class="field-row arch-taxonomy-custom" id="archSketchCustomArchitectureStyleRow" hidden><label for="archSketchCustomArchitectureStyle">Custom Architectural Style</label><input id="archSketchCustomArchitectureStyle" type="text" placeholder="Example: tropical contemporary with subtle Japanese influence"></div>
      <div class="field-row"><label for="archSketchLighting">Lighting / Time</label><div><select id="archSketchLighting"></select><p class="help-text" id="archSketchLightingHint"></p></div></div>
      <div class="field-row"><label for="archSketchMood">Atmosphere / Character</label><div><select id="archSketchMood"></select><p class="help-text">Spatial character only; lighting stays in Lighting / Time and weather stays in Site / Context.</p></div></div>
      <div class="field-row"><label for="archSketchLandscape">Site / Context <span class="optional-label">optional</span></label><div><textarea id="archSketchLandscape" class="short-textarea" placeholder="Example: restrained tropical planting, stone paving, urban sidewalk, light rain and wet ground"></textarea><p class="help-text">Physical surroundings only: planting, hardscape, terrain, streetscape, adjacent context, and weather/site conditions.</p></div></div>
      <div class="field-row"><label for="archSketchFeatures">Architectural Feature Emphasis <span class="optional-label">optional</span></label><div><textarea id="archSketchFeatures" class="short-textarea" placeholder="Example: deep entrance canopy, vertical timber screens, arched colonnade, central courtyard"></textarea><p class="help-text" id="archSketchFeaturesHint">Specific building elements to highlight.</p></div></div>
      <div class="field-row"><label for="archSketchHumanScale">Human Presence / Scale</label><div><select id="archSketchHumanScale"></select><p class="help-text" id="archSketchHumanScaleHint"></p></div></div>
      <div class="field-row"><label for="archSketchCameraView">View / Projection</label><div><select id="archSketchCameraView"></select><p class="help-text" id="archSketchCameraViewHint"></p></div></div>
      <div class="field-row" id="archSketchAnnotationTextRow"><label for="archSketchAnnotationText">Annotations / Text</label><div><select id="archSketchAnnotationText"></select><p class="help-text" id="archSketchAnnotationTextHint"></p></div></div>
      <div class="field-row"><label for="archSketchAspectRatio">Aspect Ratio</label><select id="archSketchAspectRatio"></select></div>
      <div class="field-row"><label for="archSketchExtraInstruction">Extra Instruction <span class="optional-label">optional</span></label><textarea id="archSketchExtraInstruction" class="short-textarea" placeholder="Example: emphasize the entrance canopy; avoid excessive foliage; no text labels"></textarea></div>

      <div class="arch-sketch-tip" id="archSketchTip">
        <span>${global.PromptIcons.svg("drafting")}</span>
        <div><strong>Architectural sketch logic</strong><p>Site / Context controls the physical surroundings, Architectural Feature Emphasis controls specific building elements, and Human Presence / Scale controls figures only for scale. In Reference Image mode, feature emphasis cannot invent or redesign architecture. Annotations / Text defaults to a clean no-text output.</p></div>
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

    elements.architecturalSketchFields.addEventListener("input", event => {
      markSketchRandomManual(event.target);
      generate(false);
    });
    elements.architecturalSketchFields.addEventListener("change", event => {
      markSketchRandomManual(event.target);
      if (!smartDefaults.applying && !smartDefaults.restoring && !sketchRandomState.applying) {
        if (event.target === elements.archSketchMedium) smartDefaults.surfaceTouched = true;
        if (event.target === elements.archSketchLighting) smartDefaults.lightingTouched = true;
        if (event.target === elements.archSketchCameraView) smartDefaults.viewTouched = true;
      }

      if (event.target === elements.archSketchOutputRepresentation) {
        updateRepresentationUi();
        updateRepresentationHints();
        updateHumanScaleHint();
      }
      if (event.target === elements.archSketchInputType) {
        updateWorkflowHint();
        updateTextSignagePolicyUi();
        updateFeatureHint();
      }
      if (event.target === elements.archSketchBuildingCategory) {
        updateBuildingTypeOptions({ selectedId: "" });
      }
      if (event.target === elements.archSketchBuildingType) {
        syncBuildingCustomUi();
        updateTaxonomyUi();
      }
      if (event.target === elements.archSketchStyleCategory) {
        updateArchitectureStyleOptions({ selectedId: "" });
      }
      if (event.target === elements.archSketchArchitectureStyle) {
        syncArchitectureStyleCustomUi();
        updateTaxonomyUi();
      }
      if (event.target === elements.archSketchStyle) {
        updateStyleHint();
        if (!smartDefaults.restoring && !smartDefaults.surfaceTouched) applyRecommendedSurface();
        updateSurfaceHint();
        updateHumanScaleHint();
      }
      if (event.target === elements.archSketchSceneType) {
        if (!smartDefaults.restoring) {
          if (!smartDefaults.lightingTouched) applyRecommendedLighting();
          updateViewOptions({ applySceneDefault: !smartDefaults.viewTouched });
        }
        updateLightingHint();
      }
      if (event.target === elements.archSketchMedium) updateSurfaceHint();
      if (event.target === elements.archSketchLighting) updateLightingHint();
      if (event.target === elements.archSketchHumanScale) updateHumanScaleHint();
      if (event.target === elements.archSketchCameraView) updateViewHint();
      if (event.target === elements.archSketchAnnotationText) updateAnnotationHint();
      if (event.target === elements.archSketchPhotoRealismTarget) updatePhotoRealismHint();
      if (event.target === elements.archSketchTextSignagePolicy) updateTextSignagePolicyUi();
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
      showMessage("Architectural concept prompt generated.");
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
      randomizeSketch();
    }, true);

    elements.refreshDataBtn?.addEventListener("click", () => setTimeout(() => loadFeatureData({ forceRefresh: false }), 900));
  }

  function observePromptModes() {
    if (observer) return;
    observer = new MutationObserver(() => {
      ensureModeCard();
      sortPromptModeCards();
    });
    observer.observe(elements.promptModeGrid, { childList: true });
  }

  async function loadFeatureData(loadOptions = {}) {
    try {
      const shouldPreserveState = Boolean(
        database &&
        options &&
        elements.archSketchStyle?.options?.length
      );
      const preservedState = shouldPreserveState ? serializeState() : null;
      const preservedSmartState = shouldPreserveState ? {
        surfaceTouched: smartDefaults.surfaceTouched,
        lightingTouched: smartDefaults.lightingTouched,
        viewTouched: smartDefaults.viewTouched
      } : null;
      const preservedRandomLocks = shouldPreserveState
        ? new Set(sketchRandomState.manualFields)
        : null;

      const result = await global.PromptDataLoader.load(loadOptions);
      database = result.data;
      options = buildOptions(database.config || {});
      taxonomy = global.ArchitecturalTaxonomy.fromConfig(database.config || {});
      populateControls();

      if (preservedState && preservedSmartState) {
        restoreState(preservedState);
        smartDefaults.surfaceTouched = preservedSmartState.surfaceTouched;
        smartDefaults.lightingTouched = preservedSmartState.lightingTouched;
        smartDefaults.viewTouched = preservedSmartState.viewTouched;
        sketchRandomState.manualFields = preservedRandomLocks || new Set();
        updateSurfaceHint();
        updateLightingHint();
        updateHumanScaleHint();
      }

      ensureModeCard();
    } catch (error) {
      console.warn("Architectural Sketch data load failed:", error);
    }
  }

  function buildOptions(config) {
    return {
      inputTypes: parseList(config.architecturalSketchInputTypes, FALLBACK_OPTIONS.inputTypes),
      outputRepresentations: parseList(config.architecturalSketchOutputRepresentations, FALLBACK_OPTIONS.outputRepresentations),
      photoRealismTargets: parseList(config.architecturalSketchPhotoRealismTargets, FALLBACK_OPTIONS.photoRealismTargets),
      textSignagePolicies: parseList(config.architecturalSketchTextSignagePolicies, FALLBACK_OPTIONS.textSignagePolicies),
      sceneTypes: parseList(config.architecturalSketchSceneTypes, FALLBACK_OPTIONS.sceneTypes),
      sketchStyles: parseList(config.architecturalSketchStyles, FALLBACK_OPTIONS.sketchStyles),
      media: parseList(config.architecturalSketchMedia, FALLBACK_OPTIONS.media),
      lineQualities: parseList(config.architecturalSketchLineQualities, FALLBACK_OPTIONS.lineQualities),
      colorTreatments: parseList(config.architecturalSketchColorTreatments, FALLBACK_OPTIONS.colorTreatments),
      lighting: parseList(config.architecturalSketchLighting, FALLBACK_OPTIONS.lighting),
      moods: parseList(config.architecturalSketchMoods, FALLBACK_OPTIONS.moods),
      humanScale: parseList(config.architecturalSketchHumanScale, FALLBACK_OPTIONS.humanScale),
      annotationTexts: parseList(config.architecturalSketchAnnotationTexts, FALLBACK_OPTIONS.annotationTexts),
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

    sortPromptModeCards();

    if (requestedInitialMode === MODE_ID && !active) queueMicrotask(() => activate(false));
  }

  function sortPromptModeCards() {
    if (!elements.promptModeGrid || !Array.isArray(database?.promptModes)) return;

    const order = new Map(
      database.promptModes.map((mode, index) => {
        const configuredSort = Number(mode.sort);
        return [mode.id, Number.isFinite(configuredSort) ? configuredSort : index + 1000];
      })
    );

    const cards = [...elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]")];
    if (cards.length < 2) return;

    const desired = cards.slice().sort((a, b) => {
      const aSort = order.get(a.dataset.promptModeId) ?? 9999;
      const bSort = order.get(b.dataset.promptModeId) ?? 9999;
      return aSort - bSort;
    });

    const alreadySorted = cards.every((card, index) => card === desired[index]);
    if (alreadySorted) return;

    desired.forEach(card => elements.promptModeGrid.append(card));
  }

  function populateControls() {
    if (!database || !options) return;

    populateSelect(elements.archSketchInputType, options.inputTypes);
    populateSelect(elements.archSketchOutputRepresentation, options.outputRepresentations);
    populateSelect(elements.archSketchPhotoRealismTarget, options.photoRealismTargets);
    populateSelect(elements.archSketchTextSignagePolicy, options.textSignagePolicies);
    populateTaxonomyControls();
    populateSelect(elements.archSketchSceneType, options.sceneTypes);
    populateSelect(elements.archSketchStyle, options.sketchStyles);
    populateSelect(elements.archSketchMedium, options.media);
    populateSelect(elements.archSketchLineQuality, options.lineQualities);
    populateSelect(elements.archSketchColorTreatment, options.colorTreatments);
    populateSelect(elements.archSketchLighting, options.lighting);
    populateSelect(elements.archSketchMood, options.moods);
    populateSelect(elements.archSketchHumanScale, options.humanScale);
    populateSelect(elements.archSketchAnnotationText, options.annotationTexts);

    elements.archSketchAspectRatio.innerHTML = "";
    (database.aspectRatios || []).forEach(item => {
      const value = item.value || item.label || item.id;
      const option = new Option(item.label || value, value);
      option.dataset.id = item.id || "";
      elements.archSketchAspectRatio.append(option);
    });

    resetSmartDefaultState();
    applyDefaults();
    initSearchable();
    updateRepresentationUi();
    updateWorkflowHint();
    updateRepresentationHints();
    updateTaxonomyUi();
    updateFeatureHint();
    updateStyleHint();
    updatePhotoRealismHint();
    updateViewHint();
    updateAnnotationHint();
    updateSurfaceHint();
    updateLightingHint();
    updateHumanScaleHint();
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
      option.dataset.recommendedLighting = item.recommended_lighting || "";
      option.dataset.recommendedHuman = item.recommended_human || "";
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
    updateTaxonomyUi();
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
    updateTaxonomyUi();
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

  function updateTaxonomyUi() {
    if (!taxonomy) return;
    const t = global.ArchitecturalTaxonomy;
    const buildingCategoryId = elements.archSketchBuildingCategory?.value || "";
    const styleCategoryId = elements.archSketchStyleCategory?.value || "";

    const buildingReady = Boolean(buildingCategoryId);
    if (elements.archSketchBuildingType) elements.archSketchBuildingType.disabled = !buildingReady;
    searchable.get("archSketchBuildingType")?.setDisabled?.(!buildingReady);
    searchable.get("archSketchBuildingType")?.syncFromNative?.();

    const styleReady = Boolean(styleCategoryId);
    if (elements.archSketchArchitectureStyle) elements.archSketchArchitectureStyle.disabled = !styleReady;
    searchable.get("archSketchArchitectureStyle")?.setDisabled?.(!styleReady);
    searchable.get("archSketchArchitectureStyle")?.syncFromNative?.();

    if (elements.archSketchBuildingCategoryHint) {
      const description = t.categoryDescription(elements.archSketchBuildingCategory, taxonomy.buildingCategories);
      const count = t.countForCategory(taxonomy.buildingTypes, buildingCategoryId);
      elements.archSketchBuildingCategoryHint.textContent = buildingCategoryId
        ? [description, count ? `${count} building types available.` : ""].filter(Boolean).join(" ")
        : "Choose a category first to narrow the Building Type list. Categories organize the UI only and do not enter the prompt.";
    }

    if (elements.archSketchBuildingTypeHint) {
      const custom = elements.archSketchBuildingType?.value === t.CUSTOM_ID;
      const description = t.selectedDescription(elements.archSketchBuildingType, taxonomy.buildingTypes);
      elements.archSketchBuildingTypeHint.textContent = !buildingCategoryId
        ? "Select Building Category to unlock Building Type."
        : custom
          ? "Enter a precise custom building type below. The category remains navigation metadata only."
          : description || "Choose the project type that best matches the concept.";
    }

    if (elements.archSketchStyleCategoryHint) {
      const description = t.categoryDescription(elements.archSketchStyleCategory, taxonomy.styleCategories);
      const count = t.countForCategory(taxonomy.styleOptions, styleCategoryId);
      elements.archSketchStyleCategoryHint.textContent = styleCategoryId
        ? [description, count ? `${count} styles available.` : ""].filter(Boolean).join(" ")
        : "Choose a style family first. Style categories organize the UI and do not enter the prompt.";
    }

    if (elements.archSketchArchitectureStyleHint) {
      const custom = elements.archSketchArchitectureStyle?.value === t.CUSTOM_ID;
      const description = t.selectedDescription(elements.archSketchArchitectureStyle, taxonomy.styleOptions);
      elements.archSketchArchitectureStyleHint.textContent = !styleCategoryId
        ? "Select Architectural Style Category to unlock Architectural Style."
        : custom
          ? "Describe a custom architectural language below. Keep it concise and visually specific."
          : description || "Choose the architectural language for the concept.";
    }
  }

  function markSketchRandomManual(target) {
    if (!target?.id) return;
    if (target.classList?.contains("searchable-input")) return;
    if (smartDefaults.applying || smartDefaults.restoring || sketchRandomState.applying) return;
    sketchRandomState.manualFields.add(target.id);
  }

  function isSketchRandomLocked(id) {
    return sketchRandomState.manualFields.has(id);
  }

  function pickRandom(items) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)] || null;
  }

  function pickRandomSelectValue(select) {
    if (!select) return "";
    const values = [...select.options]
      .filter(option => !option.disabled && option.value && option.value !== global.ArchitecturalTaxonomy.CUSTOM_ID)
      .map(option => option.value);
    return pickRandom(values) || "";
  }

  function recommendedSurfaceIdsForStyle() {
    return String(selectedMeta(elements.archSketchStyle, "recommendedSurface") || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
  }

  function styleSupportsSurface(item, surfaceId) {
    if (!surfaceId) return true;
    return String(item?.recommended_surface || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
      .includes(surfaceId);
  }

  function sceneSupportsView(sceneId, viewId) {
    if (!viewId) return true;
    const view = (options?.cameraViews || []).find(item => item.id === viewId);
    return view ? viewAppliesToScene(view, sceneId) : true;
  }

  function randomizeSketch() {
    if (!active || !database || !options || !taxonomy) return;

    sketchRandomState.applying = true;
    smartDefaults.applying = true;

    try {
      if (!isSketchRandomLocked("archSketchOutputRepresentation")) {
        setValue(
          elements.archSketchOutputRepresentation,
          pickRandom(options.outputRepresentations)?.id || elements.archSketchOutputRepresentation.value
        );
      }
      updateRepresentationUi();
      const photography = isPhotographyRepresentation();

      if (photography && !isSketchRandomLocked("archSketchPhotoRealismTarget")) {
        setValue(
          elements.archSketchPhotoRealismTarget,
          pickRandom(options.photoRealismTargets)?.id || elements.archSketchPhotoRealismTarget.value
        );
      }

      const buildingTypeLocked = isSketchRandomLocked("archSketchBuildingType")
        || isSketchRandomLocked("archSketchCustomBuildingType");
      const buildingCategoryLocked = isSketchRandomLocked("archSketchBuildingCategory");

      if (buildingTypeLocked) {
        const selectedBuilding = taxonomy.buildingTypes.find(item => item.id === elements.archSketchBuildingType.value);
        if (!buildingCategoryLocked && selectedBuilding?.category_id) {
          setValue(elements.archSketchBuildingCategory, selectedBuilding.category_id);
          updateBuildingTypeOptions({ selectedId: selectedBuilding.id });
        }
      } else {
        let categoryId = elements.archSketchBuildingCategory.value;
        if (!buildingCategoryLocked || !categoryId) {
          const categories = (taxonomy.buildingCategories || []).filter(category =>
            (taxonomy.buildingTypes || []).some(item => item.category_id === category.id)
          );
          const category = pickRandom(categories);
          categoryId = category?.id || categoryId;
          setValue(elements.archSketchBuildingCategory, categoryId);
        }
        const candidates = (taxonomy.buildingTypes || []).filter(item => item.category_id === categoryId);
        updateBuildingTypeOptions({ selectedId: pickRandom(candidates)?.id || "" });
      }
      syncBuildingCustomUi();

      const architectureStyleLocked = isSketchRandomLocked("archSketchArchitectureStyle")
        || isSketchRandomLocked("archSketchCustomArchitectureStyle");
      const styleCategoryLocked = isSketchRandomLocked("archSketchStyleCategory");

      if (architectureStyleLocked) {
        const selectedArchitectureStyle = taxonomy.styleOptions.find(item => item.id === elements.archSketchArchitectureStyle.value);
        if (!styleCategoryLocked && selectedArchitectureStyle?.category_id) {
          setValue(elements.archSketchStyleCategory, selectedArchitectureStyle.category_id);
          updateArchitectureStyleOptions({ selectedId: selectedArchitectureStyle.id });
        }
      } else {
        let categoryId = elements.archSketchStyleCategory.value;
        if (!styleCategoryLocked || !categoryId) {
          const categories = (taxonomy.styleCategories || []).filter(category =>
            (taxonomy.styleOptions || []).some(item => item.category_id === category.id)
          );
          const category = pickRandom(categories);
          categoryId = category?.id || categoryId;
          setValue(elements.archSketchStyleCategory, categoryId);
        }
        const candidates = (taxonomy.styleOptions || []).filter(item => item.category_id === categoryId);
        updateArchitectureStyleOptions({ selectedId: pickRandom(candidates)?.id || "" });
      }
      syncArchitectureStyleCustomUi();

      if (!isSketchRandomLocked("archSketchSceneType")) {
        const lockedView = isSketchRandomLocked("archSketchCameraView")
          ? elements.archSketchCameraView.value
          : "";
        const sceneCandidates = (options.sceneTypes || []).filter(scene =>
          sceneSupportsView(scene.id, lockedView)
        );
        setValue(elements.archSketchSceneType, pickRandom(sceneCandidates)?.id || elements.archSketchSceneType.value);
      }

      if (!photography) {
        if (!isSketchRandomLocked("archSketchStyle")) {
          const lockedSurface = isSketchRandomLocked("archSketchMedium")
            ? elements.archSketchMedium.value
            : "";
          const compatibleStyles = lockedSurface
            ? (options.sketchStyles || []).filter(item => styleSupportsSurface(item, lockedSurface))
            : (options.sketchStyles || []);
          const style = pickRandom(compatibleStyles.length ? compatibleStyles : options.sketchStyles);
          setValue(elements.archSketchStyle, style?.id || elements.archSketchStyle.value);
        }

        if (!isSketchRandomLocked("archSketchMedium")) {
          const recommended = recommendedSurfaceIdsForStyle();
          const surfaceId = pickRandom(recommended) || pickRandom((options.media || []).map(item => item.id));
          setValue(elements.archSketchMedium, surfaceId || elements.archSketchMedium.value);
        }
      }

      if (!isSketchRandomLocked("archSketchLighting")) {
        const recommended = recommendedLightingForScene();
        setValue(
          elements.archSketchLighting,
          recommended || pickRandom(options.lighting)?.id || elements.archSketchLighting.value
        );
      }

      if (!isSketchRandomLocked("archSketchMood")) {
        setValue(elements.archSketchMood, pickRandom(options.moods)?.id || elements.archSketchMood.value);
      }

      if (!isSketchRandomLocked("archSketchHumanScale")) {
        if (photography) {
          const photoHumans = (options.humanScale || []).filter(item => !NON_PHOTOGRAPHIC_HUMAN_IDS.has(item.id));
          setValue(elements.archSketchHumanScale, pickRandom(photoHumans)?.id || "none");
        } else {
          const recommended = recommendedHumanForStyle();
          const useNone = recommended && recommended !== "none" && Math.random() < 0.25;
          setValue(elements.archSketchHumanScale, useNone ? "none" : (recommended || "none"));
        }
      }

      const currentView = elements.archSketchCameraView.value;
      if (isSketchRandomLocked("archSketchCameraView")) {
        updateViewOptions({ applySceneDefault: false, preferredValue: currentView });
      } else {
        updateViewOptions({ applySceneDefault: false });
        const sceneId = elements.archSketchSceneType.value;
        const eligible = (options.cameraViews || []).filter(item =>
      viewAppliesToScene(item, sceneId) && viewAppliesToRepresentation(item)
    );
        setValue(elements.archSketchCameraView, pickRandom(eligible)?.id || sceneDefaultView(sceneId));
      }

      if (!isSketchRandomLocked("archSketchLineQuality")) {
        setValue(elements.archSketchLineQuality, "auto-follow-style");
      }
      if (!isSketchRandomLocked("archSketchColorTreatment")) {
        setValue(elements.archSketchColorTreatment, "auto-follow-style");
      }
      if (!isSketchRandomLocked("archSketchAnnotationText")) {
        setValue(elements.archSketchAnnotationText, "no-text");
      }
      if (!isSketchRandomLocked("archSketchAspectRatio")) {
        setValue(elements.archSketchAspectRatio, pickRandomSelectValue(elements.archSketchAspectRatio));
      }

      searchable.forEach(control => control.syncFromNative?.());
      updateRepresentationUi();
      updateTaxonomyUi();
      updateFeatureHint();
      updatePhotoRealismHint();
      updateViewHint();
      updateAnnotationHint();
      updateStyleHint();
      updateSurfaceHint();
      updateLightingHint();
      updateHumanScaleHint();
      updateAdvancedState();
      generate(false);

      global.dispatchEvent(new CustomEvent("promptgen:architecturalsketchrandomized", {
        detail: { state: serializeState(), prompt: elements.output?.value || "" }
      }));
      showMessage("Concept Random created a compatible variation. Manual choices were preserved.");
    } finally {
      smartDefaults.applying = false;
      sketchRandomState.applying = false;
    }
  }

  function resetSmartDefaultState() {
    smartDefaults.surfaceTouched = false;
    smartDefaults.lightingTouched = false;
    smartDefaults.viewTouched = false;
    smartDefaults.restoring = false;
    smartDefaults.applying = false;
    sketchRandomState.applying = false;
    sketchRandomState.manualFields.clear();
  }

  function withSmartApply(callback) {
    smartDefaults.applying = true;
    try {
      callback();
    } finally {
      smartDefaults.applying = false;
    }
  }

  function firstRecommendedSurface() {
    return String(selectedMeta(elements.archSketchStyle, "recommendedSurface") || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)[0] || "";
  }

  function recommendedLightingForScene() {
    return selectedMeta(elements.archSketchSceneType, "recommendedLighting") || "";
  }

  function recommendedHumanForStyle() {
    return selectedMeta(elements.archSketchStyle, "recommendedHuman") || "";
  }

  function syncSearchableControl(id) {
    searchable.get(id)?.syncFromNative?.();
  }

  function applyRecommendedSurface({ force = false } = {}) {
    if (!force && smartDefaults.surfaceTouched) return false;
    const recommended = firstRecommendedSurface();
    const fallback = database?.config?.defaultArchitecturalSketchMedium || "watercolor-paper";
    withSmartApply(() => setValue(elements.archSketchMedium, recommended || fallback));
    syncSearchableControl("archSketchMedium");
    return true;
  }

  function applyRecommendedLighting({ force = false } = {}) {
    if (!force && smartDefaults.lightingTouched) return false;
    const recommended = recommendedLightingForScene();
    const fallback = database?.config?.defaultArchitecturalSketchLighting || "morning-light";
    withSmartApply(() => setValue(elements.archSketchLighting, recommended || fallback));
    syncSearchableControl("archSketchLighting");
    return true;
  }

  function applyDefaults() {
    const config = database?.config || {};
    setValue(elements.archSketchInputType, config.defaultArchitecturalSketchInputType || "concept-prompt");
    setValue(elements.archSketchOutputRepresentation, config.defaultArchitecturalSketchOutputRepresentation || "sketch-presentation");
    setValue(elements.archSketchPhotoRealismTarget, config.defaultArchitecturalSketchPhotoRealismTarget || "hyper-real-architectural-photo");
    setValue(elements.archSketchTextSignagePolicy, config.defaultArchitecturalSketchTextSignagePolicy || "no-invented-text");
    setValue(elements.archSketchBuildingCategory, config.defaultArchitecturalBuildingCategory || "");
    updateBuildingTypeOptions({ selectedId: "" });
    setValue(elements.archSketchStyleCategory, config.defaultArchitecturalStyleCategory || "");
    updateArchitectureStyleOptions({ selectedId: "" });
    setValue(elements.archSketchSceneType, config.defaultArchitecturalSketchSceneType || "exterior");
    setValue(elements.archSketchStyle, config.defaultArchitecturalSketchStyle || "watercolor-sketch");
    applyRecommendedSurface({ force: true });
    setValue(elements.archSketchLineQuality, config.defaultArchitecturalSketchLineQuality || "auto-follow-style");
    setValue(elements.archSketchColorTreatment, config.defaultArchitecturalSketchColorTreatment || "auto-follow-style");
    applyRecommendedLighting({ force: true });
    setValue(elements.archSketchMood, config.defaultArchitecturalSketchMood || "calm");
    setValue(elements.archSketchHumanScale, config.defaultArchitecturalSketchHumanScale || "none");
    setValue(elements.archSketchAnnotationText, config.defaultArchitecturalSketchAnnotationText || "no-text");
    updateViewOptions({ applySceneDefault: true });
    setValue(elements.archSketchAspectRatio, config.defaultArchitecturalSketchAspectRatio || "4:5");
    updateRepresentationUi();
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

  function viewAppliesToRepresentation(item) {
    return !isPhotographyRepresentation() || !NON_PHOTOGRAPHIC_VIEW_IDS.has(item?.id);
  }

  function updateViewOptions({ applySceneDefault = false, preferredValue = "" } = {}) {
    if (!elements.archSketchCameraView || !options) return;

    const sceneId = elements.archSketchSceneType?.value || database?.config?.defaultArchitecturalSketchSceneType || "exterior";
    const previous = preferredValue || elements.archSketchCameraView.value;
    const eligible = (options.cameraViews || []).filter(item => viewAppliesToScene(item, sceneId));

    populateSelect(elements.archSketchCameraView, eligible);

    const preferred = applySceneDefault ? sceneDefaultView(sceneId) : previous;
    setValue(elements.archSketchCameraView, preferred);

    if (!elements.archSketchCameraView.value) {
      setValue(elements.archSketchCameraView, sceneDefaultView(sceneId));
    }
    if (!elements.archSketchCameraView.value && eligible[0]) {
      elements.archSketchCameraView.value = eligible[0].id;
    }

    const control = searchable.get("archSketchCameraView");
    control?.refresh?.();
    control?.syncFromNative?.();
  }

  function resolveViewForScene(value, sceneId) {
    const aliased = LEGACY_VIEW_ALIASES[value] || value;
    const eligible = (options?.cameraViews || []).filter(item =>
      viewAppliesToScene(item, sceneId) && viewAppliesToRepresentation(item)
    );
    if (eligible.some(item => item.id === aliased)) return aliased;
    return sceneDefaultView(sceneId);
  }

  function initSearchable() {
    [
      "archSketchInputType", "archSketchOutputRepresentation", "archSketchBuildingCategory", "archSketchBuildingType",
      "archSketchSceneType", "archSketchStyle", "archSketchMedium", "archSketchPhotoRealismTarget", "archSketchTextSignagePolicy",
      "archSketchStyleCategory", "archSketchArchitectureStyle",
      "archSketchLineQuality", "archSketchColorTreatment", "archSketchLighting", "archSketchMood",
      "archSketchHumanScale", "archSketchCameraView", "archSketchAnnotationText", "archSketchAspectRatio"
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

  function isPhotographyRepresentation() {
    return elements.archSketchOutputRepresentation?.value === "architectural-photography";
  }

  function updateRepresentationUi() {
    const photography = isPhotographyRepresentation();
    if (elements.archSketchStyleRow) elements.archSketchStyleRow.hidden = photography;
    if (elements.archSketchMediumRow) elements.archSketchMediumRow.hidden = photography;
    if (elements.archSketchPhotoRealismTargetRow) elements.archSketchPhotoRealismTargetRow.hidden = !photography;
    if (elements.archSketchTextSignagePolicyRow) elements.archSketchTextSignagePolicyRow.hidden = !photography;
    if (elements.archSketchAdvanced) {
      elements.archSketchAdvanced.hidden = photography;
      if (photography) elements.archSketchAdvanced.open = false;
    }
    if (elements.archSketchAnnotationTextRow) elements.archSketchAnnotationTextRow.hidden = photography;
    document.body.classList.toggle("architectural-photography-output", photography);
    updateTextSignagePolicyUi();
    updateHumanScaleOptions({ preferredValue: elements.archSketchHumanScale?.value || "" });
    updateViewOptions({ preferredValue: elements.archSketchCameraView?.value || "" });
    updateRepresentationHints();

    if (elements.randomPromptBtn && active) {
      elements.randomPromptBtn.innerHTML = `${global.PromptIcons.svg("refresh")}<span class="button-label">Concept Random</span>`;
    }
    if (elements.randomModeTitle && active) elements.randomModeTitle.textContent = "Smart Concept";
    if (elements.randomModeHint && active) {
      elements.randomModeHint.textContent = "Randomizes untouched architectural concept controls while preserving your manual choices and selected output representation.";
    }
    if (elements.outputTipTitle && active) {
      elements.outputTipTitle.textContent = photography ? "Architectural photography tip" : "Architectural sketch tip";
    }
    if (elements.outputTipText && active) {
      elements.outputTipText.textContent = photography
        ? "Photo Realism Target controls the photographic language. Text / Signage Policy prevents invented lettering without automatically deleting supported reference signage."
        : "Sketch Style controls the default line and color language. Keep Advanced Style Controls on Auto unless you deliberately want a line or color override.";
    }
  }

  function updateRepresentationHints() {
    if (!elements.archSketchOutputRepresentationHint) return;
    const description = selectedMeta(elements.archSketchOutputRepresentation, "description");
    elements.archSketchOutputRepresentationHint.textContent = description
      || (isPhotographyRepresentation()
        ? "Architectural Photography uses camera-compatible views and hides sketch-only presentation controls."
        : "Sketch Presentation enables drawing style, surface, line/color, and annotation controls.");
  }

  function updatePhotoRealismHint() {
    if (!elements.archSketchPhotoRealismTargetHint) return;
    const description = selectedMeta(elements.archSketchPhotoRealismTarget, "description");
    elements.archSketchPhotoRealismTargetHint.textContent = description
      || "Controls photographic character only; architecture, lighting, atmosphere, and view remain separate.";
  }

  function updateFeatureHint() {
    if (!elements.archSketchFeaturesHint) return;
    const reference = elements.archSketchInputType?.value === "reference-image";
    elements.archSketchFeaturesHint.textContent = reference
      ? "Reference-aware: only emphasize architectural features already visible or supported by the reference. Do not use this field to add or redesign elements."
      : "Use this for specific elements you want the concept to include or emphasize, such as a canopy, screen, courtyard, colonnade, or roof feature.";
  }

  function updateViewHint() {
    if (!elements.archSketchCameraViewHint) return;
    const description = selectedMeta(elements.archSketchCameraView, "description");
    const modeNote = isPhotographyRepresentation()
      ? " Photography hides axonometric, orthographic, section, and other non-camera projections."
      : " Options are filtered by Scene Type.";
    elements.archSketchCameraViewHint.textContent =
      (description || "Choose how the architecture is viewed or projected.") + modeNote;
  }

  function updateAnnotationHint() {
    if (!elements.archSketchAnnotationTextHint) return;
    const description = selectedMeta(elements.archSketchAnnotationText, "description");
    elements.archSketchAnnotationTextHint.textContent = description
      || "Controls sketch annotations only. The default clean mode suppresses generated text and signage.";
  }

  function updateHumanScaleOptions({ preferredValue = "" } = {}) {
    if (!elements.archSketchHumanScale || !options) return;
    const previous = preferredValue || elements.archSketchHumanScale.value;
    const eligible = isPhotographyRepresentation()
      ? (options.humanScale || []).filter(item => !NON_PHOTOGRAPHIC_HUMAN_IDS.has(item.id))
      : (options.humanScale || []);

    populateSelect(elements.archSketchHumanScale, eligible);
    setValue(elements.archSketchHumanScale, previous);
    if (!elements.archSketchHumanScale.value) setValue(elements.archSketchHumanScale, "none");

    const control = searchable.get("archSketchHumanScale");
    control?.refresh?.();
    control?.syncFromNative?.();
  }

  function updateWorkflowHint() {
    if (!elements.archSketchWorkflowHint) return;
    const reference = elements.archSketchInputType?.value === "reference-image";
    elements.archSketchWorkflowHint.textContent = reference
      ? "Concept Builder uses the reference as a design basis but still allows selected style, representation, and view development. For exact geometry and source-view preservation, use Architectural Render."
      : "Concept-first workflow for developing a new idea or brief. Use Architectural Render when an existing design must be preserved with explicit fidelity control.";
  }

  function updateTextSignagePolicyUi() {
    if (!elements.archSketchTextSignagePolicy) return;
    const reference = elements.archSketchInputType?.value === "reference-image";
    const preserveOption = [...elements.archSketchTextSignagePolicy.options]
      .find(option => option.value === "preserve-reference-text");

    if (preserveOption) preserveOption.disabled = !reference;

    if (!reference && elements.archSketchTextSignagePolicy.value === "preserve-reference-text") {
      setValue(
        elements.archSketchTextSignagePolicy,
        database?.config?.defaultArchitecturalSketchTextSignagePolicy || "no-invented-text"
      );
    }

    const control = searchable.get("archSketchTextSignagePolicy");
    control?.refresh?.();
    control?.syncFromNative?.();

    if (elements.archSketchTextSignageHint) {
      const policyDescription = selectedMeta(elements.archSketchTextSignagePolicy, "description");
      const compatibility = reference
        ? " Preserve Reference Signage / Text is available when exact reference wording matters."
        : " Preserve Reference Signage / Text is unavailable without a reference image.";
      elements.archSketchTextSignageHint.textContent =
        (policyDescription || "Choose how architectural text and signage should be handled.") + compatibility;
    }
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

  function updateLightingHint() {
    if (!elements.archSketchLightingHint) return;
    const recommendedId = recommendedLightingForScene();
    const sceneLabel = selectedLabel(elements.archSketchSceneType) || "this scene";
    const recommended = (options?.lighting || []).find(item => item.id === recommendedId);
    if (!recommended) {
      elements.archSketchLightingHint.textContent = "Choose lighting independently for the selected scene.";
      return;
    }
    const current = elements.archSketchLighting?.value || "";
    elements.archSketchLightingHint.textContent = current === recommendedId
      ? `Recommended for ${sceneLabel}: ${recommended.label || recommended.id}. Current lighting is a recommended match.`
      : `Recommended for ${sceneLabel}: ${recommended.label || recommended.id}. You can still choose any lighting.`;
  }

  function updateHumanScaleHint() {
    if (!elements.archSketchHumanScaleHint) return;
    if (isPhotographyRepresentation()) {
      elements.archSketchHumanScaleHint.textContent = "Optional human presence for believable architectural scale; keep people visually secondary to the architecture.";
      return;
    }
    const recommendedId = recommendedHumanForStyle();
    const styleLabel = selectedLabel(elements.archSketchStyle) || "this sketch style";
    const recommended = (options?.humanScale || []).find(item => item.id === recommendedId);
    if (!recommended) {
      elements.archSketchHumanScaleHint.textContent = "Controls human presence only for architectural scale; mood, clothing, location, and narrative activity remain separate.";
      return;
    }
    const current = elements.archSketchHumanScale?.value || "";
    elements.archSketchHumanScaleHint.textContent = current === recommendedId
      ? `Recommended for ${styleLabel}: ${recommended.label || recommended.id}. Current selection is a recommended match.`
      : `Recommended for ${styleLabel}: ${recommended.label || recommended.id}. You can still choose any option.`;
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
      outputRepresentation: elements.archSketchOutputRepresentation.value || "sketch-presentation",
      outputRepresentationPrompt: selectedPrompt(elements.archSketchOutputRepresentation),
      photoRealismTarget: elements.archSketchPhotoRealismTarget.value,
      photoRealismTargetPrompt: selectedPrompt(elements.archSketchPhotoRealismTarget),
      textSignagePolicy: elements.archSketchTextSignagePolicy.value,
      textSignagePolicyPrompt: selectedPrompt(elements.archSketchTextSignagePolicy),
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
      architectureStyleSemanticProfile: global.ArchitecturalTaxonomy.selectedSemanticProfile(
        elements.archSketchArchitectureStyle,
        taxonomy?.styleOptions || []
      ),
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
      annotationText: elements.archSketchAnnotationText.value,
      annotationTextPrompt: selectedPrompt(elements.archSketchAnnotationText),
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
    if (elements.randomPromptBtn) {
      elements.randomPromptBtn.hidden = false;
      elements.randomPromptBtn.innerHTML = `${global.PromptIcons.svg("refresh")}<span class="button-label">Concept Random</span>`;
    }

    if (elements.activeModeBadge) {
      elements.activeModeBadge.textContent = "Architectural Concept Builder";
      elements.activeModeBadge.dataset.mode = MODE_ID;
    }
    updateRepresentationUi();
    updateRepresentationHints();
    updateTaxonomyUi();
    updateFeatureHint();
    updatePhotoRealismHint();
    updateTextSignagePolicyUi();
    updateViewHint();
    updateAnnotationHint();
    updateStyleHint();
    updateSurfaceHint();
    updateLightingHint();
    updateHumanScaleHint();
    updateAdvancedState();

    elements.promptModeGrid.querySelectorAll("[data-prompt-mode-id]").forEach(card => {
      const on = card.dataset.promptModeId === MODE_ID;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });

    generate(false);
    global.dispatchEvent(new CustomEvent("promptgen:modechange", { detail: { mode: MODE_ID } }));
    if (notify) showMessage("Architectural Concept Builder selected.");
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
    resetSmartDefaultState();
    applyDefaults();
    searchable.forEach(control => control.syncFromNative?.());
    if (elements.archSketchAdvanced) elements.archSketchAdvanced.open = false;
    updateStyleHint();
    updateSurfaceHint();
    updateLightingHint();
    updateHumanScaleHint();
    updateAdvancedState();
    generate(false);
    showMessage("Architectural Concept form reset.");
  }

  function serializeState() {
    const resolved = collectState();
    return {
      archSketchInputType: elements.archSketchInputType.value,
      archSketchOutputRepresentation: elements.archSketchOutputRepresentation.value,
      archSketchPhotoRealismTarget: elements.archSketchPhotoRealismTarget.value,
      archSketchTextSignagePolicy: elements.archSketchTextSignagePolicy.value,
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
      archSketchAnnotationText: elements.archSketchAnnotationText.value,
      archSketchAspectRatio: elements.archSketchAspectRatio.value,
      archSketchExtraInstruction: elements.archSketchExtraInstruction.value
    };
  }

  function restoreState(state = {}) {
    const missing = [];
    smartDefaults.restoring = true;
    setSelect("archSketchInputType", state.archSketchInputType, missing, "Input Type");
    setSelect(
      "archSketchOutputRepresentation",
      state.archSketchOutputRepresentation || database?.config?.defaultArchitecturalSketchOutputRepresentation || "sketch-presentation",
      missing,
      "Output Representation"
    );
    setSelect(
      "archSketchPhotoRealismTarget",
      state.archSketchPhotoRealismTarget || database?.config?.defaultArchitecturalSketchPhotoRealismTarget || "hyper-real-architectural-photo",
      missing,
      "Photo Realism Target"
    );
    setSelect(
      "archSketchTextSignagePolicy",
      state.archSketchTextSignagePolicy || database?.config?.defaultArchitecturalSketchTextSignagePolicy || "no-invented-text",
      missing,
      "Text / Signage Policy"
    );
    updateRepresentationUi();
    updateWorkflowHint();

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
    const restoredHumanScale = LEGACY_HUMAN_SCALE_ALIASES[state.archSketchHumanScale] || state.archSketchHumanScale;
    const compatibleHumanScale = isPhotographyRepresentation() && NON_PHOTOGRAPHIC_HUMAN_IDS.has(restoredHumanScale)
      ? "none"
      : restoredHumanScale;
    setSelect("archSketchHumanScale", compatibleHumanScale || database?.config?.defaultArchitecturalSketchHumanScale || "none", missing, "Human Presence / Scale");
    const restoredView = resolveViewForScene(state.archSketchCameraView, elements.archSketchSceneType.value || "exterior");
    updateViewOptions({ preferredValue: restoredView });
    setSelect("archSketchCameraView", restoredView, missing, "View / Projection");
    setSelect("archSketchAnnotationText", state.archSketchAnnotationText || database?.config?.defaultArchitecturalSketchAnnotationText || "no-text", missing, "Annotations / Text");
    setSelect("archSketchAspectRatio", state.archSketchAspectRatio, missing, "Aspect Ratio");
    setText("archSketchExtraInstruction", state.archSketchExtraInstruction);
    searchable.forEach(control => control.syncFromNative?.());
    sketchRandomState.manualFields.clear();
    [
      ["archSketchInputType", state.archSketchInputType],
      ["archSketchOutputRepresentation", state.archSketchOutputRepresentation],
      ["archSketchPhotoRealismTarget", state.archSketchPhotoRealismTarget],
      ["archSketchTextSignagePolicy", state.archSketchTextSignagePolicy],
      ["archSketchBuildingCategory", state.archSketchBuildingCategory],
      ["archSketchBuildingType", state.archSketchBuildingType],
      ["archSketchCustomBuildingType", state.archSketchCustomBuildingType],
      ["archSketchSceneType", state.archSketchSceneType],
      ["archSketchStyleCategory", state.archSketchStyleCategory],
      ["archSketchArchitectureStyle", state.archSketchArchitectureStyleId || state.archSketchArchitectureStyle],
      ["archSketchCustomArchitectureStyle", state.archSketchCustomArchitectureStyle],
      ["archSketchStyle", state.archSketchStyle],
      ["archSketchMedium", state.archSketchMedium],
      ["archSketchLineQuality", state.archSketchLineQuality],
      ["archSketchColorTreatment", state.archSketchColorTreatment],
      ["archSketchLighting", state.archSketchLighting],
      ["archSketchMood", state.archSketchMood],
      ["archSketchLandscape", state.archSketchLandscape],
      ["archSketchFeatures", state.archSketchFeatures],
      ["archSketchHumanScale", state.archSketchHumanScale],
      ["archSketchCameraView", state.archSketchCameraView],
      ["archSketchAnnotationText", state.archSketchAnnotationText],
      ["archSketchAspectRatio", state.archSketchAspectRatio],
      ["archSketchExtraInstruction", state.archSketchExtraInstruction]
    ].forEach(([id, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        sketchRandomState.manualFields.add(id);
      }
    });

    smartDefaults.restoring = false;
    smartDefaults.surfaceTouched = true;
    smartDefaults.lightingTouched = true;
    smartDefaults.viewTouched = true;
    updateStyleHint();
    updateSurfaceHint();
    updateLightingHint();
    updateHumanScaleHint();
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
    const photography = state.outputRepresentation === "architectural-photography";
    const labels = photography
      ? ["Project", "Architecture", "Photo", "Realism", "Atmosphere"]
      : ["Project", "Architecture", "Sketch", "Surface", "Atmosphere"];
    const ready = [
      Boolean(state.projectType || state.inputType),
      Boolean(state.architectureStyle || state.sceneType),
      photography ? Boolean(state.outputRepresentation) : Boolean(state.sketchStyle),
      photography ? Boolean(state.photoRealismTarget) : Boolean(state.medium && state.lineQuality),
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
