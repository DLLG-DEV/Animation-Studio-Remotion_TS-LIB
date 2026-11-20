/**
 * Aleatoriedad DETERMINISTA. Remotion renderiza fotogramas en paralelo y en
 * cualquier orden: nunca usar Math.random(). Todo depende de una semilla.
 */

/** Hash FNV-1a de una cadena -> entero de 32 bits. */
export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Generador mulberry32: rápido y suficiente para geometría procedural. */
export const createRng = (seed: string | number) => {
  let a = typeof seed === "number" ? seed >>> 0 : hashString(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    /** Valor centrado en 0: [-amp, amp] */
    jitter: (amp: number) => (next() * 2 - 1) * amp,
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    chance: (p: number) => next() < p,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
  };
};

export type Rng = ReturnType<typeof createRng>;

/** Número pseudoaleatorio [0,1) para una semilla puntual. */
export const rand01 = (seed: string | number) => createRng(seed).next();

/** Ruido de valor 1D suavizado, salida en [-1, 1]. Útil para temblor de cámara. */
export const noise1D = (seed: string, t: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  const a = rand01(`${seed}:${i}`) * 2 - 1;
  const b = rand01(`${seed}:${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/**
 * Animación "en dos / en tres": congela el tiempo en pasos, como los dibujos
 * sucesivos de la animación tradicional.
 */
export const steppedFrame = (frame: number, step: number) =>
  Math.floor(frame / Math.max(1, step)) * Math.max(1, step);
