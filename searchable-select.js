(function (global) {
    "use strict";

    let uid = 0;

    class SearchableSelectControl {
        constructor(select, options = {}) {
            if (!select) throw new Error("SearchableSelect requires a native select element.");
            this.select = select;
            this.options = options;
            this.id = `searchable-select-${++uid}`;
            this.mode = "prioritize";
            this.rankings = new Map();
            this.opened = false;
            this.activeIndex = -1;
            this.filteredItems = [];
            this.build();
            this.refresh();
            this.bind();
        }

        build() {
            this.select.classList.add("searchable-native-select");
            this.wrapper = document.createElement("div");
            this.wrapper.className = "searchable-select";

            this.inputWrap = document.createElement("div");
            this.inputWrap.className = "searchable-input-wrap";

            this.input = document.createElement("input");
            this.input.type = "search";
            this.input.className = "searchable-input";
            this.input.autocomplete = "off";
            this.input.spellcheck = false;
            this.input.setAttribute("role", "combobox");
            this.input.setAttribute("aria-autocomplete", "list");
            this.input.setAttribute("aria-expanded", "false");
            this.input.setAttribute("aria-controls", `${this.id}-menu`);

            this.clearButton = document.createElement("button");
            this.clearButton.type = "button";
            this.clearButton.className = "searchable-clear";
            this.clearButton.setAttribute("aria-label", "Clear selection");
            this.clearButton.textContent = "×";

            this.arrow = document.createElement("span");
            this.arrow.className = "searchable-arrow";
            this.arrow.setAttribute("aria-hidden", "true");

            this.menu = document.createElement("div");
            this.menu.id = `${this.id}-menu`;
            this.menu.className = "searchable-menu";
            this.menu.setAttribute("role", "listbox");

            this.inputWrap.append(this.input, this.clearButton, this.arrow);
            this.wrapper.append(this.inputWrap, this.menu);
            this.select.insertAdjacentElement("afterend", this.wrapper);
        }

        bind() {
            this.input.addEventListener("focus", () => {
                this.open();
                this.input.select();
            });
            this.input.addEventListener("input", () => {
                this.open();
                this.render(this.input.value);
            });
            this.input.addEventListener("keydown", event => this.handleKeydown(event));
            this.clearButton.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                this.clear();
            });
            this.arrow.addEventListener("mousedown", event => {
                event.preventDefault();
                this.opened ? this.close() : this.open();
                this.input.focus();
            });
            this.select.addEventListener("change", () => this.syncFromNative());
            document.addEventListener("mousedown", event => {
                if (!this.wrapper.contains(event.target)) this.close();
            });
        }

        refresh() {
            this.placeholder = this.select.options[0]?.textContent?.trim() || "Search and select…";
            this.items = [];
            let index = 0;
            [...this.select.children].forEach(node => {
                if (node.tagName === "OPTGROUP") {
                    [...node.children].forEach(option => {
                        this.items.push(this.optionToItem(option, node.label, index++));
                    });
                } else if (node.tagName === "OPTION") {
                    this.items.push(this.optionToItem(node, "", index++));
                }
            });
            this.syncFromNative();
            this.render("");
        }

        optionToItem(option, group, index) {
            return {
                option,
                value: option.value,
                label: option.textContent.trim(),
                id: option.dataset.id || "",
                group: group || option.dataset.category || "",
                category: option.dataset.category || group || "",
                tags: option.dataset.tags || "",
                searchText: option.dataset.searchText || "",
                disabled: option.disabled,
                originalIndex: index
            };
        }

        syncFromNative() {
            const option = this.select.selectedOptions[0];
            const hasValue = option && String(option.value || "").trim() !== "";
            this.input.value = option ? option.textContent.trim() : "";
            this.input.placeholder = this.placeholder;
            this.clearButton.hidden = !hasValue;
            this.wrapper.classList.toggle("is-filled", hasValue);
            if (!this.opened) this.input.setAttribute("aria-expanded", "false");
        }

        setDisabled(disabled) {
            this.input.disabled = disabled;
            this.clearButton.disabled = disabled;
            this.wrapper.classList.toggle("is-disabled", disabled);
        }

        setCompatibility(rankings, mode = "prioritize") {
            this.rankings = rankings instanceof Map ? rankings : new Map();
            this.mode = mode || "prioritize";
            this.render(this.opened ? this.input.value : "");
        }

        resetCompatibility() {
            this.rankings = new Map();
            this.mode = "all";
            this.render(this.opened ? this.input.value : "");
        }

        open() {
            if (this.input.disabled) return;
            this.opened = true;
            this.wrapper.classList.add("is-open");
            this.input.setAttribute("aria-expanded", "true");
            this.render(this.input.value === this.selectedLabel() ? "" : this.input.value);
        }

        close() {
            this.opened = false;
            this.wrapper.classList.remove("is-open");
            this.input.setAttribute("aria-expanded", "false");
            this.activeIndex = -1;
            this.syncFromNative();
        }

        clear() {
            const clearOption = this.items.find(item => item.value === "") || this.items[0];
            if (!clearOption) return;
            this.choose(clearOption);
        }

        selectedLabel() {
            return this.select.selectedOptions[0]?.textContent?.trim() || "";
        }

        choose(item) {
            if (!item || item.disabled) return;
            this.select.value = item.value;
            this.select.dispatchEvent(new Event("change", { bubbles: true }));
            this.syncFromNative();
            this.close();
        }

        render(query = "") {
            const normalizedQuery = String(query || "").trim().toLowerCase();
            const selectedValue = this.select.value;
            let filtered = this.items.filter(item => {
                if (item.disabled) return false;
                const ranking = this.rankings.get(item.id);
                const hiddenByMode = this.mode === "hide"
                    && ranking
                    && ["poor", "blocked"].includes(ranking.level)
                    && item.value !== selectedValue;
                if (hiddenByMode) return false;
                if (!normalizedQuery) return true;
                const haystack = [item.label, item.group, item.category, item.tags, item.searchText]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(normalizedQuery);
            });

            if (this.mode === "prioritize" && this.rankings.size) {
                filtered = filtered.slice().sort((a, b) => {
                    if (a.value === "" && b.value !== "") return -1;
                    if (b.value === "" && a.value !== "") return 1;
                    const scoreA = this.rankings.get(a.id)?.score ?? 100;
                    const scoreB = this.rankings.get(b.id)?.score ?? 100;
                    return scoreB - scoreA || a.originalIndex - b.originalIndex;
                });
            }

            this.filteredItems = filtered;
            this.activeIndex = -1;
            this.menu.innerHTML = "";

            if (!filtered.length) {
                const empty = document.createElement("div");
                empty.className = "searchable-empty";
                empty.textContent = "No matching options";
                this.menu.append(empty);
                return;
            }

            let currentGroup = null;
            filtered.forEach((item, filteredIndex) => {
                if (item.group && item.group !== currentGroup) {
                    currentGroup = item.group;
                    const group = document.createElement("div");
                    group.className = "searchable-group";
                    group.textContent = currentGroup;
                    this.menu.append(group);
                }

                const ranking = this.rankings.get(item.id);
                const button = document.createElement("button");
                button.type = "button";
                button.className = "searchable-option";
                button.setAttribute("role", "option");
                button.setAttribute("aria-selected", item.value === selectedValue ? "true" : "false");
                button.dataset.index = String(filteredIndex);
                if (ranking) button.dataset.level = ranking.level;

                const copy = document.createElement("span");
                copy.className = "searchable-option-copy";
                const label = document.createElement("span");
                label.className = "searchable-option-label";
                label.textContent = item.label;
                copy.append(label);

                if (item.tags) {
                    const meta = document.createElement("small");
                    meta.className = "searchable-option-meta";
                    meta.textContent = item.tags.split(",").slice(0, 4).join(" · ");
                    copy.append(meta);
                }
                button.append(copy);

                if (ranking && item.value !== "") {
                    const badge = document.createElement("span");
                    badge.className = `compatibility-option-badge is-${ranking.level}`;
                    badge.textContent = String(ranking.score);
                    badge.title = ranking.messages?.[0]?.text || ranking.label;
                    button.append(badge);
                }

                button.addEventListener("mousedown", event => event.preventDefault());
                button.addEventListener("click", () => this.choose(item));
                this.menu.append(button);
            });
        }

        handleKeydown(event) {
            if (event.key === "Escape") {
                this.close();
                return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!this.opened) this.open();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                this.activeIndex += direction;
                if (this.activeIndex < 0) this.activeIndex = this.filteredItems.length - 1;
                if (this.activeIndex >= this.filteredItems.length) this.activeIndex = 0;
                this.highlightActive();
                return;
            }
            if (event.key === "Enter" && this.opened && this.activeIndex >= 0) {
                event.preventDefault();
                this.choose(this.filteredItems[this.activeIndex]);
            }
        }

        highlightActive() {
            const buttons = [...this.menu.querySelectorAll(".searchable-option")];
            buttons.forEach(button => button.classList.remove("is-active"));
            const active = buttons.find(button => Number(button.dataset.index) === this.activeIndex);
            if (active) {
                active.classList.add("is-active");
                active.scrollIntoView({ block: "nearest" });
            }
        }
    }

    global.SearchableSelectControl = SearchableSelectControl;
})(window);
