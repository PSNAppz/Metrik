import type { Scene } from "./SceneCanvas";
import { noise3o2 } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const S = 14;
const N = 22;
const M = 30;
const INK: [number, number, number] = [247, 239, 227];

/** Isometric pixel cubes riding a noise heightmap. Load sets churn. */
export function isometricField(colors: string[], speed = 1): Scene {
  const TOP = hexToRgb(colors[0]);
  const SIDE = hexToRgb(colors[1] ?? colors[0]);
  const L = mix(SIDE, [0, 0, 0], 0.55);
  const R = mix(SIDE, [0, 0, 0], 0.75);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const ox = w / 2, oy = h * 0.18;
      const ch = t * speed * (0.15 + 0.5 * s.load);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
          const hh = ((noise3o2(i * 0.13 + ch * 0.3, j * 0.13, ch * 0.4) * 6) | 0) * 4 + 4;
          const x = ox + (j - i) * S * 0.9;
          const y = oy + (j + i) * S * 0.45 - hh;
          if (x < -S || x > w + S) continue;
          ctx.fillStyle = rgba(mix(SIDE, TOP, hh / 28), 0.85);
          ctx.fillRect((x - S * 0.45) | 0, y | 0, (S * 0.9) | 0, (S * 0.45) | 0);
          ctx.fillStyle = rgba(L, 0.9);
          ctx.fillRect((x - S * 0.45) | 0, (y + S * 0.45) | 0, (S * 0.45) | 0, hh);
          ctx.fillStyle = rgba(R, 0.9);
          ctx.fillRect(x | 0, (y + S * 0.45) | 0, (S * 0.45) | 0, hh);
          if (noise3o2(i * 0.2, j * 0.2, t * 0.1) > 0.72) {
            ctx.fillStyle = rgba(INK, 0.9);
            ctx.fillRect(x - 1, y + 2, 2, 2);
          }
        }
      }
    },
  };
}
