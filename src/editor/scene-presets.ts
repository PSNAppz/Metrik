import type { BackgroundConfig } from "../types";

export type PaletteColors = [string, string, string];

/** Named colour triples shared by every scene: [primary, secondary, tertiary]. */
export const PALETTES: { name: string; colors: PaletteColors }[] = [
  { name: "Amber", colors: ["#FFB347", "#4ADE80", "#FF5A1F"] },
  { name: "Moss", colors: ["#F5E663", "#7EE08A", "#FF7A1A"] },
  { name: "Phosphor", colors: ["#5EEAD4", "#F5D90A", "#FF6A2B"] },
  { name: "Ice", colors: ["#9EE8FF", "#5B7CFF", "#FFFFFF"] },
  { name: "Ember", colors: ["#FF5A1F", "#FFD166", "#FF2D55"] },
  { name: "Violet", colors: ["#C084FC", "#7C3AED", "#FF4FD8"] },
  { name: "Rose", colors: ["#FF7A9E", "#FFD6E0", "#FF3B6B"] },
  { name: "Mono", colors: ["#FFFFFF", "#8A8A8A", "#FFB347"] },
  { name: "Cobalt", colors: ["#60A5FA", "#1E3A8A", "#FACC15"] },
  { name: "Mint", colors: ["#A7F3D0", "#10B981", "#F472B6"] },
  { name: "Sodium", colors: ["#FFD166", "#8A6A1A", "#FFFFFF"] },
  { name: "Signal", colors: ["#FF3B30", "#FFFFFF", "#00E5FF"] },
];

export interface ScenePreset {
  label: string;
  /** Builds a background from a palette; scenes decide how many colours they use. */
  make: (p: PaletteColors) => BackgroundConfig;
  /** True when `bg` is this preset (in any palette). */
  is: (bg: BackgroundConfig) => boolean;
  /** Which palette `bg` is using, or -1 if it doesn't match one exactly. */
  paletteOf: (bg: BackgroundConfig) => number;
}

function preset(
  label: string,
  make: (p: PaletteColors) => BackgroundConfig,
  is: (bg: BackgroundConfig) => boolean
): ScenePreset {
  return {
    label,
    make,
    is,
    paletteOf: (bg) => (is(bg) ? PALETTES.findIndex((p) => JSON.stringify(make(p.colors)) === JSON.stringify(bg)) : -1),
  };
}

const scene = (label: string, name: string, pick: (p: PaletteColors) => string[], speed = 1) =>
  preset(
    label,
    (p) => ({ type: "scene", scene: name, colors: pick(p), speed }),
    (bg) => bg.type === "scene" && bg.scene === name
  );

export const SCENE_PRESETS: ScenePreset[] = [
  preset(
    "Glyph Cluster",
    (p) => ({ type: "glyph-cluster", colors: [p[0], p[1]], density: 1, speed: 1 }),
    (bg) => bg.type === "glyph-cluster"
  ),
  preset(
    "Pixel Flow",
    (p) => ({ type: "pixel-flow", base: darken(p[1]), colors: [p[0], p[1]], speed: 1 }),
    (bg) => bg.type === "pixel-flow"
  ),
  scene("Halftone Bloom", "halftone-bloom", (p) => [p[0], p[1]]),
  scene("Spectrum Wall", "spectrum-wall", (p) => [p[1], p[0], p[2]]),
  scene("Orbit Lattice", "orbit-lattice", (p) => [p[1], p[0]]),
  scene("Glyph Ticker", "glyph-ticker", (p) => [p[0], p[1]]),
  scene("Contour Terrain", "contour-terrain", (p) => [p[1], p[0]]),
  scene("Pixel Aurora", "pixel-aurora", (p) => [p[1], p[0], p[2]]),
  scene("Cellular Drift", "cellular-drift", (p) => [p[0], p[1]]),
  scene("Sonar Sweep", "sonar-sweep", (p) => [p[1], p[0]]),
  scene("Dither Swell", "dither-swell", (p) => [p[0], p[1]]),
  scene("Warp Field", "warp-field", (p) => [p[0], p[1]]),
  scene("Circuit Trace", "circuit-trace", (p) => [p[0], p[1]]),
  scene("Isometric Field", "isometric-field", (p) => [p[0], p[1]]),
  scene("Moiré Rings", "moire-rings", (p) => [p[0], p[1]]),
  scene("Rainfall Pool", "rainfall-pool", (p) => [p[0], p[1]]),
  scene("Barcode Drift", "barcode-drift", (p) => [p[0], p[1], p[2]]),
  scene("Glitch Blocks", "glitch-blocks", (p) => [p[0], p[1], p[2]]),
  preset(
    "8-bit Dust",
    (p) => ({ type: "particles", color: p[0], count: 90, speed: 0.4 }),
    (bg) => bg.type === "particles"
  ),
  preset(
    "Matrix Rain",
    (p) => ({ type: "matrix", color: p[1], speed: 1 }),
    (bg) => bg.type === "matrix"
  ),
];

export const STATIC_PRESETS: { label: string; bg: BackgroundConfig }[] = [
  { label: "Void", bg: { type: "solid", color: "#000000" } },
  { label: "Deep Moss", bg: { type: "solid", color: "#0E1A14" } },
  { label: "Slow Gradient", bg: { type: "animated-gradient", colors: ["#000000", "#0A0015", "#000A14"], speed: 12 } },
];

/** Darkens a hex colour to ~30% for use as a resting base tone. */
function darken(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (v: number) => Math.round(v * 0.3).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
