import { useMemo, useRef } from "react";
import { useMetricsContext } from "../providers/MetricsContext";
import { useCanvasLoop } from "../anim/useCanvasLoop";
import { makeSmoother } from "../anim/useSmoothValue";
import { readMetric, formatNumber } from "./format";
import { cssVar, hexToRgb, rgba } from "../scenes/palette";
import type { WidgetProps } from "../types";

const START = -Math.PI * 1.25; // 270° sweep from 7 o'clock to 5 o'clock
const SWEEP = Math.PI * 1.5;
const TICKS = 60;

/**
 * Dial-ring gauge: rotating tick ring, thin track, sweeping arc with a
 * glowing head and a translucent band trailing it. Everything is drawn on
 * canvas each frame so the needle glides between samples.
 */
export function GaugeWidget({ metricKey, label, style }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metrics = useMetricsContext();
  const key = metricKey || "";
  const reading = readMetric(metricKey ? metrics.current[metricKey] : undefined, key);

  const sm = useMemo(() => ({ pct: makeSmoother(0, 0.06), val: makeSmoother(0, 0.08) }), []);
  sm.pct.set(reading.percent);
  sm.val.set(reading.value ?? 0);

  const readingRef = useRef(reading);
  readingRef.current = reading;
  const labelRef = useRef(label);
  labelRef.current = label;
  const colorOverride = style?.color;

  useCanvasLoop(canvasRef, ({ ctx, w, h, t, dt }) => {
    const r = readingRef.current;
    const pct = sm.pct.step(dt) / 100;
    const val = sm.val.step(dt);

    const primary = colorOverride || cssVar("--color-primary", "#ffb347");
    const accent = cssVar("--color-accent", "#4ade80");
    const text = cssVar("--color-text", "#ffffff");
    const muted = cssVar("--color-muted", "rgba(255,255,255,0.45)");
    const outline = cssVar("--color-outline", "rgba(255,255,255,0.14)");
    const danger = cssVar("--color-danger", "#ff5a1f");
    const arcColor = pct > 0.88 ? danger : primary;

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2 + 4;
    const R = Math.min(w, h) / 2 - 6;
    const ringR = R;
    const arcR = R - 16;
    const arcW = Math.max(3, R * 0.06);

    // Tick ring, slowly rotating for ambient motion.
    const spin = t * 0.04;
    ctx.lineCap = "butt";
    for (let i = 0; i < TICKS; i++) {
      const a = spin + (i / TICKS) * Math.PI * 2;
      const major = i % 5 === 0;
      const len = major ? 7 : 3;
      ctx.strokeStyle = major ? muted : outline;
      ctx.lineWidth = major ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
      ctx.lineTo(cx + Math.cos(a) * (ringR - len), cy + Math.sin(a) * (ringR - len));
      ctx.stroke();
    }

    // Track.
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, START, START + SWEEP);
    ctx.stroke();

    // Trailing band (wide, translucent) behind the head.
    const end = START + SWEEP * pct;
    const bandStart = Math.max(START, end - 0.55);
    if (pct > 0.005) {
      const [ar, ag, ab] = hexToRgb(accent.startsWith("#") ? accent : "#4ade80");
      ctx.strokeStyle = rgba([ar, ag, ab], 0.28);
      ctx.lineWidth = arcW * 3.2;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR + 5, bandStart, end);
      ctx.stroke();

      // Value arc.
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = arcW;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, START, end);
      ctx.stroke();

      // Head marker with glow.
      const hx = cx + Math.cos(end) * arcR;
      const hy = cy + Math.sin(end) * arcR;
      ctx.shadowColor = arcColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = arcColor;
      ctx.fillRect(hx - arcW * 0.9, hy - arcW * 0.9, arcW * 1.8, arcW * 1.8);
      ctx.shadowBlur = 0;
    }

    // Numeral.
    const numSize = Math.max(14, R * 0.5);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = text;
    ctx.font = `800 ${numSize}px Unbounded, "Segoe UI", sans-serif`;
    const numeral = r.value === null ? "--" : formatNumber(val, r.decimals);
    ctx.fillText(numeral, cx, cy + numSize * 0.36);

    // Unit + label in mono.
    ctx.fillStyle = muted;
    ctx.font = `700 ${Math.max(7, R * 0.11)}px "Space Mono", monospace`;
    const sub = [r.unit, labelRef.current].filter(Boolean).join("  ·  ").toUpperCase();
    ctx.fillText(sub, cx, cy + numSize * 0.36 + R * 0.2);
  }, [sm, colorOverride]);

  return (
    <div className="widget gauge-widget">
      <canvas ref={canvasRef} className="gauge-canvas" />
    </div>
  );
}
