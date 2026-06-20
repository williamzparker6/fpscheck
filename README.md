# ⚡ FPS Check

Estimate the **average FPS** your PC will get in popular games — at any
resolution and graphics preset — from your **GPU, CPU and RAM**.

It's a single static page: pick your parts, get an instant estimate, a plain
performance rating ("Smooth 60+ FPS", "Struggles"…), the likely **bottleneck**
(GPU vs CPU vs RAM), and a bar chart comparing every graphics preset.

> **These are ballpark estimates, not guarantees.** See the [accuracy note](#accuracy--honesty) below.

## Run it

No build step, no dependencies. Either:

```bash
# Just open the file
open index.html            # macOS  (use 'xdg-open' on Linux / double-click on Windows)

# …or serve it locally (nicer for fonts/caching)
python3 -m http.server 8000   # then visit http://localhost:8000
```

### Deploy

Because it's 100% static, host it free on **GitHub Pages**, **Netlify**, **Vercel**,
or **Cloudflare Pages** — just point them at this repo / folder. Nothing to configure.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Page layout |
| `styles.css` | Styling (dark, responsive, no framework) |
| `data.js`    | Hardware lists, game ceilings, tuning constants |
| `model.js`   | The estimation model (pure functions) |
| `app.js`     | UI: searchable dropdowns, controls, live render |

---

## Design decisions (the three questions from the brief)

### 1. Tech stack — and why no backend

**Vanilla HTML / CSS / JavaScript, fully client-side, zero dependencies.**

The estimate is computed from a small math model, so there's no database to
query and nothing secret to protect. Doing it all in the browser means:

- **Instant results** — every keystroke recomputes locally; no network round-trip.
- **Free, trivial hosting** — any static host works; no server to run or pay for.
- **Privacy** — your specs never leave your machine.
- **Longevity** — no framework churn or build pipeline to maintain.

A framework (React/Vite, Next.js) would be reasonable if this grew into a large
app with accounts, saved builds, or a live benchmark database. For the current
scope it would add build tooling and weight without buying anything, so it was
intentionally skipped. The model (`model.js`) is plain functions, so dropping it
into React/Vue later is straightforward.

### 2. Where the FPS numbers come from

There were three realistic options:

| Approach | Pros | Cons |
|---|---|---|
| **Real benchmark datasets** (scrape/license review data) | Most accurate for tested combos | Huge to gather & keep current; **sparse** — no site tests every GPU×CPU×game×res×preset; licensing/attribution issues |
| **Public API** | Outsource the data | Few good free ones exist; rate limits, cost, downtime, and you inherit their coverage gaps |
| **Estimation model** ✅ *(chosen)* | Covers **any** combination instantly; tiny; offline; no cost or API keys | Approximate — a model, not measurements |

This app uses the **estimation model**. Each component gets a relative
gaming-performance **index** (`RTX 4090 = 100`, `Ryzen 7 9800X3D = 100`),
hand-calibrated to public review averages. Each game stores how many FPS the
reference parts reach at 1080p/Ultra, split into a **GPU ceiling** and a **CPU
ceiling**. The model scales those by your parts, resolution and preset:

```
gpuCeiling = game.gpuBase × (gpuScore/100) × resolutionMult × presetGpuMult
cpuCeiling = game.cpuBase × (cpuScore/100) ×                  presetCpuMult
fps        = min(gpuCeiling, cpuCeiling) × ramFactor          (then any engine cap)
```

The lower of the two ceilings is your FPS **and** tells you the bottleneck.
Resolution multipliers are sub-linear (real-world 1440p ≈ 0.68×, 4K ≈ 0.42× of
1080p), matching how games actually scale rather than raw pixel counts.

### 3. Handling combinations with no benchmark data

**There is no "missing combination" — that's the main advantage of the model.**
Because FPS is derived from per-component indices and per-game weights rather
than a lookup table, **every** GPU + CPU + game + resolution + preset resolves to
a number, including parts that have never been benchmarked together. Adding a
brand-new GPU is a one-line entry in `data.js` (`{ name, score }`) and it
immediately works across every game and setting.

The trade-off is honesty about precision, which is why the UI states clearly
that these are estimates.

---

## Accuracy & honesty

Real FPS depends on drivers, game patches, specific scenes, thermals/power
limits, background apps, and especially **upscaling (DLSS/FSR/XeSS)** and **ray
tracing**, which this model deliberately leaves out of the baseline. Treat the
output as a **well-reasoned ballpark for comparing options and setting
expectations**, not a measured result for your exact machine.

## Extending it

- **More hardware:** add `{ name, score }` to `GPUS` / `CPUS` in `data.js`.
- **More games:** add `{ name, gpuBase, cpuBase, cap, ramMin }` to `GAMES`.
- **Tune the curves:** edit `RESOLUTIONS`, `PRESETS`, or the RAM factors in `model.js`.
- **Add DLSS/FSR:** introduce an upscaling multiplier on `gpuCeiling`.
