import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { steppedFrame } from "@engine/lib/random";
import { GH, tone as toneColor } from "../tokens";
import { roughPasses, type Pt, type RoughOptions } from "../lib/geometry";
import { useGraphiteFilter, type FilterKind } from "./SketchCanvas";
import type { Bounds } from "../lib/hatch";

/** Ventana de dibujo [inicio, fin] en fotogramas locales. */
export type DrawWindow = readonly [number, number];

/** Progreso de dibujo "a saltos" (dibujos sucesivos). */
export const useDrawProgress = (draw?: DrawWindow, step: number = GH.motion.drawStep) => {
  const frame = useCurrentFrame();
  if (!draw) return 1;
  const f = steppedFrame(frame, step);
  return interpolate(f, [draw[0], Math.max(draw[0] + 1, draw[1])], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export type PencilStrokeProps = {
  /** Puntos de la forma (se le aplica temblor). */
  points?: Pt[];
  /** O un path SVG ya construido (sin temblor adicional). */
  d?: string;
  seed: string;
  /** Grosor base del trazo. */
  width?: number;
  /** Oscuridad 0..1 */
  tone?: number;
  passes?: number;
  rough?: RoughOptions;
  draw?: DrawWindow;
  opacity?: number;
  /** Color explícito (p. ej. color papel para trazos de goma). */
  color?: string;
};

/** Un trazo de lápiz con varias pasadas que se dibuja progresivamente. */
export const PencilStroke: React.FC<PencilStrokeProps> = ({
  points,
  d,
  seed,
  width = 3,
  tone = 0.9,
  passes = 2,
  rough,
  draw,
  opacity = 1,
  color,
}) => {
  const paths = useMemo(() => {
    if (d) return passes > 1 ? [d, d] : [d];
    if (!points) return [];
    return roughPasses(points, seed, passes, { overshoot: 10, ...rough });
  }, [d, points, seed, passes, rough]);
  const p = useDrawProgress(draw);
  if (p <= 0) return null;
  const c = color ?? toneColor(tone);
  return (
    <g>
      {paths.map((pd, i) => {
        // Las pasadas siguientes llegan un poco después (el dibujante repasa)
        const pi = i === 0 ? p : Math.min(1, Math.max(0, p * 1.25 - 0.25));
        if (pi <= 0) return null;
        return (
          <path
            key={i}
            d={pd}
            fill="none"
            stroke={c}
            strokeWidth={width * (i === 0 ? 1 : 0.55)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity * (i === 0 ? 0.95 : 0.7)}
            pathLength={1}
            strokeDasharray="1 2"
            strokeDashoffset={1 - pi}
            transform={i === 0 || !d ? undefined : `translate(${1.4} ${-1.1})`}
          />
        );
      })}
    </g>
  );
};

/** Secuencia de trazos dibujados uno tras otro dentro de una ventana. */
export const PencilDrawing: React.FC<{
  strokes: Omit<PencilStrokeProps, "draw">[];
  draw: DrawWindow;
  /** Solapamiento 0..1 entre trazos consecutivos. */
  overlap?: number;
}> = ({ strokes, draw, overlap = 0.35 }) => {
  const n = strokes.length;
  const span = draw[1] - draw[0];
  const slot = span / Math.max(1, n - (n - 1) * overlap);
  return (
    <g>
      {strokes.map((s, i) => {
        const start = draw[0] + i * slot * (1 - overlap);
        return <PencilStroke key={`${s.seed}-${i}`} {...s} draw={[start, start + slot]} />;
      })}
    </g>
  );
};

/**
 * Grupo "vivo": aplica el filtro de lápiz (boil + diente del papel) a todo su
 * contenido y controla su aparición / desaparición como dibujos sucesivos.
 */
export const AnimatedSketch: React.FC<{
  name?: string;
  seed: string;
  filter?: FilterKind;
  region?: Bounds;
  /** Fotograma en que aparece (con parpadeo de entrada). */
  appear?: number;
  /** Fotograma en que desaparece. */
  disappear?: number;
  opacity?: number;
  tooth?: number;
  wobble?: number;
  children: React.ReactNode;
}> = ({ seed, filter = "pencil", region, appear, disappear, opacity = 1, tooth, wobble, children }) => {
  const frame = useCurrentFrame();
  const fl = useGraphiteFilter(filter, seed, region, { tooth, wobble });
  let vis = 1;
  if (appear !== undefined) {
    const d = frame - appear;
    // Entrada nerviosa: 0 -> .5 -> 0 -> 1
    vis = d < 0 ? 0 : d < 2 ? 0.55 : d < 3 ? 0.15 : 1;
  }
  if (disappear !== undefined && frame >= disappear) {
    const d = frame - disappear;
    vis = d < 2 ? 0.4 : 0;
  }
  if (vis <= 0) return null;
  return (
    <g opacity={vis * opacity}>
      {fl.element}
      <g filter={fl.url}>{children}</g>
    </g>
  );
};
