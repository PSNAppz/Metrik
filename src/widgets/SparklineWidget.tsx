import { useRef, useEffect } from "react";
import { useMetricsContext } from "../providers/MetricsContext";
import type { WidgetProps } from "../types";

const HISTORY_LEN = 60;

export function SparklineWidget({ metricKey, label }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metrics = useMetricsContext();
  const history = metricKey ? metrics.history[metricKey] || [] : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = 2;

    ctx.clearRect(0, 0, w, h);

    if (history.length < 2) return;

    const step = w / (HISTORY_LEN - 1);
    const startX = w - (history.length - 1) * step;

    const style = getComputedStyle(canvas);
    const color = style.getPropertyValue("--color-primary").trim() || "#00E5FF";

    ctx.beginPath();
    ctx.moveTo(startX, h - pad - (history[0] / 100) * (h - pad * 2));
    for (let i = 1; i < history.length; i++) {
      const x = startX + i * step;
      const y = h - pad - (history[i] / 100) * (h - pad * 2);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    const lastX = startX + (history.length - 1) * step;
    ctx.lineTo(lastX, h);
    ctx.lineTo(startX, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + "40");
    gradient.addColorStop(1, color + "05");
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [history]);

  return (
    <div className="widget sparkline-widget">
      <div className="widget-label">{label}</div>
      <canvas ref={canvasRef} className="sparkline-canvas" />
    </div>
  );
}
