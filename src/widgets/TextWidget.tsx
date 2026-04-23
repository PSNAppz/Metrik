import type { WidgetProps } from "../types";

export function TextWidget({ label, style, textContent }: WidgetProps) {
  const fontSize = style?.fontSize ?? 16;
  const color = style?.color;

  return (
    <div
      className="widget text-widget"
      style={{
        color: color || "var(--color-text)",
        fontSize: `${fontSize}px`,
      }}
    >
      {(style?.showLabel !== false && label) && (
        <div className="widget-label">{label}</div>
      )}
      <div className="text-content">{textContent || "Text"}</div>
    </div>
  );
}
