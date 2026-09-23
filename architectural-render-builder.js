(function (global) {
  "use strict";

  const DEFAULT_INPUT_RULE = "Use the provided architectural reference image as the authoritative source for the design.";
  const DEFAULT_FIDELITY_RULE = "Preserve the core architectural design, geometry, proportions, openings, structure, roof form, and spatial logic according to the selected design-fidelity level.";
  const DEFAULT_REALISM_OPENING = "Create a hyper-realistic architectural photograph in a {{ratio}} aspect ratio that looks like a real built project captured by a professional camera.";
  const DEFAULT_REALISM_CLOSING = "Create the result as a true-to-life architectural photograph with believable real-world exposure, physically plausible materials, natural glazing and reflections, realistic vegetation, and lifelike shadow behavior.";
  const INVENTION_GUARD = "Do not invent new architectural elements, signage, text, logos, doors, windows, floors, roof features, or decorative additions unless explicitly requested.";

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sentence(value) {
    const text = clean(value);
    if (!text) return "";
    return /[.!?]$/.test(text) ? text : `${text}.`;
  }

  function selectedDirection(label, value) {
    const text = clean(value);
    return text ? `${label}: ${text}` : "";
  }

  function withRatio(template, ratio) {
    return String(template || "").replace("{{ratio}}", ratio);
  }

  function build(state = {}) {
    const ratio = clean(state.aspectRatio) || "16:9";
    const fidelity = state.fidelity || "strict";
    const inputRule = clean(state.inputPrompt) || DEFAULT_INPUT_RULE;
    const fidelityRule = clean(state.fidelityPrompt) || DEFAULT_FIDELITY_RULE;
    const realismOpening = clean(state.realismOpening) || DEFAULT_REALISM_OPENING;
    const realismClosing = clean(state.realismClosing) || DEFAULT_REALISM_CLOSING;

    const opening = `${inputRule} ${withRatio(realismOpening, ratio)}`;

    const directions = [
      selectedDirection("Project type", state.projectType),
      fidelity === "strict" ? "" : selectedDirection("Architecture style", state.architectureStyle),
      selectedDirection("Building materials", state.materials),
      selectedDirection("Lighting", state.lighting),
      selectedDirection("Weather / atmosphere", state.atmosphere),
      selectedDirection("Landscape / site", state.landscape),
      fidelity === "strict" ? "" : selectedDirection("Camera / view", state.camera)
    ].filter(Boolean);

    const directionBlock = directions.length
      ? `Apply only the following visualization directions within the selected fidelity level: ${directions.join("; ")}.`
      : "";

    const ratioGuard = "If the requested aspect ratio differs from the source image, preserve the complete architecture and its proportions. Extend only the surrounding sky, ground, or site environment as needed. Do not crop, stretch, compress, or alter the architecture to fit the frame.";

    const qualityRules = global.ArchitecturePromptQuality?.renderQuality?.(state) || [];
    const qualityBlock = qualityRules.length
      ? `Architectural quality discipline: ${qualityRules.join(" ")}`
      : "";
    const realismBlock = `${realismClosing} ${INVENTION_GUARD}`;
    const extra = sentence(state.extraInstruction);

    return [
      sentence(opening),
      sentence(fidelityRule),
      sentence(directionBlock),
      sentence(qualityBlock),
      sentence(ratioGuard),
      sentence(realismBlock),
      extra
    ].filter(Boolean).join("\n\n");
  }

  global.ArchitecturalRenderPromptBuilder = { build };
})(window);
