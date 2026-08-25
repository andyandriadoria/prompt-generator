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

    function applyTemplate(template, variables) {
        return clean(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => clean(variables[key] || ""));
    }

    function buildCampaignText(state) {
        if (!state.textOverlay || state.textOverlay.id === "none") return "";

        const parts = [state.textOverlay.prompt];
        if (state.textOverlay.headline && clean(state.headline)) {
            parts.push(`Use the headline “${clean(state.headline)}”`);
        }
        if (state.textOverlay.tagline && clean(state.tagline)) {
            parts.push(`with the supporting tagline “${clean(state.tagline)}”`);
        }
        if (state.textOverlay.footer && clean(state.footer)) {
            parts.push(`and the footer line “${clean(state.footer)}”`);
        }
        return sentence(parts.filter(Boolean).join(", "));
    }

    function build(state = {}) {
        const productType = state.productType || {};
        const preservation = state.preservation || {};
        const variables = {
            product_noun: productType.product_noun || productType.productNoun || "product",
            preserve_details: productType.preserve_details || productType.preserveDetails || "exact color, material, texture, construction, shape, proportions, and every visible detail",
            aspect_ratio: state.aspectRatio || "4:5"
        };

        const introTemplate = preservation.intro_template || preservation.introTemplate ||
            "Using the provided reference image as the source product, create a photorealistic catalog image while preserving the {{product_noun}} exactly as shown. Do not alter its {{preserve_details}}. Create the image in a {{aspect_ratio}} aspect ratio.";

        const chunks = [
            sentence(applyTemplate(introTemplate, variables)),
            sentence(state.presentation?.prompt),
            sentence(state.wearContext?.prompt),
            sentence(state.setting?.prompt),
            sentence(state.shot?.prompt),
            sentence(state.composition?.prompt),
            buildCampaignText(state),
            "Keep the product as the clear visual focal point. Use clean premium catalog photography, realistic material rendering, refined commercial styling, controlled lighting, and high-end product presentation.",
            sentence(state.extraInstruction),
            sentence(preservation.closing_prompt || preservation.closingPrompt || "No product redesign, distortion, recoloring, material substitution, removal, addition, or modification of any original product detail.")
        ];

        return chunks.filter(Boolean).join("\n\n");
    }

    global.ProductCatalogPromptBuilder = { build };
})(window);
