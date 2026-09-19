(function (global) {
  "use strict";

  const INPUT_RULES = {
    "reference-image": "Use the provided architectural reference image as the direct base image and authoritative source for the design.",
    "sketch-linework": "Use the provided architectural sketch or linework as the authoritative geometry and proportion guide, translating it into a realistic built environment without losing the drawn design.",
    "massing-model": "Use the provided massing or clay-model image as the authoritative guide for building massing, volume, levels, roof form, openings, and overall proportions.",
    "existing-photo": "Use the provided existing-building photograph as the authoritative base condition. Preserve the built form and viewpoint while improving only the requested architectural visualization qualities."
  };

  const FIDELITY_RULES = {
    strict: "STRICT DESIGN FIDELITY: preserve the building geometry, massing, roof form, floor levels, facade proportions, openings, columns and visible structural elements, setbacks, and the original camera perspective exactly as shown. Do not redesign, add, remove, resize, relocate, or reinterpret architectural elements.",
    balanced: "BALANCED DESIGN FIDELITY: preserve the overall geometry, massing, floor levels, primary roof form, facade proportions, main openings, and structural rhythm. Allow only restrained presentation refinements that do not materially redesign the architecture.",
    creative: "CREATIVE DESIGN DEVELOPMENT: keep the core massing, project identity, major proportions, and primary architectural logic recognizable, while allowing controlled facade, material, landscape, and presentation development according to the selected directions."
  };

  const QUALITY_RULES = {
    "high-detail": "high-detail professional architectural visualization with physically believable materials, clean geometry edges, realistic glazing, accurate contact shadows, and natural depth",
    "ultra-realistic": "ultra-realistic architectural visualization with physically plausible material response, refined reflections, natural imperfections, realistic atmospheric depth, and convincing photographic light",
    "presentation-ready": "presentation-ready architectural visualization with refined composition, balanced contrast, polished material rendering, realistic environment integration, and professional competition-board quality"
  };

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

  function build(state = {}) {
    const ratio = clean(state.aspectRatio) || "16:9";
    const inputRule = INPUT_RULES[state.inputType] || INPUT_RULES["reference-image"];
    const fidelityRule = FIDELITY_RULES[state.fidelity] || FIDELITY_RULES.strict;
    const qualityRule = QUALITY_RULES[state.quality] || QUALITY_RULES["high-detail"];

    const opening = [
      inputRule,
      `Create a photorealistic architectural render in a ${ratio} aspect ratio.`,
      fidelityRule
    ].join(" ");

    const directions = [
      selectedDirection("Project type", state.projectType),
      selectedDirection("Architecture style", state.architectureStyle),
      selectedDirection("Materials", state.materials),
      selectedDirection("Lighting", state.lighting),
      selectedDirection("Weather / atmosphere", state.atmosphere),
      selectedDirection("Landscape / site", state.landscape),
      selectedDirection("Camera / view", state.camera),
      selectedDirection("Render style", state.renderStyle)
    ].filter(Boolean);

    const directionBlock = directions.length
      ? `Apply the following visualization direction while respecting the selected design-fidelity level: ${directions.join("; ")}.`
      : "";

    const ratioGuard = "If the requested aspect ratio differs from the source image, preserve the complete architecture and its proportions; extend the surrounding canvas, sky, ground, or environment as needed instead of cropping, stretching, compressing, or changing the building geometry.";

    const realism = `Render as ${qualityRule}. Enhance only the aspects allowed by the selected fidelity level, such as materials, textures, glazing, reflections, lighting, shadows, landscaping, surrounding environment, and overall realism. Keep scale, construction logic, perspective, and material behavior physically believable. Do not invent new signage, text, logos, structural elements, doors, windows, floors, or roof features unless explicitly requested.`;

    const cameraGuard = state.fidelity === "strict"
      ? "Keep the original camera angle, lens relationship, framing, and perspective unchanged."
      : "";

    const extra = sentence(state.extraInstruction);

    return [sentence(opening), sentence(directionBlock), sentence([ratioGuard, cameraGuard].filter(Boolean).join(" ")), sentence(realism), extra]
      .filter(Boolean)
      .join("\n\n");
  }

  global.ArchitecturalRenderPromptBuilder = { build };
})(window);
