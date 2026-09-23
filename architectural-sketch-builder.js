(function (global) {
  "use strict";

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sentence(value) {
    const text = clean(value);
    if (!text) return "";
    return /[.!?]$/.test(text) ? text : `${text}.`;
  }

  function isMonochrome(colorId) {
    return colorId === "black-white" || colorId === "warm-gray-monochrome";
  }

  function isAutoStyleControl(value) {
    return !value || value === "auto-follow-style";
  }

  function withIndefiniteArticle(value) {
    const text = clean(value);
    if (!text) return "an architectural concept";
    if (/^(?:a|an|the)\s+/i.test(text)) return text;
    return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`;
  }

  const NO_TEXT_GUARD = "Do not add any text, pseudo-text, labels, readable signage, logos, captions, handwritten notes, annotations, dates, signatures, watermarks, slogans, or decorative lettering anywhere in the image. If signage panels or signboards are part of the architecture, keep them completely blank with no characters, symbols, lettering, or invented marks.";
  const DEFAULT_PHOTO_TEXT_POLICY = "Do not invent new readable text, logos, brand names, storefront names, slogans, dates, signatures, or decorative lettering. If a provided reference contains existing legible architectural signage or text, preserve it only where visible and supported; otherwise keep sign panels neutral or blank rather than fabricating characters.";

  function build(state = {}) {
    const ratio = clean(state.aspectRatio) || "4:5";
    const projectType = clean(state.projectType) || "architectural concept";
    const scene = clean(state.scenePrompt) || clean(state.sceneLabel) || "architectural view";
    const architectureStyle = clean(state.architectureStyle);
    const inputPrompt = clean(state.inputPrompt);
    const outputRepresentation = clean(state.outputRepresentation) || "sketch-presentation";
    const isPhotography = outputRepresentation === "architectural-photography";
    const photoRealismTarget = clean(state.photoRealismTargetPrompt) || "hyper realistic photography";

    const stylePrompt = clean(state.sketchStylePrompt) || "a professional hand-drawn architectural presentation sketch";
    const styleLineRule = clean(state.sketchStyleLineRule);
    const styleColorRule = clean(state.sketchStyleColorRule);
    const styleAvoid = clean(state.sketchStyleAvoid);

    const surface = clean(state.mediumPrompt) || "clean white architectural presentation paper";
    const lineOverride = Boolean(state.lineQualityOverride) || !isAutoStyleControl(state.lineQuality);
    const colorOverride = Boolean(state.colorTreatmentOverride) || !isAutoStyleControl(state.colorTreatment);
    const lineQuality = lineOverride ? clean(state.lineQualityPrompt) : "";
    const colorTreatment = colorOverride ? clean(state.colorTreatmentPrompt) : "";

    const lighting = clean(state.lightingPrompt);
    const character = clean(state.moodPrompt);
    const siteContext = clean(state.landscape);
    const featureEmphasis = clean(state.features);
    const humanPresence = clean(state.humanScalePrompt);
    const camera = clean(state.cameraPrompt);
    const annotationMode = clean(state.annotationText) || "no-text";
    const annotationPrompt = clean(state.annotationTextPrompt);
    const photoTextPolicy = clean(state.textSignagePolicyPrompt) || DEFAULT_PHOTO_TEXT_POLICY;
    const extra = clean(state.extraInstruction);

    const opening = isPhotography
      ? `Create ${withIndefiniteArticle(photoRealismTarget)} of ${withIndefiniteArticle(projectType)} as ${scene} in a ${ratio} aspect ratio.`
      : `Create a hand-drawn architectural sketch of ${withIndefiniteArticle(projectType)} as ${scene} in a ${ratio} aspect ratio.`;

    const sourceBlock = state.inputType && state.inputType !== "concept-prompt"
      ? inputPrompt
      : "";

    const projectionTerm = global.ArchitecturePromptQuality?.projectionTerm?.(state.cameraView) || "perspective";
    const spatialDiscipline = projectionTerm === "projection"
      ? "Keep massing, proportions, openings, projection logic, and spatial relationships internally coherent"
      : "Keep massing, proportions, openings, perspective, and spatial relationships believable";
    const architectureBlock = [
      architectureStyle ? `Architecture style: ${architectureStyle}` : "",
      spatialDiscipline
    ].filter(Boolean).map(sentence).join(" ");

    const styleBlock = isPhotography ? "" : [
      `Sketch style: ${stylePrompt}`,
      lineQuality ? `Line override: ${lineQuality}; use this as the active line character within the selected sketch style` : "",
      colorTreatment ? `Color override: ${colorTreatment}; use this as the active color treatment within the selected sketch style` : "",
      `Paper / surface: ${surface}`,
      lineOverride ? "" : styleLineRule,
      colorOverride ? "" : styleColorRule
    ].filter(Boolean).map(sentence).join(" ");

    const featureInstruction = featureEmphasis
      ? state.inputType === "reference-image"
        ? `Architectural feature emphasis: emphasize only these features where they already exist in the reference: ${featureEmphasis}; do not invent, add, remove, relocate, resize, or redesign architectural elements to satisfy this instruction`
        : `Architectural feature emphasis: include and emphasize these architectural elements: ${featureEmphasis}`
      : "";

    const contextBlock = [
      lighting ? `Lighting / time: ${lighting}` : "",
      character ? `Atmosphere / character: ${character}` : "",
      camera ? `View / projection: ${camera}` : "",
      siteContext ? `Site / context: ${siteContext}` : "",
      featureInstruction,
      humanPresence ? `Human presence / scale: ${humanPresence}` : "",
      !isPhotography && annotationMode !== "no-text" && annotationPrompt ? `Annotations / text: ${annotationPrompt}` : ""
    ].filter(Boolean).join("; ");

    const qualityRules = global.ArchitecturePromptQuality?.conceptQuality?.(state) || [];
    const qualityBlock = qualityRules.length
      ? `Architectural quality discipline: ${qualityRules.join(" ")}`
      : "";

    const colorGuard = !isPhotography && colorOverride && !isMonochrome(state.colorTreatment)
      ? "Preserve the selected color override; do not collapse the result into graphite-only grayscale."
      : "";

    const guard = isPhotography
      ? [
          "Keep the result clearly within architectural photography language, not as a sketch, drawing, watercolor illustration, diagram, CGI, 3D render, or stylized concept art",
          photoTextPolicy ? `Text / signage policy: ${photoTextPolicy}` : ""
        ].filter(Boolean).map(sentence).join(" ")
      : [
          "Keep the result clearly within professional architectural sketch presentation language, not photorealistic imagery, CGI, 3D archviz, or realistic digital painting",
          annotationMode === "no-text" ? NO_TEXT_GUARD : "",
          styleAvoid
        ].filter(Boolean).map(sentence).join(" ");

    const blocks = [
      sentence(opening),
      sentence(sourceBlock),
      sentence(architectureBlock),
      sentence(qualityBlock),
      sentence(styleBlock),
      contextBlock ? sentence(contextBlock) : "",
      sentence(colorGuard),
      sentence(guard),
      extra ? sentence(`Additional instruction: ${extra}`) : ""
    ].filter(Boolean);

    return blocks.join("\n\n");
  }

  global.ArchitecturalSketchPromptBuilder = { build };
})(window);
