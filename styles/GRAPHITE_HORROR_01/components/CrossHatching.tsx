import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { steppedFrame } from "@engine/lib/random";
import { GH, tone as toneColor } from "../tokens";
import { hatchSegments, layersForTone, radialSegments, type Bounds, type HatchLayer } from "../lib/hatch";
import type { Pt } from "../lib/geometry";
import { useGraphiteFilter, useSafeId, useSketch } from "./SketchCanvas";
import type { DrawWindow } from "./PencilDrawing";

const useLayerProgress = (draw: DrawWindow | undefined, layerIndex: number, layerCount: number) => {
  const frame = useCurrentFrame();
  if (!draw) return 1;
  const f = steppedFrame(frame, GH.motion.hatchDrawStep);
  const span = draw[1] - draw[0];
  // Cada capa empieza un poco después que la anterior
  const s = draw[0] + (span * 0.45 * layerIndex) / Math.max(1, layerCount - 1 || 1);
  const e = s + span * (layerCount > 1 ? 0.55 : 1);
  return interpolate(f, [s, Math.max(s + 1, e)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

/**
 * Rayado cruzado procedural recortado a una forma.
 * `tone` (0..1) decide automáticamente cuántas capas y qué densidad.
 */
export const CrossHatching: React.FC<{
  seed: string;
  /** Path SVG de la zona a rayar. Si se omite, todo el lienzo. */
  clip?: string;
  clipRule?: "evenodd" | "nonzero";
  tone?: number;
  layers?: HatchLayer[];
  baseAngle?: number;
  /** Escala de la densidad (>1 más abierto). */
  scale?: number;
  bounds?: Bounds;
  draw?: DrawWindow;
  color?: string;
  /** id de un <mask> para gradientes de tono. */
  maskId?: string;
  /** Aplica el filtro de lápiz propio (desactivar si ya está dentro de AnimatedSketch). */
  filtered?: boolean;
  opacity?: number;
  /** Opacidad del grafito frotado bajo las líneas. Por defecto depende del tono. */
  underlay?: number;
}> = ({
  seed,
  clip,
  clipRule = "nonzero",
  tone = 0.5,
  layers,
  baseAngle = 38,
  scale = 1,
  bounds,
  draw,
  color,
  maskId,
  filtered = true,
  opacity = 1,
  underlay,
}) => {
  const ctx = useSketch();
  const b = bounds ?? ctx.bounds;
  const clipId = useSafeId("gh-clip");
  const fl = useGraphiteFilter(filtered ? "pencil" : "none", `hatch-${seed}`, b);
  const L = useMemo(() => layers ?? layersForTone(tone, baseAngle, scale), [layers, tone, baseAngle, scale]);
  // Dependencias por valor: el objeto bounds cambia de identidad en cada fotograma
  const segs = useMemo(
    () => L.map((layer, i) => hatchSegments({ x: b.x, y: b.y, w: b.w, h: b.h }, layer, `${seed}-${i}`)),
    [L, b.x, b.y, b.w, b.h, seed],
  );
  const c = color ?? toneColor(0.85);
  return (
    <g opacity={opacity} mask={maskId ? `url(#${maskId})` : undefined}>
      {fl.element}
      {clip ? (
        <clipPath id={clipId}>
          <path d={clip} clipRule={clipRule} />
        </clipPath>
      ) : null}
      <g filter={fl.url}>
        <g clipPath={clip ? `url(#${clipId})` : undefined}>
          <HatchUnderlay bounds={b} amount={underlay ?? Math.max(0, (tone - 0.5) * 1.05)} draw={draw} />
          {segs.map((list, i) => (
            <HatchLayerPath
              key={i}
              list={list}
              layer={L[i]}
              color={c}
              draw={draw}
              index={i}
              count={L.length}
            />
          ))}
        </g>
      </g>
    </g>
  );
};

/** Grafito frotado (tono de fondo) que aparece junto con el rayado. */
const HatchUnderlay: React.FC<{ bounds: Bounds; amount: number; draw?: DrawWindow }> = ({ bounds, amount, draw }) => {
  const p = useLayerProgress(draw, 1, 2);
  if (amount <= 0 || p <= 0) return null;
  return (
    <rect
      x={bounds.x - 40}
      y={bounds.y - 40}
      width={bounds.w + 80}
      height={bounds.h + 80}
      fill={GH.palette.graphite700}
      opacity={amount * (p < 0.5 ? 0.5 : 1)}
    />
  );
};

const HatchLayerPath: React.FC<{
  list: string[];
  layer: HatchLayer;
  color: string;
  draw?: DrawWindow;
  index: number;
  count: number;
}> = ({ list, layer, color, draw, index, count }) => {
  const p = useLayerProgress(draw, index, count);
  const k = Math.ceil(list.length * p);
  const d = useMemo(() => list.slice(0, k).join(""), [list, k]);
  if (k === 0) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={layer.width ?? 1.6}
      strokeLinecap="round"
      opacity={layer.opacity ?? 0.7}
    />
  );
};

/**
 * Conjunto de trazos (pelos, pestañas, hierba, lluvia...) que se revelan
 * progresivamente en el orden dado.
 */
export const StrokeBundle: React.FC<{
  list: string[];
  width?: number;
  tone?: number;
  color?: string;
  opacity?: number;
  draw?: DrawWindow;
}> = ({ list, width = 1.8, tone = 0.85, color, opacity = 0.85, draw }) => (
  <HatchLayerPath
    list={list}
    layer={{ angle: 0, spacing: 0, width, opacity }}
    color={color ?? toneColor(tone)}
    draw={draw}
    index={0}
    count={1}
  />
);

/** Trazos radiales (iris, rayos, perspectiva). */
export const RadialHatching: React.FC<{
  seed: string;
  center: Pt;
  rInner: number;
  rOuter: number;
  count: number;
  width?: number;
  tone?: number;
  opacity?: number;
  draw?: DrawWindow;
  lengthVar?: number;
  startAngle?: number;
  endAngle?: number;
}> = ({ seed, center, rInner, rOuter, count, width = 1.6, tone = 0.8, opacity = 0.8, draw, lengthVar, startAngle, endAngle }) => {
  const list = useMemo(
    () => radialSegments([center[0], center[1]], rInner, rOuter, count, seed, { lengthVar, startAngle, endAngle }),
    [center[0], center[1], rInner, rOuter, count, seed, lengthVar, startAngle, endAngle],
  );
  return (
    <HatchLayerPath
      list={list}
      layer={{ angle: 0, spacing: 0, width, opacity }}
      color={toneColor(tone)}
      draw={draw}
      index={0}
      count={1}
    />
  );
};
