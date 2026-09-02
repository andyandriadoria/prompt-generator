(function (global) {
    "use strict";

    let attempts = 0;

    function placeOutfitFocusField() {
        const row = document.getElementById("outfitFocusStyleRow");
        const subject = document.getElementById("catalogSubject");
        const customSubjectRow = document.getElementById("catalogCustomSubjectRow");
        const anchor = customSubjectRow || subject?.closest(".field-row");

        if (!row || !anchor) {
            if (attempts++ < 100) global.setTimeout(placeOutfitFocusField, 80);
            return;
        }

        if (row.previousElementSibling !== anchor) {
            anchor.insertAdjacentElement("afterend", row);
        }

        const helper = row.querySelector(".help-text");
        if (helper) {
            helper.textContent = "Choose the outfit presentation style before pose and shot. Some styles can control or override conflicting pose or framing.";
        }
    }

    function init() {
        placeOutfitFocusField();
        global.addEventListener("promptgen:modechange", () => global.setTimeout(placeOutfitFocusField, 30));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})(window);
