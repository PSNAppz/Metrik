import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 8;

interface Drop { c: number; y: number; v: number; len: number }

/** Dot columns fall and pool into a settling meniscus at the bottom. Load sets rain density. */
export function rainfallPool(colors: string[], speed = 1): Scene {
  const HEAD = hexToRgb(colors[0]);
  const TAIL = hexToRgb(colors[1] ?? colors[0]);
  let drops: Drop[] = [];
  let pool = new Float32Array(0);
  let cols = 0;
  return {
    draw({ ctx, w, h, dt }, s) {
      const c = Math.ceil(w / CELL);
      if (c !== cols) {
        cols = c;
        pool = new Float32Array(cols).fill(2);
        drops = [];
      }
      ctx.clearRect(0, 0, w, h);
      const step = dt * speed;
      if (Math.random() < (0.15 + 0.8 * s.load) * step) {
        drops.push({ c: (Math.random() * cols) | 0, y: -10, v: 2 + Math.random() * 3, len: (3 + Math.random() * 8) | 0 });
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.v * step;
        if (d.y > h - pool[d.c] * CELL) {
          pool[d.c] += 0.6;
          drops.splice(i, 1);
          continue;
        }
        for (let k = 0; k < d.len; k++) {
          const y = d.y - k * CELL;
          if (y < 0) continue;
          ctx.fillStyle = k ? rgba(TAIL, 0.5 * (1 - k / d.len)) : rgba(HEAD, 0.95);
          ctx.fillRect(d.c * CELL + 2, y | 0, 4, 4);
        }
      }
      for (let i = 0; i < cols; i++) {
        const l = pool[i], r = pool[(i + 1) % cols], ll = pool[(i - 1 + cols) % cols];
        pool[i] += ((l + r + ll) / 3 - l) * 0.15 * step;
        pool[i] = Math.max(1, pool[i] - 0.004 * step);
        const n = pool[i] | 0;
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = rgba(mix(TAIL, HEAD, k / Math.max(4, n)), 0.35 + 0.5 * (k / n));
          ctx.fillRect(i * CELL + 2, h - (k + 1) * CELL + 2, 4, 4);
        }
      }
    },
  };
}
