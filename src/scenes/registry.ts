import type { Scene } from "./SceneCanvas";
import { halftoneBloom } from "./halftoneBloom";
import { spectrumWall } from "./spectrumWall";
import { orbitLattice } from "./orbitLattice";
import { glyphTicker } from "./glyphTicker";
import { contourTerrain } from "./contourTerrain";
import { pixelAurora } from "./pixelAurora";
import { cellularDrift } from "./cellularDrift";
import { sonarSweep } from "./sonarSweep";
import { ditherSwell } from "./ditherSwell";
import { warpField } from "./warpField";
import { circuitTrace } from "./circuitTrace";
import { isometricField } from "./isometricField";
import { moireRings } from "./moireRings";
import { rainfallPool } from "./rainfallPool";
import { barcodeDrift } from "./barcodeDrift";
import { glitchBlocks } from "./glitchBlocks";

export type SceneName =
  | "halftone-bloom"
  | "spectrum-wall"
  | "orbit-lattice"
  | "glyph-ticker"
  | "contour-terrain"
  | "pixel-aurora"
  | "cellular-drift"
  | "sonar-sweep"
  | "dither-swell"
  | "warp-field"
  | "circuit-trace"
  | "isometric-field"
  | "moire-rings"
  | "rainfall-pool"
  | "barcode-drift"
  | "glitch-blocks";

/** Scenes that share the `{ type: "scene", scene, colors, speed }` config shape. */
export const SCENE_REGISTRY: Record<SceneName, (colors: string[], speed?: number) => Scene> = {
  "halftone-bloom": halftoneBloom,
  "spectrum-wall": spectrumWall,
  "orbit-lattice": orbitLattice,
  "glyph-ticker": glyphTicker,
  "contour-terrain": contourTerrain,
  "pixel-aurora": pixelAurora,
  "cellular-drift": cellularDrift,
  "sonar-sweep": sonarSweep,
  "dither-swell": ditherSwell,
  "warp-field": warpField,
  "circuit-trace": circuitTrace,
  "isometric-field": isometricField,
  "moire-rings": moireRings,
  "rainfall-pool": rainfallPool,
  "barcode-drift": barcodeDrift,
  "glitch-blocks": glitchBlocks,
};
