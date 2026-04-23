import { METRIC_KEYS, WIDGET_TYPES } from "../types";
import type { WidgetConfig } from "../types";

interface Props {
  onAdd: (widget: WidgetConfig) => void;
  onClose: () => void;
}

let idCounter = 0;
function makeId(): string {
  return `w_${Date.now()}_${++idCounter}`;
}

const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  gauge: { w: 180, h: 180 },
  card: { w: 170, h: 90 },
  sparkline: { w: 400, h: 100 },
  clock: { w: 150, h: 60 },
  text: { w: 200, h: 50 },
};

export function WidgetPalette({ onAdd, onClose }: Props) {
  function addWidget(type: string, metricKey: string | null = null) {
    const size = DEFAULT_SIZES[type] || { w: 150, h: 80 };
    const widget: WidgetConfig = {
      id: makeId(),
      type,
      metricKey,
      label: metricKey?.split(".").pop()?.toUpperCase() || type.toUpperCase(),
      x: Math.round((800 - size.w) / 2),
      y: Math.round((480 - size.h) / 2),
      w: size.w,
      h: size.h,
      style: { showLabel: true, showBar: true },
      textContent: type === "text" ? "Custom Text" : undefined,
    };
    onAdd(widget);
    onClose();
  }

  return (
    <div className="widget-palette" onClick={(e) => e.stopPropagation()}>
      <div className="wp-header">
        <span>Add Widget</span>
        <button className="pp-close" onClick={onClose}>X</button>
      </div>
      <div className="wp-grid">
        {WIDGET_TYPES.map((type) => (
          <div key={type} className="wp-type-group">
            <div className="wp-type-label">{type}</div>
            {type === "clock" || type === "text" ? (
              <button className="wp-item" onClick={() => addWidget(type)}>
                + {type}
              </button>
            ) : (
              <div className="wp-metrics">
                {METRIC_KEYS.map((key) => (
                  <button
                    key={key}
                    className="wp-item"
                    onClick={() => addWidget(type, key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
