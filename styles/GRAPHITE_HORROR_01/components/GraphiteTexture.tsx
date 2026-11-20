import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { createRng, rand01 } from "@engine/lib/random";
import { GH } from "../tokens";
import { useSafeId } from "./SketchCanvas";

/**
 * Textura de papel + grano de grafito + polvo. Superposición a pantalla
 * completa (multiply). Cambia sutilmente con cada dibujo (como hojas
 * distintas de una animación tradicional).
 */
export const GraphiteTexture: React.FC<{
  intensity?: number;
  /** Ciclo de hojas de papel distintas. */
  sheets?: number;
  dust?: boolean;
}> = ({ intensity = 1, sheets = 3, dust = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drawing = Math.floor(frame / GH.motion.boilStep);
  const sheet = drawing % sheets;
  const grainId = useSafeId("gh-grain");
  const blotchId = useSafeId("gh-blotch");
  const fiberId = useSafeId("gh-fiber");
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={grainId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={3} seed={7 + sheet * 17} />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.22  0 0 0 0 0.2  0 0 0 0 0.17  -2.1 0 0 0 1.18"
            />
          </filter>
          <filter id={blotchId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0032" numOctaves={4} seed={3 + sheet} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.32  0 0 0 0 0.27  1.4 0 0 0 -0.52" />
          </filter>
          <filter id={fiberId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves={2} seed={19} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.37  0 0 0 0 0.32  2.2 0 0 0 -1.25" />
          </filter>
        </defs>
        <rect width={width} height={height} filter={`url(#${blotchId})`} opacity={0.55 * intensity} />
        <rect width={width} height={height} filter={`url(#${fiberId})`} opacity={0.14 * intensity} />
        <rect width={width} height={height} filter={`url(#${grainId})`} opacity={0.42 * intensity} />
        {dust ? <Dust drawing={drawing} width={width} height={height} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

/** Motas, pelos y rayones de grafito que cambian en cada dibujo. */
const Dust: React.FC<{ drawing: number; width: number; height: number }> = ({ drawing, width, height }) => {
  const marks = useMemo(() => {
    const rng = createRng(`dust-${drawing}`);
    const n = rng.int(3, 9);
    return Array.from({ length: n }, () => {
      const x = rng.range(0, width);
      const y = rng.range(0, height);
      const kind = rng.next();
      if (kind < 0.55) return { t: "dot" as const, x, y, r: rng.range(1, 3.5), o: rng.range(0.3, 0.8) };
      const len = rng.range(14, 70);
      const a = rng.range(0, Math.PI * 2);
      return {
        t: "hair" as const,
        d: `M${x} ${y} q${rng.jitter(18)} ${rng.jitter(18)} ${Math.cos(a) * len} ${Math.sin(a) * len}`,
        o: rng.range(0.25, 0.6),
      };
    });
  }, [drawing, width, height]);
  // Rayón vertical ocasional (película dañada)
  const scratch = rand01(`scratch-${drawing}`) < 0.18 ? rand01(`scratchx-${drawing}`) * width : null;
  return (
    <g>
      {marks.map((m, i) =>
        m.t === "dot" ? (
          <circle key={i} cx={m.x} cy={m.y} r={m.r} fill={GH.palette.graphite700} opacity={m.o} />
        ) : (
          <path key={i} d={m.d} stroke={GH.palette.graphite700} strokeWidth={1.2} fill="none" opacity={m.o} />
        ),
      )}
      {scratch !== null ? (
        <line x1={scratch} y1={0} x2={scratch + 6} y2={height} stroke={GH.palette.graphite500} strokeWidth={1.4} opacity={0.35} />
      ) : null}
    </g>
  );
};

/** Viñeta irregular, como grafito frotado en los bordes. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 1 }) => {
  const { width, height } = useVideoConfig();
  const gid = useSafeId("gh-vig");
  const fid = useSafeId("gh-vigf");
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={gid} cx="50%" cy="46%" r="72%">
            <stop offset="0.38" stopColor={GH.palette.ink} stopOpacity={0} />
            <stop offset="0.72" stopColor={GH.palette.graphite900} stopOpacity={0.5 * strength} />
            <stop offset="1" stopColor={GH.palette.ink} stopOpacity={Math.min(1, 0.95 * strength)} />
          </radialGradient>
          <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={9} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={160} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect x={-80} y={-80} width={width + 160} height={height + 160} fill={`url(#${gid})`} filter={`url(#${fid})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Valor de parpadeo 0..1 (oscurecimiento) determinista por dibujo. */
export const flickerAmount = (frame: number, seed = "flicker", intensity = 1) => {
  const d = Math.floor(frame / 2);
  const base = rand01(`${seed}-${d}`) * 0.07;
  const spike = rand01(`${seed}-s-${d}`) < 0.035 ? 0.22 + rand01(`${seed}-v-${d}`) * 0.25 : 0;
  return Math.min(1, (base + spike) * intensity);
};

/** Parpadeo artesanal de exposición. */
export const Flicker: React.FC<{ intensity?: number; seed?: string }> = ({ intensity = 1, seed = "flicker" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", background: GH.palette.ink, opacity: flickerAmount(frame, seed, intensity) }}
    />
  );
};

/**
 * Marco global del estilo: papel de fondo + contenido + textura + viñeta +
 * parpadeo. Se coloca UNA vez, envolviendo todas las escenas.
 */
export const GraphiteFrame: React.FC<{
  children: React.ReactNode;
  texture?: number;
  vignette?: number;
  flicker?: number;
}> = ({ children, texture = 1, vignette = 1, flicker = 1 }) => (
  <AbsoluteFill style={{ background: GH.palette.paper }}>
    <AbsoluteFill style={{ filter: "contrast(1.12)" }}>{children}</AbsoluteFill>
    <GraphiteTexture intensity={texture} />
    {vignette > 0 ? <Vignette strength={vignette} /> : null}
    {flicker > 0 ? <Flicker intensity={flicker} /> : null}
  </AbsoluteFill>
);
