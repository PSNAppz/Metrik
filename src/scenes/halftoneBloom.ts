import type { Scene } from "./SceneCanvas";
import { smoothstep } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CELL = 12;

/** Concentric dot rings that swell outward from the centre like a heartbeat. Load sets the pulse rate. */
export function halftoneBloom(colors: string[], speed = 1): Scene {
  const A = hexToRgb(colors[0]);
  const B = hexToRgb(colors[1] ?? colors[0]);
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const cx = w / 2 + Math.sin(time * 0.1) * 30;
      const cy = h / 2 + Math.cos(time * 0.13) * 16;
      const rate = 0.35 + 1.2 * s.load;
      const head = time * rate * 120;
      const reach = Math.max(w, h) * 0.55 * (0.9 + 0.3 * s.mem);

      for (let y = CELL / 2; y < h; y += CELL) {
        for (let x = CELL / 2; x < w; x += CELL) {
          const d = Math.hypot(x - cx, y - cy);
          const q1 = ((((head - d) / 90) % 4) + 4) % 4 - 0.6;
          const q2 = ((((head - d - 260) / 90) % 4) + 4) % 4 - 0.6;
          const pulse = Math.max(Math.exp(-(q1 * q1) * 3), 0.45 * Math.exp(-(q2 * q2) * 3));
          const fall = smoothstep(reach, 60, d);
          const size = 1 + 7 * pulse * fall;
          if (size < 1.3 && fall < 0.05) continue;
          ctx.fillStyle = rgba(mix(B, A, pulse + s.heat * 0.2), 0.12 + 0.85 * pulse * fall + 0.1 * fall);
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
    },
  };
}
