import type { Scene } from "./SceneCanvas";
import { noise3, noise3o2, smoothstep } from "./noise";
import { hexToRgb, mix, rgba, type RGB } from "./palette";

const CELL = 8;
const DOT = 3;

/**
 * Dot-matrix field clipped to a tilted ellipse, with luminous streams
 * (contour bands of drifting noise) flowing through it. Load raises the
 * stream speed and width; memory pressure widens the field.
 */
export function pixelFlow(
  base: string,
  colors: [string, string],
  speed = 1
): Scene {
  const BASE: RGB = hexToRgb(base);
  const CORE: RGB = hexToRgb(colors[0]);
  const EDGE: RGB = hexToRgb(colors[1]);
  const ANGLE = -0.62;
  const cosA = Math.cos(ANGLE);
  const sinA = Math.sin(ANGLE);

  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const flowSpeed = 0.25 + 1.1 * s.load;
      const bandWidth = 0.05 + 0.05 * s.load;

      const cx = w * 0.5 + Math.sin(time * 0.07) * 20;
      const cy = h * 0.5 + Math.cos(time * 0.09) * 14;
      const rx = w * 0.33 * (1 + 0.15 * s.mem);
      const ry = h * 0.72 * (1 + 0.1 * s.mem);

      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const px = gx * CELL + CELL / 2;
          const py = gy * CELL + CELL / 2;

          // Rotated-ellipse mask with a noisy, frayed rim.
          const dx = px - cx;
          const dy = py - cy;
          const ex = (dx * cosA - dy * sinA) / rx;
          const ey = (dx * sinA + dy * cosA) / ry;
          const rim = noise3(gx * 0.15, gy * 0.15, time * 0.1) * 0.35;
          const inside = smoothstep(1.05 + rim, 0.7 + rim, ex * ex + ey * ey);
          if (inside <= 0.02) continue;

          // Streams are contour bands of slowly drifting noise.
          const f = noise3o2(
            px * 0.0045 + time * 0.03,
            py * 0.0045 - time * 0.02,
            time * 0.05
          );
          const contour = (f * 3) % 1;
          const dist = Math.min(contour, 1 - contour);
          let stream = smoothstep(bandWidth, 0, dist);
          // Pulses travelling along the stream.
          const pulse = noise3(px * 0.02 - time * flowSpeed, py * 0.02, 3);
          stream *= 0.55 + 0.45 * pulse;

          const baseA = (0.12 + 0.18 * noise3(gx * 0.4, gy * 0.4, time * 0.3)) * inside;
          const color = stream > 0.02 ? mix(EDGE, CORE, stream * stream) : BASE;
          const alpha = stream > 0.02 ? baseA + stream * inside : baseA;
          ctx.fillStyle = rgba(mix(BASE, color, Math.min(1, stream * 1.4 + 0.0)), alpha);

          const size = stream > 0.5 ? DOT + 1 : DOT;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
      }
    },
  };
}
