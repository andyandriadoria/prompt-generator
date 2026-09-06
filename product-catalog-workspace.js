(function (global) {
    "use strict";

    const MODE_ID = "reference_product_catalog";
    const POSTER_MODE_ID = "reference_product_poster";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        queueMicrotask(init);
    }

    function init() {
        global.addEventListener("promptgen:modechange", schedule);
        schedule();
    }

    function schedule() {
        global.setTimeout(updateBuildDnaLabels, 35);
    }

    function updateBuildDnaLabels() {
        const badgeMode = document.getElementById("activeModeBadge")?.dataset?.mode || "";
        const posterActive = Boolean(global.ProductPosterMode?.isActive?.()) || badgeMode === POSTER_MODE_ID;
        if (posterActive) return;

        const productActive = Boolean(global.ProductCatalogMode?.isActive?.()) || badgeMode === MODE_ID;
        const labels = productActive
            ? ["Product", "Presentation", "Preservation", "Framing", "Scene"]
            : ["Subject", "Scene", "Style", "Framing", "Light"];

        ["dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"].forEach((id, index) => {
            const label = document.querySelector(`#${id} b`);
            if (label) label.textContent = labels[index];
        });
    }
})(window);
