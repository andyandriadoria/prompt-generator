(function (global) {
  "use strict";

  const INPUT_RULES = {
    "reference-image": "Use the provided architectural reference image as the authoritative source for the design.",
    "sketch-linework": "Use the provided architectural sketch or linework as the authoritative geometry and proportion guide, translating it into a realistic built environment without losing the drawn design.",
    "massing-model": "Use the provided massing or clay-model image as the authoritative guide for building massing, volume, levels, roof form, openings, and overall proportions.",
    "existing-photo": "Use the provided existing-building photograph as the authoritative base condition for the visualization."
  };

  const FIDELITY_RULES = {
    strict: "STRICT DESIGN FIDELITY: Preserve the original building geometry, massing, roof form, floor levels, facade proportions, openings, columns, visible structural elements, setbacks, camera position, framing, lens relationship, and perspective exactly as shown. Do not redesign, add, remove, resize, relocate, or reinterpret architectural elements.",
    balanced: "BALANCED DESIGN FIDELITY: Preserve the core building geometry, massing, facade composition, roof form, floor levels, main openings, and structural rhythm. Allow only restrained visualization refinements that do not materially change the architectural design.",
    creative: "CREATIVE DESIGN FIDELITY: Use the reference as the primary design basis while allowing controlled development of materials, facade expression, landscape, mood, and presentation. Keep the core massing, project identity, major proportions, and primary architectural logic recognizable unless explicitly instructed otherwise."
  };

  const REALISM_TARGETS = {
    "photoreal-archviz": {
      opening: "Create a polished photorealistic architectural visualization in a {{ratio}} aspect ratio.",
      closing: "Produce a refined presentation-quality architectural visualization with physically believable materials, realistic glazing, reflections, shadows, atmospheric depth, clean landscape integration, and controlled professional polish. Keep scale, construction logic, and material behavior physically plausible. Avoid cartoonish stylization or obviously artificial geometry."
    },
    "hyper-real-photo": {
      opening: "Create a hyper-realistic architectural photograph in a {{ratio}} aspect ratio that looks like a real built project captured by a professional camera.",
      closing: "Create the result as a true-to-life architectural photograph, not as CGI, a 3D render, concept art, or polished architectural visualization. Use believable real-world exposure, physically plausible light response, natural glazing and reflections, subtle material irregularities, slight weathering where appropriate, organic vegetation variation, non-uniform grass and paving tones, and lifelike shadow softness. Avoid overly perfect surfaces, synthetic foliage, sterile lighting, exaggerated sharpness, excessive HDR, or a computer-generated look."
    },
    "documentary-site-photo": {
      opening: "Create a natural documentary architectural site photograph in a {{ratio}} aspect ratio, as if the completed project were photographed on location in ordinary real-world conditions.",
      closing: "Favor honest site-documentation realism with natural exposure, restrained contrast, ordinary material variation, believable minor imperfections, realistic vegetation, and unforced shadow behavior. Keep the image observational rather than staged. Avoid luxury marketing polish, cinematic grading, showroom perfection, artificial CGI sheen, or an idealized architectural-visualization look."
    }
  };

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
    const realismTarget = REALISM_TARGETS[state.realismTarget] || REALISM_TARGETS["hyper-real-photo"];
    const inputRule = INPUT_RULES[state.inputType] || INPUT_RULES["reference-image"];
    const fidelityRule = FIDELITY_RULES[fidelity] || FIDELITY_RULES.strict;

    const opening = `${inputRule} ${withRatio(realismTarget.opening, ratio)}`;

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

    const realismBlock = `${realismTarget.closing} ${INVENTION_GUARD}`;
    const extra = sentence(state.extraInstruction);

    return [
      sentence(opening),
      sentence(fidelityRule),
      sentence(directionBlock),
      sentence(ratioGuard),
      sentence(realismBlock),
      extra
    ].filter(Boolean).join("\n\n");
  }

  global.ArchitecturalRenderPromptBuilder = {
    build,
    realismTargets: Object.keys(REALISM_TARGETS)
  };
})(window);
