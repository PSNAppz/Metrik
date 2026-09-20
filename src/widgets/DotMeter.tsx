import { useSmoothValue } from "../anim/useSmoothValue";

interface Props {
  /** 0–100 target; eased internally. */
  percent: number;
  count?: number;
  color?: string;
  /** Above this percent the meter turns to the danger colour. */
  hot?: number;
}

/** LED-style row of square dots; lit count follows the value smoothly. */
export function DotMeter({ percent, count = 14, color, hot = 88 }: Props) {
  const p = useSmoothValue(Math.max(0, Math.min(100, percent)), 0.08);
  const lit = (p / 100) * count;
  const tone = p >= hot ? "var(--color-danger)" : color || "var(--color-accent)";

  return (
    <div className="dot-meter" style={{ ["--dot-color" as string]: tone }}>
      {Array.from({ length: count }, (_, i) => {
        const fill = Math.max(0, Math.min(1, lit - i));
        return (
          <span
            key={i}
            className="dot-meter-dot"
            style={{ opacity: 0.12 + fill * 0.88 }}
          />
        );
      })}
    </div>
  );
}
