import type { MetricValue } from "../types";

/** Keys whose Float values are physical quantities, not 0–100%. */
export const ABSOLUTE_KEYS = new Set(["gpu.power", "gpu.clock", "gpu.temp", "cpu.temp", "game.memory_mb"]);

/** Sensible full-scale values so absolute metrics can still drive meters. */
export const ABSOLUTE_MAX: Record<string, number> = {
  "gpu.power": 500,
  "gpu.clock": 3000,
  "gpu.temp": 100,
  "cpu.temp": 100,
  "game.fps": 240,
  "frontend.fps": 144,
};

export interface MetricReading {
  /** Numeric value to animate toward, or null for text/missing. */
  value: number | null;
  /** 0–100 for meters. */
  percent: number;
  /** Suffix rendered small next to the numeral. */
  unit: string;
  /** Decimal places for the numeral. */
  decimals: number;
  /** For Ratio values: "of 12.0 GB" style secondary text. */
  secondary?: string;
  /** Pre-formatted text for Text values. */
  text?: string;
}

export function readMetric(val: MetricValue | undefined, key: string): MetricReading {
  if (!val) return { value: null, percent: 0, unit: "", decimals: 0 };

  switch (val.type) {
    case "Float":
    case "Integer": {
      const n = val.value;
      const isAbs = ABSOLUTE_KEYS.has(key);
      const max = ABSOLUTE_MAX[key];
      const percent = isAbs || max ? Math.min((n / (max ?? 100)) * 100, 100) : Math.min(n, 100);
      if (key.includes("temp")) return { value: n, percent, unit: "°C", decimals: 0 };
      if (key.includes("power")) return { value: n, percent, unit: "W", decimals: 0 };
      if (key.includes("clock")) return { value: n, percent, unit: "MHz", decimals: 0 };
      if (key.includes("fps")) return { value: n, percent, unit: "FPS", decimals: 0 };
      if (key.includes("memory_mb")) {
        return n >= 1000
          ? { value: n / 1000, percent, unit: "GB", decimals: 1 }
          : { value: n, percent, unit: "MB", decimals: 0 };
      }
      return { value: n, percent, unit: "%", decimals: 0 };
    }
    case "Ratio": {
      const { used, total } = val.value;
      const gb = 1024 * 1024 * 1024;
      const percent = total > 0 ? (used / total) * 100 : 0;
      return {
        value: used / gb,
        percent,
        unit: "GB",
        decimals: 1,
        secondary: `of ${(total / gb).toFixed(1)} GB`,
      };
    }
    case "Text":
      return { value: null, percent: 0, unit: "", decimals: 0, text: val.value };
  }
}

export function formatNumber(n: number, decimals: number): string {
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}
