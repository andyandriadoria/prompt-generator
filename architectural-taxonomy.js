(function (global) {
  "use strict";

  const CUSTOM_ID = "__custom__";

  function parseList(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function fromConfig(config = {}) {
    return {
      buildingCategories: parseList(config.architecturalBuildingCategories),
      buildingTypes: parseList(config.architecturalBuildingTypes),
      styleCategories: parseList(config.architecturalStyleCategories),
      styleOptions: parseList(config.architecturalStyleOptions)
    };
  }

  function normalized(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ");
  }

  function findById(items, id) {
    return (items || []).find(item => item.id === id) || null;
  }

  function findLegacyMatch(items, value) {
    const target = normalized(value);
    if (!target) return null;
    return (items || []).find(item => {
      return [item.id, item.label, item.prompt].some(candidate => normalized(candidate) === target);
    }) || null;
  }

  function itemsForCategory(items, categoryId) {
    if (!categoryId) return [];
    return (items || []).filter(item => item.category_id === categoryId);
  }

  function populateCategorySelect(select, categories, {
    placeholder = "Select Category...",
    selectedId = ""
  } = {}) {
    if (!select) return;
    select.innerHTML = "";
    const first = new Option(placeholder, "");
    first.dataset.placeholder = "true";
    select.append(first);

    (categories || []).forEach(item => {
      const option = new Option(item.label || item.id, item.id || "");
      option.dataset.id = item.id || "";
      option.dataset.description = item.description || "";
      option.dataset.searchText = [item.label, item.description].filter(Boolean).join(" ");
      select.append(option);
    });

    if ([...select.options].some(option => option.value === selectedId)) {
      select.value = selectedId;
    }
  }

  function populateItemSelect(select, items, categoryId, {
    placeholder = "Select...",
    selectedId = "",
    customLabel = "Custom…"
  } = {}) {
    if (!select) return;
    select.innerHTML = "";

    const first = new Option(placeholder, "");
    first.dataset.placeholder = "true";
    select.append(first);

    itemsForCategory(items, categoryId).forEach(item => {
      const option = new Option(item.label || item.id, item.id || "");
      option.dataset.id = item.id || "";
      option.dataset.categoryId = item.category_id || "";
      option.dataset.prompt = item.prompt || "";
      option.dataset.description = item.description || "";
      option.dataset.searchText = [item.label, item.prompt, item.description].filter(Boolean).join(" ");
      select.append(option);
    });

    const custom = new Option(customLabel, CUSTOM_ID);
    custom.dataset.id = CUSTOM_ID;
    custom.dataset.categoryId = categoryId || "";
    custom.dataset.searchText = "custom other manual input";
    select.append(custom);

    if ([...select.options].some(option => option.value === selectedId)) {
      select.value = selectedId;
    }
  }

  function selectedItem(select, items) {
    if (!select || !select.value || select.value === CUSTOM_ID) return null;
    return findById(items, select.value);
  }

  function resolveValue(select, customInput, items) {
    if (!select) return "";
    if (select.value === CUSTOM_ID) return String(customInput?.value || "").trim();
    const item = selectedItem(select, items);
    return String(item?.prompt || item?.label || "").trim();
  }

  function selectedLabel(select, items) {
    if (!select) return "";
    if (select.value === CUSTOM_ID) return "Custom";
    const item = selectedItem(select, items);
    return item?.label || select.selectedOptions?.[0]?.textContent?.trim() || "";
  }

  function selectedDescription(select, items) {
    if (!select || !select.value || select.value === CUSTOM_ID) return "";
    const item = findById(items, select.value);
    return String(item?.description || select.selectedOptions?.[0]?.dataset?.description || "").trim();
  }

  function categoryDescription(select, categories) {
    if (!select || !select.value) return "";
    const item = findById(categories, select.value);
    return String(item?.description || select.selectedOptions?.[0]?.dataset?.description || "").trim();
  }

  function countForCategory(items, categoryId) {
    return itemsForCategory(items, categoryId).length;
  }

  function deriveRestore({
    items = [],
    categoryId = "",
    itemId = "",
    customValue = "",
    legacyValue = ""
  } = {}) {
    if (itemId === CUSTOM_ID) {
      return {
        categoryId: categoryId || "",
        itemId: CUSTOM_ID,
        customValue: String(customValue || legacyValue || "").trim()
      };
    }

    const direct = findById(items, itemId);
    if (direct) {
      return {
        categoryId: direct.category_id || categoryId || "",
        itemId: direct.id,
        customValue: ""
      };
    }

    const matched = findLegacyMatch(items, legacyValue);
    if (matched) {
      return {
        categoryId: matched.category_id || categoryId || "",
        itemId: matched.id,
        customValue: ""
      };
    }

    const custom = String(customValue || legacyValue || "").trim();
    if (custom) {
      return {
        categoryId: categoryId || "",
        itemId: CUSTOM_ID,
        customValue: custom
      };
    }

    return {
      categoryId: categoryId || "",
      itemId: "",
      customValue: ""
    };
  }

  function setCustomVisibility(select, row, input) {
    const show = select?.value === CUSTOM_ID;
    if (row) row.hidden = !show;
    if (input) {
      input.disabled = !show;
      if (!show) input.removeAttribute("aria-invalid");
    }
    return show;
  }

  global.ArchitecturalTaxonomy = {
    CUSTOM_ID,
    fromConfig,
    findById,
    findLegacyMatch,
    itemsForCategory,
    populateCategorySelect,
    populateItemSelect,
    selectedItem,
    selectedLabel,
    selectedDescription,
    categoryDescription,
    countForCategory,
    resolveValue,
    deriveRestore,
    setCustomVisibility
  };
})(window);
