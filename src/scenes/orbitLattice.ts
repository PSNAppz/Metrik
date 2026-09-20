import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const POINTS = 620;

/** Sphere of pixel dots projected in 3D on a tilted, spinning axis. Load sets spin speed; memory sets radius. */
export function orbitLattice(colors: string[], speed = 1): Scene {
  const FAR = hexToRgb(colors[0]);
  const NEAR = hexToRgb(colors[1] ?? colors[0]);
  // Fibonacci sphere for even coverage.
  const pts: [number, number, number][] = [];
  for (let i = 0; i < POINTS; i++) {
    const y = 1 - (i / (POINTS - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const R = h * 0.42 * (0.9 + 0.25 * s.mem);
      const cx = w / 2, cy = h / 2;
      const ay = time * (0.15 + 0.6 * s.load);
      const ax = 0.5 + Math.sin(time * 0.2) * 0.2;
      const ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);

      for (const [px, py, pz] of pts) {
        const x = px * ca - pz * sa;
        let z = px * sa + pz * ca;
        const y = py * cb - z * sb;
        z = py * sb + z * cb;
        const per = 1 / (1.9 - z * 0.6);
        const sx = Math.round(cx + x * R * per);
        const sy = Math.round(cy + y * R * per);
        const depth = (z + 1) / 2;
        const size = 1.5 + 3.5 * depth;
        ctx.fillStyle = rgba(mix(FAR, NEAR, depth), 0.1 + 0.85 * depth * depth);
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }

      ctx.strokeStyle = rgba(NEAR, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
}
