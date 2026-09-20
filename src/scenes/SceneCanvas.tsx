import { useMemo, useRef } from "react";
import { useCanvasLoop, type FrameInfo } from "../anim/useCanvasLoop";
import { useSceneSignals, makeSmoothSignals, type SceneSignals } from "./signals";

export interface Scene {
  draw(f: FrameInfo, s: SceneSignals): void;
}

interface Props {
  /** Builds the scene once; re-built whenever `deps` change. */
  factory: () => Scene;
  deps: unknown[];
  className?: string;
}

/** Full-bleed canvas that runs a generative scene fed by live metric signals. */
export function SceneCanvas({ factory, deps, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalsRef = useSceneSignals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(factory, deps);
  const smooth = useMemo(() => makeSmoothSignals(), [scene]);

  useCanvasLoop(
    canvasRef,
    (f) => scene.draw(f, smooth.step(signalsRef.current, f.dt)),
    [scene]
  );

  return <canvas ref={canvasRef} className={`bg-fill bg-scene ${className ?? ""}`} />;
}
