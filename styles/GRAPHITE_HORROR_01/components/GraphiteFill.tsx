import React, { useMemo } from "react";
import { GH, tone as toneColor } from "../tokens";
import { roughPath, type Pt } from "../lib/geometry";
import { createRng } from "@engine/lib/random";
import { useGraphiteFilter } from "./SketchCanvas";
import { useDrawProgress, type DrawWindow } from "./PencilDrawing";
import type { Bounds } from "../lib/hatch";

/**
 * Masa de grafito frotado: negros profundos con vetas y diente del papel.
 * Para siluetas, sombras y cielos densos.
 */
export const GraphiteFill: React.FC<{
  seed: string;
  d: string;
  tone?: number;
  opacity?: number;
  region?: Bounds;
  /** Aparece por capas sucesivas (como frotar el lápiz varias veces). */
  draw?: DrawWindow;
  kind?: "graphite" | "smudge";
  fillRule?: "evenodd" | "nonzero";
}> = ({ seed, d, tone = 0.95, opacity = 1, region, draw, kind = "graphite", fillRule = "nonzero" }) => {
  const fl = useGraphiteFilter(kind, `fill-${seed}`, region);
  const p = useDrawProgress(draw, 3);
  if (p <= 0) return null;
  // Se oscurece por capas: 3 "pasadas" visibles
  const layered = p < 0.34 ? 0.35 : p < 0.67 ? 0.7 : 1;
  return (
    <g opacity={opacity * layered}>
      {fl.element}
      <path d={d} fill={toneColor(tone)} fillRule={fillRule} filter={fl.url} />
    </g>
  );
};

/**
 * Marcas de goma de borrar (color papel): niebla, brillos, luz recortada
 * sobre zonas oscuras.
 */
export const EraserMarks: React.FC<{
  seed: string;
  strokes: Pt[][];
  width?: number;
  opacity?: number;
  draw?: DrawWindow;
  region?: Bounds;
}> = ({ seed, strokes, width = 40, opacity = 0.75, draw, region }) => {
  const fl = useGraphiteFilter("eraser", `eraser-${seed}`, region);
  const paths = useMemo(() => {
    const rng = createRng(seed);
    return strokes.map((s) => roughPath(s, rng, { jitter: 6, segment: 60 }));
  }, [strokes, seed]);
  const p = useDrawProgress(draw);
  if (p <= 0) return null;
  return (
    <g opacity={opacity}>
      {fl.element}
      <g filter={fl.url}>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={GH.palette.eraser}
            strokeWidth={width}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 2"
            strokeDashoffset={1 - p}
          />
        ))}
      </g>
    </g>
  );
};
