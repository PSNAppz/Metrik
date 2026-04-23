import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { availableMonitors, getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { MetricsProvider, useMetricsContext } from "./providers/MetricsContext";
import { BackgroundLayer } from "./background/BackgroundLayer";
import { WidgetRenderer } from "./widgets/WidgetRenderer";
import { Toolbar } from "./editor/Toolbar";
import { PropertyPanel } from "./editor/PropertyPanel";
import { WidgetPalette } from "./editor/WidgetPalette";
import { BackgroundPicker } from "./editor/BackgroundPicker";
import { DEFAULT_WIDGETS } from "./layouts/default-widgets";
import type { ThemeConfig, WidgetConfig, BackgroundConfig, BackgroundOverlay } from "./types";

import cyberpunkTheme from "./themes/cyberpunk.json";
import minimalTheme from "./themes/minimal.json";
import emberTheme from "./themes/ember.json";

const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: cyberpunkTheme as ThemeConfig,
  minimal: minimalTheme as ThemeConfig,
  ember: emberTheme as ThemeConfig,
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
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [background, setBackground] = useState<BackgroundConfig>(
    (cyberpunkTheme as ThemeConfig).background
  );
  const [overlay, setOverlay] = useState<BackgroundOverlay | undefined>(
    (cyberpunkTheme as ThemeConfig).overlay
  );

  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const CANVAS_W = 800;
  const CANVAS_H = 480;
  const SIDE_PANEL_W = 220;
  const TOOLBAR_H = 44;
  const GAP = 0;

  const theme = THEMES[themeName] || THEMES.cyberpunk;

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  useEffect(() => {
    const win = getCurrentWindow();
    if (editing) {
      win.setResizable(true).then(() =>
        win.setSize(new LogicalSize(CANVAS_W + SIDE_PANEL_W + GAP, CANVAS_H + TOOLBAR_H))
      );
    } else {
      win.setSize(new LogicalSize(CANVAS_W, CANVAS_H)).then(() =>
        win.setResizable(false)
      );
    }
  }, [editing]);

  useEffect(() => {
    loadConfig();
    restoreWindowPosition();
    setupPositionPersistence();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && editing) {
        setEditing(false);
        setSelectedId(null);
        setShowPalette(false);
        setShowBgPicker(false);
        return;
      }
      if (e.key === "Escape" || (e.ctrlKey && e.key === "q")) {
        invoke("exit_app").catch(() => {});
      }
      if (e.key === "m" || e.key === "M") {
        cycleMonitor();
      }
      if ((e.key === "e" || e.key === "E") && !editing) {
        setEditing(true);
      }
      if (e.key === "Delete" && editing && selectedId) {
        setWidgets((prev) => prev.filter((w) => w.id !== selectedId));
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, selectedId]);

  const debouncedSave = useCallback(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      invoke("save_config", { key: "widgets", value: widgets }).catch(() => {});
      invoke("save_config", { key: "custom_background", value: background }).catch(() => {});
      invoke("save_config", { key: "custom_overlay", value: overlay ?? null }).catch(() => {});
    }, 500);
  }, [widgets, background, overlay]);

  useEffect(() => {
    debouncedSave();
  }, [widgets, background, overlay, debouncedSave]);

  async function loadConfig() {
    try {
      const config = await invoke<any>("get_config");
      if (config.theme && THEMES[config.theme]) setThemeName(config.theme);
    } catch {}

    try {
      const store = await invoke<any>("get_config");
      // Load saved widgets
      const savedWidgets = store.widgets;
      if (Array.isArray(savedWidgets) && savedWidgets.length > 0) {
        setWidgets(savedWidgets);
      }
      // Load saved background
      if (store.custom_background && store.custom_background.type) {
        setBackground(store.custom_background);
      }
      if (store.custom_overlay) {
        setOverlay(store.custom_overlay);
      }
    } catch {}
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
    } catch {}
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
      await win.setPosition(new PhysicalPosition(next.position.x, next.position.y));
    } catch {}
  }

  function handleThemeChange(name: string) {
    setThemeName(name);
    invoke("save_config", { key: "theme", value: name }).catch(() => {});
    const t = THEMES[name];
    if (t) {
      setBackground(t.background);
      setOverlay(t.overlay);
    }
  }

  function handleWidgetMove(id: string, x: number, y: number) {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }

  function handleWidgetResize(id: string, w: number, h: number) {
    setWidgets((prev) => prev.map((wg) => (wg.id === id ? { ...wg, w, h } : wg)));
  }

  function handleWidgetChange(updated: WidgetConfig) {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  function handleWidgetDelete(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSelectedId(null);
  }

  function handleAddWidget(widget: WidgetConfig) {
    setWidgets((prev) => [...prev, widget]);
    setSelectedId(widget.id);
  }

  function handleReset() {
    setWidgets([...DEFAULT_WIDGETS]);
    setSelectedId(null);
    const t = THEMES[themeName];
    if (t) {
      setBackground(t.background);
      setOverlay(t.overlay);
    }
  }

  const selectedWidget = widgets.find((w) => w.id === selectedId) || null;

  const sideContent = showBgPicker ? "bg" : showPalette ? "palette" : selectedWidget ? "props" : null;

  return (
    <MetricsProvider>
      {editing ? (
        <div className="edit-shell">
          <Toolbar
            themeName={themeName}
            themeNames={Object.keys(THEMES)}
            onThemeChange={handleThemeChange}
            onAddWidget={() => { setShowPalette(true); setShowBgPicker(false); }}
            onBackground={() => { setShowBgPicker(true); setShowPalette(false); }}
            onReset={handleReset}
            onDone={() => {
              setEditing(false);
              setSelectedId(null);
              setShowPalette(false);
              setShowBgPicker(false);
            }}
          />

          <div className="edit-body">
            <div
              className="panel-root edit-active"
              onClick={() => setSelectedId(null)}
            >
              <BackgroundLayer config={background} overlay={overlay} />
              <div className="panel-content">
                <NoDataOverlay />
                <WidgetRenderer
                  widgets={widgets}
                  editing={editing}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onMove={handleWidgetMove}
                  onResize={handleWidgetResize}
                />
              </div>
            </div>

            <div className="edit-side-panel">
              {sideContent === "bg" && (
                <BackgroundPicker
                  background={background}
                  overlay={overlay}
                  onChangeBackground={setBackground}
                  onChangeOverlay={setOverlay}
                  onClose={() => setShowBgPicker(false)}
                />
              )}
              {sideContent === "palette" && (
                <WidgetPalette
                  onAdd={handleAddWidget}
                  onClose={() => setShowPalette(false)}
                />
              )}
              {sideContent === "props" && selectedWidget && (
                <PropertyPanel
                  widget={selectedWidget}
                  onChange={handleWidgetChange}
                  onDelete={handleWidgetDelete}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="panel-root"
          onClick={() => setSelectedId(null)}
        >
          <BackgroundLayer config={background} overlay={overlay} />
          <div className="panel-content">
            <header className="panel-header">
              <span className="panel-title">METRIK</span>
              <GpuName />
            </header>
            <NoDataOverlay />
            <WidgetRenderer
              widgets={widgets}
              editing={editing}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={handleWidgetMove}
              onResize={handleWidgetResize}
            />
          </div>
          <div className="edit-hint">Press E to edit</div>
        </div>
      )}
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
