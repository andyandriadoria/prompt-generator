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
      interior: "Prioritize domestic scale, clear circulation, legible illumination, and coherent relationships between openings, materials, and adjoining spaces."
    },
    "commercial-buildings": {
      general: "Prioritize a clear public entrance, readable facade hierarchy, pedestrian scale, and a believable interface between the building and its customer-facing public realm.",
      exterior: "Prioritize a clear public entrance, readable frontage and facade hierarchy, pedestrian scale, and a believable interface with the public realm without inventing branding.",
      interior: "Prioritize customer circulation, spatial hierarchy, service or display zones, and coherent lighting without inventing branding or unsupported merchandising."
    },
    "institutional-public-buildings": {
      general: "Prioritize legible public access, circulation hierarchy, accessibility, durable public-facing scale, and a clear relationship between civic function and architectural form.",
      exterior: "Prioritize legible civic or public entry, accessibility, circulation hierarchy, durable public-facing scale, and a clear relationship between building and public realm.",
      interior: "Prioritize clear circulation and wayfinding hierarchy, accessible spatial relationships, public-to-private transitions, and believable illumination."
    },
    "religious-buildings": {
      general: "Prioritize spatial hierarchy, approach and threshold, communal or ceremonial scale, and coherent light while avoiding unsupported religious symbols or decorative additions.",
      exterior: "Prioritize approach, threshold, silhouette, communal or ceremonial scale, and coherent light while avoiding unsupported religious symbols or decorative additions.",
      interior: "Prioritize spatial hierarchy, orientation, procession or assembly, controlled illumination, and restrained symbolic expression without inventing unsupported religious elements."
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

  const TYPE_PRIORITIES = {
    "single-family-house": {
      general: "Clarify domestic scale, primary access, opening hierarchy, and coherent relationships between private, shared, and outdoor spaces.",
      exterior: "Make the main entrance, private-to-public threshold, opening proportions, and terrace or garden relationship easy to read.",
      interior: "Make domestic circulation, room-to-room relationships, openings, and daylight hierarchy easy to read."
    },
    "retail-store": {
      general: "Clarify public entry, customer-facing threshold, storefront or display hierarchy, and circulation without inventing brand identity.",
      exterior: "Keep the entrance, storefront depth, display zones, canopy or threshold, and pedestrian approach legible without inventing brand identity.",
      interior: "Keep customer circulation, display or merchandising zones, service points, and spatial hierarchy legible without fabricated logos or promotional text."
    },
    "hotel-resort": {
      general: "Clarify arrival, guest circulation, public-space hierarchy, accommodation zones, and the relationship between architecture and landscape or views.",
      exterior: "Clarify arrival, guest entry, public-space hierarchy, accommodation wings, and the relationship between architecture and landscape.",
      interior: "Clarify arrival or lobby sequence, public-space hierarchy, guest circulation, and the relationship between interior spaces and landscape or views."
    },
    "restaurant-cafe": {
      general: "Clarify public threshold, seating and service hierarchy, circulation, and indoor-outdoor relationship without inventing branding.",
      exterior: "Clarify the public threshold, seating relationship, facade openness, and indoor-outdoor connection without inventing branding.",
      interior: "Clarify seating zones, service circulation, spatial focus, and believable ambient or natural-light hierarchy."
    },
    "school-university": {
      general: "Clarify primary access, learning-space hierarchy, communal zones, circulation, daylight, and courtyard or campus relationships.",
      exterior: "Clarify primary access, learning or communal clusters, shaded circulation, gathering areas, and campus or courtyard relationships.",
      interior: "Clarify learning-space hierarchy, circulation, communal zones, illumination, and visual connections between spaces."
    },
    "hospital-clinic": {
      general: "Clarify accessible public access, circulation hierarchy, public-to-clinical transitions, daylight, and durable healthcare material logic.",
      exterior: "Clarify accessible public entry, drop-off or approach, circulation hierarchy, and durable healthcare scale without visual clutter.",
      interior: "Clarify accessible routes, public-to-clinical transitions, circulation hierarchy, illumination, and durable material logic."
    },
    "museum": {
      general: "Clarify civic arrival, exhibition-space hierarchy, visitor circulation, thresholds, and controlled daylight without distracting decorative clutter.",
      exterior: "Clarify civic arrival, entry hierarchy, visitor approach, massing, and the relationship between exhibition volumes and public space.",
      interior: "Clarify exhibition sequence, thresholds, visitor circulation, controlled illumination, and spatial hierarchy without distracting decorative clutter."
    },
    "factory-manufacturing": {
      general: "Clarify production volumes, structural bays, operational circulation, service access, logistics, and durable industrial material logic.",
      exterior: "Clarify production volumes, service access, logistics paths, structural bays, and the relationship between operational and administrative zones.",
      interior: "Clarify structural spans, production zones, service routes, operational clearances, and durable industrial material logic."
    },
    "warehouse": {
      general: "Clarify clear-span structure, loading relationships, service access, storage logic, and efficient logistics circulation.",
      exterior: "Clarify loading access, large-span volume, service yards, structural rhythm, and efficient logistics circulation.",
      interior: "Clarify clear-span structure, storage logic, loading relationships, operational clearances, and practical circulation."
    },
    "pavilion": {
      general: "Emphasize openness, shelter, structural clarity, framed views, and the pavilion's relationship to landscape and pedestrian approach.",
      exterior: "Emphasize openness, shelter, threshold, structural clarity, and the pavilion's relationship to landscape, view, and pedestrian approach.",
      interior: "Emphasize openness, structure, framed views, shelter, and continuous relationship with the surrounding landscape."
    },
    "architectural-bridge": {
      general: "Emphasize span, structural continuity, deck or pathway scale, approach sequence, and relationship to terrain, water, or urban context.",
      exterior: "Emphasize span, structural continuity, deck or pathway scale, approach sequence, and relationship to terrain, water, or urban context."
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

  function adaptStyleProfile(profile, sceneType = "", state = {}) {
    let text = clean(profile);
    if (!text) return "";

    if (sceneType === "interior") {
      const sceneSwaps = [
        [/layered facade composition/gi, "layered spatial composition"],
        [/planar facade composition/gi, "planar composition"],
        [/facade rhythm/gi, "spatial rhythm"],
        [/articulated facades/gi, "articulated surfaces and openings"],
        [/facade hierarchy/gi, "architectural hierarchy"]
      ];
      sceneSwaps.forEach(([pattern, value]) => { text = text.replace(pattern, value); });
    }

    if (
      state.outputRepresentation !== "architectural-photography" &&
      state.sketchStyle === "refined-line-drawing"
    ) {
      text = text.replace(/expressive color and form/gi, "expressive form and tonal contrast");
    }

    return text;
  }

  function typologyPriority(categoryId, sceneType = "") {
    const profile = CATEGORY_PRIORITIES[categoryId];
    if (!profile) return "";
    return clean(profile[sceneType] || profile.general || "");
  }

  function typePriority(buildingType, sceneType = "") {
    const profile = TYPE_PRIORITIES[buildingType];
    if (!profile) return "";
    if (!sceneType) return clean(profile.general || "");
    return clean(profile[sceneType] || profile.general || "");
  }

  function renderQuality(state = {}) {
    const parts = [];
    const fidelity = clean(state.fidelity) || "strict";
    const categoryRule = typologyPriority(state.buildingCategory);
    const buildingRule = typePriority(state.buildingType);
    const typologyRule = buildingRule || categoryRule;

    if (typologyRule) {
      const scope = buildingRule ? "Building-type" : "Typology";
      parts.push(
        fidelity === "strict"
          ? `${scope} presentation priority: communicate the intended building use through realistic light, material reading, scale, and context without altering the reference architecture. ${typologyRule}`
          : `${scope} design priority: ${typologyRule}`
      );
    }

    const inputRule = INPUT_RULES[state.inputType];
    if (inputRule) parts.push(`Reference interpretation: ${inputRule}`);

    if (fidelity === "balanced" && clean(state.architectureStyle)) {
      const profile = clean(state.architectureStyleSemanticProfile);
      parts.push(
        profile
          ? `Style discipline: express the selected architectural language selectively through ${profile}; keep these cues restrained and compatible with the preserved geometry, openings, levels, and structural rhythm, and do not add unsupported signature elements merely to signal the style.`
          : "Style discipline: express the selected architectural style only through restrained material, detail, and facade-language refinements that remain compatible with the preserved geometry, openings, levels, and structural rhythm."
      );
    } else if (fidelity === "creative" && clean(state.architectureStyle)) {
      const profile = clean(state.architectureStyleSemanticProfile);
      parts.push(
        profile
          ? `Style discipline: develop the selected architectural language coherently through ${profile}; use these cues across proportion, facade rhythm, materials, openings, structure, and detail hierarchy rather than as superficial decoration, while keeping the reference massing and project identity recognizable.`
          : "Style discipline: use the selected style as a coherent architectural system across proportion, facade rhythm, materials, openings, and detail hierarchy, not as superficial decoration; keep the reference massing and project identity recognizable."
      );
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
    const buildingRule = typePriority(state.buildingType, sceneType);
    const typologyRule = buildingRule || categoryRule;

    if (typologyRule) {
      parts.push(`${buildingRule ? "Building-type" : "Typology"} priority: ${typologyRule}`);
    }

    if (state.inputType === "reference-image") {
      parts.push("Reference discipline: preserve core massing, principal openings, floor relationships, and spatial composition; resolve ambiguity conservatively rather than inventing major geometry.");
    } else {
      parts.push("Design resolution: resolve unspecified secondary details coherently; avoid arbitrary ornament, contradictory structure, and implausible openings.");
    }

    if (clean(state.architectureStyle)) {
      const profile = adaptStyleProfile(state.architectureStyleSemanticProfile, sceneType, state);
      if (state.inputType === "reference-image") {
        parts.push(
          profile
            ? `Style: use only reference-compatible cues from ${profile}; do not add unsupported signature elements.`
            : "Style: interpret the reference conservatively through the selected architectural language without changing its core form."
        );
      } else {
        parts.push(
          profile
            ? `Style: use ${profile} as coherent architectural cues across proportion, openings, structure, materials, and spatial composition—not as applied decoration.`
            : "Style: use the selected architectural language coherently across proportion, openings, structure, materials, and spatial composition—not as applied decoration."
        );
      }
    }

    if (TECHNICAL_PROJECTION_IDS.has(state.cameraView)) {
      parts.push("Projection: keep the selected projection internally consistent; avoid camera distortion or perspective cues that conflict with it.");
    } else if (photography) {
      const sceneRule = sceneType === "interior"
        ? "maintain believable interior exposure, verticals, material response, and light falloff"
        : "maintain a coherent ground plane, contact shadows, facade depth, and sky-to-building exposure";
      parts.push(`Photography: keep horizon, lens behavior, depth, and scale physically coherent; ${sceneRule}.`);
    }

    if (photography) {
      const realismRule = CONCEPT_REALISM_RULES[state.photoRealismTarget];
      if (realismRule) parts.push(`Image quality: ${realismRule}`);

      if (clean(state.humanScalePrompt)) {
        parts.push("People: keep figures naturally posed, correctly scaled, physically grounded, and secondary to the architecture.");
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
    typePriority,
    adaptStyleProfile,
    renderQuality,
    conceptQuality,
    projectionTerm
  };
})(window);
