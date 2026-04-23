import { useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { BackgroundConfig, BackgroundOverlay } from "../types";

interface Props {
  background: BackgroundConfig;
  overlay?: BackgroundOverlay;
  onChangeBackground: (bg: BackgroundConfig) => void;
  onChangeOverlay: (ov: BackgroundOverlay | undefined) => void;
  onClose: () => void;
}

const PRESETS: { label: string; bg: BackgroundConfig }[] = [
  { label: "Solid Black", bg: { type: "solid", color: "#000000" } },
  { label: "Dark Gradient", bg: { type: "animated-gradient", colors: ["#000000", "#0A0015", "#000A14"], speed: 8 } },
  { label: "Ember Particles", bg: { type: "particles", color: "#FF6B35", count: 40, speed: 0.5 } },
  { label: "Cyan Particles", bg: { type: "particles", color: "#00E5FF", count: 30, speed: 0.3 } },
  { label: "Purple Haze", bg: { type: "animated-gradient", colors: ["#000000", "#1a0030", "#000020"], speed: 12 } },
  { label: "Synthwave", bg: { type: "animated-gradient", colors: ["#0d0221", "#3d0066", "#ff00c8"], speed: 10 } },
  { label: "Vaporwave", bg: { type: "animated-gradient", colors: ["#ff71ce", "#b967ff", "#05ffa1"], speed: 14 } },
  { label: "Neon City", bg: { type: "particles", color: "#ff00ff", count: 50, speed: 0.4 } },
  { label: "Deep Space", bg: { type: "particles", color: "#4040ff", count: 60, speed: 0.15 } },
  { label: "Electric Storm", bg: { type: "particles", color: "#ffffff", count: 80, speed: 1.2 } },
  { label: "Sunset Glow", bg: { type: "animated-gradient", colors: ["#0d0000", "#4a0030", "#ff6a00"], speed: 16 } },
  { label: "Matrix Rain", bg: { type: "matrix", color: "#00ff41", speed: 1 } },
];

export function BackgroundPicker({ background, overlay, onChangeBackground, onChangeOverlay, onClose }: Props) {
  const [tab, setTab] = useState<"presets" | "custom" | "settings">("presets");
  const [urlInput, setUrlInput] = useState("");
  const [opacity, setOpacity] = useState(
    ("opacity" in background ? (background as any).opacity : 1) ?? 1
  );

  async function pickFile() {
    try {
      const result = await open({
        multiple: false,
        filters: [
          { name: "Media", extensions: ["png", "jpg", "jpeg", "gif", "webp", "mp4", "webm"] },
        ],
      });
      if (result) {
        const copied = await invoke<string>("copy_background_file", { sourcePath: result });
        const assetUrl = convertFileSrc(copied);
        const isVideo = /\.(mp4|webm)$/i.test(copied);
        onChangeBackground(
          isVideo
            ? { type: "user-video", src: assetUrl, opacity }
            : { type: "user-image", src: assetUrl, opacity }
        );
      }
    } catch {
      // User cancelled
    }
  }

  function applyUrl() {
    const url = urlInput.trim();
    if (!url) return;
    const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(url);
    onChangeBackground(
      isVideo
        ? { type: "user-video", src: url, opacity }
        : { type: "user-url", url, opacity }
    );
  }

  return (
    <div className="bg-picker-modal" onClick={(e) => e.stopPropagation()}>
      <div className="bp-header">
        <span>Background</span>
        <button className="pp-close" onClick={onClose}>X</button>
      </div>

      <div className="bp-tabs">
        <button className={tab === "presets" ? "active" : ""} onClick={() => setTab("presets")}>Presets</button>
        <button className={tab === "custom" ? "active" : ""} onClick={() => setTab("custom")}>Media</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>Settings</button>
      </div>

      <div className="bp-content">
        {tab === "presets" && (
          <div className="bp-presets">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                className={`bp-preset-btn ${JSON.stringify(background) === JSON.stringify(p.bg) ? "active" : ""}`}
                onClick={() => onChangeBackground(p.bg)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {tab === "custom" && (
          <div className="bp-custom">
            <button className="bp-file-btn" onClick={pickFile}>
              Choose File from PC...
            </button>
            <div className="bp-divider">or enter URL</div>
            <div className="bp-url-row">
              <input
                type="text"
                placeholder="https://example.com/bg.gif"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button onClick={applyUrl}>Apply</button>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="bp-settings">
            <div className="pp-section">
              <label>Opacity: {Math.round(opacity * 100)}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  setOpacity(val);
                  if ("opacity" in background) {
                    onChangeBackground({ ...background, opacity: val } as any);
                  }
                }}
              />
            </div>
            <div className="pp-section">
              <label className="pp-checkbox">
                <input
                  type="checkbox"
                  checked={overlay?.type === "scanlines"}
                  onChange={(e) => {
                    onChangeOverlay(
                      e.target.checked ? { type: "scanlines", opacity: 0.04 } : undefined
                    );
                  }}
                />
                Scanlines Overlay
              </label>
            </div>
            {overlay?.type === "scanlines" && (
              <div className="pp-section">
                <label>Scanline Intensity: {Math.round(overlay.opacity * 100)}%</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={Math.round(overlay.opacity * 100)}
                  onChange={(e) => {
                    onChangeOverlay({ type: "scanlines", opacity: Number(e.target.value) / 100 });
                  }}
                />
              </div>
            )}
            <div className="pp-section">
              <label className="pp-checkbox">
                <input
                  type="checkbox"
                  checked={overlay?.type === "noise"}
                  onChange={(e) => {
                    onChangeOverlay(
                      e.target.checked ? { type: "noise", opacity: 0.06 } : undefined
                    );
                  }}
                />
                Noise Overlay
              </label>
            </div>
            {overlay?.type === "noise" && (
              <div className="pp-section">
                <label>Noise Intensity: {Math.round(overlay.opacity * 100)}%</label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={Math.round(overlay.opacity * 100)}
                  onChange={(e) => {
                    onChangeOverlay({ type: "noise", opacity: Number(e.target.value) / 100 });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
