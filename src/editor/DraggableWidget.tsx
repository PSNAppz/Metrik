import { useRef, useState, useCallback, type ReactNode, type PointerEvent } from "react";

const DRAG_GRID = 4;
const MIN_W = 60;
const MIN_H = 40;

function snap(v: number): number {
  return Math.round(v / DRAG_GRID) * DRAG_GRID;
}

interface Props {
  x: number;
  y: number;
  w: number;
  h: number;
  editing: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  children: ReactNode;
}

export function DraggableWidget({
  x, y, w, h,
  editing, selected, onSelect, onMove, onResize,
  children,
}: Props) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = useCallback((e: PointerEvent) => {
    if (!editing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y };
    setDragging(true);
  }, [editing, x, y, onSelect]);

  const handleDragMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nx = snap(Math.max(0, Math.min(800 - w, dragRef.current.origX + dx)));
    const ny = snap(Math.max(0, Math.min(480 - h, dragRef.current.origY + dy)));
    onMove(nx, ny);
  }, [w, h, onMove]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const handleResizeStart = useCallback((e: PointerEvent) => {
    if (!editing) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: w, origH: h };
  }, [editing, w, h]);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const nw = Math.round(Math.max(MIN_W, Math.min(800 - x, resizeRef.current.origW + dx)));
    const nh = Math.round(Math.max(MIN_H, Math.min(480 - y, resizeRef.current.origH + dy)));
    onResize(nw, nh);
  }, [x, y, onResize]);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);

  return (
    <div
      className={`draggable-widget ${editing ? "editing" : ""} ${selected ? "selected" : ""} ${dragging ? "dragging" : ""}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: `translate(${x}px, ${y}px)`,
        willChange: dragging ? "transform" : "auto",
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onClick={(e) => { if (editing) { e.stopPropagation(); onSelect(); } }}
    >
      <div className="draggable-content">
        {children}
      </div>
      {editing && (
        <div
          className="resize-handle"
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        />
      )}
    </div>
  );
}
