/** Small, dependency-free value noise. Deterministic per (x, y, z). */

function hash3(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 3D value noise in [0, 1]. Use z as time for animation. */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);

  const c000 = hash3(xi, yi, zi),         c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi),     c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1),     c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);

  const x00 = c000 + (c100 - c000) * xf;
  const x10 = c010 + (c110 - c010) * xf;
  const x01 = c001 + (c101 - c001) * xf;
  const x11 = c011 + (c111 - c011) * xf;
  const y0 = x00 + (x10 - x00) * yf;
  const y1 = x01 + (x11 - x01) * yf;
  return y0 + (y1 - y0) * zf;
}

/** Two octaves of noise3: enough texture without the cost of full fBm. */
export function noise3o2(x: number, y: number, z: number): number {
  return noise3(x, y, z) * 0.667 + noise3(x * 2.1, y * 2.1, z * 1.3) * 0.333;
}

/** Stable per-cell random in [0, 1). */
export function cellRand(x: number, y: number, salt = 0): number {
  return hash3(x, y, salt);
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
