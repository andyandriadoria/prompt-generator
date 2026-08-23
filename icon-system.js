(function () {
  "use strict";

  const paths = {
    sparkles: '<path d="M12 3l1.15 3.1L16 7.25l-2.85 1.15L12 11.5l-1.15-3.1L8 7.25l2.85-1.15L12 3Z"/><path d="M5.5 13.5l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2Z"/><path d="M18.5 12l.55 1.45L20.5 14l-1.45.55L18.5 16l-.55-1.45L16.5 14l1.45-.55L18.5 12Z"/>',
    shirt: '<path d="M8 4.5 5.5 6 3 9l3 2v8h12v-8l3-2-2.5-3L16 4.5c-.7 1-2 1.5-4 1.5S8.7 5.5 8 4.5Z"/>',
    smartphone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M10 5h4M11.25 18.4h1.5"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    gem: '<path d="m4 8 4-4h8l4 4-8 12L4 8Z"/><path d="m8 4 4 4 4-4M4 8h16M12 8v12"/>',
    sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    cassette: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2.1"/><circle cx="15.5" cy="11" r="2.1"/><path d="M7 17h10l-1.2-3H8.2L7 17Z"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 0-3.6h-.7a1.6 1.6 0 0 1 0-3.2H15A6 6 0 0 0 15 3h-3Z"/><circle cx="7.5" cy="9" r=".7"/><circle cx="10" cy="6.5" r=".7"/><circle cx="14" cy="6.2" r=".7"/>',
    brain: '<path d="M9.5 4.5A3 3 0 0 0 6.7 8 3.2 3.2 0 0 0 5 13.8 3.1 3.1 0 0 0 8 18h1.5V4.5ZM14.5 4.5A3 3 0 0 1 17.3 8a3.2 3.2 0 0 1 1.7 5.8A3.1 3.1 0 0 1 16 18h-1.5V4.5Z"/><path d="M9.5 9H8M14.5 9H16M9.5 13H8M14.5 13H16"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    refresh: '<path d="M20 6v5h-5"/><path d="M19 11a7.5 7.5 0 1 0-1.5 5"/>',
    moon: '<path d="M20 15.5A8.2 8.2 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    copy: '<rect x="8" y="8" width="10" height="10" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
    wand: '<path d="m4 20 10-10M11 5l.8-2 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8ZM17 12l.6-1.5.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6Z"/><path d="m3 17 4 4"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5 10a7.5 7.5 0 1 1 2 7"/>',
    check: '<path d="m5 12.5 4 4 10-10"/>',
    shield: '<path d="M12 3 5 6v5c0 4.4 2.8 7.8 7 10 4.2-2.2 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
    warning: '<path d="M12 3 2.7 19h18.6L12 3Z"/><path d="M12 9v4M12 16h.01"/>',
    block: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    chevronDown: '<path d="m7 9.5 5 5 5-5"/>',
    close: '<path d="m7 7 10 10M17 7 7 17"/>',
    light: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };

  function normalize(name) {
    const aliases = {
      "✨":"sparkles","👗":"shirt","📱":"smartphone","🎬":"film","✦":"gem","🌿":"sun","📼":"cassette","🏠":"cube",
      "creative":"sparkles","outfit_catalog":"shirt","outfit-catalog":"shirt"
    };
    return aliases[name] || name || "sparkles";
  }

  function svg(name, className = "ui-icon", title = "") {
    const key = normalize(name);
    const body = paths[key] || paths.sparkles;
    const titleNode = title ? `<title>${String(title).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}</title>` : "";
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${titleNode}${body}</svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll("[data-line-icon]").forEach(node => {
      node.innerHTML = svg(node.dataset.lineIcon, node.dataset.iconClass || "ui-icon");
    });
  }

  window.PromptIcons = { svg, hydrate, normalize };
})();
