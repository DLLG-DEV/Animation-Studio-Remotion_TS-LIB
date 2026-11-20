import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { createRng, rand01 } from "@engine/lib/random";
import { GH } from "../tokens";
import { smoothPath, type Pt } from "../lib/geometry";
import { GraphiteFilter, useSafeId } from "../components/SketchCanvas";

/** Zigzag continuo que cubre el encuadre (pasadas de lápiz / goma). */
const zigzag = (w: number, h: number, rows: number, amp: number, seed: string): string => {
  const rng = createRng(seed);
  const pts: Pt[] = [];
  const rowH = (h + 400) / rows;
  for (let r = 0; r < rows; r++) {
    const y = -200 + r * rowH + rowH / 2;
    const ltr = r % 2 === 0;
    const xs = [-180, w * 0.25, w * 0.5, w * 0.75, w + 180];
    (ltr ? xs : [...xs].reverse()).forEach((x, i) =>
      pts.push([x + rng.jitter(40), y + (i % 2 === 0 ? -amp : amp) * rng.range(0.4, 1) + rng.jitter(20)]),
    );
  }
  return smoothPath(pts);
};

const steppedProgress = (p: number, steps = 14) => Math.round(p * steps) / steps;

// ---------------------------------------------------------------------------
// graphiteSmear: garabatos de grafito cubren todo y se retiran.
// ---------------------------------------------------------------------------
type SmearProps = { seed?: string };

const GraphiteSmearPresentation: React.FC<TransitionPresentationComponentProps<SmearProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = steppedProgress(presentationProgress);
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: p < 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p >= 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      <SmearOverlay p={p} seed={passedProps.seed ?? "smear"} />
    </AbsoluteFill>
  );
};

const SmearOverlay: React.FC<{ p: number; seed: string }> = ({ p, seed }) => {
  const { width, height } = useVideoConfig();
  const fid = useSafeId("gh-smear");
  const d1 = useMemo(() => zigzag(width, height, 30, 70, `${seed}-a`), [width, height, seed]);
  const d2 = useMemo(() => zigzag(width, height, 44, 50, `${seed}-b`), [width, height, seed]);
  // Primera mitad: se dibuja. Segunda mitad: se retira desde el inicio.
  const cover = p < 0.5 ? p * 2 : 1;
  const uncover = p < 0.5 ? 0 : (p - 0.5) * 2;
  const dashProps = (lag: number) => {
    const c = Math.min(1, Math.max(0, cover * (1 + lag) - lag));
    const u = Math.min(1, Math.max(0, uncover * (1 + lag) - lag * 0.5));
    return {
      pathLength: 1,
      strokeDasharray: `${Math.max(0, c - u)} 3`,
      strokeDashoffset: -u,
    };
  };
  if (p <= 0 || p >= 1) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <GraphiteFilter
          id={fid}
          kind="pencil"
          region={{ x: 0, y: 0, w: width, h: height }}
          seed={Math.floor(p * 14) * 7 + 3}
          wobble={5}
          tooth={0.7}
        />
        <g filter={`url(#${fid})`}>
          <path d={d1} fill="none" stroke={GH.palette.ink} strokeWidth={78} strokeLinecap="round" {...dashProps(0)} />
          <path d={d2} fill="none" stroke={GH.palette.graphite900} strokeWidth={30} strokeLinecap="round" {...dashProps(0.12)} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const graphiteSmear = (props: SmearProps = {}): TransitionPresentation<SmearProps> => ({
  component: GraphiteSmearPresentation,
  props,
});

// ---------------------------------------------------------------------------
// eraserWipe: una goma abre la escena nueva en zigzag.
// ---------------------------------------------------------------------------
type EraserProps = { seed?: string };

const EraserWipePresentation: React.FC<TransitionPresentationComponentProps<EraserProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const seed = passedProps.seed ?? "eraser";
  const d = useMemo(() => zigzag(width, height, 8, 120, seed), [width, height, seed]);
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = steppedProgress(presentationProgress, 16);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
<filter id='f' x='-20%' y='-20%' width='140%' height='140%'>
<feTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='2' seed='4'/>
<feDisplacementMap in='SourceGraphic' scale='70' xChannelSelector='R' yChannelSelector='G'/>
<feGaussianBlur stdDeviation='10'/>
</filter>
<path d='${d}' fill='none' stroke='white' stroke-width='${Math.round(340)}' stroke-linecap='round' pathLength='1' stroke-dasharray='${p * 1.02} 3' filter='url(#f)'/>
</svg>`;
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <AbsoluteFill
      style={{
        maskImage: p >= 1 ? undefined : mask,
        WebkitMaskImage: p >= 1 ? undefined : mask,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskMode: "alpha",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const eraserWipe = (props: EraserProps = {}): TransitionPresentation<EraserProps> => ({
  component: EraserWipePresentation,
  props,
});

// ---------------------------------------------------------------------------
// flickerCut: corte estroboscópico entre escena, negro y escena nueva.
// ---------------------------------------------------------------------------
type FlickerCutProps = { seed?: string };

const flickerState = (p: number, seed: string): "exit" | "black" | "enter" => {
  const step = Math.floor(p * 10);
  if (p >= 0.85) return "enter";
  const r = rand01(`${seed}-${step}`);
  if (r < p * 0.9) return "enter";
  if (r < p * 0.9 + 0.35) return "black";
  return "exit";
};

const FlickerCutPresentation: React.FC<TransitionPresentationComponentProps<FlickerCutProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const state = flickerState(presentationProgress, passedProps.seed ?? "fcut");
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: state === "enter" ? 1 : 0 }}>{children}</AbsoluteFill>
      {state === "black" ? <AbsoluteFill style={{ background: GH.palette.ink }} /> : null}
    </AbsoluteFill>
  );
};

export const flickerCut = (props: FlickerCutProps = {}): TransitionPresentation<FlickerCutProps> => ({
  component: FlickerCutPresentation,
  props,
});
