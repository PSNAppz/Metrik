import type { Scene } from "./SceneCanvas";
import { noise3, cellRand } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 24;

interface Tear { y: number; hh: number; dx: number; life: number }

/** Calm mosaic that occasionally tears sideways with a colour split. Load sets tear frequency. */
export function glitchBlocks(colors: string[], speed = 1): Scene {
  const CALM = hexToRgb(colors[1] ?? colors[0]);
  const HOT = hexToRgb(colors[0]);
  const SPLIT_A = hexToRgb(colors[2] ?? colors[0]);
  const SPLIT_B = mix(CALM, HOT, 0.5);
  let seed = 1;
  let tear: Tear | null = null;
  return {
    draw({ ctx, w, h, t, dt }, s) {
      ctx.clearRect(0, 0, w, h);
      const step = dt * speed;
      if (!tear && Math.random() < (0.004 + 0.03 * s.load) * step) {
        tear = { y: (Math.random() * h) | 0, hh: (20 + Math.random() * 80) | 0, dx: (Math.random() - 0.5) * 60, life: 6 + Math.random() * 10 };
      }
      for (let y = 0; y < h; y += CELL) {
        for (let x = 0; x < w; x += CELL) {
          const k = cellRand(x, y, seed);
          if (k < 0.55) continue;
          let ox = 0, col = CALM, al = 0.08 + 0.18 * noise3(x * 0.01, y * 0.01, t * 0.2);
          if (tear && y >= tear.y && y < tear.y + tear.hh) { ox = tear.dx; col = HOT; al += 0.35; }
          ctx.fillStyle = rgba(col, al);
          ctx.fillRect(x + ox, y, CELL * (k < 0.75 ? 1 : 2) - 3, CELL - 3);
        }
      }
      if (tear) {
        ctx.fillStyle = rgba(SPLIT_A, 0.5);
        ctx.fillRect(tear.dx * 1.5, tear.y, w, 2);
        ctx.fillStyle = rgba(SPLIT_B, 0.5);
        ctx.fillRect(-tear.dx * 1.5, tear.y + tear.hh, w, 2);
        tear.life -= step;
        if (tear.life <= 0) {
          tear = null;
          if (Math.random() < 0.3) seed++;
        }
      }
    },
  };
}
