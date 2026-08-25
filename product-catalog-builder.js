(function (global) {
    "use strict";

    loadWorkspaceBridge();

    function loadWorkspaceBridge() {
        if (document.querySelector('script[data-product-catalog-workspace]')) return;
        const script = document.createElement("script");
        script.src = "product-catalog-workspace.js?v=4.5-product-2";
        script.defer = true;
        script.dataset.productCatalogWorkspace = "true";
        document.head.append(script);
    }

    function clean(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function sentence(value) {
        const text = clean(value);
        if (!text) return "";
        const normalized = text.charAt(0).toUpperCase() + text.slice(1);
        return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
    }

    function stripTerminal(value) {
        return clean(value).replace(/[.!?]+$/, "");
    }

    function applyTemplate(template, variables) {
        return clean(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => clean(variables[key] || ""));
    }

    function compositionGuard(state) {
        const id = state.composition?.id || "single-product";
        if (id === "pair") return "When the reference contains a pair, preserve both products and their relationship exactly as shown";
        if (id === "set") return "When the reference contains a coordinated set, preserve every item in the product set exactly as shown";
        if (id === "collection") return "When the reference contains multiple products, preserve every visible product in the reference collection exactly as shown";
        return "";
    }

    function buildCampaignText(state) {
        if (!state.textOverlay || state.textOverlay.id === "none") return "";

        const parts = [stripTerminal(state.textOverlay.prompt)];
        if (state.textOverlay.headline && clean(state.headline)) {
            parts.push(`use the headline “${clean(state.headline)}”`);
        }
        if (state.textOverlay.tagline && clean(state.tagline)) {
            parts.push(`the supporting tagline “${clean(state.tagline)}”`);
        }
        if (state.textOverlay.footer && clean(state.footer)) {
            parts.push(`the footer line “${clean(state.footer)}”`);
        }
        return sentence(parts.filter(Boolean).join(", with "));
    }

    function buildPresentationBlock(state) {
        const display = stripTerminal(state.presentation?.prompt);
        const wear = stripTerminal(state.wearContext?.prompt);
        const setting = stripTerminal(state.setting?.prompt);
        const shot = stripTerminal(state.shot?.prompt);
        const composition = stripTerminal(state.composition?.prompt);

        const firstParts = [display, wear, setting].filter(Boolean);
        const first = firstParts.length ? sentence(firstParts.join(" ")) : "";

        let second = "";
        if (shot && composition) second = sentence(`${shot}, ${composition}`);
        else second = sentence(shot || composition);

        const campaign = buildCampaignText(state);
        return [first, second, campaign].filter(Boolean).join(" ");
    }

    function buildQualityBlock(state, preservation) {
        const quality = "Keep the product as the clear visual focal point with realistic material rendering, refined commercial styling, controlled lighting, and high-end catalog photography";
        const extra = sentence(state.extraInstruction);
        const closing = sentence(preservation.closing_prompt || preservation.closingPrompt || "No product redesign, distortion, recoloring, material substitution, removal, addition, or modification of any original product detail.");
        return [sentence(quality), extra, closing].filter(Boolean).join(" ");
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

        const intro = [
            sentence(applyTemplate(introTemplate, variables)),
            sentence(compositionGuard(state))
        ].filter(Boolean).join(" ");

        const presentation = buildPresentationBlock(state);
        const quality = buildQualityBlock(state, preservation);

        return [intro, presentation, quality].filter(Boolean).join("\n\n");
    }

    global.ProductCatalogPromptBuilder = { build };
})(window);
