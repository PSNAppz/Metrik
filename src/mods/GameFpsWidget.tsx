import type { WidgetProps } from "../types";
import { useMetricsContext } from "../providers/MetricsContext";

function fmtMem(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} GB`;
  return `${Math.round(v)} MB`;
}

export function GameFpsWidget({ label, style }: WidgetProps) {
  const metrics = useMetricsContext();
  const color = style?.color || "var(--color-primary)";
  const showLabel = style?.showLabel !== false;

  const gameName = metrics.current["game.name"];
  const gameFps = metrics.current["game.fps"];
  const gameCpu = metrics.current["game.cpu_usage"];
  const gameMem = metrics.current["game.memory_mb"];

  const nameStr =
    gameName && gameName.type === "Text" ? gameName.value : "";
  const fpsVal =
    gameFps && (gameFps.type === "Float" || gameFps.type === "Integer")
      ? gameFps.value
      : null;
  const cpuVal =
    gameCpu && (gameCpu.type === "Float" || gameCpu.type === "Integer")
      ? gameCpu.value
      : null;
  const memVal =
    gameMem && (gameMem.type === "Float" || gameMem.type === "Integer")
      ? gameMem.value
      : null;

  const fpsColor =
    fpsVal !== null
      ? fpsVal >= 60
        ? "var(--color-accent)"
        : fpsVal >= 30
        ? "var(--color-primary)"
        : "var(--color-danger)"
      : color;

  if (!nameStr) {
    return (
      <div className="widget gamefps-widget">
        {showLabel && (
          <div className="widget-label">{label || "GAME"}</div>
        )}
        <div className="gfps-idle">No game detected</div>
      </div>
    );
  }

  return (
    <div className="widget gamefps-widget">
      {showLabel && (
        <div className="widget-label">{label || "GAME"}</div>
      )}
      <div className="gfps-name" style={{ color }}>{nameStr}</div>
      {fpsVal !== null ? (
        <div className="gfps-fps" style={{ color: fpsColor }}>
          {Math.round(fpsVal)} <span className="gfps-unit">FPS</span>
        </div>
      ) : (
        <div className="gfps-no-fps">Run as Admin for FPS</div>
      )}
      <div className="gfps-stats">
        {cpuVal !== null && (
          <div className="gfps-stat">
            <span className="gfps-stat-value">{cpuVal.toFixed(1)}%</span>
            <span className="gfps-stat-label">CPU</span>
          </div>
        )}
        {memVal !== null && (
          <div className="gfps-stat">
            <span className="gfps-stat-value">{fmtMem(memVal)}</span>
            <span className="gfps-stat-label">MEM</span>
          </div>
        )}
      </div>
    </div>
  );
}
