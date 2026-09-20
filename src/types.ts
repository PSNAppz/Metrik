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
  /** Secondary caption shown after the label, e.g. "TIME · IDLE". */
  caption?: string;
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
  /** Tile fill (semi-transparent over the scene). */
  surface?: string;
  /** Hairline outline for tiles and dividers. */
  outline?: string;
  /** Dim text for labels / captions. */
  muted?: string;
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
  | { type: "user-youtube"; videoId: string; opacity?: number }
  | { type: "matrix"; color?: string; speed?: number }
  /** Breathing blob of 8-bit glyphs (squares, rings, crosses). */
  | { type: "glyph-cluster"; colors: [string, string]; density?: number; speed?: number }
  /** Dot-matrix field with luminous streams flowing through it. */
  | { type: "pixel-flow"; base: string; colors: [string, string]; speed?: number }
  /** Any scene from src/scenes/registry.ts; `colors` meaning is per scene. */
  | { type: "scene"; scene: string; colors: string[]; speed?: number };

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
  "game.name",
  "game.fps",
  "game.cpu_usage",
  "game.memory_mb",
] as const;

/** Human-readable display labels for metric keys shown in the editor UI. */
export const METRIC_LABELS: Record<string, string> = {
  "gpu.usage": "GPU Usage",
  "gpu.temp": "GPU Temp",
  "gpu.vram": "GPU VRAM",
  "gpu.clock": "GPU Clock",
  "gpu.fan": "GPU Fan",
  "gpu.power": "GPU Power",
  "gpu.name": "GPU Name",
  "cpu.usage": "CPU Usage",
  "cpu.temp": "CPU Temp",
  "ram": "RAM",
  "frontend.fps": "Panel FPS",
  "game.name": "Game Name",
  "game.fps": "Game FPS",
  "game.cpu_usage": "Game CPU",
  "game.memory_mb": "Game Memory",
};

export const WIDGET_TYPES = [
  "gauge",
  "card",
  "sparkline",
  "clock",
  "text",
  "youtube",
  "discord",
  "steam",
  "gamefps",
] as const;

export interface IntegrationConfig {
  provider: string;
  [key: string]: unknown;
}

export interface StylePreset {
  name: string;
  themeName: string;
  background: BackgroundConfig;
  overlay?: BackgroundOverlay;
  widgets: WidgetConfig[];
}
