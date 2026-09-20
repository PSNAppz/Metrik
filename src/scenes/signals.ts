import { useRef } from "react";
import { useMetricsContext } from "../providers/MetricsContext";
import { makeSmoother } from "../anim/useSmoothValue";
import type { MetricValue } from "../types";

/** Normalised 0..1 drivers that scenes use to modulate their motion. */
export interface SceneSignals {
  /** GPU load (falls back to CPU). */
  load: number;
  /** GPU temperature, 30°C → 0, 90°C → 1. */
  heat: number;
  /** VRAM fill ratio (falls back to RAM). */
  mem: number;
}

function num(v: MetricValue | undefined): number | null {
  if (!v) return null;
  if (v.type === "Float" || v.type === "Integer") return v.value;
  if (v.type === "Ratio") return v.value.total > 0 ? (v.value.used / v.value.total) * 100 : 0;
  return null;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Returns a mutable ref holding the latest signal targets. Scenes read it
 * inside their canvas loop and ease toward it with `SmoothSignals`.
 */
export function useSceneSignals() {
  const metrics = useMetricsContext();
  const ref = useRef<SceneSignals>({ load: 0, heat: 0, mem: 0 });

  const load = num(metrics.current["gpu.usage"]) ?? num(metrics.current["cpu.usage"]) ?? 0;
  const temp = num(metrics.current["gpu.temp"]) ?? num(metrics.current["cpu.temp"]) ?? 40;
  const mem = num(metrics.current["gpu.vram"]) ?? num(metrics.current["ram"]) ?? 0;

  ref.current.load = clamp01(load / 100);
  ref.current.heat = clamp01((temp - 30) / 60);
  ref.current.mem = clamp01(mem / 100);
  return ref;
}

/** Per-scene smoothers so signal changes ripple in over ~1s instead of snapping. */
export function makeSmoothSignals(rate = 0.03) {
  const load = makeSmoother(0, rate);
  const heat = makeSmoother(0, rate);
  const mem = makeSmoother(0, rate);
  return {
    step(target: SceneSignals, dt: number): SceneSignals {
      load.set(target.load);
      heat.set(target.heat);
      mem.set(target.mem);
      return { load: load.step(dt), heat: heat.step(dt), mem: mem.step(dt) };
    },
  };
}
