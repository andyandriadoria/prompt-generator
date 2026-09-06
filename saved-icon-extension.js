(function (global) {
    "use strict";

    const EXTRA_PATHS = Object.freeze({
        bookmark: '<path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V21l-5-3-5 3V4.5Z"/>',
        image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4.5 3 3 2-2L19 18"/>',
        upload: '<path d="M12 16V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
        edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'
    });

    function install(attempt = 0) {
        const icons = global.PromptIcons;
        if (!icons?.svg) {
            if (attempt < 80) global.setTimeout(() => install(attempt + 1), 50);
            return;
        }
        if (icons.svg.__savedIconExtension) return;

        const baseSvg = icons.svg.bind(icons);
        const baseNormalize = typeof icons.normalize === "function" ? icons.normalize.bind(icons) : value => value;

        function svg(name, className = "ui-icon", title = "") {
            const key = String(name || "");
            const body = EXTRA_PATHS[key];
            if (!body) return baseSvg(name, className, title);
            const titleNode = title
                ? `<title>${String(title).replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]))}</title>`
                : "";
            return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${titleNode}${body}</svg>`;
        }
        svg.__savedIconExtension = true;

        function normalize(name) {
            const key = String(name || "");
            return EXTRA_PATHS[key] ? key : baseNormalize(name);
        }

        global.PromptIcons = { ...icons, svg, normalize };
        global.PromptIcons.hydrate?.(document);
    }

    install();
})(window);
