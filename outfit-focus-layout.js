(function (global) {
    "use strict";

    let attempts = 0;

    function installSettingHistoryMigration() {
        if (document.querySelector('script[data-setting-history-migration]')) return;
        const migration = document.createElement("script");
        migration.src = "setting-history-migration.js?v=4.5-settings-id-1";
        migration.dataset.settingHistoryMigration = "true";
        document.head.append(migration);
    }

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
        installSettingHistoryMigration();
        placeOutfitFocusField();
        global.addEventListener("promptgen:modechange", () => global.setTimeout(placeOutfitFocusField, 30));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})(window);
