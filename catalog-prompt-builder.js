(function (global) {
    "use strict";

    function sentence(text) {
        const clean = String(text || "").trim().replace(/\s+/g, " ");
        if (!clean) return "";
        return /[.!?]$/.test(clean) ? clean : `${clean}.`;
    }

    function paragraph(text) {
        return String(text || "")
            .replace(/\s+([,.!?])/g, "$1")
            .replace(/\.{2,}/g, ".")
            .trim();
    }

    function replaceTokens(text, state) {
        return String(text || "")
            .replace(/\{\{aspect_ratio\}\}/gi, state.aspectRatio || "4:5")
            .replace(/\{\{subject\}\}/gi, state.subject || "the subject")
            .replace(/\{\{catalog_type\}\}/gi, state.catalogType || "a clothing catalog");
    }

    function build(state) {
        const preservation = state.preservation || {};
        const intro = replaceTokens(
            preservation.intro_prompt || preservation.introPrompt ||
            "Without changing the existing outfit in any way, including its exact color, fabric, pattern, texture, cut, proportions, and every original detail, create a photorealistic image in a {{aspect_ratio}} aspect ratio.",
            state
        );

        const subject = String(state.subject || "A person").trim();
        const catalogType = String(state.catalogType || "a clothing catalog").trim();
        const setting = String(state.setting || "").trim();
        const pose = String(state.pose || "Natural pose").trim();
        const shot = String(state.shot || "medium shot").trim();

        let body = `${subject} wearing the exact outfit from the reference image, photographed for ${catalogType}`;
        if (setting) body += ` ${setting}`;
        body = sentence(body);

        const presentation = [pose, state.ageAppropriate ? "age-appropriate presentation" : "", shot]
            .filter(Boolean)
            .map(item => item.replace(/[.]+$/, ""))
            .join(", ");
        if (presentation) body += ` ${sentence(presentation)}`;

        const closingParts = [];
        if (state.closingStyle) closingParts.push(sentence(state.closingStyle));
        const closing = replaceTokens(
            preservation.closing_prompt || preservation.closingPrompt ||
            "No text, no accessories that alter the outfit, and no modification or distortion of the clothing.",
            state
        );
        if (closing) closingParts.push(sentence(closing));
        if (state.extraInstruction) closingParts.push(sentence(state.extraInstruction));

        return [paragraph(sentence(intro)), paragraph(body), paragraph(closingParts.join(" "))]
            .filter(Boolean)
            .join("\n\n");
    }

    global.CatalogPromptBuilder = { build };

    // Reference Outfit Catalog extension. Kept separate so the base builder stays compact.
    if (!document.querySelector('script[data-outfit-focus-style]')) {
        const extension = document.createElement("script");
        extension.src = "outfit-focus-style.js?v=4.5-outfit-focus-1";
        extension.dataset.outfitFocusStyle = "true";
        document.head.append(extension);
    }
})(window);
