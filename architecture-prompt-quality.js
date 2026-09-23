(function (global) {
  "use strict";

  const TECHNICAL_PROJECTION_IDS = new Set([
    "axonometric-isometric",
    "orthographic-elevation",
    "section-perspective"
  ]);

  const CATEGORY_PRIORITIES = {
    "residential-buildings": {
      general: "Prioritize human-scale proportions, a legible entrance sequence, believable opening sizes, and a coherent relationship between private space, landscape, and access.",
      exterior: "Prioritize human-scale proportions, a legible entrance sequence, believable window and door sizes, and a coherent relationship between the dwelling, landscape, and street or access.",
      interior: "Prioritize domestic scale, clear circulation, believable daylight, and coherent relationships between openings, materials, and adjoining spaces."
    },
    "commercial-buildings": {
      general: "Prioritize a clear public entrance, readable facade hierarchy, pedestrian scale, and a believable interface between the building and its customer-facing public realm.",
      exterior: "Prioritize a clear public entrance, readable frontage and facade hierarchy, pedestrian scale, and a believable interface with the public realm without inventing branding.",
      interior: "Prioritize customer circulation, spatial hierarchy, service or display zones, and coherent lighting without inventing branding or unsupported merchandising."
    },
    "institutional-public-buildings": {
      general: "Prioritize legible public access, circulation hierarchy, accessibility, durable public-facing scale, and a clear relationship between civic function and architectural form.",
      exterior: "Prioritize legible civic or public entry, accessibility, circulation hierarchy, durable public-facing scale, and a clear relationship between building and public realm.",
      interior: "Prioritize clear circulation and wayfinding hierarchy, accessible spatial relationships, public-to-private transitions, and believable daylight."
    },
    "religious-buildings": {
      general: "Prioritize spatial hierarchy, approach and threshold, communal or ceremonial scale, and coherent light while avoiding unsupported religious symbols or decorative additions.",
      exterior: "Prioritize approach, threshold, silhouette, communal or ceremonial scale, and coherent light while avoiding unsupported religious symbols or decorative additions.",
      interior: "Prioritize spatial hierarchy, orientation, procession or assembly, natural light, and restrained symbolic expression without inventing unsupported religious elements."
    },
    "industrial-buildings": {
      general: "Prioritize structural logic, service access, operational circulation, realistic clearances, and believable large-span or utility scale.",
      exterior: "Prioritize structural logic, loading or service access, operational circulation, realistic clearances, and believable industrial scale.",
      interior: "Prioritize structural spans, operational clearances, service zones, durable material behavior, and functional circulation."
    },
    "specialty-historic-buildings": {
      general: "Prioritize the defining silhouette, structural or historical logic, landmark presence, and relationship to the surrounding site or landscape.",
      exterior: "Prioritize the defining silhouette, structural or historical logic, landmark presence, and relationship to the surrounding site or landscape.",
      interior: "Prioritize spatial legibility, structural character, material authenticity, and the defining qualities of the selected building type."
    }
  };

  const CONCEPT_REALISM_RULES = {
    "hyper-real-architectural-photo": "Use professional real-camera realism with natural dynamic range, physically plausible material reflectance, subtle lens character, slight surface variation, and restrained sharpening. Avoid sterile CGI perfection, excessive HDR, or synthetic material smoothness.",
    "natural-documentary-architectural-photo": "Use observational framing, ordinary believable exposure, restrained contrast, natural site irregularity, and minor material variation. Avoid staged marketing polish, cinematic grading, or showroom perfection.",
    "editorial-architectural-photo": "Use controlled professional composition, disciplined verticals, refined exposure and tonal balance, and clear architectural hierarchy while retaining real material texture and believable site conditions. Avoid synthetic perfection."
  };

  const RENDER_REALISM_RULES = {
    "photoreal-archviz": "Maintain clear presentation hierarchy, coherent construction logic, physically plausible material transitions, and disciplined architectural composition without stylized or impossible geometry.",
    "hyper-real-photo": "Maintain plausible professional-camera behavior, natural dynamic range, disciplined verticals where appropriate, realistic material reflectance, and subtle real-world irregularity rather than render-like perfection.",
    "documentary-site-photo": "Favor observational framing, ordinary site conditions, restrained contrast, honest surface variation, and believable imperfections rather than staging or idealization."
  };

  const INPUT_RULES = {
    "reference-image": "Treat visible reference geometry as intentional design information. Do not reinterpret rendering artifacts, shadows, or texture noise as new architectural elements.",
    "sketch-linework": "Treat linework as geometry and proportion information. Use materials, light, and depth to clarify the drawn design rather than distorting or replacing its lines and openings.",
    "massing-model": "Treat model or clay shading as form information rather than finish specification. Infer surface character only from the selected materials, style, and fidelity rules.",
    "existing-photo": "Respect real site levels, existing structure, visible perspective, and built conditions. Any visualization refinement must remain physically constructible and spatially coherent."
  };

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function typologyPriority(categoryId, sceneType = "") {
    const profile = CATEGORY_PRIORITIES[categoryId];
    if (!profile) return "";
    return clean(profile[sceneType] || profile.general || "");
  }

  function renderQuality(state = {}) {
    const parts = [];
    const fidelity = clean(state.fidelity) || "strict";
    const categoryRule = typologyPriority(state.buildingCategory);

    if (categoryRule) {
      parts.push(
        fidelity === "strict"
          ? `Typology presentation priority: communicate the intended building type through realistic light, material reading, scale, and context without altering the reference architecture. ${categoryRule}`
          : `Typology design priority: ${categoryRule}`
      );
    }

    const inputRule = INPUT_RULES[state.inputType];
    if (inputRule) parts.push(`Reference interpretation: ${inputRule}`);

    if (fidelity === "balanced" && clean(state.architectureStyle)) {
      parts.push("Style discipline: express the selected architectural style only through restrained material, detail, and facade-language refinements that remain compatible with the preserved geometry, openings, levels, and structural rhythm.");
    } else if (fidelity === "creative" && clean(state.architectureStyle)) {
      parts.push("Style discipline: use the selected style as a coherent architectural system across proportion, facade rhythm, materials, openings, and detail hierarchy, not as superficial decoration; keep the reference massing and project identity recognizable.");
    }

    if (clean(state.materials)) {
      parts.push("Material discipline: keep construction scale, joints, thickness, reflectance, weathering, and transitions physically plausible; avoid texture mapping that ignores edges, seams, or assembly logic.");
    }

    const realismRule = RENDER_REALISM_RULES[state.realismTarget];
    if (realismRule) parts.push(`Image-quality discipline: ${realismRule}`);

    if (fidelity !== "strict" && clean(state.camera)) {
      parts.push("Camera discipline: keep horizon, verticals, lens behavior, scale, and perspective physically coherent with the selected view; avoid impossible wide-angle stretching or conflicting vanishing points.");
    }

    return parts.filter(Boolean);
  }

  function conceptQuality(state = {}) {
    const parts = [];
    const photography = state.outputRepresentation === "architectural-photography";
    const sceneType = clean(state.sceneType);
    const categoryRule = typologyPriority(state.buildingCategory, sceneType);

    if (categoryRule) {
      parts.push(`Typology priority: ${categoryRule}`);
    }

    if (state.inputType === "reference-image") {
      parts.push("Reference discipline: let the selected representation, style, light, and atmosphere change how the design is depicted, not the core massing, principal openings, floor relationships, or spatial composition. Resolve ambiguity conservatively instead of inventing major geometry.");
    } else {
      parts.push("Design-resolution discipline: resolve unspecified secondary details coherently from the selected building type and architectural style. Avoid arbitrary ornament, contradictory structure, implausible openings, or decorative clutter with no architectural role.");
    }

    if (clean(state.architectureStyle)) {
      parts.push(
        state.inputType === "reference-image"
          ? "Style discipline: apply the selected architectural language as a restrained and coherent visual or material interpretation that remains compatible with the preserved reference form."
          : "Style discipline: use the selected architectural language as a coherent design system across proportion, openings, material character, structure, and detail hierarchy rather than as surface decoration."
      );
    }

    if (TECHNICAL_PROJECTION_IDS.has(state.cameraView)) {
      parts.push("Projection discipline: keep the selected architectural projection internally consistent; do not introduce photographic lens distortion, perspective convergence, or camera-depth cues that conflict with the projection.");
    } else if (photography) {
      parts.push("Camera discipline: keep horizon, verticals, lens behavior, spatial depth, and scale physically coherent with the selected view. Avoid impossible focal-length distortion or conflicting vanishing points.");
    } else {
      parts.push("Drawing-space discipline: keep scale, depth, vanishing structure, and spatial relationships coherent with the selected view or projection.");
    }

    if (photography) {
      if (sceneType === "interior") {
        parts.push("Scene realism: maintain believable interior exposure balance, depth, verticals, material reflectance, and natural falloff between daylight and artificial or ambient light.");
      } else {
        parts.push("Scene realism: maintain a coherent ground plane, contact shadows, facade depth, sky-to-building exposure, and believable scale between architecture, paving, vegetation, and people.");
      }

      const realismRule = CONCEPT_REALISM_RULES[state.photoRealismTarget];
      if (realismRule) parts.push(`Image-quality discipline: ${realismRule}`);

      if (clean(state.humanScalePrompt)) {
        parts.push("Human-scale discipline: people must remain naturally posed, correctly scaled, physically grounded, and visually secondary to the architecture; avoid staged crowd behavior.");
      }
    }

    return parts.filter(Boolean);
  }

  function projectionTerm(cameraView) {
    return TECHNICAL_PROJECTION_IDS.has(cameraView) ? "projection" : "perspective";
  }

  global.ArchitecturePromptQuality = {
    TECHNICAL_PROJECTION_IDS,
    typologyPriority,
    renderQuality,
    conceptQuality,
    projectionTerm
  };
})(window);
