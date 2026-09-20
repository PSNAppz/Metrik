import type { Scene } from "./SceneCanvas";
import { noise3, smoothstep } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 6;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Bayer-dithered light curtains hanging from the top edge. Load sets brightness; heat warms the tips. */
export function pixelAurora(colors: string[], speed = 1): Scene {
  const A = hexToRgb(colors[0]);
  const B = hexToRgb(colors[1] ?? colors[0]);
  const C = hexToRgb(colors[2] ?? colors[1] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const gain = 0.45 + 0.8 * s.load;

      for (let gy = 0; gy < rows; gy++) {
        const y = gy / rows;
        const fall = Math.pow(1 - y, 1.6);
        const tint = mix(B, C, Math.min(1, y * 1.3 + s.heat * 0.4));
        for (let gx = 0; gx < cols; gx++) {
          const sway = noise3(gx * 0.02, 0, time * 0.15) * 3;
          const col = noise3(gx * 0.05 + sway * 0.1, y * 1.2, time * 0.25);
          const curtain = smoothstep(0.35, 0.75, col) * fall * gain;
          const thr = (BAYER[(gx % 4) + (gy % 4) * 4] + 0.5) / 16;
          if (curtain < thr * 0.9) continue;
          ctx.fillStyle = rgba(mix(A, tint, Math.min(1, y * 1.3)), 0.35 + 0.6 * curtain);
          ctx.fillRect(gx * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    },
  };
}
