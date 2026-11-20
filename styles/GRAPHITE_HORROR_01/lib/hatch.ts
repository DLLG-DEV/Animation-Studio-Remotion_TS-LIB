import { createRng } from "@engine/lib/random";
import type { Pt } from "./geometry";

const f = (n: number) => Math.round(n * 10) / 10;

export type Bounds = { x: number; y: number; w: number; h: number };

export type HatchLayer = {
  /** Ángulo del trazo en grados. */
  angle: number;
  /** Separación entre filas de trazos (px). */
  spacing: number;
  /** Longitud media de cada trazo corto; 0 = líneas completas. */
  strokeLength?: number;
  /** Grosor del lápiz. */
  width?: number;
  opacity?: number;
  /** Curvatura del trazo (la muñeca hace arcos). */
  bow?: number;
  /** Variación del ángulo por trazo (grados). */
  angleJitter?: number;
};

/**
 * Genera los trazos de una capa de rayado. Devuelve segmentos individuales
 * ordenados por fila, para poder "dibujarlos" progresivamente.
 */
export const hatchSegments = (bounds: Bounds, layer: HatchLayer, seed: string): string[] => {
  const rng = createRng(seed);
  const a = (layer.angle * Math.PI) / 180;
  const u: Pt = [Math.cos(a), Math.sin(a)];
  const n: Pt = [-u[1], u[0]];
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const D = Math.hypot(bounds.w, bounds.h) / 2 + 20;
  const L = layer.strokeLength ?? 0;
  const bow = layer.bow ?? 6;
  const aj = ((layer.angleJitter ?? 3) * Math.PI) / 180;
  const out: string[] = [];
  for (let s = -D; s <= D; s += layer.spacing * rng.range(0.75, 1.25)) {
    const ox = cx + n[0] * s;
    const oy = cy + n[1] * s;
    // Recorre la línea en tramos cortos (filas de trazos a mano)
    let t = -D - rng.range(0, L || 1);
    while (t < D) {
      const len = L > 0 ? L * rng.range(0.6, 1.4) : 2 * D;
      const ang = rng.jitter(aj);
      const du: Pt = [Math.cos(a + ang), Math.sin(a + ang)];
      const x1 = ox + u[0] * t + rng.jitter(1.5);
      const y1 = oy + u[1] * t + rng.jitter(1.5);
      const x2 = x1 + du[0] * len;
      const y2 = y1 + du[1] * len;
      const b = rng.jitter(bow);
      const mx = (x1 + x2) / 2 + n[0] * b;
      const my = (y1 + y2) / 2 + n[1] * b;
      // Descartar trazos completamente fuera de los límites
      const inside =
        Math.max(x1, x2) > bounds.x - 30 &&
        Math.min(x1, x2) < bounds.x + bounds.w + 30 &&
        Math.max(y1, y2) > bounds.y - 30 &&
        Math.min(y1, y2) < bounds.y + bounds.h + 30;
      if (inside && !rng.chance(0.04)) {
        out.push(`M${f(x1)} ${f(y1)}Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`);
      }
      t += len + (L > 0 ? rng.range(2, L * 0.25) : 0);
    }
  }
  return out;
};

/** Trazos radiales desde un centro (iris, perspectiva de pasillo, rayos). */
export const radialSegments = (
  center: Pt,
  rInner: number,
  rOuter: number,
  count: number,
  seed: string,
  o: { lengthVar?: number; angleJitter?: number; startAngle?: number; endAngle?: number } = {},
): string[] => {
  const rng = createRng(seed);
  const start = o.startAngle ?? 0;
  const end = o.endAngle ?? Math.PI * 2;
  const lv = o.lengthVar ?? 0.35;
  const aj = o.angleJitter ?? 0.02;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const ang = start + ((end - start) * (i + rng.range(0, 1))) / count;
    const r1 = rInner * rng.range(0.92, 1.08);
    const r2 = r1 + (rOuter - r1) * rng.range(1 - lv, 1);
    const a2 = ang + rng.jitter(aj);
    const x1 = center[0] + Math.cos(ang) * r1;
    const y1 = center[1] + Math.sin(ang) * r1;
    const x2 = center[0] + Math.cos(a2) * r2;
    const y2 = center[1] + Math.sin(a2) * r2;
    const mx = (x1 + x2) / 2 + rng.jitter(3);
    const my = (y1 + y2) / 2 + rng.jitter(3);
    out.push(`M${f(x1)} ${f(y1)}Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`);
  }
  return out;
};

/**
 * Tono 0..1 -> capas de rayado cruzado. Es la regla central del estilo:
 *   < 0.25  una capa diagonal abierta
 *   < 0.5   dos capas
 *   < 0.75  tres capas
 *   ≥ 0.75  cuatro capas densas (casi negro)
 */
export const layersForTone = (toneValue: number, baseAngle = 38, scale = 1): HatchLayer[] => {
  const t = Math.min(1, Math.max(0, toneValue));
  const sp = (v: number) => v * scale;
  const layers: HatchLayer[] = [
    { angle: baseAngle, spacing: sp(16 - t * 8), strokeLength: sp(90), width: 1.8, opacity: 0.6 + t * 0.32 },
  ];
  if (t >= 0.25)
    layers.push({ angle: baseAngle - 82, spacing: sp(17 - t * 8), strokeLength: sp(80), width: 1.7, opacity: 0.56 + t * 0.32 });
  if (t >= 0.5)
    layers.push({ angle: baseAngle + 45, spacing: sp(14 - t * 6), strokeLength: sp(70), width: 1.4, opacity: 0.5 + t * 0.35 });
  if (t >= 0.75)
    layers.push({ angle: baseAngle - 30, spacing: sp(9 - t * 3), strokeLength: sp(60), width: 1.8, opacity: 0.7 + t * 0.25 });
  return layers;
};
