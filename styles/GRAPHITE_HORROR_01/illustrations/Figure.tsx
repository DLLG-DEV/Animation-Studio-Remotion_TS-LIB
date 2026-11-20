import React, { useMemo } from "react";
import { GH } from "../tokens";
import { ellipsePts, polyD, quadPts, roughPath, rotatePts, smoothPath, type Pt } from "../lib/geometry";
import { createRng } from "@engine/lib/random";
import { AnimatedSketch, PencilStroke, useDrawProgress, type DrawWindow } from "../components/PencilDrawing";
import { GraphiteFill } from "../components/GraphiteFill";
import { StrokeBundle } from "../components/CrossHatching";

/**
 * Silueta humana inquietante: alargada, brazos que llegan a las rodillas,
 * cabeza ladeada. Coordenadas: (x, y) = punto entre los pies; height en px.
 */
export type FigureProps = {
  seed: string;
  x: number;
  y: number;
  height: number;
  /** Inclinación de la cabeza (grados). */
  headTilt?: number;
  /** Ojos blancos (papel) visibles en la silueta. */
  eyes?: boolean;
  /** Proporción de anchura (más bajo = más delgado). */
  thinness?: number;
  draw?: DrawWindow;
  appear?: number;
  disappear?: number;
  /** Sombra en el suelo. */
  shadow?: boolean;
};

// Contorno normalizado (altura 1, origen entre los pies, y hacia arriba negativa)
const BODY: Pt[] = [
  [-0.072, 0], [-0.05, -0.11], [-0.054, -0.3], [-0.06, -0.47], [-0.066, -0.6], [-0.078, -0.74],
  [-0.098, -0.785], [-0.03, -0.83], [-0.016, -0.875], [0.02, -0.875], [0.03, -0.83], [0.096, -0.79],
  [0.076, -0.74], [0.064, -0.6], [0.058, -0.47], [0.052, -0.3], [0.048, -0.11], [0.074, 0],
  [0.018, 0], [0.014, -0.28], [0.005, -0.445], [-0.005, -0.445], [-0.016, -0.28], [-0.02, 0],
];
const ARM_L: Pt[] = [[-0.094, -0.775], [-0.118, -0.6], [-0.122, -0.42], [-0.118, -0.34]];
const ARM_R: Pt[] = [[0.092, -0.78], [0.112, -0.61], [0.12, -0.43], [0.126, -0.35]];

export const Figure: React.FC<FigureProps> = ({
  seed,
  x,
  y,
  height,
  headTilt = 14,
  eyes = false,
  thinness = 1,
  draw,
  appear,
  disappear,
  shadow = true,
}) => {
  const geo = useMemo(() => {
    const tr = (p: Pt): Pt => [x + p[0] * height * thinness, y + p[1] * height];
    const body = BODY.map(tr);
    const headC: Pt = tr([0.012, -0.935]);
    const head = rotatePts(ellipsePts(headC[0], headC[1], 0.046 * height * thinness, 0.064 * height, 28), headC, headTilt);
    const rng = createRng(seed);
    const armL = ARM_L.map(tr);
    const armR = ARM_R.map(tr);
    // Dedos largos
    const fingers = (end: Pt, dir: number) =>
      Array.from({ length: 4 }, (_, i) => {
        const a = Math.PI / 2 + dir * (0.12 + i * 0.09) + rng.jitter(0.05);
        const len = height * rng.range(0.045, 0.075);
        const b: Pt = [end[0] + Math.cos(a) * len * 0.3 * dir, end[1] + Math.sin(a) * len];
        return smoothPath(quadPts(end, [end[0] + dir * height * 0.006, end[1] + len * 0.5], b, 6));
      });
    const bodyD = roughPath(body, rng, { jitter: height * 0.003, segment: height * 0.05, closed: true });
    const headD = roughPath(head, rng, { jitter: height * 0.002, segment: height * 0.03, closed: true });
    const eyeL: Pt = [headC[0] - height * 0.016, headC[1] - height * 0.004];
    const eyeR: Pt = [headC[0] + height * 0.018, headC[1] + height * 0.002];
    // Garabatos de borde (el dibujante repasa el contorno)
    const scribble = Array.from({ length: 26 }, () => {
      const i = rng.int(0, body.length - 1);
      const p = body[i];
      return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}q${rng.jitter(height * 0.02).toFixed(1)} ${rng
        .jitter(height * 0.02)
        .toFixed(1)} ${rng.jitter(height * 0.03).toFixed(1)} ${rng.jitter(height * 0.03).toFixed(1)}`;
    });
    return { bodyD, headD, armL, armR, fingersL: fingers(armL[armL.length - 1], -1), fingersR: fingers(armR[armR.length - 1], 1), eyeL, eyeR, scribble, body };
  }, [seed, x, y, height, headTilt, thinness]);

  const w = Math.max(1.5, height * 0.022);
  const region = { x: x - height * 0.3, y: y - height * 1.05, w: height * 0.6, h: height * 1.1 };
  const fillWin: DrawWindow | undefined = draw ? [draw[0] + (draw[1] - draw[0]) * 0.3, draw[1]] : undefined;
  // El relleno se frota en dos pasadas después de empezar el contorno
  const fp = useDrawProgress(fillWin, 3);
  const fillOpacity = fp <= 0 ? 0 : fp < 0.5 ? 0.5 : 1;
  return (
    <g>
      {shadow ? (
        <GraphiteFill
          seed={`${seed}-shadow`}
          kind="smudge"
          tone={1}
          opacity={0.75}
          d={polyD(ellipsePts(x + height * 0.05, y + height * 0.008, height * 0.2, height * 0.025, 24))}
          draw={fillWin}
        />
      ) : null}
      <AnimatedSketch seed={`${seed}-fig`} filter="graphite" region={region} appear={appear} disappear={disappear} opacity={fillOpacity}>
        <path d={geo.bodyD} fill={GH.palette.ink} />
        <path d={geo.headD} fill={GH.palette.ink} />
        <path d={smoothPath(geo.armL)} fill="none" stroke={GH.palette.ink} strokeWidth={w * 1.25} strokeLinecap="round" />
        <path d={smoothPath(geo.armR)} fill="none" stroke={GH.palette.ink} strokeWidth={w * 1.25} strokeLinecap="round" />
        {[...geo.fingersL, ...geo.fingersR].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={GH.palette.ink} strokeWidth={w * 0.45} strokeLinecap="round" />
        ))}
      </AnimatedSketch>
      <AnimatedSketch seed={`${seed}-edge`} region={region} appear={appear} disappear={disappear}>
        <PencilStroke points={geo.body} rough={{ closed: true, jitter: height * 0.004 }} seed={`${seed}-o`} width={Math.max(1.4, height * 0.004)} tone={1} draw={draw} />
        <StrokeBundle list={geo.scribble} width={Math.max(1.2, height * 0.003)} tone={1} opacity={0.8} draw={draw} />
        {eyes ? (
          <g>
            <ellipse cx={geo.eyeL[0]} cy={geo.eyeL[1]} rx={height * 0.0075} ry={height * 0.004} fill={GH.palette.paperLight} />
            <ellipse cx={geo.eyeR[0]} cy={geo.eyeR[1]} rx={height * 0.0075} ry={height * 0.004} fill={GH.palette.paperLight} />
          </g>
        ) : null}
      </AnimatedSketch>
    </g>
  );
};
