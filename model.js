/* =============================================================================
 * model.js — The FPS estimation model
 * -----------------------------------------------------------------------------
 * Pure functions, no DOM. Given component scores + settings, return an FPS
 * estimate plus the limiting factor (GPU / CPU / RAM / frame cap).
 *
 * Core idea: compute two independent frame-rate ceilings and take the lower.
 *
 *   gpuCeiling = game.gpuBase × (gpuScore/100) × resolutionMult × presetGpuMult
 *   cpuCeiling = game.cpuBase × (cpuScore/100) ×                  presetCpuMult
 *   fps        = min(gpuCeiling, cpuCeiling) × ramFactor × ramSpeedFactor
 *   fps        = min(fps, game.cap)            // if the engine caps frame-rate
 *
 * Whichever ceiling is lower is the bottleneck. Because everything is derived
 * from per-component scores, ANY combination of parts produces an estimate —
 * there is no "missing benchmark row" to fall back on.
 * ========================================================================== */

/** RAM capacity penalty. Below a game's expected RAM, performance and frame
 *  consistency drop; plenty of headroom gives no extra benefit. */
function ramCapacityFactor(ramGB, gameRamMin) {
  if (ramGB < 8) return 0.55;                 // thrashing / stutter territory
  if (ramGB < gameRamMin) return 0.85;        // enough to run, not enough to be happy
  return 1.0;                                 // meets or exceeds expectation
}

/** Optional RAM-speed modifier. Small effect, larger on Ryzen in practice, but
 *  kept brand-agnostic and deliberately minor here. */
function ramSpeedFactor(ramSpeedMhz) {
  if (!ramSpeedMhz) return 1.0;               // user left it blank
  if (ramSpeedMhz < 2667) return 0.97;
  if (ramSpeedMhz < 3201) return 1.00;
  if (ramSpeedMhz < 4000) return 1.01;
  return 1.02;                                // fast DDR5
}

/**
 * Estimate FPS for one configuration.
 * @returns {{
 *   fps:number, gpuCeiling:number, cpuCeiling:number,
 *   bottleneck:string, bottleneckKind:'gpu'|'cpu'|'balanced'|'cap'|'ram',
 *   capped:boolean, ramLimited:boolean
 * }}
 */
function estimateFps({ gpuScore, cpuScore, ramGB, ramSpeedMhz, game, resolutionKey, presetKey }) {
  const res = RESOLUTIONS[resolutionKey];
  const preset = PRESETS[presetKey];

  const gpuCeiling = game.gpuBase * (gpuScore / REF_SCORE) * res.gpuMult * preset.gpuMult;
  const cpuCeiling = game.cpuBase * (cpuScore / REF_SCORE) * preset.cpuMult;

  const rawCeiling = Math.min(gpuCeiling, cpuCeiling);

  const ramCap = ramCapacityFactor(ramGB, game.ramMin);
  const ramLimited = ramCap < 1.0;
  let fps = rawCeiling * ramCap * ramSpeedFactor(ramSpeedMhz);

  // Engine frame cap (e.g. Elden Ring 60, Apex 300)
  let capped = false;
  if (game.cap && fps > game.cap) {
    fps = game.cap;
    capped = true;
  }

  // Decide what to report as the limiting factor (most user-relevant wins)
  let bottleneck, bottleneckKind;
  if (capped) {
    bottleneck = `Frame cap (${game.cap} FPS engine limit)`;
    bottleneckKind = "cap";
  } else if (ramLimited && ramGB < 8) {
    bottleneck = "RAM (too little memory — expect stutter)";
    bottleneckKind = "ram";
  } else {
    const ratio = gpuCeiling / cpuCeiling;
    if (ratio < 0.92) {
      bottleneck = "GPU-bound (graphics card is the limit)";
      bottleneckKind = "gpu";
    } else if (ratio > 1.08) {
      bottleneck = "CPU-bound (processor is the limit)";
      bottleneckKind = "cpu";
    } else {
      bottleneck = "Well balanced (GPU and CPU evenly matched)";
      bottleneckKind = "balanced";
    }
    if (ramLimited) bottleneck += " · low RAM also holding it back";
  }

  return {
    fps: Math.round(fps),
    gpuCeiling: Math.round(gpuCeiling),
    cpuCeiling: Math.round(cpuCeiling),
    bottleneck,
    bottleneckKind,
    capped,
    ramLimited,
  };
}

/** Map an FPS number to a human rating + a style class. */
function ratingFor(fps) {
  if (fps < 25)  return { label: "Unplayable",            cls: "r-unplayable",  blurb: "Below 25 FPS — drop settings or resolution." };
  if (fps < 40)  return { label: "Struggles",             cls: "r-struggles",   blurb: "Choppy. Playable only if you're patient." };
  if (fps < 60)  return { label: "Playable",              cls: "r-playable",    blurb: "Fine for most single-player games." };
  if (fps < 100) return { label: "Smooth 60+ FPS",        cls: "r-smooth",      blurb: "The 60 FPS sweet spot — feels great." };
  if (fps < 144) return { label: "High-FPS 100+",         cls: "r-high",        blurb: "Buttery. Great on a high-refresh monitor." };
  return            { label: "Competitive 144+ FPS",   cls: "r-competitive", blurb: "Esports-ready frame rates." };
}

// Expose for the browser (no modules / build step)
window.FpsModel = { estimateFps, ratingFor };
