import type { Scene } from "./SceneCanvas";
import { noise3, noise3o2 } from "./noise";
import { hexToRgb, mix, rgba } from "./palette";

const CW = 10;
const CH = 6;

/** Equaliser-style bank of pixel bars swayed by noise. Load sets amplitude; heat tips tall bars to the hot colour. */
export function spectrumWall(colors: string[], speed = 1): Scene {
  const LOW = hexToRgb(colors[0]);
  const HIGH = hexToRgb(colors[1] ?? colors[0]);
  const HOT = hexToRgb(colors[2] ?? colors[1] ?? colors[0]);
  const CAP: [number, number, number] = [247, 239, 227];
  return {
    draw({ ctx, w, h, t }, s) {
      ctx.clearRect(0, 0, w, h);
      const time = t * speed;
      const cols = Math.floor(w / CW);
      const rows = Math.floor((h - 20) / CH);
      const amp = 0.25 + 0.75 * s.load;
      const hotLine = 0.75 - 0.3 * s.heat;

      for (let c = 0; c < cols; c++) {
        const v = noise3o2(c * 0.09, 0, time * 0.6) * 0.7 + noise3(c * 0.3, 1, time * 1.8) * 0.3;
        const lit = Math.floor(v * amp * rows * 1.15);
        for (let r = 0; r < Math.min(rows, lit); r++) {
          const fr = r / rows;
          const cap = r >= lit - 2;
          ctx.fillStyle = cap
            ? rgba(CAP, 0.95)
            : rgba(mix(LOW, fr > hotLine ? HOT : HIGH, fr), 0.25 + 0.6 * fr);
          ctx.fillRect(c * CW + 2, h - 10 - (r + 1) * CH, CW - 3, CH - 2);
        }
      }
    },
  };
}
