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
import { IntegrationPanel } from "./editor/IntegrationPanel";
import { DEFAULT_WIDGETS, LAYOUT_VERSION } from "./layouts/default-widgets";
import type { ThemeConfig, WidgetConfig, BackgroundConfig, BackgroundOverlay, StylePreset } from "./types";

import amberTheme from "./themes/amber.json";
import mossTheme from "./themes/moss.json";
import phosphorTheme from "./themes/phosphor.json";

const THEMES: Record<string, ThemeConfig> = {
  amber: amberTheme as ThemeConfig,
  moss: mossTheme as ThemeConfig,
  phosphor: phosphorTheme as ThemeConfig,
};
const DEFAULT_THEME = "amber";

function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--color-primary", c.primary);
  root.style.setProperty("--color-secondary", c.secondary);
  root.style.setProperty("--color-accent", c.accent);
  root.style.setProperty("--color-danger", c.danger);
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-bg", c.background);
  root.style.setProperty("--color-surface", c.surface ?? "rgba(255,255,255,0.04)");
  root.style.setProperty("--color-outline", c.outline ?? "rgba(255,255,255,0.14)");
  root.style.setProperty("--color-muted", c.muted ?? "rgba(255,255,255,0.45)");
  root.style.setProperty(
    "--glow-intensity",
    theme.glow.enabled ? `${theme.glow.intensity}px` : "0px"
  );
}

export default function App() {
  const [themeName, setThemeName] = useState(DEFAULT_THEME);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [background, setBackground] = useState<BackgroundConfig>(
    THEMES[DEFAULT_THEME].background
  );
  const [overlay, setOverlay] = useState<BackgroundOverlay | undefined>(
    THEMES[DEFAULT_THEME].overlay
  );

  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState<string | null>(null);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [stylePresets, setStylePresets] = useState<(StylePreset | null)[]>([null, null, null]);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const CANVAS_W = 800;
  const CANVAS_H = 480;
  const SIDE_PANEL_W = 220;
  const TOOLBAR_H = 44;
  const GAP = 0;

  const theme = THEMES[themeName] || THEMES[DEFAULT_THEME];

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
    invoke<boolean>("get_autostart_enabled")
      .then(setAutostartEnabled)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && editing) {
        setEditing(false);
        setSelectedId(null);
        setShowPalette(false);
        setShowBgPicker(false);
        setShowIntegrations(null);
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
    let config: any;
    try {
      config = await invoke<any>("get_config");
    } catch {
      return;
    }

    if (config.theme && THEMES[config.theme]) setThemeName(config.theme);

    // Layouts saved by the previous visual system are discarded so the
    // rebuilt defaults show up; presets are kept and can still be loaded.
    if (config.layout_version === LAYOUT_VERSION) {
      if (Array.isArray(config.widgets) && config.widgets.length > 0) {
        setWidgets(config.widgets);
      }
      if (config.custom_background && config.custom_background.type) {
        setBackground(config.custom_background);
      }
      if (config.custom_overlay) {
        setOverlay(config.custom_overlay);
      }
    } else {
      invoke("save_config", { key: "layout_version", value: LAYOUT_VERSION }).catch(() => {});
    }

    const loaded: (StylePreset | null)[] = [null, null, null];
    for (let i = 0; i < 3; i++) {
      const p = config[`style_preset_${i}`];
      if (p && p.themeName && THEMES[p.themeName]) loaded[i] = p;
    }
    setStylePresets(loaded);
  }

  async function restoreWindowPosition() {
    try {
      const config = await invoke<any>("get_config");
      if (config.position) {
        const { x, y } = config.position;
        // Ignore Windows minimized/off-screen sentinel values
        if (x <= -10000 || y <= -10000) return;
        const win = getCurrentWindow();
        const monitors = await availableMonitors();
        // Make sure the position lands on at least one monitor
        const onScreen = monitors.some(
          (m) =>
            x >= m.position.x &&
            x < m.position.x + m.size.width &&
            y >= m.position.y &&
            y < m.position.y + m.size.height
        );
        if (onScreen) {
          await win.setPosition(new PhysicalPosition(x, y));
        }
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

  function handleAutostartChange(enabled: boolean) {
    setAutostartEnabled(enabled);
    invoke("set_autostart_enabled", { enabled }).catch(() => {});
  }

  function handleSavePreset(slotIndex: number) {
    const preset: StylePreset = {
      name: `Preset ${slotIndex + 1}`,
      themeName,
      background,
      overlay,
      widgets: structuredClone(widgets),
    };
    setStylePresets((prev) => {
      const next = [...prev];
      next[slotIndex] = preset;
      return next;
    });
    invoke("save_config", {
      key: `style_preset_${slotIndex}`,
      value: preset,
    }).catch(() => {});
  }

  function handleLoadPreset(slotIndex: number) {
    const preset = stylePresets[slotIndex];
    if (!preset) return;
    if (preset.themeName && THEMES[preset.themeName]) {
      setThemeName(preset.themeName);
      invoke("save_config", { key: "theme", value: preset.themeName }).catch(() => {});
    }
    setBackground(preset.background);
    setOverlay(preset.overlay);
    setWidgets(preset.widgets);
    setSelectedId(null);
  }

  const selectedWidget = widgets.find((w) => w.id === selectedId) || null;

  const sideContent = showIntegrations ? "integrations" : showBgPicker ? "bg" : showPalette ? "palette" : selectedWidget ? "props" : null;

  return (
    <MetricsProvider>
      {editing ? (
        <div className="edit-shell">
          <Toolbar
            themeName={themeName}
            themeNames={Object.keys(THEMES)}
            onThemeChange={handleThemeChange}
            onAddWidget={() => { setShowPalette(true); setShowBgPicker(false); setShowIntegrations(null); }}
            onBackground={() => { setShowBgPicker(true); setShowPalette(false); setShowIntegrations(null); }}
            onIntegrations={() => { setShowIntegrations("youtube"); setShowPalette(false); setShowBgPicker(false); }}
            onReset={handleReset}
            onDone={() => {
              setEditing(false);
              setSelectedId(null);
              setShowPalette(false);
              setShowBgPicker(false);
              setShowIntegrations(null);
            }}
            autostartEnabled={autostartEnabled}
            onAutostartChange={handleAutostartChange}
            presetSlots={stylePresets}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
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
              {sideContent === "integrations" && (
                <div className="integrations-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="pp-header">
                    <span>Integrations</span>
                    <button className="pp-close" onClick={() => setShowIntegrations(null)}>X</button>
                  </div>
                  <div className="int-tabs">
                    {["youtube", "discord", "steam"].map((p) => (
                      <button
                        key={p}
                        className={`int-tab ${showIntegrations === p ? "active" : ""}`}
                        onClick={() => setShowIntegrations(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {showIntegrations === "youtube" && (
                    <IntegrationPanel
                      provider="youtube"
                      title="YouTube Config"
                      fields={[
                        { key: "api_key", label: "API Key", placeholder: "AIza...", secret: true },
                        { key: "channel_id", label: "Channel ID", placeholder: "UC..." },
                      ]}
                      onClose={() => setShowIntegrations(null)}
                    />
                  )}
                  {showIntegrations === "discord" && (
                    <IntegrationPanel
                      provider="discord"
                      title="Discord Config"
                      fields={[
                        { key: "user_id", label: "User ID", placeholder: "123456789..." },
                        { key: "bot_token", label: "Bot Token (optional)", placeholder: "Bot token for presence", secret: true },
                      ]}
                      onClose={() => setShowIntegrations(null)}
                    />
                  )}
                  {showIntegrations === "steam" && (
                    <IntegrationPanel
                      provider="steam"
                      title="Steam Config"
                      fields={[
                        { key: "api_key", label: "API Key", placeholder: "Steam Web API key", secret: true },
                        { key: "steam_id", label: "Steam ID", placeholder: "76561198..." },
                      ]}
                      onClose={() => setShowIntegrations(null)}
                    />
                  )}
                </div>
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
          <footer className="panel-footer">
            <span className="panel-brand">METRIK</span>
            <GpuName />
            <span className="edit-hint">E · EDIT</span>
          </footer>
        </div>
      )}
    </MetricsProvider>
  );
}

function GpuName() {
  const metrics = useMetricsContext();
  const name = metrics.current["gpu.name"];
  if (!name || name.type !== "Text") return null;
  return <span className="gpu-name">· {name.value.replace(/^NVIDIA\s+/i, "")}</span>;
}

function NoDataOverlay() {
  const metrics = useMetricsContext();
  const hasAnyData = Object.keys(metrics.current).length > 0;
  if (hasAnyData) return null;

  return (
    <div className="no-data-overlay">
      <div className="no-data-spinner">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="no-data-text">WAITING FOR METRICS</div>
      <div className="no-data-hint">
        If this persists, check that NVIDIA drivers are installed.
      </div>
    </div>
  );
}
