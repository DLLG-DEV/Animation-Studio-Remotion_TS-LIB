import { createRng, type Rng } from "@engine/lib/random";

export type Pt = [number, number];

const f = (n: number) => Math.round(n * 10) / 10;

/** Subdivide una polilínea para que el temblor afecte a todo el trazo. */
export const subdivide = (pts: Pt[], maxSeg = 40, closed = false): Pt[] => {
  const out: Pt[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(len / maxSeg));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
};

/** Catmull-Rom -> curvas Bézier cúbicas (trazo continuo y orgánico). */
export const smoothPath = (pts: Pt[], closed = false): string => {
  if (pts.length < 2) return "";
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f(p[1][0])} ${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + " Z" : d;
};

export type RoughOptions = {
  /** Desviación máxima de cada punto (px). */
  jitter?: number;
  /** Separación entre puntos antes del temblor. */
  segment?: number;
  closed?: boolean;
  /** Prolongación de los extremos (las líneas a mano se pasan de la esquina). */
  overshoot?: number;
};

/** Trazo irregular a partir de una polilínea. */
export const roughPath = (pts: Pt[], rng: Rng, o: RoughOptions = {}): string => {
  const { jitter = 2.5, segment = 45, closed = false, overshoot = 0 } = o;
  let base = pts;
  if (!closed && overshoot > 0 && pts.length >= 2) {
    const ext = (a: Pt, b: Pt, k: number): Pt => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [a[0] + ((a[0] - b[0]) / len) * k, a[1] + ((a[1] - b[1]) / len) * k];
    };
    base = [
      ext(pts[0], pts[1], overshoot * rng.range(0.3, 1)),
      ...pts.slice(1, -1),
      ext(pts[pts.length - 1], pts[pts.length - 2], overshoot * rng.range(0.3, 1)),
    ];
    if (pts.length === 2) base = [base[0], base[base.length - 1]];
  }
  const sub = subdivide(base, segment, closed).map(
    ([x, y]) => [x + rng.jitter(jitter), y + rng.jitter(jitter)] as Pt,
  );
  return smoothPath(sub, closed);
};

/** Varias pasadas de lápiz sobre la misma forma (como un dibujante real). */
export const roughPasses = (pts: Pt[], seed: string, passes = 2, o: RoughOptions = {}): string[] => {
  const rng = createRng(seed);
  return Array.from({ length: passes }, (_, i) =>
    roughPath(pts, rng, { ...o, jitter: (o.jitter ?? 2.5) * (1 + i * 0.35) }),
  );
};

export const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

export const ellipsePts = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 48,
  start = 0,
  end = Math.PI * 2,
): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = start + ((end - start) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

/** Polígono cerrado exacto (para clipPath, sin temblor). */
export const polyD = (pts: Pt[]) => `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")} Z`;

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Muestra una curva Bézier cuadrática como polilínea. */
export const quadPts = (a: Pt, c: Pt, b: Pt, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
  });

export const rotatePts = (pts: Pt[], center: Pt, deg: number): Pt[] => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return pts.map(([x, y]) => {
    const dx = x - center[0];
    const dy = y - center[1];
    return [center[0] + dx * c - dy * s, center[1] + dx * s + dy * c] as Pt;
  });
};

export const offsetPts = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy] as Pt);

export const scalePts = (pts: Pt[], origin: Pt, sx: number, sy = sx): Pt[] =>
  pts.map(([x, y]) => [origin[0] + (x - origin[0]) * sx, origin[1] + (y - origin[1]) * sy] as Pt);

/** Segmento curvo corto (pelo, pestaña, hierba) como path. */
export const curlD = (a: Pt, angle: number, len: number, bend: number): string => {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const b: Pt = [a[0] + ux * len, a[1] + uy * len];
  const c: Pt = [(a[0] + b[0]) / 2 - uy * bend, (a[1] + b[1]) / 2 + ux * bend];
  return `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
};
