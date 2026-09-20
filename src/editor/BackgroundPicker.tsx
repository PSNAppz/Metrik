import { useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { BackgroundConfig, BackgroundOverlay } from "../types";
import { PALETTES, SCENE_PRESETS, STATIC_PRESETS } from "./scene-presets";

interface Props {
  background: BackgroundConfig;
  overlay?: BackgroundOverlay;
  onChangeBackground: (bg: BackgroundConfig) => void;
  onChangeOverlay: (ov: BackgroundOverlay | undefined) => void;
  onClose: () => void;
}

/** Background presets live in scene-presets.ts; the picker pairs a scene with a palette. */

export function BackgroundPicker({ background, overlay, onChangeBackground, onChangeOverlay, onClose }: Props) {
  const [tab, setTab] = useState<"presets" | "custom" | "settings">("presets");
  const activeScene = SCENE_PRESETS.find((sp) => sp.is(background)) ?? null;
  const detected = activeScene ? activeScene.paletteOf(background) : -1;
  const [paletteIdx, setPaletteIdx] = useState(detected >= 0 ? detected : 0);
  const palette = PALETTES[paletteIdx].colors;

  function choosePalette(i: number) {
    setPaletteIdx(i);
    if (activeScene) onChangeBackground(activeScene.make(PALETTES[i].colors));
  }
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

  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) return m[1];
    }
    return null;
  }

  function applyUrl() {
    const url = urlInput.trim();
    if (!url) return;

    const ytId = extractYouTubeId(url);
    if (ytId) {
      onChangeBackground({ type: "user-youtube", videoId: ytId, opacity });
      return;
    }

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
            <div className="bp-scene-name">Palette</div>
            <div className="bp-swatches">
              {PALETTES.map((pal, i) => (
                <button
                  key={pal.name}
                  className={`bp-swatch ${i === paletteIdx ? "active" : ""}`}
                  title={pal.name}
                  onClick={() => choosePalette(i)}
                >
                  <span style={{ background: pal.colors[0] }} />
                  <span style={{ background: pal.colors[1] }} />
                  <span style={{ background: pal.colors[2] }} />
                </button>
              ))}
            </div>
            <div className="bp-palette-name">{PALETTES[paletteIdx].name}</div>

            <div className="bp-scene-name">Scenes</div>
            <div className="bp-scene-list">
              {SCENE_PRESETS.map((sp) => (
                <button
                  key={sp.label}
                  className={`bp-preset-btn ${activeScene === sp ? "active" : ""}`}
                  onClick={() => onChangeBackground(sp.make(palette))}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            <div className="bp-scene-name">Static</div>
            <div className="bp-scene-list">
              {STATIC_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`bp-preset-btn ${JSON.stringify(background) === JSON.stringify(p.bg) ? "active" : ""}`}
                  onClick={() => onChangeBackground(p.bg)}
                >
                  {p.label}
                </button>
              ))}
            </div>
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
                placeholder="https://youtube.com/watch?v=... or image URL"
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
