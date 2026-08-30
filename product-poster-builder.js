(function (global) {
    "use strict";

    function clean(value) {
        return String(value == null ? "" : value).trim();
    }

    function build(state = {}) {
        const aspectRatio = clean(state.aspectRatio) || "4:5";
        const productInformation = clean(state.productInformation);
        const extraInstruction = clean(state.extraInstruction);

        const productBlock = [
            `Aspect Ratio: ${aspectRatio}`,
            productInformation
        ].filter(Boolean).join("\n");

        const blocks = [
`Use the provided image as the direct base image and transform it into a clean premium product poster.

Preserve the original photograph exactly as it is. Do not change, regenerate, retouch, redesign, crop, reposition, distort, or alter the model, face, expression, hijab, outfit, accessories, pose, body proportions, product details, background, lighting, shadows, framing, camera angle, or any other original visual element within the original photograph.

Treat the original photograph as a locked base layer. If the selected aspect ratio differs from the original photograph, do not crop, stretch, distort, or reframe the original image. Keep the complete original photograph intact and extend only the surrounding canvas beyond the original frame as needed to reach the requested aspect ratio. Any newly added canvas area must continue the existing background naturally and seamlessly without changing the original photograph itself.

The photograph itself must remain visually unchanged. Only add typography, product information, minimalist icons, and subtle graphic elements needed for the poster layout.`,
`PRODUCT INFORMATION

${productBlock}`,
`POSTER DESIGN

Create a refined premium editorial product poster with a clean, modern, boutique-like aesthetic.

Use the available negative space in the original photograph intelligently. Do not place text or graphic elements over important parts of the product or model.

Create a clear visual hierarchy:

- Brand: small and understated
- Product Name: primary headline
- Price: clear secondary information
- Details: supporting information arranged neatly below or beside the main information

For every item under “Details”, create one small minimalist monoline icon that visually represents the meaning of that specific detail.

The icons must:
- be simple and elegant
- use thin consistent linework
- have the same visual style throughout
- be visually relevant to each detail
- remain secondary to the text
- never use emoji
- never use colorful illustrations
- never appear decorative or playful

The number of detail items is flexible. Automatically adapt the layout according to however many details are provided while keeping comfortable spacing and visual balance.

Use elegant typography, restrained graphic elements, generous spacing, and a color palette that harmonizes naturally with the existing photograph.

Keep the overall design premium, editorial, clean, tasteful, and not crowded.

Use all supplied text exactly as written. Do not change product names, brand names, prices, numbers, measurements, spelling, or product information. Do not invent any information that was not provided.`
        ];

        if (extraInstruction) {
            blocks.push(`ADDITIONAL INSTRUCTION\n\n${extraInstruction}`);
        }

        return blocks.join("\n\n");
    }

    global.ProductPosterPromptBuilder = { build };
})(window);
