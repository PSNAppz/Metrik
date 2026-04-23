import { WIDGET_REGISTRY } from "./widget-registry";
import type { WidgetConfig } from "../types";

interface Props {
  config: WidgetConfig[];
}

export function WidgetRenderer({ config }: Props) {
  return (
    <>
      {config.map((widget, i) => {
        const Component = WIDGET_REGISTRY[widget.type];
        if (!Component) return null;

        const gridClass = getGridClass(widget);

        return (
          <div key={i} className={`widget-slot ${gridClass}`}>
            <Component metricKey={widget.metricKey} label={widget.label} />
          </div>
        );
      })}
    </>
  );
}

function getGridClass(w: WidgetConfig): string {
  const classes: string[] = [];

  if (w.row === "header") {
    classes.push("slot-header");
  } else if (typeof w.row === "number") {
    classes.push(`slot-row-${w.row}`);
  }

  if (w.col === "right") {
    classes.push("slot-right");
  } else if (typeof w.col === "string" && w.col.includes("-")) {
    classes.push("slot-span");
  } else if (typeof w.col === "number") {
    classes.push(`slot-col-${w.col}`);
  }

  return classes.join(" ");
}
