import { WIDGET_REGISTRY } from "./widget-registry";
import { DraggableWidget } from "../editor/DraggableWidget";
import type { WidgetConfig } from "../types";

interface Props {
  widgets: WidgetConfig[];
  editing: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

export function WidgetRenderer({
  widgets, editing, selectedId, onSelect, onMove, onResize,
}: Props) {
  return (
    <div className="widget-canvas">
      {widgets.map((widget) => {
        const Component = WIDGET_REGISTRY[widget.type];
        if (!Component) return null;

        return (
          <DraggableWidget
            key={widget.id}
            x={widget.x}
            y={widget.y}
            w={widget.w}
            h={widget.h}
            editing={editing}
            selected={selectedId === widget.id}
            onSelect={() => onSelect(widget.id)}
            onMove={(x, y) => onMove(widget.id, x, y)}
            onResize={(w, h) => onResize(widget.id, w, h)}
          >
            <Component
              metricKey={widget.metricKey}
              label={widget.label}
              style={widget.style}
              textContent={widget.textContent}
              w={widget.w}
              h={widget.h}
            />
          </DraggableWidget>
        );
      })}
    </div>
  );
}
