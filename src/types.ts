export type MetricValue =
  | { type: "Float"; value: number }
  | { type: "Integer"; value: number }
  | { type: "Ratio"; value: { used: number; total: number } }
  | { type: "Text"; value: string };

export interface MetricSnapshot {
  ts: number;
  values: Record<string, MetricValue>;
}

export interface WidgetConfig {
  type: string;
  metricKey: string | null;
  label: string;
  col: string | number;
  row: string | number;
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
  | { type: "particles"; color: string; count: number; speed: number };

export interface BackgroundOverlay {
  type: "scanlines";
  opacity: number;
}

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
}
