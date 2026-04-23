import { useCallback } from "react";
import type { WidgetConfig } from "../types";
import { METRIC_KEYS, WIDGET_TYPES } from "../types";

function CoordBox({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max]);
  return (
    <div className="pp-coord-box">
      <span className="pp-coord-label">{label}</span>
      <button className="pp-stepper" onClick={() => onChange(clamp(value - 1))}>-</button>
      <input
        type="number"
        value={value}
        step={1}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
      />
      <button className="pp-stepper" onClick={() => onChange(clamp(value + 1))}>+</button>
    </div>
  );
}

interface Props {
  widget: WidgetConfig;
  onChange: (updated: WidgetConfig) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PropertyPanel({ widget, onChange, onDelete, onClose }: Props) {
  function update(partial: Partial<WidgetConfig>) {
    onChange({ ...widget, ...partial });
  }

  function updateStyle(partial: Partial<NonNullable<WidgetConfig["style"]>>) {
    onChange({ ...widget, style: { ...widget.style, ...partial } });
  }

  return (
    <div className="property-panel" onClick={(e) => e.stopPropagation()}>
      <div className="pp-header">
        <span>Properties</span>
        <button className="pp-close" onClick={onClose}>X</button>
      </div>

      <div className="pp-section">
        <label>Type</label>
        <select
          value={widget.type}
          onChange={(e) => update({ type: e.target.value })}
        >
          {WIDGET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {widget.type !== "clock" && widget.type !== "text" && (
        <div className="pp-section">
          <label>Metric</label>
          <select
            value={widget.metricKey || ""}
            onChange={(e) => update({ metricKey: e.target.value || null })}
          >
            <option value="">None</option>
            {METRIC_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      )}

      <div className="pp-section">
        <label>Label</label>
        <input
          type="text"
          value={widget.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </div>

      {widget.type === "text" && (
        <div className="pp-section">
          <label>Text Content</label>
          <textarea
            value={widget.textContent || ""}
            onChange={(e) => update({ textContent: e.target.value })}
            rows={3}
          />
        </div>
      )}

      <div className="pp-section">
        <label>Color Override</label>
        <div className="pp-color-row">
          <input
            type="color"
            value={widget.style?.color || "#00E5FF"}
            onChange={(e) => updateStyle({ color: e.target.value })}
          />
          <button
            className="pp-btn-small"
            onClick={() => {
              const s = { ...widget.style };
              delete s.color;
              onChange({ ...widget, style: s });
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="pp-section">
        <label>Font Size: {widget.style?.fontSize ?? 16}px</label>
        <input
          type="range"
          min={8}
          max={64}
          value={widget.style?.fontSize ?? 16}
          onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
        />
      </div>

      <div className="pp-section">
        <label className="pp-checkbox">
          <input
            type="checkbox"
            checked={widget.style?.showLabel !== false}
            onChange={(e) => updateStyle({ showLabel: e.target.checked })}
          />
          Show Label
        </label>
      </div>

      {(widget.type === "card") && (
        <div className="pp-section">
          <label className="pp-checkbox">
            <input
              type="checkbox"
              checked={widget.style?.showBar !== false}
              onChange={(e) => updateStyle({ showBar: e.target.checked })}
            />
            Show Bar
          </label>
        </div>
      )}

      <div className="pp-section">
        <label>Transform</label>
        <div className="pp-transform-grid">
          <CoordBox label="X" value={widget.x} min={0} max={800} onChange={(v) => update({ x: v })} />
          <CoordBox label="Y" value={widget.y} min={0} max={480} onChange={(v) => update({ y: v })} />
          <CoordBox label="W" value={widget.w} min={60} max={800} onChange={(v) => update({ w: v })} />
          <CoordBox label="H" value={widget.h} min={40} max={480} onChange={(v) => update({ h: v })} />
        </div>
      </div>

      <div className="pp-section">
        <button className="pp-btn-danger" onClick={() => onDelete(widget.id)}>
          Delete Widget
        </button>
      </div>
    </div>
  );
}
