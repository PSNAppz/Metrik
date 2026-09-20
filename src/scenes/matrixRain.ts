import type { Scene } from "./SceneCanvas";

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";
const FONT = 14;

/** Classic falling-glyph rain; load raises the drop rate. */
export function matrixRain(color: string, speed: number): Scene {
  let drops: number[] = [];
  let acc = 0;
  let cols = 0;

  return {
    draw({ ctx, w, h, dt }, s) {
      const c = Math.floor(w / FONT);
      if (c !== cols) {
        cols = c;
        drops = Array.from({ length: cols }, () => Math.random() * -50);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
      }

      // Advance in discrete steps so glyphs stay crisp; interval shrinks with load.
      acc += dt * 16.667;
      const interval = 50 / (speed * (0.8 + 1.2 * s.load));
      if (acc < interval) return;
      acc = 0;

      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.font = `${FONT}px "Space Mono", monospace`;

      for (let i = 0; i < cols; i++) {
        const y = drops[i] * FONT;
        ctx.globalAlpha = 0.9;
        ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], i * FONT, y);
        if (y - FONT > 0) {
          ctx.globalAlpha = 0.4;
          ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], i * FONT, y - FONT);
        }
        drops[i]++;
        if (y > h && Math.random() > 0.975) drops[i] = 0;
      }
      ctx.globalAlpha = 1;
    },
  };
}
