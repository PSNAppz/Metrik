import { useState, useEffect } from "react";
import type { WidgetProps } from "../types";

export function ClockWidget({ label: _label }: WidgetProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="widget clock-widget">
      <div className="clock-time">{time}</div>
      <div className="clock-date">{date}</div>
    </div>
  );
}
