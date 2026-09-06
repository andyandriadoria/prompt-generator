(function (global) {
  "use strict";

  let pane, items = [], selectedId = "", editingId = "", draftBlob = null, removeDraft = false, urls = [], draftUrl = "", initialized = false;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryInit, { once: true }); else queueMicrotask(tryInit);
  global.addEventListener("promptgen:workspace-shell-ready", tryInit);

  function tryInit(attempt = 0) {
    if (initialized) return;
    pane = document.getElementById("workspace-saved");
    if (!pane || !global.PromptSavedStore) { if (attempt < 80) setTimeout(() => tryInit(attempt + 1), 60); return; }
    initialized = true; build(); injectSaveButton(); buildModal(); bind(); start();
  }

  async function start() {
    if (!global.indexedDB) return fail("Saved Prompt Library needs IndexedDB, which is unavailable in this browser.");
    try { await global.PromptSavedStore.ready(); await global.PromptSavedStore.migrateLegacy(); await refresh(); }
    catch (error) { console.warn(error); fail("Saved Prompt Library could not initialize local browser storage."); }
  }

  function build() {
    pane.classList.remove("workspace-placeholder"); pane.classList.add("saved-workspace");
    pane.innerHTML = `
      <div class="saved-head panel"><div class="saved-head-copy"><span class="saved-kicker">${icon("bookmark")}Saved Prompt Library · Local</span><h2>Keep prompt recipes that already work</h2><p>Save the complete Build state together with a generated result image, then restore it later as a reusable prompt template.</p></div><div class="saved-head-actions"><div class="saved-capacity"><strong id="savedCount">0</strong><span>saved</span></div><button type="button" class="primary-button" id="savedNewBtn">${icon("bookmark")}<span>Save Current Prompt</span></button></div></div>
      <div class="saved-layout">
        <section class="panel saved-browser"><div class="saved-browser-head"><div><span class="saved-section-label">Library</span><h3>Saved templates</h3></div><span class="saved-browser-count" id="savedBrowserCount">0 items</span></div>
          <div class="saved-toolbar"><label class="saved-search-wrap">${icon("search")}<input type="search" id="savedSearch" placeholder="Search saved prompts" autocomplete="off"></label><select id="savedModeFilter"><option value="all">All modes</option><option value="creative">Creative</option><option value="outfit_catalog">Outfit Catalog</option><option value="reference_product_catalog">Product Catalog</option><option value="reference_product_poster">Product Poster</option></select></div>
          <div class="saved-grid" id="savedGrid"></div><div class="saved-empty" id="savedEmpty" hidden>${icon("bookmark")}<strong>No saved templates yet</strong><p>Build a prompt, press Save Prompt, then attach the generated result image.</p><button type="button" class="primary-button" id="savedEmptyBuildBtn">${icon("wand")}<span>Go to Build</span></button></div>
        </section>
        <aside class="panel saved-preview"><div class="saved-preview-head"><div><span class="saved-section-label">Template</span><h3 id="savedPreviewTitle">Select a saved template</h3></div><span class="saved-preview-mode" id="savedPreviewMode">—</span></div>
          <div class="saved-result-image" id="savedResultImage"></div>
          <div class="saved-preview-meta" id="savedPreviewMeta" hidden><div><span>Saved</span><strong id="savedPreviewTime">—</strong></div><div><span>Style</span><strong id="savedPreviewStyle">—</strong></div><div><span>Length</span><strong id="savedPreviewLength">—</strong></div></div>
          <div class="saved-notes" id="savedNotes" hidden><span>Notes</span><p id="savedNotesText"></p></div>
          <div class="saved-editor-shell"><div class="saved-editor-topline"><span>saved/prompt.txt</span><span>LOCAL</span></div><textarea id="savedPromptPreview" readonly></textarea></div>
          <div class="saved-preview-actions"><button type="button" class="primary-button" id="savedRestoreBtn" disabled>${icon("refresh")}<span>Restore to Build</span></button><button type="button" class="secondary-button" id="savedCopyBtn" disabled>${icon("copy")}<span>Copy Prompt</span></button><button type="button" class="secondary-button" id="savedEditBtn" disabled>${icon("edit")}<span>Edit / Image</span></button><button type="button" class="ghost-button saved-delete-button" id="savedDeleteBtn" disabled>${icon("close")}<span>Delete</span></button></div><p class="saved-status" id="savedStatus" aria-live="polite"></p>
        </aside>
      </div>`;
  }

  function injectSaveButton() {
    if (document.getElementById("savePromptBtn")) return;
    const generate = document.getElementById("generatePromptBtn"); if (!generate) return;
    const button = document.createElement("button"); button.type = "button"; button.id = "savePromptBtn"; button.className = "secondary-button saved-build-button"; button.innerHTML = `${icon("bookmark")}<span>Save Prompt</span>`; generate.insertAdjacentElement("afterend", button);
  }

  function buildModal() {
    if (document.getElementById("savedEditorModal")) return;
    const modal = document.createElement("div"); modal.id = "savedEditorModal"; modal.className = "saved-modal"; modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `<div class="saved-modal-backdrop" data-saved-close></div><div class="saved-modal-card panel"><div class="saved-modal-head"><div><span class="saved-section-label">Reusable Template</span><h3 id="savedEditorTitle">Save current prompt</h3></div><button type="button" class="saved-modal-close" data-saved-close aria-label="Close">${icon("close")}</button></div>
      <div class="saved-modal-body"><label class="saved-modal-field"><span>Template Name</span><input id="savedEditorName" type="text" maxlength="120"></label><label class="saved-modal-field"><span>Notes <small>optional</small></span><textarea id="savedEditorNotes" rows="3" maxlength="800" placeholder="Example: most natural result; keep this shot and lighting"></textarea></label>
      <div class="saved-image-field"><div class="saved-image-field-head"><div><span>Generated Result Image</span><small>recommended · JPG, PNG, WebP</small></div><button type="button" class="ghost-button" id="savedRemoveImageBtn" hidden>${icon("close")}<span>Remove Image</span></button></div><button type="button" class="saved-image-drop" id="savedImageDrop">${icon("upload")}<strong>Choose, drop, or paste your generated image</strong><small>Stored locally in this browser.</small><img id="savedEditorImagePreview" alt="Generated result preview" hidden></button><input id="savedImageInput" type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden></div><div class="saved-modal-summary" id="savedModalSummary"></div></div>
      <div class="saved-modal-actions"><button type="button" class="ghost-button" data-saved-close>Cancel</button><button type="button" class="primary-button" id="savedEditorCommitBtn">${icon("bookmark")}<span>Save to Library</span></button></div></div>`;
    document.body.append(modal);
  }

  function bind() {
    document.addEventListener("click", e => {
      if (e.target.closest("#savePromptBtn,#savedNewBtn")) { e.preventDefault(); openCurrent(); }
      else if (e.target.closest("[data-saved-close]")) closeModal();
    });
    byId("savedGrid")?.addEventListener("click", e => { const card = e.target.closest("[data-saved-id]"); if (card) { selectedId = card.dataset.savedId; render(); } });
    byId("savedSearch")?.addEventListener("input", render); byId("savedModeFilter")?.addEventListener("change", render);
    byId("savedRestoreBtn")?.addEventListener("click", restore); byId("savedCopyBtn")?.addEventListener("click", copy); byId("savedEditBtn")?.addEventListener("click", edit); byId("savedDeleteBtn")?.addEventListener("click", del);
    byId("savedEmptyBuildBtn")?.addEventListener("click", () => global.PromptWorkspaceTabs?.setActive?.("build"));
    byId("savedImageDrop")?.addEventListener("click", () => byId("savedImageInput")?.click());
    byId("savedImageInput")?.addEventListener("change", e => { const file = e.target.files?.[0]; if (file) acceptImage(file); e.target.value = ""; });
    byId("savedRemoveImageBtn")?.addEventListener("click", e => { e.preventDefault(); draftBlob = null; removeDraft = true; renderDraft(); });
    byId("savedEditorCommitBtn")?.addEventListener("click", commit);
    const drop = byId("savedImageDrop"); ["dragenter","dragover"].forEach(t => drop?.addEventListener(t, e => { e.preventDefault(); drop.classList.add("is-dragging"); })); ["dragleave","drop"].forEach(t => drop?.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("is-dragging"); }));
    drop?.addEventListener("drop", e => { const file = [...(e.dataTransfer?.files || [])].find(x => x.type.startsWith("image/")); if (file) acceptImage(file); });
    byId("savedEditorModal")?.addEventListener("paste", e => { const clip = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith("image/")); const file = clip?.getAsFile?.(); if (file) { e.preventDefault(); acceptImage(file); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !byId("savedEditorModal")?.hidden) closeModal(); });
    global.addEventListener("promptgen:workspacechange", e => { if (e.detail?.workspace === "saved") refresh(); });
  }

  async function refresh() { items = await global.PromptSavedStore.list(); if (selectedId && !items.some(x => x.id === selectedId)) selectedId = ""; if (!selectedId && items.length) selectedId = items[0].id; render(); }
  function render() { revokeUrls(); const q = value("savedSearch").trim().toLowerCase(), mode = value("savedModeFilter") || "all"; const filtered = items.filter(x => (mode === "all" || x.mode === mode) && (!q || [x.title,x.notes,x.prompt,x.modeLabel,x.styleLabel].filter(Boolean).join(" ").toLowerCase().includes(q))); const grid = byId("savedGrid"); grid.innerHTML = ""; byId("savedBrowserCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`; byId("savedEmpty").hidden = items.length > 0;
    if (!filtered.length && items.length) grid.innerHTML = `<div class="saved-no-results">${icon("search")}<strong>No matching saved templates</strong><p>Try another search or mode filter.</p></div>`;
    filtered.forEach(x => { const card = document.createElement("button"); card.type = "button"; card.className = `saved-card${x.id === selectedId ? " is-active" : ""}`; card.dataset.savedId = x.id; const visual = x.imageBlob ? `<img src="${url(x.imageBlob)}" alt="${esc(x.title || "Saved result")}">` : `<span class="saved-card-placeholder">${icon("image")}<small>No image</small></span>`; card.innerHTML = `<span class="saved-card-image">${visual}${x.legacy ? '<i>Legacy</i>' : ""}</span><span class="saved-card-copy"><span class="saved-card-mode">${icon(global.PromptSavedStore.modeIcon(x.mode))}${esc(global.PromptSavedStore.shortMode(x.mode))}</span><strong>${esc(x.title || "Saved Prompt")}</strong><span>${esc(x.styleLabel || "Custom")}</span><time>${date(x.updatedAt || x.createdAt)}</time></span>`; grid.append(card); });
    renderPreview(); byId("savedCount").textContent = String(items.length); updateTab(items.length);
  }

  function renderPreview() { const x = items.find(i => i.id === selectedId), disabled = !x; ["savedRestoreBtn","savedCopyBtn","savedEditBtn","savedDeleteBtn"].forEach(id => { byId(id).disabled = disabled; }); byId("savedPreviewMeta").hidden = disabled; byId("savedNotes").hidden = !x?.notes; if (!x) { byId("savedPreviewTitle").textContent = "Select a saved template"; byId("savedPreviewMode").textContent = "—"; byId("savedPromptPreview").value = ""; byId("savedResultImage").innerHTML = `<div class="saved-result-placeholder">${icon("image")}<span>No result image attached</span></div>`; return; }
    byId("savedPreviewTitle").textContent = x.title || "Saved Prompt"; byId("savedPreviewMode").textContent = global.PromptSavedStore.shortMode(x.mode); byId("savedPreviewTime").textContent = dateTime(x.updatedAt || x.createdAt); byId("savedPreviewStyle").textContent = x.styleLabel || "Custom"; byId("savedPreviewLength").textContent = `${x.prompt.length.toLocaleString()} characters`; byId("savedPromptPreview").value = x.prompt; byId("savedNotesText").textContent = x.notes || ""; byId("savedResultImage").innerHTML = x.imageBlob ? `<img src="${url(x.imageBlob)}" alt="${esc(x.title || "Saved result")}">` : `<div class="saved-result-placeholder">${icon("image")}<span>No result image attached</span></div>`;
  }

  function openCurrent() { const prompt = byId("output")?.value?.trim() || ""; if (!prompt) return message("Build or generate a prompt before saving it."); editingId = ""; draftBlob = null; removeDraft = false; byId("savedEditorTitle").textContent = "Save current prompt"; byId("savedEditorName").value = global.PromptSavedStore.suggestTitle(); byId("savedEditorNotes").value = ""; byId("savedEditorCommitBtn").innerHTML = `${icon("bookmark")}<span>Save to Library</span>`; byId("savedModalSummary").textContent = `${prompt.length.toLocaleString()} characters · complete Build state will be stored.`; renderDraft(); openModal(); }
  function edit() { const x = items.find(i => i.id === selectedId); if (!x) return; editingId = x.id; draftBlob = x.imageBlob || null; removeDraft = false; byId("savedEditorTitle").textContent = "Edit saved template"; byId("savedEditorName").value = x.title || "Saved Prompt"; byId("savedEditorNotes").value = x.notes || ""; byId("savedEditorCommitBtn").innerHTML = `${icon("check")}<span>Update Saved Template</span>`; byId("savedModalSummary").textContent = `${global.PromptSavedStore.modeLabel(x.mode)} · ${x.prompt.length.toLocaleString()} characters`; renderDraft(); openModal(); }
  function openModal() { byId("savedEditorModal").hidden = false; document.body.classList.add("saved-modal-open"); setTimeout(() => byId("savedEditorName")?.focus(), 0); }
  function closeModal() { byId("savedEditorModal").hidden = true; document.body.classList.remove("saved-modal-open"); if (draftUrl) URL.revokeObjectURL(draftUrl); draftUrl = ""; editingId = ""; draftBlob = null; removeDraft = false; }
  async function acceptImage(file) { try { draftBlob = await global.PromptSavedStore.normalizeImage(file); removeDraft = false; renderDraft(); } catch (e) { console.warn(e); status("Could not process that image. Try JPG, PNG, or WebP.", "error"); } }
  function renderDraft() { if (draftUrl) URL.revokeObjectURL(draftUrl); draftUrl = ""; const img = byId("savedEditorImagePreview"), remove = byId("savedRemoveImageBtn"), drop = byId("savedImageDrop"); if (!draftBlob) { img.hidden = true; img.removeAttribute("src"); remove.hidden = true; drop.classList.remove("has-image"); return; } draftUrl = URL.createObjectURL(draftBlob); img.src = draftUrl; img.hidden = false; remove.hidden = false; drop.classList.add("has-image"); }

  async function commit() { const button = byId("savedEditorCommitBtn"); button.disabled = true; try { if (editingId) { const x = await global.PromptSavedStore.get(editingId); if (!x) throw new Error("Missing saved item"); x.title = value("savedEditorName").trim() || "Saved Prompt"; x.notes = value("savedEditorNotes").trim(); x.updatedAt = Date.now(); if (removeDraft) x.imageBlob = null; else if (draftBlob) x.imageBlob = draftBlob; await global.PromptSavedStore.put(x); selectedId = x.id; } else { const prompt = byId("output")?.value?.trim() || ""; if (!prompt) throw new Error("No prompt"); const x = global.PromptSavedStore.snapshot(prompt); x.title = value("savedEditorName").trim() || x.title || "Saved Prompt"; x.notes = value("savedEditorNotes").trim(); x.imageBlob = draftBlob || null; await global.PromptSavedStore.put(x); selectedId = x.id; navigator.storage?.persist?.().catch?.(() => {}); message("Prompt saved to Saved Library."); } closeModal(); await refresh(); status("Saved template ready.", "success"); } catch (e) { console.warn(e); status("Could not save this prompt. Browser storage may be unavailable or full.", "error"); } finally { button.disabled = false; } }
  async function restore() { const x = items.find(i => i.id === selectedId); if (!x) return; try { const missing = await global.PromptSavedStore.restore(x); message(missing.length ? `Template restored with ${missing.length} unavailable option${missing.length === 1 ? "" : "s"}.` : "Saved template restored to Build."); } catch (e) { console.warn(e); status("Could not restore this template. Refresh the database and try again.", "error"); } }
  async function copy() { const x = items.find(i => i.id === selectedId); if (!x) return; try { await navigator.clipboard.writeText(x.prompt); status("Prompt copied to clipboard.", "success"); } catch (_) { status("Could not copy the prompt.", "error"); } }
  async function del() { const x = items.find(i => i.id === selectedId); if (!x || !confirm(`Delete “${x.title || "Saved Prompt"}” from this browser?`)) return; await global.PromptSavedStore.remove(x.id); selectedId = ""; await refresh(); status("Saved template deleted.", "success"); }

  function fail(text) { status(text, "error"); byId("savePromptBtn").disabled = true; byId("savedNewBtn").disabled = true; }
  function updateTab(count) { const tab = byId("workspace-tab-saved"); if (!tab) return; let badge = tab.querySelector(".workspace-tab-count"); if (!badge) { badge = document.createElement("span"); badge.className = "workspace-tab-count"; tab.append(badge); } badge.textContent = count > 99 ? "99+" : String(count); badge.hidden = !count; }
  function status(text, tone = "info") { const el = byId("savedStatus"); if (el) { el.textContent = text; el.dataset.tone = tone; } }
  function message(text) { const box = byId("messageBox"); if (!box) return; box.textContent = text; box.classList.add("is-visible"); clearTimeout(message.timer); message.timer = setTimeout(() => box.classList.remove("is-visible"), 2500); }
  function value(id) { return byId(id)?.value || ""; } function byId(id) { return document.getElementById(id); } function icon(name) { return global.PromptIcons?.svg?.(name) || ""; }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function date(t) { return new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(t || Date.now())); } function dateTime(t) { return new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(t || Date.now())); }
  function url(blob) { const u = URL.createObjectURL(blob); urls.push(u); return u; } function revokeUrls() { urls.forEach(URL.revokeObjectURL); urls = []; }

  global.PromptSaved = { refresh, open: openCurrent, count: () => items.length };
})(window);
