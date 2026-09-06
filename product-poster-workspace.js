(function (global) {
    "use strict";

    const MODE_ID = "reference_product_poster";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        queueMicrotask(init);
    }

    function init() {
        global.addEventListener("promptgen:modechange", schedule);
        document.addEventListener("input", event => {
            if (event.target?.closest?.("#posterFields")) schedule();
        }, true);
        document.addEventListener("change", event => {
            if (event.target?.closest?.("#posterFields")) schedule();
        }, true);
        schedule();
    }

    function schedule() {
        global.setTimeout(updateBuildDnaLabels, 45);
    }

    function updateBuildDnaLabels() {
        const active = Boolean(global.ProductPosterMode?.isActive?.())
            || document.getElementById("activeModeBadge")?.dataset?.mode === MODE_ID;
        if (!active) return;

        const labels = ["Base Photo", "Product Info", "Poster Style", "Ratio", "Text Fidelity"];
        ["dnaSubject", "dnaScene", "dnaStyle", "dnaCamera", "dnaLight"].forEach((id, index) => {
            const label = document.querySelector(`#${id} b`);
            if (label) label.textContent = labels[index];
        });
    }
})(window);
