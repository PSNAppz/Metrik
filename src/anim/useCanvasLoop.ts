import { useEffect, useRef, type RefObject } from "react";

export interface FrameInfo {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Seconds since loop start. */
  t: number;
  /** Frames elapsed since last draw (1 = 60fps). Clamped so tab sleep doesn't cause jumps. */
  dt: number;
}

/**
 * Runs `draw` every animation frame on a DPR-aware canvas sized to its CSS
 * box. Skips work while the document is hidden. `draw` is read through a
 * ref so callers can pass a fresh closure every render without restarting
 * the loop; pass `deps` to force a restart (e.g. when a scene config changes).
 */
export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: (f: FrameInfo) => void,
  deps: unknown[] = []
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const start = performance.now();
    let last = start;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now: number) {
      if (document.hidden) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      const rect = canvas!.getBoundingClientRect();
      if (Math.round(rect.width) !== w || Math.round(rect.height) !== h) resize();
      drawRef.current({ ctx: ctx!, w, h, t: (now - start) / 1000, dt });
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
