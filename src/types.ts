export type MetricValue =
  | { type: "Float"; value: number }
  | { type: "Integer"; value: number }
  | { type: "Ratio"; value: { used: number; total: number } }
  | { type: "Text"; value: string };

export interface MetricSnapshot {
  ts: number;
  values: Record<string, MetricValue>;
}

export interface WidgetStyle {
  color?: string;
  fontSize?: number;
  showLabel?: boolean;
  showBar?: boolean;
}

export interface WidgetConfig {
  id: string;
  type: string;
  metricKey: string | null;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: WidgetStyle;
  textContent?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  text: string;
  background: string;
}

export type BackgroundConfig =
  | { type: "solid"; color: string }
  | { type: "gradient"; css: string }
  | { type: "animated-gradient"; colors: string[]; speed: number }
  | { type: "image"; src: string; opacity?: number }
  | { type: "video"; src: string; opacity?: number }
  | { type: "particles"; color: string; count: number; speed: number }
  | { type: "user-image"; src: string; opacity?: number }
  | { type: "user-url"; url: string; opacity?: number }
  | { type: "user-video"; src: string; opacity?: number }
  | { type: "matrix"; color?: string; speed?: number };

export type BackgroundOverlay =
  | { type: "scanlines"; opacity: number }
  | { type: "noise"; opacity: number };

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  glow: { intensity: number; enabled: boolean };
  background: BackgroundConfig;
  overlay?: BackgroundOverlay;
}

export interface WidgetProps {
  metricKey: string | null;
  label: string;
  style?: WidgetStyle;
  textContent?: string;
  w?: number;
  h?: number;
}

export const METRIC_KEYS = [
  "gpu.usage",
  "gpu.temp",
  "gpu.vram",
  "gpu.clock",
  "gpu.fan",
  "gpu.power",
  "gpu.name",
  "cpu.usage",
  "cpu.temp",
  "ram",
  "frontend.fps",
] as const;

export const WIDGET_TYPES = [
  "gauge",
  "card",
  "sparkline",
  "clock",
  "text",
] as const;
