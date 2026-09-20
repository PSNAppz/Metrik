import { useMetricsContext } from "../providers/MetricsContext";
import { useSmoothValue } from "../anim/useSmoothValue";
import { readMetric, formatNumber } from "./format";
import { DotMeter } from "./DotMeter";
import type { WidgetProps } from "../types";

/** Stat tile: tiny mono label, big geometric numeral, LED dot meter. */
export function CardWidget({ metricKey, label, style, w = 170, h = 90 }: WidgetProps) {
  const metrics = useMetricsContext();
  const key = metricKey || "";
  const reading = readMetric(metricKey ? metrics.current[metricKey] : undefined, key);
  const shown = useSmoothValue(reading.value ?? 0, 0.1);
  const showLabel = style?.showLabel !== false;
  const showBar = style?.showBar !== false && reading.value !== null;

  // Scale the numeral to the tile; the meter takes a fixed strip at the bottom.
  const numeralSize = style?.fontSize && style.fontSize > 16
    ? style.fontSize
    : Math.max(18, Math.min(h * 0.36, w * 0.22));
  const dots = Math.max(6, Math.min(24, Math.floor((w - 28) / 9)));

  return (
    <div className="widget card-widget" style={{ color: style?.color }}>
      {showLabel && (
        <div className="widget-label">
          <span>{label}</span>
          {style?.caption && <span className="widget-caption">· {style.caption}</span>}
        </div>
      )}
      <div className="card-body">
        {reading.text !== undefined ? (
          <div className="card-text">{reading.text}</div>
        ) : reading.value === null ? (
          <div className="card-value" style={{ fontSize: numeralSize }}>
            <span className="numeral dim">--</span>
          </div>
        ) : (
          <div className="card-value" style={{ fontSize: numeralSize }}>
            <span className="numeral">{formatNumber(shown, reading.decimals)}</span>
            <span className="unit">{reading.unit}</span>
            {reading.secondary && <span className="card-secondary">{reading.secondary}</span>}
          </div>
        )}
      </div>
      {showBar && <DotMeter percent={reading.percent} count={dots} color={style?.color} />}
    </div>
  );
}
