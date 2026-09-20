import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 12;

/** Game of Life with phosphor trails, reseeded at the edges so it never dies. Load raises the step rate and birth rate. */
export function cellularDrift(colors: string[], speed = 1): Scene {
  const ALIVE = hexToRgb(colors[0]);
  const TRAIL = hexToRgb(colors[1] ?? colors[0]);
  const DARK = mix(TRAIL, [0, 0, 0], 0.85);
  let grid = new Uint8Array(0);
  let age = new Float32Array(0);
  let cols = 0, rows = 0;
  let acc = 0;

  return {
    draw({ ctx, w, h, dt }, s) {
      const c = Math.ceil(w / CELL), r = Math.ceil(h / CELL);
      if (c !== cols || r !== rows) {
        cols = c; rows = r;
        grid = new Uint8Array(cols * rows);
        age = new Float32Array(cols * rows);
        for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.22 ? 1 : 0;
      }

      acc += dt * speed;
      const step = 8 - 5 * s.load;
      if (acc >= step) {
        acc = 0;
        const next = new Uint8Array(cols * rows);
        const birth = 0.02 + 0.08 * s.load;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            let n = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                n += grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
              }
            }
            const i = y * cols + x;
            next[i] = (grid[i] && (n === 2 || n === 3)) || (!grid[i] && n === 3) ? 1 : 0;
            if (!next[i] && (x === 0 || x === cols - 1) && Math.random() < birth) next[i] = 1;
          }
        }
        grid = next;
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) age[i] = 1;
        else age[i] *= Math.pow(0.985, dt);
        const a = age[i];
        if (a < 0.02) continue;
        const x = (i % cols) * CELL;
        const y = Math.floor(i / cols) * CELL;
        const size = grid[i] ? CELL - 3 : Math.max(2, (CELL - 3) * a);
        ctx.fillStyle = grid[i] ? rgba(ALIVE, 0.95) : rgba(mix(DARK, TRAIL, a), 0.9 * a);
        ctx.fillRect(x + (CELL - size) / 2, y + (CELL - size) / 2, size, size);
      }
    },
  };
}
