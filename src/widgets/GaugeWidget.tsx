import { useMetricsContext } from "../providers/MetricsContext";
import type { WidgetProps } from "../types";

const RADIUS = 70;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;
const CENTER = SIZE / 2;

const ABSOLUTE_KEYS = new Set(["gpu.power", "gpu.clock", "gpu.temp", "cpu.temp"]);
const ABSOLUTE_MAX: Record<string, number> = {
  "gpu.power": 500,
  "gpu.clock": 3000,
  "gpu.temp": 120,
  "cpu.temp": 120,
};

function formatGaugeCenter(val: { type: string; value: any } | undefined, key: string): string {
  if (!val) return "--";
  if (val.type === "Ratio" && val.value.total > 0)
    return `${Math.round((val.value.used / val.value.total) * 100)}%`;
  if (val.type === "Float" || val.type === "Integer") {
    const n = val.type === "Float" ? val.value as number : val.value as number;
    if (key.includes("power")) return `${Math.round(n)}W`;
    if (key.includes("temp")) return `${Math.round(n)}°C`;
    if (key.includes("clock")) return `${Math.round(n)}`;
    return `${Math.round(n)}%`;
  }
  return "--";
}

export function GaugeWidget({ metricKey, label }: WidgetProps) {
  const metrics = useMetricsContext();
  const val = metricKey ? metrics.current[metricKey] : undefined;
  const key = metricKey || "";

  let percent = 0;
  if (val?.type === "Ratio" && val.value.total > 0) {
    percent = (val.value.used / val.value.total) * 100;
  } else if (val?.type === "Float" || val?.type === "Integer") {
    const n = val.value as number;
    if (ABSOLUTE_KEYS.has(key)) {
      const max = ABSOLUTE_MAX[key] ?? 100;
      percent = Math.min((n / max) * 100, 100);
    } else {
      percent = Math.min(n, 100);
    }
  }

  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const displayText = formatGaugeCenter(val, key);

  return (
    <div className="widget gauge-widget">
      <div className="widget-label">{label}</div>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-bg-subtle, rgba(255,255,255,0.08))"
          strokeWidth={STROKE}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className="gauge-ring"
        />
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          className="gauge-value"
          fill="var(--color-text)"
        >
          {displayText}
        </text>
      </svg>
    </div>
  );
}
