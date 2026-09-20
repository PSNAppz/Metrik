import { useEffect, useRef, useState } from "react";

/**
 * Exponentially eases toward `target` on every animation frame so metric
 * updates (which arrive once a second) glide instead of jumping.
 * `rate` is the fraction of the remaining distance covered per 16ms frame.
 */
export function useSmoothValue(target: number, rate = 0.1, epsilon = 0.01): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - last) / 16.667, 4);
      last = now;
      const diff = targetRef.current - valueRef.current;
      if (Math.abs(diff) < epsilon) {
        if (valueRef.current !== targetRef.current) {
          valueRef.current = targetRef.current;
          setValue(valueRef.current);
        }
      } else {
        valueRef.current += diff * (1 - Math.pow(1 - rate, dt));
        setValue(valueRef.current);
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rate, epsilon]);

  return value;
}

/**
 * Same easing, but stored outside React for canvas loops that must not
 * trigger renders. Call `step(dtFrames)` from inside your own rAF loop.
 */
export function makeSmoother(initial: number, rate = 0.1) {
  let value = initial;
  let target = initial;
  return {
    set(t: number) { target = t; },
    get() { return value; },
    step(dtFrames: number) {
      value += (target - value) * (1 - Math.pow(1 - rate, dtFrames));
      return value;
    },
  };
}
