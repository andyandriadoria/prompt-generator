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

    const medium = clean(state.mediumPrompt) || "clean white architectural presentation paper";
    const lineQuality = clean(state.lineQualityPrompt);
    const colorTreatment = clean(state.colorTreatmentPrompt);

    const lighting = clean(state.lightingPrompt);
    const mood = clean(state.moodPrompt);
    const landscape = clean(state.landscape);
    const features = clean(state.features);
    const humanScale = clean(state.humanScalePrompt);
    const camera = clean(state.cameraPrompt);
    const extra = clean(state.extraInstruction);

    const opening = `Create a hand-drawn architectural sketch illustration of a ${projectType} as ${scene}.`;

    const architectureBlock = architectureStyle
      ? `The architectural language should reflect ${architectureStyle} while keeping believable massing, proportions, openings, and spatial logic.`
      : "Keep the architecture believable, proportionate, and spatially coherent.";

    const styleBlock = [
      `Use the selected sketch language: ${stylePrompt}`,
      `Present it on ${medium}`,
      lineQuality ? `Line character: ${lineQuality}` : "",
      colorTreatment ? `Color treatment: ${colorTreatment}` : "",
      styleLineRule,
      styleColorRule
    ].filter(Boolean).map(sentence).join(" ");

    const environment = [
      lighting ? `Lighting / time: ${lighting}` : "",
      mood ? `Atmosphere / mood: ${mood}` : "",
      landscape ? `Landscape / context: ${landscape}` : "",
      features ? `Architectural features to emphasize: ${features}` : "",
      camera ? `View / composition: ${camera}` : "",
      humanScale
    ].filter(Boolean);

    const styleAlreadyGuardsMonochrome = /monochrome|grayscale/i.test(styleAvoid);
    const colorGuard = isMonochrome(state.colorTreatment)
      ? "Honor the selected monochrome treatment and do not introduce colored washes."
      : styleAlreadyGuardsMonochrome
        ? ""
        : "Do not collapse the image into monochrome graphite or grayscale; preserve the selected color treatment while keeping the linework visible.";

    const clarity = "Keep architectural proportions, perspective, openings, structure, and spatial relationships clear and believable. The architecture should remain the primary subject, with entourage and context visually secondary.";

    const universalAvoid = "Keep the result clearly within architectural sketch and hand-rendered presentation language. Do not render it as a photorealistic image, CGI, 3D visualization, polished archviz render, or realistic digital painting.";

    const blocks = [
      sentence(opening),
      sentence(inputPrompt),
      sentence(architectureBlock),
      sentence(styleBlock),
      environment.length ? sentence(environment.join("; ")) : "",
      sentence(clarity),
      sentence(colorGuard),
      sentence(styleAvoid),
      sentence(universalAvoid),
      sentence(`Aspect ratio: ${ratio}`),
      extra ? sentence(`Additional instruction: ${extra}`) : ""
    ].filter(Boolean);

    return blocks.join("\n\n");
  }

  global.ArchitecturalSketchPromptBuilder = { build };
})(window);
