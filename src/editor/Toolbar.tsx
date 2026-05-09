import { useState } from "react";

interface Props {
  themeName: string;
  themeNames: string[];
  onThemeChange: (name: string) => void;
  onAddWidget: () => void;
  onBackground: () => void;
  onReset: () => void;
  onDone: () => void;
  autostartEnabled: boolean;
  onAutostartChange: (enabled: boolean) => void;
  presetSlots: ({ name: string } | null)[];
  onSavePreset: (slot: number) => void;
  onLoadPreset: (slot: number) => void;
  onIntegrations: () => void;
}

export function Toolbar({
  themeName, themeNames,
  onThemeChange, onAddWidget, onBackground, onReset, onDone,
  autostartEnabled, onAutostartChange,
  presetSlots, onSavePreset, onLoadPreset,
  onIntegrations,
}: Props) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="edit-toolbar">
      <div className="et-left">
        <span className="et-label">EDIT MODE</span>
        <button className="et-btn" onClick={onAddWidget}>+ Widget</button>
        <button className="et-btn" onClick={onBackground}>Background</button>
        <select
          className="et-select"
          value={themeName}
          onChange={(e) => onThemeChange(e.target.value)}
        >
          {themeNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button className="et-btn" onClick={onIntegrations}>Integrations</button>
        <div className="et-preset-wrap">
          <button
            className="et-btn"
            onClick={() => setShowPresets((v) => !v)}
          >
            Presets
          </button>
          {showPresets && (
            <div className="et-preset-dropdown">
              {[0, 1, 2].map((i) => (
                <div key={i} className="et-preset-row">
                  <span className="et-preset-name">
                    {presetSlots[i] ? presetSlots[i]!.name : `Slot ${i + 1} (empty)`}
                  </span>
                  <button
                    className="et-btn et-btn-tiny"
                    onClick={() => { onSavePreset(i); }}
                  >
                    Save
                  </button>
                  <button
                    className="et-btn et-btn-tiny"
                    disabled={!presetSlots[i]}
                    onClick={() => { onLoadPreset(i); setShowPresets(false); }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="et-right">
        <label className="et-autostart-toggle" title="Launch Metrik on system startup">
          <input
            type="checkbox"
            checked={autostartEnabled}
            onChange={(e) => onAutostartChange(e.target.checked)}
          />
          <span>Start on boot</span>
        </label>
        <button className="et-btn et-btn-muted" onClick={onReset}>Reset</button>
        <button className="et-btn et-btn-primary" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
