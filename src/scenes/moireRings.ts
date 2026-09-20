import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 5;

/** Two ring families drifting past each other; interference bands bloom where they cross. Load sets drift. */
export function moireRings(colors: string[], speed = 1): Scene {
  const HOT = hexToRgb(colors[0]);
  const A = hexToRgb(colors[1] ?? colors[0]);
  const B = mix(A, HOT, 0.5);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const d = (0.2 + 0.8 * s.load) * t * speed;
      const ax = w * 0.5 + Math.cos(d * 0.5) * 110, ay = h * 0.5 + Math.sin(d * 0.37) * 60;
      const bx = w * 0.5 + Math.cos(d * 0.5 + 3) * 110, by = h * 0.5 + Math.sin(d * 0.37 + 2) * 60;
      const p2 = 14.5 * (1 - 0.15 * s.mem);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const x = gx * CELL + 2, y = gy * CELL + 2;
          const r1 = Math.hypot(x - ax, y - ay) / 13;
          const r2 = Math.hypot(x - bx, y - by) / p2;
          const a = Math.abs((r1 % 1) - 0.5) < 0.22;
          const b = Math.abs((r2 % 1) - 0.5) < 0.22;
          if (!a && !b) continue;
          const both = a && b;
          ctx.fillStyle = both ? rgba(HOT, 0.95) : rgba(a ? A : B, 0.28);
          ctx.fillRect(gx * CELL, gy * CELL, both ? 4 : 3, both ? 4 : 3);
        }
      }
    },
  };
}
