(function () {
    "use strict";

    const POV_STYLE_ID = "neck-down-selfie";
    const FULL_BODY_SHOT_ID = "full-body";

    function selectedId(select) {
        return select?.selectedOptions?.[0]?.dataset?.id || select?.value || "";
    }

    function setSelectById(select, id) {
        if (!select || !id) return false;
        const option = [...select.options].find(item => item.dataset.id === id || item.value === id);
        if (!option) return false;
        if (select.value === option.value) return false;
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function enforcePovOutfitSelfieShot() {
        const focusSelect = document.getElementById("outfitFocusStyle");
        const shotSelect = document.getElementById("catalogShot");
        if (!focusSelect || !shotSelect) return;
        if (selectedId(focusSelect) !== POV_STYLE_ID) return;
        setSelectById(shotSelect, FULL_BODY_SHOT_ID);
    }

    document.addEventListener("change", event => {
        const id = event.target?.id;
        if (id === "outfitFocusStyle" || id === "catalogShot") {
            enforcePovOutfitSelfieShot();
        }
    });

    // Covers restored/local state when the extension loads after the initial selection.
    window.setTimeout(enforcePovOutfitSelfieShot, 300);
    window.setTimeout(enforcePovOutfitSelfieShot, 1000);

    window.OutfitFocusCompatibility = {
        enforcePovOutfitSelfieShot
    };
})();
