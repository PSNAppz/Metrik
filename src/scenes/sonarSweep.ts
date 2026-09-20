import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const BLIPS = 40;
const TAU = Math.PI * 2;

/** Rotating beam over a ringed dial; pixel blips flare as the beam passes. Load sets how many contacts show. */
export function sonarSweep(colors: string[], speed = 1): Scene {
  const RING = hexToRgb(colors[0]);
  const BLIP = hexToRgb(colors[1] ?? colors[0]);
  const blips = Array.from({ length: BLIPS }, () => ({
    a: Math.random() * TAU,
    r: 0.15 + Math.random() * 0.8,
  }));

  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const R = h * 0.46;
      const ang = (t * speed * (0.8 + 0.6 * s.load)) % TAU;

      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(RING, 0.18);
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R * i) / 4, 0, TAU);
        ctx.stroke();
      }
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * TAU;
        const major = i % 6 === 0;
        ctx.fillStyle = rgba(RING, major ? 0.7 : 0.3);
        ctx.fillRect(cx + Math.cos(a) * (R + 4) - 1, cy + Math.sin(a) * (R + 4) - 1, 2, 2);
        if (major) {
          ctx.strokeStyle = rgba(RING, 0.6);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          ctx.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8));
          ctx.stroke();
        }
      }

      for (let k = 0; k < 28; k++) {
        const a = ang - k * 0.03;
        ctx.strokeStyle = rgba(RING, 0.35 * (1 - k / 28));
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }

      const n = Math.floor(8 + 30 * s.load);
      for (let i = 0; i < n; i++) {
        const b = blips[i];
        const age = ((ang - b.a + TAU) % TAU) / TAU;
        const flare = Math.exp(-age * 5);
        const x = cx + Math.cos(b.a) * b.r * R;
        const y = cy + Math.sin(b.a) * b.r * R;
        const size = 3 + 5 * flare;
        ctx.fillStyle = rgba(mix(RING, BLIP, flare), 0.15 + 0.85 * flare);
        ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      }
    },
  };
}
