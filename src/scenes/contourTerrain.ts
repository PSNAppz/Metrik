import type { Scene } from "./SceneCanvas";
import { noise3o2 } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 5;
const LEVELS = 12;

/** Topographic contour lines of a drifting height field; every fifth line is heavier. Load sets drift. */
export function contourTerrain(colors: string[], speed = 1): Scene {
  const LOW = hexToRgb(colors[0]);
  const HIGH = hexToRgb(colors[1] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const drift = time * (0.04 + 0.14 * s.load);
      const lift = s.heat * 2;

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const f = noise3o2(gx * 0.028 + drift, gy * 0.028, time * 0.02) * LEVELS + lift;
          const fr = f % 1;
          const d = Math.min(fr, 1 - fr);
          if (d >= 0.07) continue;
          const major = Math.floor(f) % 5 === 0;
          const size = major ? 4 : 3;
          ctx.fillStyle = rgba(mix(LOW, HIGH, f / LEVELS), (major ? 0.85 : 0.35) * (1 - d / 0.07));
          ctx.fillRect(gx * CELL, gy * CELL, size, size);
        }
      }
    },
  };
}
