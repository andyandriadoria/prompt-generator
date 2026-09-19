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

  function build(state = {}) {
    const ratio = clean(state.aspectRatio) || "4:5";
    const projectType = clean(state.projectType) || "architectural concept";
    const scene = clean(state.scenePrompt) || clean(state.sceneLabel) || "architectural view";
    const architectureStyle = clean(state.architectureStyle);
    const inputPrompt = clean(state.inputPrompt);
    const sketchStyle = clean(state.sketchStylePrompt) || "a refined architectural sketch";
    const medium = clean(state.mediumPrompt) || "clean drawing paper";
    const lineQuality = clean(state.lineQualityPrompt) || "balanced architectural line weight";
    const colorTreatment = clean(state.colorTreatmentPrompt) || "restrained hand-rendered color";
    const lighting = clean(state.lightingPrompt);
    const mood = clean(state.moodPrompt);
    const landscape = clean(state.landscape);
    const features = clean(state.features);
    const humanScale = clean(state.humanScalePrompt);
    const camera = clean(state.cameraPrompt);
    const extra = clean(state.extraInstruction);

    const opening = `Create a hand-drawn architectural sketch illustration of a ${projectType} as ${scene}.`;

    const styleBlock = architectureStyle
      ? `The architectural language should reflect ${architectureStyle} while keeping believable massing, proportions, openings, and spatial logic.`
      : "Keep the architecture believable, proportionate, and spatially coherent.";

    const sketchBlock = `Render the image as ${sketchStyle} on ${medium}, using ${lineQuality} and ${colorTreatment}.`;

    const environment = [
      lighting ? `Lighting / time: ${lighting}` : "",
      mood ? `Atmosphere / mood: ${mood}` : "",
      landscape ? `Landscape / context: ${landscape}` : "",
      features ? `Architectural features to emphasize: ${features}` : "",
      camera ? `View / composition: ${camera}` : "",
      humanScale
    ].filter(Boolean);

    const hierarchy = "Use a clear architectural line-weight hierarchy: heavier lines for foreground emphasis, cut edges, and primary outlines; medium lines for main architectural edges, openings, and key features; lighter lines for secondary details, furniture, planting, and textures; and very light lines for background elements, surface patterns, and perspective or construction guides.";

    const closing = "Keep the result elegant, intentional, presentation-ready, and architecturally legible. Preserve the feeling of a real hand-rendered design drawing rather than a casual doodle, cartoon, or photorealistic render.";

    const blocks = [
      sentence(opening),
      sentence(inputPrompt),
      sentence(styleBlock),
      sentence(sketchBlock),
      environment.length ? sentence(environment.join("; ")) : "",
      sentence(hierarchy),
      sentence(closing),
      sentence(`Aspect ratio: ${ratio}`),
      extra ? sentence(`Additional instruction: ${extra}`) : ""
    ].filter(Boolean);

    return blocks.join("\n\n");
  }

  global.ArchitecturalSketchPromptBuilder = { build };
})(window);
