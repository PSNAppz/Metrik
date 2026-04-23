import type { WidgetConfig } from "../types";

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "d_gauge", type: "gauge", metricKey: "gpu.usage", label: "GPU", x: 20, y: 55, w: 200, h: 190, style: { showLabel: true } },
  { id: "d_temp", type: "card", metricKey: "gpu.temp", label: "TEMP", x: 235, y: 55, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "d_vram", type: "card", metricKey: "gpu.vram", label: "VRAM", x: 420, y: 55, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "d_cpu", type: "card", metricKey: "cpu.usage", label: "CPU", x: 235, y: 155, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "d_ram", type: "card", metricKey: "ram", label: "RAM", x: 420, y: 155, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "d_spark", type: "sparkline", metricKey: "gpu.usage", label: "GPU \u2014 LAST 60s", x: 20, y: 260, w: 570, h: 100, style: { showLabel: true } },
  { id: "d_clock", type: "clock", metricKey: null, label: "", x: 640, y: 10, w: 150, h: 55 },
];

export const COMPACT_WIDGETS: WidgetConfig[] = [
  { id: "c_gauge", type: "gauge", metricKey: "gpu.usage", label: "GPU", x: 20, y: 55, w: 200, h: 190, style: { showLabel: true } },
  { id: "c_temp", type: "card", metricKey: "gpu.temp", label: "TEMP", x: 240, y: 55, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "c_vram", type: "card", metricKey: "gpu.vram", label: "VRAM", x: 430, y: 55, w: 170, h: 90, style: { showLabel: true, showBar: true } },
  { id: "c_clock", type: "clock", metricKey: null, label: "", x: 640, y: 10, w: 150, h: 55 },
];
