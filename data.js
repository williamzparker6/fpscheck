/* =============================================================================
 * data.js — Hardware & game databases + tuning constants for the FPS estimator
 * -----------------------------------------------------------------------------
 * All "scores" are RELATIVE gaming-performance indices, not raw benchmark FPS.
 *
 *   GPU_SCORE  : ~ relative rasterized gaming performance. RTX 4090 = 100.
 *   CPU_SCORE  : ~ relative 1080p gaming performance.      Ryzen 7 9800X3D = 100.
 *
 * Per game we store the FPS the *reference* parts (score 100) reach at
 * 1080p / Ultra, split into a GPU ceiling and a CPU ceiling. The model in
 * model.js scales those by the chosen parts, resolution and preset.
 *
 * These indices are hand-calibrated approximations of public review averages.
 * They are good enough to rank configurations and give ballpark FPS — they are
 * NOT measured results for any specific machine.
 * ========================================================================== */

const GPUS = [
  // --- NVIDIA RTX 50 series ---
  { name: "NVIDIA RTX 5090", score: 140 },
  { name: "NVIDIA RTX 5080", score: 95 },
  { name: "NVIDIA RTX 5070 Ti", score: 78 },
  { name: "NVIDIA RTX 5070", score: 62 },
  { name: "NVIDIA RTX 5060 Ti", score: 46 },
  { name: "NVIDIA RTX 5060", score: 38 },
  // --- NVIDIA RTX 40 series ---
  { name: "NVIDIA RTX 4090", score: 100 },
  { name: "NVIDIA RTX 4080 Super", score: 82 },
  { name: "NVIDIA RTX 4080", score: 80 },
  { name: "NVIDIA RTX 4070 Ti Super", score: 73 },
  { name: "NVIDIA RTX 4070 Ti", score: 68 },
  { name: "NVIDIA RTX 4070 Super", score: 62 },
  { name: "NVIDIA RTX 4070", score: 54 },
  { name: "NVIDIA RTX 4060 Ti", score: 42 },
  { name: "NVIDIA RTX 4060", score: 35 },
  // --- NVIDIA RTX 30 series ---
  { name: "NVIDIA RTX 3090 Ti", score: 78 },
  { name: "NVIDIA RTX 3090", score: 73 },
  { name: "NVIDIA RTX 3080 Ti", score: 72 },
  { name: "NVIDIA RTX 3080", score: 67 },
  { name: "NVIDIA RTX 3070 Ti", score: 56 },
  { name: "NVIDIA RTX 3070", score: 52 },
  { name: "NVIDIA RTX 3060 Ti", score: 46 },
  { name: "NVIDIA RTX 3060", score: 35 },
  { name: "NVIDIA RTX 3050", score: 24 },
  // --- NVIDIA RTX 20 series ---
  { name: "NVIDIA RTX 2080 Ti", score: 52 },
  { name: "NVIDIA RTX 2080 Super", score: 45 },
  { name: "NVIDIA RTX 2070 Super", score: 40 },
  { name: "NVIDIA RTX 2060", score: 30 },
  // --- NVIDIA GTX ---
  { name: "NVIDIA GTX 1080 Ti", score: 42 },
  { name: "NVIDIA GTX 1080", score: 34 },
  { name: "NVIDIA GTX 1070", score: 28 },
  { name: "NVIDIA GTX 1660 Super", score: 28 },
  { name: "NVIDIA GTX 1660", score: 25 },
  { name: "NVIDIA GTX 1060 6GB", score: 21 },
  { name: "NVIDIA GTX 1650", score: 17 },
  // --- AMD RX 9000 (RDNA 4) ---
  { name: "AMD RX 9070 XT", score: 72 },
  { name: "AMD RX 9070", score: 64 },
  { name: "AMD RX 9060 XT", score: 44 },
  // --- AMD RX 7000 ---
  { name: "AMD RX 7900 XTX", score: 92 },
  { name: "AMD RX 7900 XT", score: 82 },
  { name: "AMD RX 7900 GRE", score: 70 },
  { name: "AMD RX 7800 XT", score: 64 },
  { name: "AMD RX 7700 XT", score: 55 },
  { name: "AMD RX 7600 XT", score: 38 },
  { name: "AMD RX 7600", score: 35 },
  // --- AMD RX 6000 ---
  { name: "AMD RX 6950 XT", score: 76 },
  { name: "AMD RX 6900 XT", score: 72 },
  { name: "AMD RX 6800 XT", score: 68 },
  { name: "AMD RX 6800", score: 60 },
  { name: "AMD RX 6750 XT", score: 52 },
  { name: "AMD RX 6700 XT", score: 48 },
  { name: "AMD RX 6650 XT", score: 38 },
  { name: "AMD RX 6600 XT", score: 36 },
  { name: "AMD RX 6600", score: 32 },
  { name: "AMD RX 6500 XT", score: 18 },
  // --- AMD RX 5000 ---
  { name: "AMD RX 5700 XT", score: 40 },
  { name: "AMD RX 5600 XT", score: 33 },
  // --- Intel Arc ---
  { name: "Intel Arc B580", score: 42 },
  { name: "Intel Arc A770", score: 38 },
  { name: "Intel Arc A750", score: 34 },
  { name: "Intel Arc A580", score: 28 },
  { name: "Intel Arc A380", score: 14 },
];

const CPUS = [
  // --- AMD Ryzen 9000 ---
  { name: "AMD Ryzen 9 9950X3D", score: 102 },
  { name: "AMD Ryzen 7 9800X3D", score: 100 },
  { name: "AMD Ryzen 9 9950X", score: 88 },
  { name: "AMD Ryzen 9 9900X", score: 85 },
  { name: "AMD Ryzen 7 9700X", score: 84 },
  { name: "AMD Ryzen 5 9600X", score: 80 },
  // --- AMD Ryzen 7000 ---
  { name: "AMD Ryzen 9 7950X3D", score: 95 },
  { name: "AMD Ryzen 7 7800X3D", score: 94 },
  { name: "AMD Ryzen 9 7900X3D", score: 90 },
  { name: "AMD Ryzen 5 7600X3D", score: 86 },
  { name: "AMD Ryzen 9 7950X", score: 82 },
  { name: "AMD Ryzen 9 7900X", score: 80 },
  { name: "AMD Ryzen 7 7700X", score: 78 },
  { name: "AMD Ryzen 5 7600X", score: 74 },
  { name: "AMD Ryzen 5 7600", score: 72 },
  // --- AMD Ryzen 5000 ---
  { name: "AMD Ryzen 7 5800X3D", score: 80 },
  { name: "AMD Ryzen 9 5950X", score: 68 },
  { name: "AMD Ryzen 9 5900X", score: 66 },
  { name: "AMD Ryzen 7 5800X", score: 62 },
  { name: "AMD Ryzen 5 5600X", score: 58 },
  { name: "AMD Ryzen 5 5600", score: 56 },
  // --- AMD Ryzen 3000 ---
  { name: "AMD Ryzen 7 3700X", score: 48 },
  { name: "AMD Ryzen 5 3600", score: 44 },
  // --- Intel Core Ultra (Arrow Lake) ---
  { name: "Intel Core Ultra 9 285K", score: 90 },
  { name: "Intel Core Ultra 7 265K", score: 86 },
  { name: "Intel Core Ultra 5 245K", score: 80 },
  // --- Intel 14th gen ---
  { name: "Intel Core i9-14900K", score: 92 },
  { name: "Intel Core i7-14700K", score: 88 },
  { name: "Intel Core i5-14600K", score: 80 },
  { name: "Intel Core i5-14400", score: 68 },
  // --- Intel 13th gen ---
  { name: "Intel Core i9-13900K", score: 90 },
  { name: "Intel Core i7-13700K", score: 85 },
  { name: "Intel Core i5-13600K", score: 78 },
  { name: "Intel Core i5-13400", score: 66 },
  // --- Intel 12th gen ---
  { name: "Intel Core i9-12900K", score: 80 },
  { name: "Intel Core i7-12700K", score: 75 },
  { name: "Intel Core i5-12600K", score: 70 },
  { name: "Intel Core i5-12400", score: 62 },
  // --- Intel 10th/11th gen ---
  { name: "Intel Core i9-11900K", score: 60 },
  { name: "Intel Core i7-11700K", score: 57 },
  { name: "Intel Core i9-10900K", score: 58 },
  { name: "Intel Core i7-10700K", score: 54 },
  { name: "Intel Core i5-10400", score: 46 },
  { name: "Intel Core i7-9700K", score: 50 },
  { name: "Intel Core i5-9600K", score: 46 },
];

/* Per-game ceilings at 1080p / Ultra for reference parts (score 100 each).
 *   gpuBase : avg FPS an RTX 4090 reaches when not CPU-limited
 *   cpuBase : avg FPS a Ryzen 7 9800X3D can feed (≈ resolution-independent)
 *   cap     : hard engine frame cap, if any (null = uncapped)
 *   ramMin  : RAM (GB) the game expects for a smooth experience
 */
const GAMES = [
  { name: "Valorant",                          gpuBase: 800, cpuBase: 700, cap: null, ramMin: 8 },
  { name: "League of Legends",                 gpuBase: 700, cpuBase: 600, cap: null, ramMin: 8 },
  { name: "Counter-Strike 2",                  gpuBase: 600, cpuBase: 450, cap: null, ramMin: 8 },
  { name: "Minecraft (Java, vanilla)",         gpuBase: 420, cpuBase: 350, cap: null, ramMin: 8 },
  { name: "Apex Legends",                      gpuBase: 300, cpuBase: 250, cap: 300,  ramMin: 8 },
  { name: "Fortnite",                          gpuBase: 250, cpuBase: 300, cap: null, ramMin: 8 },
  { name: "PUBG: Battlegrounds",               gpuBase: 250, cpuBase: 240, cap: null, ramMin: 16 },
  { name: "Grand Theft Auto V",                gpuBase: 200, cpuBase: 190, cap: null, ramMin: 8 },
  { name: "Forza Horizon 5",                   gpuBase: 200, cpuBase: 230, cap: null, ramMin: 16 },
  { name: "Marvel's Spider-Man Remastered",    gpuBase: 190, cpuBase: 200, cap: null, ramMin: 16 },
  { name: "The Witcher 3 (Next-Gen)",          gpuBase: 180, cpuBase: 220, cap: null, ramMin: 8 },
  { name: "Baldur's Gate 3",                   gpuBase: 170, cpuBase: 130, cap: null, ramMin: 16 },
  { name: "Red Dead Redemption 2",             gpuBase: 150, cpuBase: 260, cap: null, ramMin: 8 },
  { name: "Call of Duty: Warzone",             gpuBase: 180, cpuBase: 220, cap: null, ramMin: 16 },
  { name: "Cyberpunk 2077",                    gpuBase: 140, cpuBase: 200, cap: null, ramMin: 12 },
  { name: "Hogwarts Legacy",                   gpuBase: 130, cpuBase: 150, cap: null, ramMin: 16 },
  { name: "Elden Ring",                        gpuBase: 120, cpuBase: 110, cap: 60,   ramMin: 12 },
  { name: "Starfield",                         gpuBase: 110, cpuBase: 120, cap: null, ramMin: 16 },
  { name: "Microsoft Flight Simulator",        gpuBase: 110, cpuBase: 90,  cap: null, ramMin: 16 },
  { name: "Black Myth: Wukong",                gpuBase: 90,  cpuBase: 160, cap: null, ramMin: 16 },
];

/* Tuning constants shared with model.js */
const REF_SCORE = 100; // both reference parts are indexed to 100

// GPU load scales hard with resolution; values are real-world (sub-linear) ratios
const RESOLUTIONS = {
  "1080p": { label: "1080p (1920×1080)", gpuMult: 1.00 },
  "1440p": { label: "1440p (2560×1440)", gpuMult: 0.68 },
  "4K":    { label: "4K (3840×2160)",    gpuMult: 0.42 },
};

// Lower presets lift the GPU ceiling a lot, the CPU ceiling only slightly
const PRESETS = {
  Low:    { gpuMult: 1.90, cpuMult: 1.15 },
  Medium: { gpuMult: 1.45, cpuMult: 1.08 },
  High:   { gpuMult: 1.15, cpuMult: 1.03 },
  Ultra:  { gpuMult: 1.00, cpuMult: 1.00 },
};

const RAM_OPTIONS = [4, 8, 16, 32, 64];
