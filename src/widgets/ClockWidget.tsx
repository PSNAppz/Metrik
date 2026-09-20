import { useState, useEffect } from "react";
import type { WidgetProps } from "../types";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Big geometric clock with a blinking colon and a mono date line. */
export function ClockWidget({ label, style, w = 400, h = 220 }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  const showLabel = style?.showLabel !== false;
  const date = now
    .toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  const size = style?.fontSize && style.fontSize > 24
    ? style.fontSize
    : Math.max(20, Math.min(h * 0.42, w * 0.2));

  return (
    <div className="widget clock-widget" style={{ color: style?.color }}>
      {showLabel && (
        <div className="widget-label">
          <span>{label || "TIME"}</span>
          <span className="widget-caption">· {style?.caption || "LOCAL"}</span>
          <span className="widget-live" />
        </div>
      )}
      <div className="clock-body">
        <div className="clock-time" style={{ fontSize: size }}>
          {pad(now.getHours())}
          <span className="clock-colon">:</span>
          {pad(now.getMinutes())}
          <span className="clock-seconds">{pad(now.getSeconds())}</span>
        </div>
        <div className="clock-date">{date}</div>
      </div>
    </div>
  );
}
