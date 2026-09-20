import type { Scene } from "./SceneCanvas";
import { noise3, cellRand, smoothstep } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const ROW = 22;
const GAP = 14;

/** Rows of 8-bit glyphs scrolling sideways like punched tape, masked to the centre. Load sets tape speed. */
export function glyphTicker(colors: string[], speed = 1): Scene {
  const A = hexToRgb(colors[0]);
  const B = hexToRgb(colors[1] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const rows = Math.ceil(h / ROW);
      const sp = 20 + 90 * s.load;
      const maskR = 520 * (0.85 + 0.3 * s.mem);

      for (let r = 0; r < rows; r++) {
        const dir = r % 2 ? 1 : -1;
        const v = sp * (0.4 + cellRand(r, 1, 1) * 1.2);
        const off = ((time * v * dir) % GAP + GAP) % GAP;
        const y = r * ROW + ROW / 2;
        for (let x = off - GAP * 2; x < w + GAP; x += GAP) {
          const k = cellRand(Math.floor((x - off) / GAP) + r * 1000, r, 3);
          const m = smoothstep(maskR, 120, Math.hypot(x - w / 2, (y - h / 2) * 1.6));
          if (m < 0.03) continue;
          const bright = noise3(x * 0.01, r * 0.5, time * 0.4);
          ctx.fillStyle = rgba(mix(B, A, bright + s.heat * 0.25), 0.15 + 0.7 * m * bright);
          if (k < 0.3) ctx.fillRect(x - 3, y - 3, 6, 6);
          else if (k < 0.5) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
          else if (k < 0.68) {
            ctx.fillRect(x - 3, y - 3, 6, 1.5);
            ctx.fillRect(x - 3, y + 1.5, 6, 1.5);
            ctx.fillRect(x - 3, y - 3, 1.5, 6);
            ctx.fillRect(x + 1.5, y - 3, 1.5, 6);
          } else if (k < 0.85) {
            ctx.fillRect(x - 1, y - 4, 2, 8);
            ctx.fillRect(x - 4, y - 1, 8, 2);
          } else ctx.fillRect(x - 5, y - 1, 10, 2);
        }
      }
    },
  };
}
