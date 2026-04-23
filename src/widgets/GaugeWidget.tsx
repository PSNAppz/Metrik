import { useMetricsContext } from "../providers/MetricsContext";
import type { WidgetProps } from "../types";

const RADIUS = 70;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;
const CENTER = SIZE / 2;

export function GaugeWidget({ metricKey, label }: WidgetProps) {
  const metrics = useMetricsContext();
  const val = metricKey ? metrics.current[metricKey] : undefined;

  let percent = 0;
  if (val?.type === "Float") percent = val.value;
  else if (val?.type === "Ratio" && val.value.total > 0)
    percent = (val.value.used / val.value.total) * 100;

  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

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
          {Math.round(percent)}%
        </text>
      </svg>
    </div>
  );
}
