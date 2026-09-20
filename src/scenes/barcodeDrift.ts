import type { Scene } from "./SceneCanvas";
import { noise3, noise3o2, cellRand } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

/** Barcode bars sliding sideways with a scanner line sweeping across. Load sets scroll speed. */
export function barcodeDrift(colors: string[], speed = 1): Scene {
  const BRIGHT = hexToRgb(colors[0]);
  const DIM = hexToRgb(colors[1] ?? colors[0]);
  const SCAN = hexToRgb(colors[2] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const sp = t * speed * (8 + 50 * s.load);
      let x = -(sp % 600);
      let i = Math.floor(sp / 600) * 97;
      while (x < w) {
        const bw = (2 + cellRand(i, 1, 1) * 14) | 0;
        const gap = (2 + cellRand(i, 2, 2) * 10) | 0;
        const br = noise3o2((x + sp) * 0.004, 0, t * 0.2);
        const top = h * 0.18 + noise3(i * 0.3, 3, t * 0.2) * h * 0.2;
        const bot = h * 0.82 - noise3(i * 0.3, 4, t * 0.2) * h * 0.2;
        ctx.fillStyle = rgba(mix(DIM, BRIGHT, br), 0.15 + 0.7 * br * br);
        ctx.fillRect(x | 0, top | 0, bw, (bot - top) | 0);
        x += bw + gap;
        i++;
      }
      const sx = w * 0.5 + Math.sin(t * 0.7) * w * 0.35;
      ctx.fillStyle = rgba(SCAN, 0.25);
      ctx.fillRect((sx - 6) | 0, h * 0.1, 14, h * 0.8);
      ctx.fillStyle = rgba(SCAN, 0.9);
      ctx.fillRect(sx | 0, h * 0.1, 2, h * 0.8);
    },
  };
}
