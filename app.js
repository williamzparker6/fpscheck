/* =============================================================================
 * app.js — UI for the FPS estimator
 * Custom searchable dropdowns (GPU/CPU/Game/RAM), segmented controls, a radial
 * gauge with count-up, and a preset/resolution comparison chart. Re-renders
 * instantly on every change (no page reload).
 * ========================================================================== */

(function () {
  "use strict";

  const { estimateFps, ratingFor } = window.FpsModel;
  const $ = (id) => document.getElementById(id);
  const ICON = {
    caret: '<svg class="dd-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.6-3.6"/></svg>',
    check: '<svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>',
  };

  /* ---------------------------- App state ---------------------------- */
  const state = {
    gpu: GPUS.find((g) => g.name === "NVIDIA RTX 4070"),
    cpu: CPUS.find((c) => c.name === "AMD Ryzen 5 7600"),
    ramGB: 16,
    ramSpeedMhz: null,
    game: GAMES.find((g) => g.name === "Cyberpunk 2077"),
    resolutionKey: "1080p",
    presetKey: "High",
    chartMode: "preset", // 'preset' | 'resolution'
  };

  // Stable RAM option objects (shared by the dropdown + getValue so reference
  // equality lights up the selected row).
  const RAM_ITEMS = RAM_OPTIONS.map((gb) => ({ name: gb + " GB", gb }));

  /* ======================================================================
   * Custom dropdown component (searchable, grouped, keyboard-accessible)
   * ==================================================================== */
  const openDropdowns = new Set();

  function createDropdown({ rootId, items, getValue, setValue, searchable = true, groupBy = null, placeholder = "Search…" }) {
    const root = $(rootId);
    root.classList.add("dd");
    root.innerHTML =
      `<button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false">
         <span class="dd-value"></span>${ICON.caret}
       </button>
       <div class="dd-panel" hidden role="dialog">
         ${searchable ? `<div class="dd-search">${ICON.search}<input type="text" class="dd-input" placeholder="${placeholder}" autocomplete="off" aria-label="${placeholder}"/></div>` : ""}
         <ul class="dd-list" role="listbox"></ul>
       </div>`;

    const trigger = root.querySelector(".dd-trigger");
    const valueEl = root.querySelector(".dd-value");
    const panel = root.querySelector(".dd-panel");
    const input = root.querySelector(".dd-input");
    const list = root.querySelector(".dd-list");

    let flatItems = [];     // options in displayed order (for keyboard nav)
    let activeIdx = -1;

    const optionLabel = (it) => {
      if (groupBy) { const g = groupBy(it); return it.name.startsWith(g + " ") ? it.name.slice(g.length + 1) : it.name; }
      return it.name;
    };

    function renderList() {
      const q = (input ? input.value : "").trim().toLowerCase();
      const matches = q ? items.filter((it) => it.name.toLowerCase().includes(q)) : items.slice();
      flatItems = matches;
      activeIdx = -1;

      if (!matches.length) { list.innerHTML = '<li class="dd-empty">No match — try another model</li>'; return; }

      const cur = getValue();
      let html = "", lastGroup = null;
      matches.forEach((it, i) => {
        if (groupBy) { const g = groupBy(it); if (g !== lastGroup) { html += `<li class="dd-group">${g}</li>`; lastGroup = g; } }
        const sel = it === cur;
        const meta = it.score !== undefined ? `idx ${it.score}` : "";
        html += `<li class="dd-option ${sel ? "selected" : ""}" role="option" data-i="${i}" aria-selected="${sel}">
                   <span class="opt-name">${sel ? ICON.check : ""}${optionLabel(it)}</span>
                   <span class="meta">${meta}</span>
                 </li>`;
      });
      list.innerHTML = html;
    }

    function setActive(idx) {
      activeIdx = idx;
      list.querySelectorAll(".dd-option").forEach((o) => {
        const on = Number(o.dataset.i) === idx;
        o.classList.toggle("active", on);
        if (on) o.scrollIntoView({ block: "nearest" });
      });
    }

    function open() {
      closeAll(api);
      panel.hidden = false; root.classList.add("open"); trigger.setAttribute("aria-expanded", "true");
      if (input) input.value = "";
      renderList();
      openDropdowns.add(api);
      if (input) setTimeout(() => input.focus(), 0);
    }
    function close() {
      panel.hidden = true; root.classList.remove("open"); trigger.setAttribute("aria-expanded", "false");
      openDropdowns.delete(api);
    }
    function choose(it) { if (!it) return; setValue(it); syncTrigger(); close(); trigger.focus(); }
    function syncTrigger() {
      const cur = getValue();
      valueEl.textContent = cur ? cur.name : "";
      valueEl.classList.toggle("placeholder", !cur);
    }

    trigger.addEventListener("click", () => (panel.hidden ? open() : close()));
    list.addEventListener("mousedown", (e) => {            // mousedown beats input blur
      const li = e.target.closest(".dd-option");
      if (li) { e.preventDefault(); choose(flatItems[Number(li.dataset.i)]); }
    });
    if (input) {
      input.addEventListener("input", renderList);
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(activeIdx + 1, flatItems.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); choose(flatItems[activeIdx >= 0 ? activeIdx : 0]); }
        else if (e.key === "Escape") { e.preventDefault(); close(); trigger.focus(); }
      });
    }

    const api = { close, root };
    syncTrigger();
    return api;
  }

  function closeAll(except) { openDropdowns.forEach((dd) => { if (dd !== except) dd.close(); }); }
  document.addEventListener("click", (e) => {
    openDropdowns.forEach((dd) => { if (!dd.root.contains(e.target)) dd.close(); });
  });

  /* ======================================================================
   * Segmented button groups
   * ==================================================================== */
  function makeSegmented(containerId, keys, getCurrent, onPick) {
    const el = $(containerId);
    el.innerHTML = keys.map((k) => `<button type="button" data-key="${k}">${k}</button>`).join("");
    const sync = () => [...el.children].forEach((b) => b.classList.toggle("active", b.dataset.key === getCurrent()));
    el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; onPick(b.dataset.key); sync(); });
    sync();
  }

  /* ======================================================================
   * Rendering
   * ==================================================================== */
  const GAUGE_C = 2 * Math.PI * 78;         // gauge circle circumference
  const GAUGE_TARGET = 144;                 // a full ring = 144 FPS (high-refresh)

  function compute(presetKey, resolutionKey) {
    return estimateFps({
      gpuScore: state.gpu.score, cpuScore: state.cpu.score,
      ramGB: state.ramGB, ramSpeedMhz: state.ramSpeedMhz,
      game: state.game,
      resolutionKey: resolutionKey || state.resolutionKey,
      presetKey: presetKey || state.presetKey,
    });
  }

  let countAnim = 0;
  function animateNumber(el, to) {
    cancelAnimationFrame(countAnim);
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    if (from === to) { el.textContent = to; return; }
    const start = performance.now(), dur = 480;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);     // easeOutCubic
      el.textContent = Math.round(from + (to - from) * e);
      if (t < 1) countAnim = requestAnimationFrame(step);
    };
    countAnim = requestAnimationFrame(step);
  }

  function ramStatus() {
    if (state.ramGB < 8) return "too low";
    if (state.ramGB < state.game.ramMin) return "a bit low";
    return "ample";
  }

  function render() {
    if (!state.gpu || !state.cpu || !state.game) return;
    const r = compute();
    const rating = ratingFor(r.fps);
    const color = getComputedStyle(document.documentElement).getPropertyValue("--" + rating.cls).trim();

    // Gauge
    animateNumber($("fps-value"), r.fps);
    const prog = $("gauge-prog");
    prog.style.strokeDasharray = GAUGE_C;
    prog.style.strokeDashoffset = GAUGE_C * (1 - Math.max(0, Math.min(r.fps / GAUGE_TARGET, 1)));
    prog.style.stroke = color || "var(--accent)";

    // Rating + meta
    const badge = $("rating-badge");
    badge.textContent = rating.label;
    badge.className = "rating " + rating.cls;
    $("fps-meta").textContent = `${state.game.name} · ${RESOLUTIONS[state.resolutionKey].label} · ${state.presetKey}`;
    $("rating-blurb").textContent = rating.blurb;

    // Stats
    $("stat-gpu").textContent = r.gpuCeiling.toLocaleString() + " FPS";
    $("stat-cpu").textContent = r.cpuCeiling.toLocaleString() + " FPS";
    $("stat-ram").textContent = state.ramGB + " GB";
    $("stat-ram-sub").textContent = ramStatus();

    // Bottleneck
    const bn = $("bottleneck");
    bn.className = "bottleneck k-" + r.bottleneckKind;
    $("bottleneck-icon").textContent = { gpu: "🎮", cpu: "🧠", cap: "🔒", ram: "📉", balanced: "⚖️" }[r.bottleneckKind] || "🔎";
    $("bottleneck-text").textContent = r.bottleneck;

    renderChart();
  }

  function renderChart() {
    let cols, title, currentKey;
    if (state.chartMode === "resolution") {
      cols = Object.keys(RESOLUTIONS).map((k) => ({ key: k, label: k, fps: compute(state.presetKey, k).fps }));
      title = `FPS by resolution · ${state.presetKey} preset`;
      currentKey = state.resolutionKey;
    } else {
      cols = Object.keys(PRESETS).map((k) => ({ key: k, label: k, fps: compute(k, state.resolutionKey).fps }));
      title = `FPS by preset · ${RESOLUTIONS[state.resolutionKey].label}`;
      currentKey = state.presetKey;
    }
    $("chart-title").textContent = title;
    const max = Math.max(...cols.map((c) => c.fps), 1);
    $("chart").innerHTML = cols
      .map((c) => {
        const h = Math.max(4, Math.round((c.fps / max) * 128));
        const cls = c.key === currentKey ? "current" : "dim";
        return `<div class="bar-col ${cls}"><div class="bar-val">${c.fps}</div><div class="bar" style="height:${h}px"></div><div class="bar-label">${c.label}</div></div>`;
      })
      .join("");
  }

  /* ======================================================================
   * Boot
   * ==================================================================== */
  function init() {
    const brandOf = (it) => it.name.split(" ")[0];   // NVIDIA / AMD / Intel

    createDropdown({
      rootId: "dd-gpu", items: GPUS, groupBy: brandOf, placeholder: "Search GPUs e.g. RTX 4070…",
      getValue: () => state.gpu, setValue: (it) => { state.gpu = it; render(); },
    });
    createDropdown({
      rootId: "dd-cpu", items: CPUS, groupBy: brandOf, placeholder: "Search CPUs e.g. i5-13600K…",
      getValue: () => state.cpu, setValue: (it) => { state.cpu = it; render(); },
    });
    createDropdown({
      rootId: "dd-game", items: GAMES, placeholder: "Search games…",
      getValue: () => state.game, setValue: (it) => { state.game = it; render(); },
    });
    createDropdown({
      rootId: "dd-ram", items: RAM_ITEMS, searchable: false,
      getValue: () => RAM_ITEMS.find((i) => i.gb === state.ramGB),
      setValue: (it) => { state.ramGB = it.gb; render(); },
    });

    $("ram-speed").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      state.ramSpeedMhz = v > 0 ? v : null;
      render();
    });

    makeSegmented("seg-res", Object.keys(RESOLUTIONS), () => state.resolutionKey, (k) => { state.resolutionKey = k; render(); });
    makeSegmented("seg-preset", Object.keys(PRESETS), () => state.presetKey, (k) => { state.presetKey = k; render(); });

    const toggle = $("chart-toggle");
    toggle.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.chartMode = b.dataset.mode;
      [...toggle.children].forEach((c) => c.classList.toggle("active", c === b));
      renderChart();
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
