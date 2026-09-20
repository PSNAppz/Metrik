import type { Scene } from "./SceneCanvas";
import { noise3 } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 6;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const INK: [number, number, number] = [247, 239, 227];

/** Stacked sine swells as Bayer-dithered bands rolling sideways. Load sets wave height. */
export function ditherSwell(colors: string[], speed = 1): Scene {
  const A = hexToRgb(colors[0]);
  const B = hexToRgb(colors[1] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const amp = 0.35 + 0.65 * s.load;
      for (let gx = 0; gx < cols; gx++) {
        const x = gx * CELL;
        for (let k = 0; k < 4; k++) {
          const base = h * (0.35 + k * 0.17);
          const y = base + Math.sin(x * 0.012 + time * (0.6 + k * 0.2) + k) * 28 * amp
            + noise3(x * 0.01, k, time * 0.3) * 22 * amp;
          const gy0 = Math.floor(y / CELL);
          for (let gy = gy0; gy < rows; gy++) {
            const depth = (gy - gy0) / 14;
            if (depth > 1) break;
            const v = 1 - depth;
            const thr = (BAYER[(gx % 4) + (gy % 4) * 4] + 0.5) / 16;
            if (v * 0.9 < thr) continue;
            ctx.fillStyle = gy === gy0 ? rgba(INK, 0.9) : rgba(mix(B, A, k / 3), 0.25 + 0.6 * v);
            ctx.fillRect(x + 1, gy * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
    },
  };
}
