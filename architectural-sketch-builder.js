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

  function build(state = {}) {
    const ratio = clean(state.aspectRatio) || "4:5";
    const projectType = clean(state.projectType) || "architectural concept";
    const scene = clean(state.scenePrompt) || clean(state.sceneLabel) || "architectural view";
    const architectureStyle = clean(state.architectureStyle);
    const inputPrompt = clean(state.inputPrompt);

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
    const landscape = clean(state.landscape);
    const features = clean(state.features);
    const humanScale = clean(state.humanScalePrompt);
    const camera = clean(state.cameraPrompt);
    const extra = clean(state.extraInstruction);

    const opening = `Create a hand-drawn architectural sketch of ${withIndefiniteArticle(projectType)} as ${scene} in a ${ratio} aspect ratio.`;

    const sourceBlock = state.inputType && state.inputType !== "concept-prompt"
      ? inputPrompt
      : "";

    const architectureBlock = [
      architectureStyle ? `Architecture style: ${architectureStyle}` : "",
      "Keep massing, proportions, openings, perspective, and spatial relationships believable"
    ].filter(Boolean).map(sentence).join(" ");

    const styleBlock = [
      `Sketch style: ${stylePrompt}`,
      lineQuality ? `Line override: ${lineQuality}; use this as the active line character within the selected sketch style` : "",
      colorTreatment ? `Color override: ${colorTreatment}; use this as the active color treatment within the selected sketch style` : "",
      `Paper / surface: ${surface}`,
      lineOverride ? "" : styleLineRule,
      colorOverride ? "" : styleColorRule
    ].filter(Boolean).map(sentence).join(" ");

    const contextBlock = [
      lighting ? `Lighting / time: ${lighting}` : "",
      character ? `Atmosphere / character: ${character}` : "",
      camera ? `View / projection: ${camera}` : "",
      landscape ? `Context: ${landscape}` : "",
      features ? `Emphasize: ${features}` : "",
      humanScale
    ].filter(Boolean).join("; ");

    const colorGuard = colorOverride && !isMonochrome(state.colorTreatment)
      ? "Preserve the selected color override; do not collapse the result into graphite-only grayscale."
      : "";

    const guard = [
      "Keep the result clearly within professional architectural sketch presentation language, not photorealistic imagery, CGI, 3D archviz, or realistic digital painting",
      styleAvoid
    ].filter(Boolean).map(sentence).join(" ");

    const blocks = [
      sentence(opening),
      sentence(sourceBlock),
      sentence(architectureBlock),
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
