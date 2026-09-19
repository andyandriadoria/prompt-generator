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
    inputTypes: [
      {id:"concept-prompt",label:"Concept Prompt",prompt:"Create the architectural sketch from the described concept and selected design directions."},
      {id:"reference-image",label:"Reference Image / Existing Design",prompt:"Use the provided architectural reference image as the design basis. Preserve the main architectural form, massing, proportions, openings, and overall spatial composition while translating it into a sketch-style architectural presentation."},
      {id:"design-brief",label:"Design Brief / Idea",prompt:"Translate the supplied architectural design brief or idea into a coherent architectural sketch presentation with believable form, proportion, and spatial logic."}
    ],
    sceneTypes: [
      {id:"exterior",label:"Exterior",prompt:"an exterior architectural view"},
      {id:"interior",label:"Interior",prompt:"an interior architectural view"}
    ],
    sketchStyles: [
      {id:"loose-pencil",label:"Loose Pencil Sketch",prompt:"a loose hand-drawn pencil architectural sketch with exploratory construction lines and expressive strokes"},
      {id:"refined-line-drawing",label:"Refined Architectural Line Drawing",prompt:"a refined architectural line drawing with controlled edges, clear spatial hierarchy, and professional presentation quality"},
      {id:"pen-ink",label:"Pen and Ink Sketch",prompt:"a pen-and-ink architectural sketch with crisp linework, selective hatching, and confident hand-drawn detail"},
      {id:"marker-sketch",label:"Marker Sketch",prompt:"an architectural marker sketch with clean linework, broad tonal markers, and presentation-studio character"},
      {id:"watercolor-sketch",label:"Watercolor Architectural Sketch",prompt:"a hand-drawn architectural sketch enhanced with transparent watercolor washes and restrained pigment variation"},
      {id:"concept-presentation",label:"Concept Presentation Sketch",prompt:"a polished architectural concept presentation sketch balancing design clarity with expressive hand-drawn character"},
      {id:"urban-sketch",label:"Urban Sketch Style",prompt:"an urban-sketch architectural illustration with lively observational linework, selective color, and natural context"},
      {id:"mixed-media",label:"Mixed Media Architectural Sketch",prompt:"a mixed-media architectural sketch combining linework, tonal shading, and restrained hand-rendered color accents"}
    ],
    media: [
      {id:"white-sketchbook-paper",label:"White Sketchbook Paper",prompt:"clean white sketchbook paper with subtle natural paper grain"},
      {id:"cream-toned-paper",label:"Cream Toned Paper",prompt:"warm cream-toned drawing paper with a refined natural texture"},
      {id:"tracing-paper",label:"Tracing Paper",prompt:"translucent architectural tracing paper with visible layered drawing character"},
      {id:"watercolor-paper",label:"Watercolor Paper",prompt:"textured watercolor paper with visible tooth and natural pigment absorption"},
      {id:"marker-paper",label:"Marker Paper",prompt:"smooth professional marker paper suitable for clean architectural presentation strokes"},
      {id:"presentation-board",label:"Presentation Board Style",prompt:"a clean architectural presentation-board surface with a refined studio-rendered sketch feel"}
    ],
    lineQualities: [
      {id:"clean-technical",label:"Clean Technical Linework",prompt:"precise, clean technical linework with disciplined edges and restrained construction marks"},
      {id:"balanced-line-weight",label:"Balanced Architectural Line Weight",prompt:"balanced architectural line weight with strong foreground hierarchy and lighter secondary detail"},
      {id:"expressive-hand-drawn",label:"Expressive Hand-Drawn Linework",prompt:"expressive hand-drawn linework with visible gesture, varied pressure, and controlled imperfection"},
      {id:"soft-loose-lines",label:"Soft Loose Sketch Lines",prompt:"soft loose sketch lines with light construction strokes and relaxed architectural definition"}
    ],
    colorTreatments: [
      {id:"black-white",label:"Black and White",prompt:"black-and-white drawing treatment with no added color"},
      {id:"warm-gray-monochrome",label:"Warm Gray Monochrome",prompt:"warm gray monochrome shading with restrained tonal depth"},
      {id:"soft-muted-color-wash",label:"Soft Muted Color Wash",prompt:"soft muted color washes applied selectively over the linework"},
      {id:"watercolor-tint",label:"Watercolor Tint",prompt:"transparent watercolor tinting with natural pigment variation"},
      {id:"marker-accent-color",label:"Marker Accent Color",prompt:"controlled marker accent colors used sparingly to emphasize key architectural elements"},
      {id:"light-natural-color",label:"Light Natural Color",prompt:"light naturalistic color rendering with restrained saturation and preserved sketch character"}
    ],
    lighting: [
      {id:"morning-light",label:"Morning Light",prompt:"soft morning light with gentle directional shadows"},
      {id:"midday",label:"Midday",prompt:"clear midday illumination with readable form and restrained contrast"},
      {id:"golden-hour",label:"Golden Hour",prompt:"warm golden-hour light with elongated soft-edged shadows"},
      {id:"overcast-day",label:"Overcast Day",prompt:"soft overcast daylight with diffuse shadows and calm tonal balance"},
      {id:"soft-interior-daylight",label:"Soft Interior Daylight",prompt:"soft interior daylight entering naturally through openings and windows"},
      {id:"evening-ambience",label:"Evening Ambience",prompt:"subtle evening ambience with warm architectural lighting accents"}
    ],
    moods: [
      {id:"calm",label:"Calm",prompt:"a calm and composed atmosphere"},
      {id:"cozy",label:"Cozy",prompt:"a warm, cozy, approachable atmosphere"},
      {id:"serene",label:"Serene",prompt:"a serene and tranquil architectural atmosphere"},
      {id:"rainy",label:"Rainy",prompt:"a gentle rainy atmosphere with subtle wet-surface cues"},
      {id:"moody",label:"Moody",prompt:"a moody atmospheric character with controlled contrast"},
      {id:"airy",label:"Airy",prompt:"an airy, light, open atmosphere"},
      {id:"dramatic",label:"Dramatic",prompt:"a dramatic presentation atmosphere with stronger tonal emphasis"},
      {id:"lively",label:"Lively",prompt:"a lively inhabited atmosphere while keeping the architecture visually dominant"}
    ],
    humanScale: [
      {id:"none",label:"None",prompt:""},
      {id:"minimal-scale-figures",label:"Minimal Scale Figures",prompt:"Include a few minimal human scale figures, kept visually secondary to the architecture."},
      {id:"silhouette-figures",label:"Silhouette Figures",prompt:"Include restrained human silhouettes to communicate scale without drawing attention away from the architecture."},
      {id:"casual-people-scale",label:"Casual People for Scale",prompt:"Include a small number of casually posed people to communicate believable architectural scale."}
    ],
    cameraViews: [
      {id:"eye-level-perspective",label:"Eye-Level Perspective",prompt:"an eye-level architectural perspective with natural human-scale viewpoint"},
      {id:"wide-perspective",label:"Wide Perspective View",prompt:"a wide architectural perspective showing the overall spatial composition clearly"},
      {id:"three-quarter-exterior",label:"Three-Quarter Exterior View",prompt:"a three-quarter exterior perspective revealing depth across two principal facades"},
      {id:"frontal-elevation",label:"Frontal Elevation-Like View",prompt:"a largely frontal elevation-like architectural view with controlled perspective depth"},
      {id:"interior-corner",label:"Interior Corner Perspective",prompt:"an interior corner perspective that clearly communicates depth, openings, and spatial relationships"},
      {id:"sketchbook-perspective",label:"Sketchbook Perspective",prompt:"a natural sketchbook-style perspective with slightly informal but believable architectural framing"}
    ]
  };

  const elements = {};
  const searchable = new Map();
  let database = null;
  let options = null;
  let active = false;
  let initialized = false;
  let observer = null;
  const requestedInitialMode = localStorage.getItem("promptGenPromptMode") || "";

  waitForDependencies();

  function waitForDependencies(attempt = 0) {
    if (global.PromptDataLoader && global.ArchitecturalSketchPromptBuilder && global.PromptIcons) return bootstrap();
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
      "architecturalSketchFields", "archSketchInputType", "archSketchProjectType", "archSketchSceneType",
      "archSketchArchitectureStyle", "archSketchStyle", "archSketchMedium", "archSketchLineQuality",
      "archSketchColorTreatment", "archSketchLighting", "archSketchMood", "archSketchLandscape",
      "archSketchFeatures", "archSketchHumanScale", "archSketchCameraView", "archSketchAspectRatio",
      "archSketchExtraInstruction", "archSketchTip"
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
      <div class="field-row"><label for="archSketchProjectType">Project Type</label><input id="archSketchProjectType" type="text" placeholder="Example: private residence, tropical villa, boutique café, mosque courtyard"></div>
      <div class="field-row"><label for="archSketchSceneType">Scene Type</label><select id="archSketchSceneType"></select></div>
      <div class="field-row"><label for="archSketchArchitectureStyle">Architecture Style</label><input id="archSketchArchitectureStyle" type="text" placeholder="Example: tropical modern, contemporary minimalist, Mediterranean, Japandi"></div>
      <div class="field-row"><label for="archSketchStyle">Sketch Style</label><select id="archSketchStyle"></select></div>
      <div class="field-row"><label for="archSketchMedium">Paper / Medium</label><select id="archSketchMedium"></select></div>
      <div class="field-row"><label for="archSketchLineQuality">Line Quality</label><select id="archSketchLineQuality"></select></div>
      <div class="field-row"><label for="archSketchColorTreatment">Color Treatment</label><select id="archSketchColorTreatment"></select></div>
      <div class="field-row"><label for="archSketchLighting">Lighting / Time</label><select id="archSketchLighting"></select></div>
      <div class="field-row"><label for="archSketchMood">Atmosphere / Mood</label><select id="archSketchMood"></select></div>
      <div class="field-row"><label for="archSketchLandscape">Landscape / Context <span class="optional-label">optional</span></label><textarea id="archSketchLandscape" class="short-textarea" placeholder="Example: restrained tropical planting, stone paving, reflective pond, urban sidewalk"></textarea></div>
      <div class="field-row"><label for="archSketchFeatures">Architectural Features <span class="optional-label">optional</span></label><textarea id="archSketchFeatures" class="short-textarea" placeholder="Example: deep overhang roof, vertical timber screens, arched openings, open courtyard"></textarea></div>
      <div class="field-row"><label for="archSketchHumanScale">Human Figure for Scale</label><select id="archSketchHumanScale"></select></div>
      <div class="field-row"><label for="archSketchCameraView">Camera / View</label><select id="archSketchCameraView"></select></div>
      <div class="field-row"><label for="archSketchAspectRatio">Aspect Ratio</label><select id="archSketchAspectRatio"></select></div>
      <div class="field-row"><label for="archSketchExtraInstruction">Extra Instruction <span class="optional-label">optional</span></label><textarea id="archSketchExtraInstruction" class="short-textarea" placeholder="Example: emphasize the entrance canopy; avoid excessive foliage; no text labels"></textarea></div>

      <div class="arch-sketch-tip" id="archSketchTip">
        <span>${global.PromptIcons.svg("drafting")}</span>
        <div><strong>Architectural sketch logic</strong><p>Line weight, paper character, rendering medium, and presentation hierarchy are built into the prompt. Reference Image mode preserves the main architecture while translating it into a hand-drawn sketch language.</p></div>
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
    elements.architecturalSketchFields.addEventListener("change", () => generate(false));

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
    populateSelect(elements.archSketchSceneType, options.sceneTypes);
    populateSelect(elements.archSketchStyle, options.sketchStyles);
    populateSelect(elements.archSketchMedium, options.media);
    populateSelect(elements.archSketchLineQuality, options.lineQualities);
    populateSelect(elements.archSketchColorTreatment, options.colorTreatments);
    populateSelect(elements.archSketchLighting, options.lighting);
    populateSelect(elements.archSketchMood, options.moods);
    populateSelect(elements.archSketchHumanScale, options.humanScale);
    populateSelect(elements.archSketchCameraView, options.cameraViews);

    elements.archSketchAspectRatio.innerHTML = "";
    (database.aspectRatios || []).forEach(item => {
      const value = item.value || item.label || item.id;
      const option = new Option(item.label || value, value);
      option.dataset.id = item.id || "";
      elements.archSketchAspectRatio.append(option);
    });

    applyDefaults();
    initSearchable();
    if (active) generate(false);
  }

  function populateSelect(select, items) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = "";
    (items || []).forEach(item => {
      const option = new Option(item.label || item.id, item.id);
      option.dataset.prompt = item.prompt || "";
      option.dataset.id = item.id || "";
      select.append(option);
    });
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }

  function applyDefaults() {
    const config = database?.config || {};
    setValue(elements.archSketchInputType, config.defaultArchitecturalSketchInputType || "concept-prompt");
    setValue(elements.archSketchSceneType, config.defaultArchitecturalSketchSceneType || "exterior");
    setValue(elements.archSketchStyle, config.defaultArchitecturalSketchStyle || "refined-line-drawing");
    setValue(elements.archSketchMedium, config.defaultArchitecturalSketchMedium || "white-sketchbook-paper");
    setValue(elements.archSketchLineQuality, config.defaultArchitecturalSketchLineQuality || "balanced-line-weight");
    setValue(elements.archSketchColorTreatment, config.defaultArchitecturalSketchColorTreatment || "soft-muted-color-wash");
    setValue(elements.archSketchLighting, config.defaultArchitecturalSketchLighting || "morning-light");
    setValue(elements.archSketchMood, config.defaultArchitecturalSketchMood || "calm");
    setValue(elements.archSketchHumanScale, config.defaultArchitecturalSketchHumanScale || "none");
    setValue(elements.archSketchCameraView, config.defaultArchitecturalSketchCameraView || "eye-level-perspective");
    setValue(elements.archSketchAspectRatio, config.defaultArchitecturalSketchAspectRatio || "4:5");
  }

  function initSearchable() {
    [
      "archSketchInputType", "archSketchSceneType", "archSketchStyle", "archSketchMedium",
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

  function collectState() {
    return {
      inputType: elements.archSketchInputType.value,
      inputPrompt: selectedPrompt(elements.archSketchInputType),
      projectType: elements.archSketchProjectType.value.trim(),
      sceneType: elements.archSketchSceneType.value,
      sceneLabel: selectedLabel(elements.archSketchSceneType),
      scenePrompt: selectedPrompt(elements.archSketchSceneType),
      architectureStyle: elements.archSketchArchitectureStyle.value.trim(),
      sketchStyle: elements.archSketchStyle.value,
      sketchStyleLabel: selectedLabel(elements.archSketchStyle),
      sketchStylePrompt: selectedPrompt(elements.archSketchStyle),
      medium: elements.archSketchMedium.value,
      mediumLabel: selectedLabel(elements.archSketchMedium),
      mediumPrompt: selectedPrompt(elements.archSketchMedium),
      lineQuality: elements.archSketchLineQuality.value,
      lineQualityPrompt: selectedPrompt(elements.archSketchLineQuality),
      colorTreatment: elements.archSketchColorTreatment.value,
      colorTreatmentPrompt: selectedPrompt(elements.archSketchColorTreatment),
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
    if (elements.randomModeHint) elements.randomModeHint.textContent = "Project, sketch style, medium, line hierarchy, color, context, and presentation";
    if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Architectural sketch tip";
    if (elements.outputTipText) elements.outputTipText.textContent = "Use this mode for concept sketches, presentation illustrations, and hand-drawn architectural visuals. Attach a reference image when Reference Image / Existing Design is selected.";

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
    elements.archSketchProjectType.value = "";
    elements.archSketchArchitectureStyle.value = "";
    elements.archSketchLandscape.value = "";
    elements.archSketchFeatures.value = "";
    elements.archSketchExtraInstruction.value = "";
    applyDefaults();
    searchable.forEach(control => control.syncFromNative?.());
    generate(false);
    showMessage("Architectural Sketch form reset.");
  }

  function serializeState() {
    return {
      archSketchInputType: elements.archSketchInputType.value,
      archSketchProjectType: elements.archSketchProjectType.value,
      archSketchSceneType: elements.archSketchSceneType.value,
      archSketchArchitectureStyle: elements.archSketchArchitectureStyle.value,
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
    setText("archSketchProjectType", state.archSketchProjectType);
    setSelect("archSketchSceneType", state.archSketchSceneType, missing, "Scene Type");
    setText("archSketchArchitectureStyle", state.archSketchArchitectureStyle);
    setSelect("archSketchStyle", state.archSketchStyle, missing, "Sketch Style");
    setSelect("archSketchMedium", state.archSketchMedium, missing, "Paper / Medium");
    setSelect("archSketchLineQuality", state.archSketchLineQuality, missing, "Line Quality");
    setSelect("archSketchColorTreatment", state.archSketchColorTreatment, missing, "Color Treatment");
    setSelect("archSketchLighting", state.archSketchLighting, missing, "Lighting / Time");
    setSelect("archSketchMood", state.archSketchMood, missing, "Atmosphere / Mood");
    setText("archSketchLandscape", state.archSketchLandscape);
    setText("archSketchFeatures", state.archSketchFeatures);
    setSelect("archSketchHumanScale", state.archSketchHumanScale, missing, "Human Figure for Scale");
    setSelect("archSketchCameraView", state.archSketchCameraView, missing, "Camera / View");
    setSelect("archSketchAspectRatio", state.archSketchAspectRatio, missing, "Aspect Ratio");
    setText("archSketchExtraInstruction", state.archSketchExtraInstruction);
    searchable.forEach(control => control.syncFromNative?.());
    generate(false);
    return { missing };
  }

  function updateDna(state) {
    if (!active) return;
    const labels = ["Project", "Architecture", "Sketch", "Medium", "Atmosphere"];
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
