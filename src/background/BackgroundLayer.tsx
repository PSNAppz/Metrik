import { useRef, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { BackgroundConfig, BackgroundOverlay } from "../types";

interface Props {
  config: BackgroundConfig;
  overlay?: BackgroundOverlay;
}

export function BackgroundLayer({ config, overlay }: Props) {
  return (
    <div className="background-layer">
      <BackgroundContent config={config} />
      {overlay?.type === "scanlines" && (
        <div
          className="scanlines-overlay"
          style={{ opacity: overlay.opacity }}
        />
      )}
      {overlay?.type === "noise" && (
        <div
          className="noise-overlay"
          style={{ opacity: overlay.opacity }}
        />
      )}
    </div>
  );
}

function BackgroundContent({ config }: { config: BackgroundConfig }) {
  switch (config.type) {
    case "solid":
      return (
        <div
          className="bg-fill"
          style={{ backgroundColor: config.color }}
        />
      );

    case "gradient":
      return (
        <div className="bg-fill" style={{ background: config.css }} />
      );

    case "animated-gradient":
      return <AnimatedGradient colors={config.colors} speed={config.speed} />;

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
      return (
        <video
          className="bg-fill bg-video"
          src={config.src}
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: config.opacity ?? 1 }}
        />
      );

    case "particles":
      return (
        <ParticleCanvas
          color={config.color}
          count={config.count}
          speed={config.speed}
        />
      );

    case "user-image": {
      const imgSrc = config.src.startsWith("http") || config.src.startsWith("asset:")
        ? config.src
        : convertFileSrc(config.src);
      return (
        <img
          className="bg-fill bg-image-fit"
          src={imgSrc}
          style={{ opacity: config.opacity ?? 1 }}
          alt=""
          draggable={false}
        />
      );
    }

    case "user-url":
      return (
        <img
          className="bg-fill bg-image-fit"
          src={config.url}
          style={{ opacity: config.opacity ?? 1 }}
          alt=""
          draggable={false}
        />
      );

    case "user-video": {
      const vidSrc = config.src.startsWith("http") || config.src.startsWith("asset:")
        ? config.src
        : convertFileSrc(config.src);
      return (
        <video
          className="bg-fill bg-video"
          src={vidSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{ opacity: config.opacity ?? 1 }}
        />
      );
    }

    case "matrix":
      return (
        <MatrixRain
          color={config.color || "#00ff41"}
          speed={config.speed || 1}
        />
      );

    default:
      return null;
  }
}

function AnimatedGradient({
  colors,
  speed,
}: {
  colors: string[];
  speed: number;
}) {
  const gradientCSS = `linear-gradient(135deg, ${colors.join(", ")})`;
  return (
    <div
      className="bg-fill bg-animated-gradient"
      style={{
        background: gradientCSS,
        backgroundSize: "400% 400%",
        animationDuration: `${speed}s`,
      }}
    />
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

function ParticleCanvas({
  color,
  count,
  speed,
}: {
  color: string;
  count: number;
  speed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 800;
    const h = 480;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed * 0.5,
      vy: (Math.random() - 0.5) * speed * 0.5,
      size: Math.random() * 4 + 2,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color, count, speed]);

  return <canvas ref={canvasRef} className="bg-fill bg-particles" />;
}

const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";

function MatrixRain({ color, speed }: { color: string; speed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 800;
    const h = 480;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const fontSize = 14;
    const cols = Math.floor(w / fontSize);
    dropsRef.current = Array.from({ length: cols }, () => Math.random() * -50);

    let last = 0;
    const interval = 50 / speed;

    function draw(ts: number) {
      if (ts - last < interval) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      last = ts;

      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, w, h);

      ctx!.fillStyle = color;
      ctx!.font = `${fontSize}px monospace`;

      for (let i = 0; i < dropsRef.current.length; i++) {
        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const y = dropsRef.current[i] * fontSize;

        ctx!.globalAlpha = 0.9;
        ctx!.fillText(ch, i * fontSize, y);

        ctx!.globalAlpha = 0.4;
        if (y - fontSize > 0) {
          const prev = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          ctx!.fillText(prev, i * fontSize, y - fontSize);
        }

        dropsRef.current[i]++;
        if (dropsRef.current[i] * fontSize > h && Math.random() > 0.975) {
          dropsRef.current[i] = 0;
        }
      }
      ctx!.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [color, speed]);

  return <canvas ref={canvasRef} className="bg-fill bg-particles" />;
}
