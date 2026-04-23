import { useMetricsContext } from "../providers/MetricsContext";
import type { WidgetProps } from "../types";

function formatValue(
  val: { type: string; value: any } | undefined,
  key: string
): string {
  if (!val) return "--";

  switch (val.type) {
    case "Float": {
      const n = val.value as number;
      if (key.includes("temp")) return `${Math.round(n)}°C`;
      if (key.includes("power")) return `${Math.round(n)}W`;
      if (key.includes("fan") || key.includes("usage"))
        return `${Math.round(n)}%`;
      return n.toFixed(1);
    }
    case "Integer": {
      const n = val.value as number;
      if (key.includes("clock")) return `${n} MHz`;
      return String(n);
    }
    case "Ratio": {
      const { used, total } = val.value;
      const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
      const totalGB = (total / 1024 / 1024 / 1024).toFixed(1);
      return `${usedGB} / ${totalGB} GB`;
    }
    case "Text":
      return val.value;
    default:
      return "--";
  }
}

function getPercent(val: { type: string; value: any } | undefined): number {
  if (!val) return 0;
  if (val.type === "Float") return Math.min(val.value as number, 100);
  if (val.type === "Ratio" && val.value.total > 0)
    return ((val.value.used / val.value.total) * 100);
  return 0;
}

export function CardWidget({ metricKey, label }: WidgetProps) {
  const metrics = useMetricsContext();
  const val = metricKey ? metrics.current[metricKey] : undefined;
  const display = formatValue(val, metricKey || "");
  const percent = getPercent(val);
  const showBar = val?.type === "Float" || val?.type === "Ratio";

  return (
    <div className="widget card-widget">
      <div className="widget-label">{label}</div>
      <div className="card-value">{display}</div>
      {showBar && (
        <div className="card-bar-track">
          <div
            className="card-bar-fill"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
