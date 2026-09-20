import type { Scene } from "./SceneCanvas";
import { hexToRgb, rgba, type RGB } from "./palette";

const GRID = 4;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  rate: number;
}

/** Pixel-snapped square particles that drift and twinkle; load adds energy. */
export function pixelParticles(color: string, count: number, speed: number): Scene {
  const C: RGB = hexToRgb(color);
  let ps: P[] = [];
  let seededFor = "";

  function seed(w: number, h: number) {
    ps = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() < 0.8 ? GRID : GRID * 2,
      phase: Math.random() * Math.PI * 2,
      rate: 0.5 + Math.random() * 1.5,
    }));
    seededFor = `${w}x${h}`;
  }

  return {
    draw({ ctx, w, h, t, dt }, s) {
      if (seededFor !== `${w}x${h}`) seed(w, h);
      ctx.clearRect(0, 0, w, h);
      const energy = 0.6 + 1.6 * s.load;

      for (const p of ps) {
        p.x += p.vx * energy * dt;
        p.y += p.vy * energy * dt;
        if (p.x < -GRID) p.x = w + GRID;
        if (p.x > w + GRID) p.x = -GRID;
        if (p.y < -GRID) p.y = h + GRID;
        if (p.y > h + GRID) p.y = -GRID;

        const tw = 0.5 + 0.5 * Math.sin(t * p.rate * (1 + s.load) + p.phase);
        const alpha = 0.15 + 0.65 * tw * tw;
        ctx.fillStyle = rgba(C, alpha);
        const sx = Math.round(p.x / GRID) * GRID;
        const sy = Math.round(p.y / GRID) * GRID;
        ctx.fillRect(sx, sy, p.size, p.size);
      }
    },
  };
}
