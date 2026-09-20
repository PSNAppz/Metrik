import type { Scene } from "./SceneCanvas";
import { hexToRgb, rgba } from "./palette";

const GRID = 16;
const TRACES = 34;

type Pt = [number, number];

/** PCB-style orthogonal traces with pulses travelling along them. Load sets pulses in flight. */
export function circuitTrace(colors: string[], speed = 1): Scene {
  const TRACE = hexToRgb(colors[1] ?? colors[0]);
  const PULSE = hexToRgb(colors[0]);
  let traces: Pt[][] = [];
  let sizedFor = "";
  const pulses: { t: number; d: number }[] = [];

  function route(w: number, h: number) {
    traces = [];
    for (let i = 0; i < TRACES; i++) {
      let x = ((Math.random() * w) / GRID | 0) * GRID;
      let y = ((Math.random() * h) / GRID | 0) * GRID;
      const pts: Pt[] = [[x, y]];
      let dir = Math.random() < 0.5 ? 0 : 1;
      for (let s = 0; s < 9; s++) {
        const len = ((2 + Math.random() * 7) | 0) * GRID;
        dir ^= 1;
        if (dir) x = Math.max(0, Math.min(w, x + (Math.random() < 0.5 ? -len : len)));
        else y = Math.max(0, Math.min(h, y + (Math.random() < 0.5 ? -len : len)));
        pts.push([x, y]);
      }
      traces.push(pts);
    }
    sizedFor = `${w}x${h}`;
  }

  return {
    draw({ ctx, w, h, dt }, s) {
      if (sizedFor !== `${w}x${h}`) route(w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      for (const p of traces) {
        ctx.strokeStyle = rgba(TRACE, 0.22);
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (const q of p) ctx.lineTo(q[0], q[1]);
        ctx.stroke();
        ctx.fillStyle = rgba(TRACE, 0.5);
        for (const q of p) ctx.fillRect(q[0] - 2, q[1] - 2, 4, 4);
      }

      const want = Math.floor(3 + 18 * s.load);
      while (pulses.length < want) pulses.push({ t: (Math.random() * traces.length) | 0, d: 0 });
      while (pulses.length > want) pulses.pop();

      for (const u of pulses) {
        const p = traces[u.t];
        const segs: number[] = [];
        let total = 0;
        for (let i = 1; i < p.length; i++) {
          const l = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
          segs.push(l);
          total += l;
        }
        u.d += dt * (2.5 + 3 * s.load) * speed;
        if (u.d > total + 60) {
          u.d = 0;
          u.t = (Math.random() * traces.length) | 0;
        }
        let d = u.d, i = 0;
        while (i < segs.length && d > segs[i]) { d -= segs[i]; i++; }
        if (i >= segs.length) continue;
        const a = p[i], b = p[i + 1];
        const f = segs[i] ? d / segs[i] : 0;
        const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        ctx.fillStyle = rgba(PULSE, 0.35);
        ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.fillStyle = rgba(PULSE, 0.95);
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    },
  };
}
