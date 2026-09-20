import type { WidgetConfig } from "../types";

/**
 * Bump when the default layout changes shape. Saved layouts from an older
 * version are discarded on load so the rebuilt look shows up immediately.
 */
export const LAYOUT_VERSION = 2;

/** Bento grid on a 12px gutter for the 800×480 canvas. */
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "d_clock", type: "clock", metricKey: null, label: "TIME", x: 12, y: 12, w: 400, h: 220, style: { showLabel: true, caption: "LOCAL" } },
  { id: "d_gauge", type: "gauge", metricKey: "gpu.usage", label: "GPU", x: 424, y: 12, w: 170, h: 220, style: { showLabel: true } },
  { id: "d_temp", type: "card", metricKey: "gpu.temp", label: "TEMP", x: 606, y: 12, w: 182, h: 104, style: { showLabel: true, showBar: true, caption: "GPU" } },
  { id: "d_vram", type: "card", metricKey: "gpu.vram", label: "VRAM", x: 606, y: 128, w: 182, h: 104, style: { showLabel: true, showBar: true } },

  { id: "d_cpu", type: "card", metricKey: "cpu.usage", label: "CPU", x: 12, y: 244, w: 194, h: 104, style: { showLabel: true, showBar: true, caption: "LOAD" } },
  { id: "d_ram", type: "card", metricKey: "ram", label: "RAM", x: 218, y: 244, w: 194, h: 104, style: { showLabel: true, showBar: true } },
  { id: "d_power", type: "card", metricKey: "gpu.power", label: "POWER", x: 424, y: 244, w: 170, h: 104, style: { showLabel: true, showBar: true, caption: "GPU" } },
  { id: "d_clk", type: "card", metricKey: "gpu.clock", label: "CLOCK", x: 606, y: 244, w: 182, h: 104, style: { showLabel: true, showBar: true, caption: "GPU" } },

  { id: "d_spark", type: "sparkline", metricKey: "gpu.usage", label: "GPU", x: 12, y: 360, w: 776, h: 108, style: { showLabel: true } },
];
