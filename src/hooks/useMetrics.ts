import { useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import type { MetricSnapshot, MetricValue } from "../types";

const HISTORY_LEN = 60;
const FPS_SAMPLE_MS = 1000;

export interface MetricsState {
  current: Record<string, MetricValue>;
  history: Record<string, number[]>;
}

function extractNumeric(val: MetricValue): number | null {
  switch (val.type) {
    case "Float":
      return val.value;
    case "Integer":
      return val.value;
    case "Ratio":
      return val.value.total > 0
        ? (val.value.used / val.value.total) * 100
        : 0;
    default:
      return null;
  }
}

export function useMetrics() {
  const [state, setState] = useState<MetricsState>({
    current: {},
    history: {},
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleSnapshot = useCallback((snapshot: MetricSnapshot) => {
    setState((prev) => {
      const newCurrent = { ...prev.current, ...snapshot.values };
      const newHistory = { ...prev.history };

      for (const [key, val] of Object.entries(snapshot.values)) {
        const num = extractNumeric(val);
        if (num !== null) {
          const existing = newHistory[key] || [];
          newHistory[key] = [...existing.slice(-(HISTORY_LEN - 1)), num];
        }
      }

      return { current: newCurrent, history: newHistory };
    });
  }, []);

  useEffect(() => {
    const unlisten = listen<MetricSnapshot>("metrics", (event) => {
      handleSnapshot(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [handleSnapshot]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId = 0;

    function tick() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= FPS_SAMPLE_MS) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        setState((prev) => {
          const fpsVal: MetricValue = { type: "Integer", value: fps };
          const newCurrent = { ...prev.current, "frontend.fps": fpsVal };
          const existing = prev.history["frontend.fps"] || [];
          const newHistory = {
            ...prev.history,
            "frontend.fps": [...existing.slice(-(HISTORY_LEN - 1)), fps],
          };
          return { current: newCurrent, history: newHistory };
        });
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return state;
}

export function useMetricValue(
  metrics: MetricsState,
  key: string
): MetricValue | undefined {
  return metrics.current[key];
}

export function useMetricHistory(
  metrics: MetricsState,
  key: string
): number[] {
  return metrics.history[key] || [];
}
