import { useRef, useEffect } from "react";
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
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
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
