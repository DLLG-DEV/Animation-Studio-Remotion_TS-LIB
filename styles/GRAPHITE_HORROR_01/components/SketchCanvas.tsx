import React, { createContext, useContext, useId } from "react";
import { useCurrentFrame } from "remotion";
import { hashString } from "@engine/lib/random";
import { GH } from "../tokens";
import type { Bounds } from "../lib/hatch";

/**
 * Lienzo SVG del estilo. Todo dibujo de GRAPHITE_HORROR_01 vive dentro de uno.
 * Proporciona: sistema de coordenadas, número de "dibujo" actual (boil) y
 * filtros de lápiz por grupo.
 */
type SketchCtx = {
  bounds: Bounds;
  /** Índice del dibujo sucesivo actual (cambia cada boilStep fotogramas). */
  drawing: number;
  wobble: number;
  seed: string;
};

const Ctx = createContext<SketchCtx>({
  bounds: { x: 0, y: 0, w: 1080, h: 1920 },
  drawing: 0,
  wobble: GH.motion.boilWobble,
  seed: "sketch",
});
export const useSketch = () => useContext(Ctx);

export const useSafeId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

export const SketchCanvas: React.FC<{
  width?: number;
  height?: number;
  seed?: string;
  boilStep?: number;
  wobble?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ width = 1080, height = 1920, seed = "sketch", boilStep, wobble, style, children }) => {
  const frame = useCurrentFrame();
  const step = boilStep ?? GH.motion.boilStep;
  const value: SketchCtx = {
    bounds: { x: 0, y: 0, w: width, h: height },
    drawing: Math.floor(frame / Math.max(1, step)),
    wobble: wobble ?? GH.motion.boilWobble,
    seed,
  };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}
    >
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </svg>
  );
};

export type FilterKind = "pencil" | "graphite" | "smudge" | "eraser" | "none";

/** Semilla de turbulencia que cambia con cada dibujo (line boil). */
export const boilSeed = (key: string, drawing: number) => (hashString(key) % 9973) + (drawing % 997) * 13;

/**
 * Filtro SVG del estilo. Región en coordenadas de usuario: evita el fallo de
 * los filtros sobre líneas horizontales (bbox de altura cero).
 */
export const GraphiteFilter: React.FC<{
  id: string;
  kind: Exclude<FilterKind, "none">;
  region: Bounds;
  seed: number;
  wobble: number;
  /** Intensidad del diente del papel 0..1 */
  tooth?: number;
}> = ({ id, kind, region, seed, wobble, tooth = 1 }) => {
  const pad = 120;
  const common = {
    id,
    filterUnits: "userSpaceOnUse" as const,
    x: region.x - pad,
    y: region.y - pad,
    width: region.w + pad * 2,
    height: region.h + pad * 2,
    colorInterpolationFilters: "sRGB" as const,
  };
  // alpha = k*R + b sobre ruido fino -> trazos interrumpidos por el papel
  const toothK = 3.6 * tooth;
  const toothB = 1 - 0.5 * toothK - 0.08;
  if (kind === "pencil") {
    return (
      <filter {...common}>
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={wobble * 3.2} xChannelSelector="R" yChannelSelector="G" result="wob" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={(seed % 3) + 11} result="t" />
        <feColorMatrix in="t" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${toothK} 0 0 0 ${toothB}`} result="tm" />
        <feComposite in="wob" in2="tm" operator="in" />
      </filter>
    );
  }
  if (kind === "graphite") {
    return (
      <filter {...common}>
        <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={2} seed={seed} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={wobble * 5} xChannelSelector="R" yChannelSelector="G" result="wob" />
        {/* Moteado del grafito frotado: variaciones suaves de densidad */}
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={(seed % 5) + 3} result="streak" />
        <feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0 0 0 0.8" result="sm" />
        {/* Diente del papel: poros claros diminutos */}
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={(seed % 3) + 21} result="t" />
        <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.12" result="tm" />
        <feComposite in="wob" in2="sm" operator="in" result="a" />
        <feComposite in="a" in2="tm" operator="in" />
      </filter>
    );
  }
  if (kind === "smudge") {
    return (
      <filter {...common}>
        <feGaussianBlur in="SourceGraphic" stdDeviation={16} result="blur" />
        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.04" numOctaves={3} seed={(seed % 4) + 5} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 0 0 0 -0.2" result="nm" />
        <feComposite in="blur" in2="nm" operator="in" result="a" />
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={1} seed={31} result="t" />
        <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 0.3" result="tm" />
        <feComposite in="a" in2="tm" operator="in" />
      </filter>
    );
  }
  // eraser: marcas de goma, bordes suaves y arrastres
  return (
    <filter {...common}>
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={seed} result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale={wobble * 6} xChannelSelector="R" yChannelSelector="G" result="wob" />
      <feGaussianBlur in="wob" stdDeviation={5} result="blur" />
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.3" numOctaves={2} seed={(seed % 4) + 41} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.35" result="nm" />
      <feComposite in="blur" in2="nm" operator="in" />
    </filter>
  );
};

/**
 * Hook: crea un filtro propio para un grupo (semilla y región independientes).
 * Devuelve el elemento <filter> (para renderizar) y la referencia url().
 */
export const useGraphiteFilter = (
  kind: FilterKind,
  key: string,
  region?: Bounds,
  opts: { boil?: boolean; tooth?: number; wobble?: number } = {},
) => {
  const ctx = useSketch();
  const id = useSafeId(`gh-${kind}`);
  if (kind === "none") return { url: undefined, element: null };
  const seed = boilSeed(`${ctx.seed}/${key}`, opts.boil === false ? 0 : ctx.drawing);
  return {
    url: `url(#${id})`,
    element: (
      <GraphiteFilter
        id={id}
        kind={kind}
        region={region ?? ctx.bounds}
        seed={seed}
        wobble={opts.wobble ?? ctx.wobble}
        tooth={opts.tooth}
      />
    ),
  };
};
