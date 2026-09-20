import { convertFileSrc } from "@tauri-apps/api/core";
import type { BackgroundConfig, BackgroundOverlay } from "../types";
import { SceneCanvas } from "../scenes/SceneCanvas";
import { glyphCluster } from "../scenes/glyphCluster";
import { pixelFlow } from "../scenes/pixelFlow";
import { pixelParticles } from "../scenes/pixelParticles";
import { matrixRain } from "../scenes/matrixRain";
import { SCENE_REGISTRY, type SceneName } from "../scenes/registry";

interface Props {
  config: BackgroundConfig;
  overlay?: BackgroundOverlay;
}

export function BackgroundLayer({ config, overlay }: Props) {
  return (
    <div className="background-layer">
      <BackgroundContent config={config} />
      {overlay?.type === "scanlines" && (
        <div className="scanlines-overlay" style={{ opacity: overlay.opacity }} />
      )}
      {overlay?.type === "noise" && (
        <div className="noise-overlay" style={{ opacity: overlay.opacity }} />
      )}
    </div>
  );
}

function resolveSrc(src: string): string {
  return src.startsWith("http") || src.startsWith("asset:") ? src : convertFileSrc(src);
}

function BackgroundContent({ config }: { config: BackgroundConfig }) {
  switch (config.type) {
    case "solid":
      return <div className="bg-fill" style={{ backgroundColor: config.color }} />;

    case "gradient":
      return <div className="bg-fill" style={{ background: config.css }} />;

    case "animated-gradient":
      return <AnimatedGradient colors={config.colors} speed={config.speed} />;

    case "glyph-cluster":
      return (
        <SceneCanvas
          factory={() => glyphCluster(config.colors, config.density, config.speed)}
          deps={[config.colors[0], config.colors[1], config.density, config.speed]}
        />
      );

    case "pixel-flow":
      return (
        <SceneCanvas
          factory={() => pixelFlow(config.base, config.colors, config.speed)}
          deps={[config.base, config.colors[0], config.colors[1], config.speed]}
        />
      );

    case "scene": {
      const make = SCENE_REGISTRY[config.scene as SceneName];
      if (!make) return null;
      return (
        <SceneCanvas
          factory={() => make(config.colors, config.speed)}
          deps={[config.scene, config.colors.join(","), config.speed]}
        />
      );
    }

    case "particles":
      return (
        <SceneCanvas
          factory={() => pixelParticles(config.color, config.count, config.speed)}
          deps={[config.color, config.count, config.speed]}
        />
      );

    case "matrix":
      return (
        <SceneCanvas
          factory={() => matrixRain(config.color || "#00ff41", config.speed || 1)}
          deps={[config.color, config.speed]}
        />
      );

    case "image":
      return (
        <div
          className="bg-fill"
          style={{
            backgroundImage: `url(${config.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: config.opacity ?? 1,
          }}
        />
      );

    case "video":
    case "user-video":
      return (
        <video
          className="bg-fill bg-video"
          src={config.type === "video" ? config.src : resolveSrc(config.src)}
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: config.opacity ?? 1 }}
        />
      );

    case "user-image":
    case "user-url":
      return (
        <img
          className="bg-fill bg-image-fit"
          src={config.type === "user-image" ? resolveSrc(config.src) : config.url}
          style={{ opacity: config.opacity ?? 1 }}
          alt=""
          draggable={false}
        />
      );

    case "user-youtube":
      return (
        <iframe
          className="bg-fill bg-video"
          src={`https://www.youtube.com/embed/${config.videoId}?autoplay=1&mute=1&loop=1&playlist=${config.videoId}&controls=0&showinfo=0&modestbranding=1`}
          allow="autoplay; encrypted-media"
          style={{ opacity: config.opacity ?? 1, border: "none", pointerEvents: "none" }}
        />
      );

    default:
      return null;
  }
}

function AnimatedGradient({ colors, speed }: { colors: string[]; speed: number }) {
  return (
    <div
      className="bg-fill bg-animated-gradient"
      style={{
        background: `linear-gradient(135deg, ${colors.join(", ")})`,
        backgroundSize: "400% 400%",
        animationDuration: `${speed}s`,
      }}
    />
  );
}
