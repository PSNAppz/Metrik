import { useMemo, useRef } from "react";
import { useMetricsContext } from "../providers/MetricsContext";
import { useCanvasLoop } from "../anim/useCanvasLoop";
import { makeSmoother } from "../anim/useSmoothValue";
import { cssVar, hexToRgb, rgba } from "../scenes/palette";
import { readMetric, formatNumber } from "./format";
import type { WidgetProps } from "../types";

const HISTORY_LEN = 60;
const CELL = 6;
const DOT = 4;

/**
 * Dot-matrix sparkline. Each sample is a column of LED dots; the strip
 * scrolls continuously between samples and the newest column eases up to
 * its height, so the chart never jumps.
 */
export function SparklineWidget({ metricKey, label, style }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metrics = useMetricsContext();
  const key = metricKey || "";
  const history = metricKey ? metrics.history[metricKey] || [] : [];
  const reading = readMetric(metricKey ? metrics.current[metricKey] : undefined, key);
  const showLabel = style?.showLabel !== false;

  const histRef = useRef(history);
  const state = useMemo(
    () => ({ head: makeSmoother(0, 0.1), lastLen: 0, lastValue: NaN, stamp: performance.now() }),
    []
  );

  // Detect a new sample so the scroll offset restarts from a full column.
  const last = history[history.length - 1];
  if (history.length !== state.lastLen || last !== state.lastValue) {
    state.lastLen = history.length;
    state.lastValue = last;
    state.stamp = performance.now();
  }
  histRef.current = history;

  const colorOverride = style?.color;

  useCanvasLoop(canvasRef, ({ ctx, w, h, dt }) => {
    const hist = histRef.current;
    const primary = colorOverride || cssVar("--color-primary", "#ffb347");
    const accent = cssVar("--color-accent", "#4ade80");
    const P = hexToRgb(primary.startsWith("#") ? primary : "#ffb347");
    const A = hexToRgb(accent.startsWith("#") ? accent : "#4ade80");

    ctx.clearRect(0, 0, w, h);
    const rows = Math.max(2, Math.floor(h / CELL));
    const colW = w / HISTORY_LEN;

    // Faint resting grid so the empty chart still reads as a matrix.
    ctx.fillStyle = rgba(P, 0.07);
    for (let c = 0; c < HISTORY_LEN; c++) {
      const x = c * colW + colW / 2 - DOT / 2;
      for (let r = 0; r < rows; r += 2) ctx.fillRect(x, h - (r + 1) * CELL + 1, DOT, DOT);
    }
    if (hist.length === 0) return;

    // Scroll: newest column slides in over the ~1s between samples.
    const elapsed = Math.min(1, (performance.now() - state.stamp) / 1000);
    const offset = (1 - elapsed) * colW;
    const headTarget = hist[hist.length - 1];
    state.head.set(headTarget);
    const head = state.head.step(dt);

    for (let i = 0; i < hist.length; i++) {
      const isHead = i === hist.length - 1;
      const v = isHead ? head : hist[i];
      const col = HISTORY_LEN - hist.length + i;
      const x = col * colW + colW / 2 - DOT / 2 + offset;
      if (x < -DOT || x > w) continue;
      const lit = (Math.max(0, Math.min(100, v)) / 100) * rows;
      const full = Math.floor(lit);
      const frac = lit - full;
      for (let r = 0; r < rows; r++) {
        const fill = r < full ? 1 : r === full ? frac : 0;
        if (fill <= 0.02) continue;
        const top = r >= full - 1;
        const rgb = top ? A : P;
        const depth = 0.35 + 0.65 * (r / Math.max(1, lit));
        ctx.fillStyle = rgba(rgb, fill * depth * (isHead ? 1 : 0.85));
        ctx.fillRect(x, h - (r + 1) * CELL + 1, DOT, DOT);
      }
    }

    // Glow on the live head.
    const hx = (HISTORY_LEN - 1) * colW + colW / 2 + offset;
    const hy = h - (Math.max(0, Math.min(100, head)) / 100) * rows * CELL;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fillStyle = accent;
    ctx.fillRect(hx - DOT / 2, Math.max(1, hy - DOT / 2), DOT, DOT);
    ctx.shadowBlur = 0;
  }, [state, colorOverride]);

  return (
    <div className="widget sparkline-widget" style={{ color: style?.color }}>
      {showLabel && (
        <div className="widget-label">
          <span>{label}</span>
          {reading.value !== null && (
            <span className="widget-caption">
              · {formatNumber(reading.value, reading.decimals)}{reading.unit}
            </span>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="sparkline-canvas" />
    </div>
  );
}
