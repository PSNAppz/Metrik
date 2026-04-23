import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { availableMonitors, getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { MetricsProvider, useMetricsContext } from "./providers/MetricsContext";
import { BackgroundLayer } from "./background/BackgroundLayer";
import { WidgetRenderer } from "./widgets/WidgetRenderer";
import type { ThemeConfig, WidgetConfig } from "./types";

import cyberpunkTheme from "./themes/cyberpunk.json";
import minimalTheme from "./themes/minimal.json";
import emberTheme from "./themes/ember.json";
import fullPanelLayout from "./layouts/full-panel.json";
import compactLayout from "./layouts/compact.json";

const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: cyberpunkTheme as ThemeConfig,
  minimal: minimalTheme as ThemeConfig,
  ember: emberTheme as ThemeConfig,
};

const LAYOUTS: Record<string, WidgetConfig[]> = {
  "full-panel": fullPanelLayout as WidgetConfig[],
  compact: compactLayout as WidgetConfig[],
};

function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-accent", theme.colors.accent);
  root.style.setProperty("--color-danger", theme.colors.danger);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--color-bg", theme.colors.background);
  root.style.setProperty(
    "--glow-intensity",
    theme.glow.enabled ? `${theme.glow.intensity}px` : "0px"
  );
}

export default function App() {
  const [themeName, setThemeName] = useState("cyberpunk");
  const [layoutName, setLayoutName] = useState("full-panel");

  const theme = THEMES[themeName] || THEMES.cyberpunk;
  const layout = LAYOUTS[layoutName] || LAYOUTS["full-panel"];

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  useEffect(() => {
    loadConfig();
    restoreWindowPosition();
    setupPositionPersistence();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || (e.ctrlKey && e.key === "q")) {
        invoke("exit_app").catch(() => {});
      }
      if (e.key === "m" || e.key === "M") {
        cycleMonitor();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function loadConfig() {
    try {
      const config = await invoke<{
        theme: string;
        layout: string;
        position: { x: number; y: number } | null;
        monitor: number | null;
      }>("get_config");
      if (config.theme && THEMES[config.theme]) setThemeName(config.theme);
      if (config.layout && LAYOUTS[config.layout]) setLayoutName(config.layout);
    } catch {
      // First launch, no config yet
    }
  }

  async function restoreWindowPosition() {
    try {
      const config = await invoke<any>("get_config");
      if (config.position) {
        const win = getCurrentWindow();
        await win.setPosition(
          new PhysicalPosition(config.position.x, config.position.y)
        );
      }
    } catch {
      // Ignore
    }
  }

  function setupPositionPersistence() {
    let timeout: ReturnType<typeof setTimeout>;
    const win = getCurrentWindow();
    win.onMoved(({ payload }) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        invoke("save_config", {
          key: "position",
          value: { x: payload.x, y: payload.y },
        }).catch(() => {});
      }, 2000);
    });
  }

  async function cycleMonitor() {
    try {
      const win = getCurrentWindow();
      const monitors = await availableMonitors();
      if (monitors.length < 2) return;

      const currentPos = await win.outerPosition();
      let currentIdx = 0;
      for (let i = 0; i < monitors.length; i++) {
        const m = monitors[i];
        if (
          currentPos.x >= m.position.x &&
          currentPos.x < m.position.x + m.size.width &&
          currentPos.y >= m.position.y &&
          currentPos.y < m.position.y + m.size.height
        ) {
          currentIdx = i;
          break;
        }
      }

      const nextIdx = (currentIdx + 1) % monitors.length;
      const next = monitors[nextIdx];
      await win.setPosition(
        new PhysicalPosition(next.position.x, next.position.y)
      );
    } catch {
      // Ignore monitor errors
    }
  }

  function cycleTheme() {
    const keys = Object.keys(THEMES);
    const next = keys[(keys.indexOf(themeName) + 1) % keys.length];
    setThemeName(next);
    invoke("save_config", { key: "theme", value: next }).catch(() => {});
  }

  function cycleLayout() {
    const keys = Object.keys(LAYOUTS);
    const next = keys[(keys.indexOf(layoutName) + 1) % keys.length];
    setLayoutName(next);
    invoke("save_config", { key: "layout", value: next }).catch(() => {});
  }

  return (
    <MetricsProvider>
      <div className="panel-root" onDoubleClick={cycleTheme} onContextMenu={(e) => { e.preventDefault(); cycleLayout(); }}>
        <BackgroundLayer
          config={theme.background}
          overlay={theme.overlay}
        />
        <div className="panel-content">
          <header className="panel-header">
            <span className="panel-title">METRIK</span>
            <GpuName />
          </header>
          <NoDataOverlay />
          <div className="widget-grid">
            <WidgetRenderer config={layout} />
          </div>
        </div>
      </div>
    </MetricsProvider>
  );
}

function GpuName() {
  const metrics = useMetricsContext();
  const name = metrics.current["gpu.name"];
  if (!name || name.type !== "Text") return null;
  return <span className="gpu-name">{name.value}</span>;
}

function NoDataOverlay() {
  const metrics = useMetricsContext();
  const hasAnyData = Object.keys(metrics.current).length > 0;
  if (hasAnyData) return null;

  return (
    <div className="no-data-overlay">
      <div className="no-data-spinner" />
      <div className="no-data-text">Waiting for metrics...</div>
      <div className="no-data-hint">
        If this persists, check that NVIDIA drivers are installed.
      </div>
    </div>
  );
}
