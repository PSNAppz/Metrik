import type { Scene } from "./SceneCanvas";
import { hexToRgb, mix, rgba } from "./palette";

const COUNT = 260;

/** Pixel starfield streaming from a drifting vanishing point. Load sets warp speed. */
export function warpField(colors: string[], speed = 1): Scene {
  const FAR = hexToRgb(colors[1] ?? colors[0]);
  const NEAR = hexToRgb(colors[0]);
  const stars = Array.from({ length: COUNT }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random(),
  }));
  return {
    draw({ ctx, w, h, t, dt }, s) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2 + Math.sin(t * 0.1) * 40;
      const cy = h / 2 + Math.cos(t * 0.13) * 20;
      const sp = (0.003 + 0.02 * s.load) * dt * speed;
      const k = w * 0.5;
      for (const st of stars) {
        const pz = st.z;
        st.z -= sp;
        if (st.z <= 0.02) {
          st.x = Math.random() * 2 - 1;
          st.y = Math.random() * 2 - 1;
          st.z = 1;
          continue;
        }
        const x = cx + (st.x / st.z) * k, y = cy + (st.y / st.z) * k;
        const px = cx + (st.x / pz) * k, py = cy + (st.y / pz) * k;
        if (x < 0 || x > w || y < 0 || y > h) continue;
        const size = Math.max(1, ((1 - st.z) * 5) | 0);
        const n = Math.max(1, Math.min(8, (Math.hypot(x - px, y - py) / 3) | 0));
        for (let i = 0; i < n; i++) {
          const f = i / n;
          ctx.fillStyle = rgba(mix(FAR, NEAR, 1 - st.z), (1 - st.z) * (1 - f * 0.8));
          ctx.fillRect((x + (px - x) * f) | 0, (y + (py - y) * f) | 0, size, size);
        }
      }
    },
  };
}
