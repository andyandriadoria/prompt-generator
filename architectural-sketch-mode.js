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
      {id:"refined-line-drawing",label:"Clean Facade Line Sketch",description:"Clean, controlled facade or elevation-style sketch with crisp architectural ink linework and generous white space.",prompt:"a clean architectural facade line sketch with refined black ink linework, precise proportions, restrained hatching, and generous white-paper negative space",line_rule:"Use crisp controlled outlines with a clear but restrained line hierarchy. Keep construction marks minimal and secondary.",color_rule:"Keep color subordinate to the linework. If a color treatment is selected, use it only as a light architectural accent rather than a full painted layer.",avoid:"Avoid graphite-heavy shading, dense pencil texture, photorealistic rendering, CGI, and polished 3D archviz."},
      {id:"loose-pencil",label:"Loose Concept Sketch",description:"Exploratory architect-style ideation sketch with loose construction lines, gesture, and spontaneous design-study energy.",prompt:"a loose conceptual architectural sketch with exploratory hand-drawn lines, visible construction guides, quick gestural strokes, simplified entourage, and intentional sketch imperfections",line_rule:"Allow construction lines, overlaps, guide marks, and varied stroke pressure to remain visible. Prioritize concept clarity over polished finish.",color_rule:"Keep color minimal unless a color treatment is selected; any added wash should remain loose and secondary to the exploratory linework.",avoid:"Avoid polished finished-render appearance, dense photoreal shading, CGI, and overly clean computer-generated edges."},
      {id:"pen-ink",label:"Bold Ink Perspective Sketch",description:"Strong pen-and-ink architectural perspective with bold contours, crosshatching, and presentation-sketch contrast.",prompt:"a bold pen-and-ink architectural perspective sketch with strong contour weight, expressive crosshatching, selective dark accents, and confident presentation-oriented composition",line_rule:"Use stronger foreground contours, decisive architectural edges, and expressive hatch patterns to describe depth, shadow, materials, and planting.",color_rule:"Keep ink dominant. If color is selected, apply only restrained washes or accents that do not weaken the bold pen-and-ink character.",avoid:"Avoid soft graphite rendering, airbrushed digital painting, photorealistic textures, CGI, and 3D-render sheen."},
      {id:"watercolor-sketch",label:"Soft Watercolor Architectural Sketch",description:"Fine architectural ink linework with transparent watercolor washes, visible white paper, and a professional hand-rendered presentation feel.",prompt:"a soft watercolor architectural presentation sketch with fine ink outlines, visible hand-drawn construction traces, transparent layered watercolor washes, and generous areas of clean white paper",line_rule:"Keep the architectural ink drawing clearly visible beneath the watercolor. Use fine-to-medium line weight and avoid heavy black fill or dense graphite shading.",color_rule:"Use transparent, soft, natural watercolor washes with restrained saturation. Preserve white paper between washes and allow slight pigment variation and imperfect hand-painted edges.",avoid:"Do not collapse into monochrome graphite or grayscale. Avoid heavy pencil shading, opaque digital painting, photorealism, CGI, and polished 3D visualization."},
      {id:"concept-presentation",label:"Minimal Color Perspective Sketch",description:"Airy contemporary architecture sketch with light linework, selective muted color blocks, and abundant white background.",prompt:"a minimalist architectural perspective sketch with light refined linework, airy white-paper composition, selective muted color blocks, and contemporary presentation-board clarity",line_rule:"Use delicate architectural outlines, sparse construction guides, and only enough line weight to establish depth and key forms.",color_rule:"Apply color selectively to focal materials, furniture, vegetation, or surfaces while leaving large areas of white paper untouched.",avoid:"Avoid dense hatching, heavy graphite tone, fully painted coverage, photorealistic rendering, CGI, and saturated illustration."},
      {id:"marker-sketch",label:"Marker Presentation Sketch",description:"Professional architecture marker sketch with ink outlines, broad tonal strokes, and controlled presentation-studio color.",prompt:"a professional architectural marker presentation sketch with clean ink outlines, broad marker tonal strokes, layered shadow blocks, and restrained studio-presentation color",line_rule:"Keep clear ink contours and readable architectural edges while allowing confident marker strokes and simplified tonal masses.",color_rule:"Use marker-like color blocks with restrained saturation, visible stroke character, and clear white-paper breathing space.",avoid:"Avoid photorealistic materials, smooth airbrushed gradients, CGI, digital-render perfection, and overly dense full-page color."},
      {id:"urban-sketch",label:"Urban Observational Sketch",description:"Lively observational architecture sketch with expressive linework, simplified context, and selective urban color.",prompt:"an urban observational architectural sketch with lively hand-drawn ink lines, simplified surrounding context, expressive vegetation and people, and selective location-inspired color",line_rule:"Use lively varied strokes and quick descriptive marks rather than rigid technical precision. Keep the architecture clearly readable.",color_rule:"Use selective natural washes or accents to suggest atmosphere and context while retaining a sketchbook character.",avoid:"Avoid sterile CAD-like lines, photorealistic rendering, CGI, and over-finished architectural visualization."},
      {id:"mixed-media",label:"Marker / Mixed Media Sketch",description:"Layered architecture presentation sketch combining ink, construction lines, marker blocks, and soft wash accents.",prompt:"a mixed-media architectural presentation sketch combining ink outlines, loose construction marks, marker tonal blocks, and restrained watercolor-style accents",line_rule:"Layer precise architectural lines with looser secondary marks so the drawing feels intentionally hand-built rather than digitally flattened.",color_rule:"Combine marker blocks and soft washes selectively, preserving visible linework and white-paper negative space.",avoid:"Avoid photorealistic rendering, glossy CGI surfaces, fully opaque digital painting, and uniform computer-generated linework."}
    ],
    media: [
      {id:"white-sketchbook-paper",label:"White Presentation Paper",prompt:"clean white architectural presentation paper with only a very subtle natural grain; keep the paper texture secondary to the drawing"},
      {id:"cream-toned-paper",label:"Cream Toned Paper",prompt:"warm cream-toned architectural drawing paper with a subtle refined texture"},
      {id:"tracing-paper",label:"Tracing Paper",prompt:"translucent architectural tracing paper with layered sketch character and faint underlying guide lines"},
      {id:"watercolor-paper",label:"Watercolor Paper",prompt:"lightly textured watercolor paper with subtle tooth and natural wash absorption, without an exaggerated paper-grain effect"},
      {id:"marker-paper",label:"Marker Paper",prompt:"smooth professional marker paper with clean white space and controlled ink-and-marker response"},
      {id:"presentation-board",label:"Presentation Board Style",prompt:"a clean white architectural presentation-board surface with restrained studio-sketch character"}
    ],
    lineQualities: [
      {id:"clean-technical",label:"Crisp Technical",prompt:"crisp disciplined architectural linework with precise edges and restrained construction marks"},
      {id:"balanced-line-weight",label:"Refined Hand-Drawn",prompt:"refined hand-drawn architectural linework with natural variation and a controlled presentation-quality hierarchy"},
      {id:"expressive-hand-drawn",label:"Loose Expressive",prompt:"loose expressive hand-drawn lines with visible gesture, overlap, varied pressure, and controlled imperfection"},
      {id:"soft-loose-lines",label:"Soft Loose Lines",prompt:"soft loose sketch lines with light construction strokes and relaxed architectural definition"},
      {id:"bold-sketchy",label:"Bold Sketchy",prompt:"bold energetic sketch lines with strong contour emphasis, expressive hatching, and visible stroke character"},
      {id:"delicate-fine-line",label:"Delicate Fine Line",prompt:"delicate fine architectural lines with elegant detail, light hierarchy, and minimal visual heaviness"}
    ],
    colorTreatments: [
      {id:"black-white",label:"Black & White",prompt:"black-and-white ink drawing treatment with no added color"},
      {id:"warm-gray-monochrome",label:"Monochrome Warm Gray",prompt:"warm-gray monochrome shading with subtle tonal variation and preserved white-paper areas"},
      {id:"soft-muted-color-wash",label:"Soft Muted Color Wash",prompt:"soft muted color washes applied selectively over the linework with restrained saturation and visible white paper"},
      {id:"watercolor-tint",label:"Full Soft Watercolor",prompt:"soft transparent watercolor color across the key architectural and environmental elements while keeping the linework visible and the paper airy"},
      {id:"marker-accent-color",label:"Selective Accent Color",prompt:"mostly neutral sketch rendering with controlled accent colors applied only to selected focal surfaces, furniture, vegetation, or architectural elements"},
      {id:"light-natural-color",label:"Light Natural Color",prompt:"light natural color rendering with restrained saturation, subtle material cues, and preserved hand-sketched character"}
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
      "archSketchExtraInstruction", "archSketchStyleHint", "archSketchTip"
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
      <div class="field-row"><label for="archSketchStyle">Sketch Style</label><div><select id="archSketchStyle"></select><p class="help-text arch-sketch-style-hint" id="archSketchStyleHint"></p></div></div>
      <div class="field-row"><label for="archSketchLineQuality">Line Character</label><select id="archSketchLineQuality"></select></div>
      <div class="field-row"><label for="archSketchColorTreatment">Sketch Color Mode</label><select id="archSketchColorTreatment"></select></div>
      <div class="field-row"><label for="archSketchMedium">Paper / Medium</label><select id="archSketchMedium"></select></div>
      <div class="field-row"><label for="archSketchArchitectureStyle">Architecture Style</label><input id="archSketchArchitectureStyle" type="text" placeholder="Example: tropical modern, contemporary minimalist, Mediterranean, Japandi"></div>
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
    elements.architecturalSketchFields.addEventListener("change", event => {
      if (event.target === elements.archSketchStyle) updateStyleHint();
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
    updateStyleHint();
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
      option.dataset.id = item.id || "";
      select.append(option);
    });
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }

  function applyDefaults() {
    const config = database?.config || {};
    setValue(elements.archSketchInputType, config.defaultArchitecturalSketchInputType || "concept-prompt");
    setValue(elements.archSketchSceneType, config.defaultArchitecturalSketchSceneType || "exterior");
    setValue(elements.archSketchStyle, config.defaultArchitecturalSketchStyle || "watercolor-sketch");
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

  function selectedMeta(select, key) {
    return select?.selectedOptions?.[0]?.dataset?.[key] || "";
  }

  function updateStyleHint() {
    if (!elements.archSketchStyleHint) return;
    const description = selectedMeta(elements.archSketchStyle, "description");
    elements.archSketchStyleHint.textContent = description || "Choose the visual sketch language; line character and color mode refine it further.";
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
      sketchStyleLineRule: selectedMeta(elements.archSketchStyle, "lineRule"),
      sketchStyleColorRule: selectedMeta(elements.archSketchStyle, "colorRule"),
      sketchStyleAvoid: selectedMeta(elements.archSketchStyle, "avoid"),
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
    if (elements.randomModeHint) elements.randomModeHint.textContent = "Choose a sketch family first, then refine line character, color, medium, context, and view";
    if (elements.outputTipTitle) elements.outputTipTitle.textContent = "Architectural sketch tip";
    if (elements.outputTipText) elements.outputTipText.textContent = "Sketch Style is the main visual controller. Watercolor, ink, concept, marker, and line-sketch families use different prompt behavior; Line Character and Sketch Color Mode refine the selected family.";
    updateStyleHint();

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
    updateStyleHint();
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
