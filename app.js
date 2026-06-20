/* =============================================================================
 * app.js — UI wiring for the FPS estimator
 * Builds the searchable dropdowns + segmented controls, holds the form state,
 * and re-renders results instantly on every change (no page reload).
 * ========================================================================== */

(function () {
  "use strict";

  const { estimateFps, ratingFor } = window.FpsModel;
  const $ = (id) => document.getElementById(id);

  // --- Form state (sensible defaults so the page shows a result on load) ---
  const state = {
    gpu: GPUS.find((g) => g.name === "NVIDIA RTX 4070"),
    cpu: CPUS.find((c) => c.name === "AMD Ryzen 5 7600"),
    ramGB: 16,
    ramSpeedMhz: null,
    game: GAMES.find((g) => g.name === "Cyberpunk 2077"),
    resolutionKey: "1080p",
    presetKey: "High",
  };

  /* ----------------------------------------------------------------------
   * Searchable combobox (reusable for GPU + CPU)
   * -------------------------------------------------------------------- */
  function makeCombo({ inputId, listId, items, getInitial, onPick }) {
    const input = $(inputId);
    const list = $(listId);
    let activeIdx = -1;
    let filtered = items;

    input.value = getInitial() ? getInitial().name : "";

    function render(query) {
      const q = query.trim().toLowerCase();
      filtered = q
        ? items.filter((it) => it.name.toLowerCase().includes(q))
        : items;
      activeIdx = -1;

      if (filtered.length === 0) {
        list.innerHTML = '<div class="combo-empty">No match — try another model</div>';
        return;
      }
      list.innerHTML = filtered
        .map(
          (it, i) =>
            `<div class="combo-opt" role="option" data-i="${i}">
               <span>${it.name}</span><small>index ${it.score}</small>
             </div>`
        )
        .join("");
    }

    function open() { list.classList.add("open"); input.setAttribute("aria-expanded", "true"); }
    function close() { list.classList.remove("open"); input.setAttribute("aria-expanded", "false"); }

    function pick(it) {
      if (!it) return;
      input.value = it.name;
      onPick(it);
      close();
    }

    function highlight(idx) {
      const opts = [...list.querySelectorAll(".combo-opt")];
      opts.forEach((o) => o.classList.remove("active"));
      if (idx >= 0 && opts[idx]) {
        opts[idx].classList.add("active");
        opts[idx].scrollIntoView({ block: "nearest" });
      }
    }

    input.addEventListener("focus", () => { render(""); open(); input.select(); });
    input.addEventListener("input", () => { render(input.value); open(); });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, filtered.length - 1); highlight(activeIdx); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); highlight(activeIdx); }
      else if (e.key === "Enter") { e.preventDefault(); pick(filtered[activeIdx >= 0 ? activeIdx : 0]); }
      else if (e.key === "Escape") { close(); input.blur(); }
    });

    list.addEventListener("mousedown", (e) => {
      // mousedown (not click) so it fires before the input's blur
      const opt = e.target.closest(".combo-opt");
      if (opt) pick(filtered[Number(opt.dataset.i)]);
    });

    input.addEventListener("blur", () => {
      // If the typed text isn't a valid pick, restore the last valid selection
      setTimeout(() => {
        const cur = getInitial();
        if (!items.some((it) => it.name === input.value)) {
          input.value = cur ? cur.name : "";
        }
        close();
      }, 120);
    });
  }

  /* ----------------------------------------------------------------------
   * Segmented controls (resolution + preset)
   * -------------------------------------------------------------------- */
  function makeSegmented(containerId, options, getCurrent, onPick) {
    const el = $(containerId);
    el.innerHTML = options
      .map((o) => `<button type="button" data-key="${o.key}">${o.label}</button>`)
      .join("");
    function sync() {
      [...el.children].forEach((b) =>
        b.classList.toggle("active", b.dataset.key === getCurrent())
      );
    }
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      onPick(btn.dataset.key);
      sync();
    });
    sync();
    return sync;
  }

  /* ----------------------------------------------------------------------
   * Plain selects (RAM + game)
   * -------------------------------------------------------------------- */
  function populateRam() {
    const sel = $("ram-select");
    sel.innerHTML = RAM_OPTIONS.map(
      (gb) => `<option value="${gb}" ${gb === state.ramGB ? "selected" : ""}>${gb} GB</option>`
    ).join("");
    sel.addEventListener("change", () => { state.ramGB = Number(sel.value); render(); });
  }

  function populateGames() {
    const sel = $("game-select");
    sel.innerHTML = GAMES.map(
      (g) => `<option value="${g.name}" ${g === state.game ? "selected" : ""}>${g.name}</option>`
    ).join("");
    sel.addEventListener("change", () => {
      state.game = GAMES.find((g) => g.name === sel.value);
      render();
    });
  }

  /* ----------------------------------------------------------------------
   * Rendering
   * -------------------------------------------------------------------- */
  function fmt(n) { return n.toLocaleString(); }

  function render() {
    if (!state.gpu || !state.cpu || !state.game) return;

    const r = estimateFps({
      gpuScore: state.gpu.score,
      cpuScore: state.cpu.score,
      ramGB: state.ramGB,
      ramSpeedMhz: state.ramSpeedMhz,
      game: state.game,
      resolutionKey: state.resolutionKey,
      presetKey: state.presetKey,
    });

    const rating = ratingFor(r.fps);

    $("fps-num").textContent = r.fps;
    $("fps-context").textContent =
      `${state.game.name} · ${RESOLUTIONS[state.resolutionKey].label} · ${state.presetKey}`;

    const badge = $("badge");
    badge.textContent = rating.label;
    badge.className = "badge " + rating.cls;
    $("rating-blurb").textContent = rating.blurb;

    $("gpu-ceiling").textContent = fmt(r.gpuCeiling) + " FPS";
    $("cpu-ceiling").textContent = fmt(r.cpuCeiling) + " FPS";

    const bn = $("bottleneck");
    bn.className = "bottleneck k-" + r.bottleneckKind;
    const icon = { gpu: "🎮", cpu: "🧠", cap: "🔒", ram: "📉", balanced: "⚖️" }[r.bottleneckKind] || "🔎";
    bn.querySelector(".icon").textContent = icon;
    $("bottleneck-text").textContent = r.bottleneck;

    renderChart();
  }

  /** Bar chart: FPS for each preset at the currently selected resolution. */
  function renderChart() {
    const presetKeys = Object.keys(PRESETS);
    const results = presetKeys.map((pk) => ({
      key: pk,
      fps: estimateFps({
        gpuScore: state.gpu.score,
        cpuScore: state.cpu.score,
        ramGB: state.ramGB,
        ramSpeedMhz: state.ramSpeedMhz,
        game: state.game,
        resolutionKey: state.resolutionKey,
        presetKey: pk,
      }).fps,
    }));

    const max = Math.max(...results.map((r) => r.fps), 1);
    $("chart-title").textContent = `FPS by preset · ${RESOLUTIONS[state.resolutionKey].label}`;

    $("chart").innerHTML = results
      .map((r) => {
        const h = Math.max(4, Math.round((r.fps / max) * 130));
        const current = r.key === state.presetKey ? "current" : "dim";
        return `<div class="bar-col ${current}">
                  <div class="bar-val">${r.fps}</div>
                  <div class="bar" style="height:${h}px"></div>
                  <div class="bar-label">${r.key}</div>
                </div>`;
      })
      .join("");
  }

  /* ----------------------------------------------------------------------
   * Boot
   * -------------------------------------------------------------------- */
  function init() {
    makeCombo({
      inputId: "gpu-input", listId: "gpu-list", items: GPUS,
      getInitial: () => state.gpu,
      onPick: (it) => { state.gpu = it; render(); },
    });
    makeCombo({
      inputId: "cpu-input", listId: "cpu-list", items: CPUS,
      getInitial: () => state.cpu,
      onPick: (it) => { state.cpu = it; render(); },
    });

    populateRam();
    populateGames();

    $("ram-speed").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      state.ramSpeedMhz = v > 0 ? v : null;
      render();
    });

    makeSegmented(
      "res-seg",
      Object.keys(RESOLUTIONS).map((k) => ({ key: k, label: k })),
      () => state.resolutionKey,
      (k) => { state.resolutionKey = k; render(); }
    );
    makeSegmented(
      "preset-seg",
      Object.keys(PRESETS).map((k) => ({ key: k, label: k })),
      () => state.presetKey,
      (k) => { state.presetKey = k; render(); }
    );

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
