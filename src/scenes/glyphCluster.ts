import type { Scene } from "./SceneCanvas";
import { noise3, noise3o2, cellRand, smoothstep } from "./noise";
import { hexToRgb, mix, rgba, type RGB } from "./palette";

const CELL = 10;
const GLYPH = 6;

/**
 * A breathing blob of tiny 8-bit glyphs (squares, rings, crosses, dots) in
 * two colours. GPU load swells the blob and speeds its flicker; heat tilts
 * the palette toward the first (warm) colour.
 */
export function glyphCluster(
  colors: [string, string],
  density = 1,
  speed = 1
): Scene {
  const A: RGB = hexToRgb(colors[0]);
  const B: RGB = hexToRgb(colors[1]);

  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;

      const cx = w / 2 + Math.sin(time * 0.11) * 36;
      const cy = h / 2 + Math.cos(time * 0.15) * 22;
      const breathe = 0.9 + 0.1 * Math.sin(time * 0.6);
      const radius = Math.min(w, h) * 0.34 * breathe * (0.85 + 0.45 * s.load);
      const flicker = 0.5 + 0.9 * s.load;

      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const px = gx * CELL + CELL / 2;
          const py = gy * CELL + CELL / 2;
          const dx = px - cx;
          const dy = py - cy;
          const r = Math.sqrt(dx * dx + dy * dy) / radius;

          // Warped boundary so the blob is organic rather than a disc.
          const shape = noise3o2(gx * 0.07, gy * 0.07, time * 0.12);
          const boundary = 0.75 + (shape - 0.5) * 1.1;
          let presence = smoothstep(boundary + 0.35, boundary - 0.3, r);
          // Sparse halo of stray glyphs outside the body.
          presence = Math.max(presence, smoothstep(boundary + 1.2, boundary, r) * 0.08);

          if (presence <= 0.01) continue;
          const seed = cellRand(gx, gy);
          if (seed > presence * density) continue;

          const alpha =
            (0.35 + 0.65 * noise3(gx * 0.35, gy * 0.35, time * flicker)) *
            Math.min(1, presence * 1.6);

          let cn = noise3(gx * 0.11 + 50, gy * 0.11, time * 0.08) + (s.heat - 0.5) * 0.35;
          const color = mix(B, A, smoothstep(0.3, 0.7, cn));
          ctx.fillStyle = rgba(color, alpha);

          const kind = cellRand(gx, gy, 7);
          const x0 = px - GLYPH / 2;
          const y0 = py - GLYPH / 2;
          if (kind < 0.42) {
            ctx.fillRect(x0, y0, GLYPH, GLYPH);
          } else if (kind < 0.6) {
            ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
          } else if (kind < 0.74) {
            // ring
            ctx.fillRect(x0, y0, GLYPH, 1.5);
            ctx.fillRect(x0, y0 + GLYPH - 1.5, GLYPH, 1.5);
            ctx.fillRect(x0, y0, 1.5, GLYPH);
            ctx.fillRect(x0 + GLYPH - 1.5, y0, 1.5, GLYPH);
          } else if (kind < 0.88) {
            // cross
            ctx.fillRect(px - 1, y0, 2, GLYPH);
            ctx.fillRect(x0, py - 1, GLYPH, 2);
          } else {
            ctx.fillRect(px - 1, py - 1, 2, 2);
          }
        }
      }
    },
  };
}
