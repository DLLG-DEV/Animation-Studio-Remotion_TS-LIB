import React, { useMemo } from "react";
import { GH } from "../tokens";
import { polyD, type Pt } from "../lib/geometry";
import { radialSegments } from "../lib/hatch";
import { SketchCanvas, useSafeId } from "../components/SketchCanvas";
import { AnimatedSketch, PencilStroke } from "../components/PencilDrawing";
import { CrossHatching, StrokeBundle } from "../components/CrossHatching";
import { EraserMarks, GraphiteFill } from "../components/GraphiteFill";

/**
 * Pasillo en perspectiva de un punto con proyección 3D real.
 * Mundo: X (−1 izq .. 1 der), Y (−1.2 techo .. 1 suelo), Z profundidad.
 */
const VP: Pt = [540, 900];
const FOCAL = 740;
const Z_NEAR = 0.55;
const Z_BACK = 6.2;
const CEIL = -1.2;
const FLOOR = 1;

export const corridorProject = (X: number, Y: number, Z: number): Pt => [VP[0] + (FOCAL * X) / Z, VP[1] + (FOCAL * Y) / Z];

/** Pies y altura en pantalla de una figura a profundidad z (altura real 1.75). */
export const corridorFigureAt = (z: number, X = 0) => {
  const feet = corridorProject(X, FLOOR, z);
  return { x: feet[0], y: feet[1], height: (1.75 * FOCAL) / z };
};

const P = corridorProject;
const quad = (a: Pt, b: Pt, c: Pt, d: Pt) => polyD([a, b, c, d]);

export const Corridor: React.FC<{
  t0?: number;
  seed?: string;
  /** Luz del fondo 0..1 (para parpadeos). */
  doorLight?: number;
  /** Lámpara del techo que falla: 0 apagada .. 1 encendida. */
  lampFlicker?: number;
  children?: React.ReactNode;
}> = ({ t0 = 0, seed = "corridor", doorLight = 1, lampFlicker = 1, children }) => {
  const maskId = useSafeId("corr-depth");
  const g = useMemo(() => {
    const zN = Z_NEAR;
    const zB = Z_BACK;
    const nTL = P(-1, CEIL, zN);
    const nTR = P(1, CEIL, zN);
    const nBL = P(-1, FLOOR, zN);
    const nBR = P(1, FLOOR, zN);
    const bTL = P(-1, CEIL, zB);
    const bTR = P(1, CEIL, zB);
    const bBL = P(-1, FLOOR, zB);
    const bBR = P(1, FLOOR, zB);
    const ceiling = quad(nTL, nTR, bTR, bTL);
    const floor = quad(bBL, bBR, nBR, nBL);
    const left = quad(nTL, bTL, bBL, nBL);
    const right = quad(nTR, bTR, bBR, nBR);
    const back = quad(bTL, bTR, bBR, bBL);
    const door = quad(P(-0.34, -0.55, zB), P(0.34, -0.55, zB), P(0.34, FLOOR, zB), P(-0.34, FLOOR, zB));
    const doorPts: Pt[] = [P(-0.34, FLOOR, zB), P(-0.34, -0.55, zB), P(0.34, -0.55, zB), P(0.34, FLOOR, zB)];
    // Puertas laterales (marco)
    const sideDoor = (X: number, z1: number, z2: number): Pt[] => [P(X, FLOOR, z1), P(X, -0.5, z1), P(X, -0.5, z2), P(X, FLOOR, z2)];
    const sideDoors = [sideDoor(-1, 1.6, 2.15), sideDoor(-1, 3.3, 3.75), sideDoor(1, 2.5, 3.0), sideDoor(1, 4.4, 4.75)];
    // Baldosas del suelo
    const tiles: string[] = [];
    [-0.5, 0, 0.5].forEach((X) => {
      const a = P(X, FLOOR, zN);
      const b = P(X, FLOOR, zB);
      tiles.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
    });
    [0.75, 0.95, 1.2, 1.55, 2, 2.6, 3.35, 4.3, 5.3].forEach((z) => {
      const a = P(-1, FLOOR, z);
      const b = P(1, FLOOR, z);
      tiles.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
    });
    // Moldura en las paredes
    const mold = (X: number): Pt[] => [P(X, 0.25, zN), P(X, 0.25, zB)];
    // Lámparas del techo
    const lamp = (z: number) => quad(P(-0.12, CEIL, z - 0.14), P(0.12, CEIL, z - 0.14), P(0.12, CEIL, z + 0.14), P(-0.12, CEIL, z + 0.14));
    const lamps = [1.1, 2.6, 4.6].map(lamp);
    // Rayado en perspectiva (converge al punto de fuga)
    const persp = radialSegments(VP, 160, 1500, 260, `${seed}-persp`, { lengthVar: 0.6 });
    return {
      ceiling, floor, left, right, back, door, doorPts, sideDoors, tiles, lamps, persp,
      edges: [[nTL, bTL], [nTR, bTR], [nBL, bBL], [nBR, bBR]] as Pt[][],
      backPts: [bTL, bTR, bBR, bBL] as Pt[],
      molds: [mold(-1), mold(1)],
    };
  }, [seed]);

  return (
    <SketchCanvas seed={seed}>
      <defs>
        {/* Máscara: el rayado denso aparece lejos de la luz del fondo */}
        <radialGradient id={`${maskId}-g`} cx={VP[0]} cy={VP[1]} r={1100} gradientUnits="userSpaceOnUse">
          <stop offset="0.12" stopColor="#000" />
          <stop offset="0.55" stopColor="#fff" />
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-300} y={-300} width={1700} height={2500}>
          <rect x={-300} y={-300} width={1700} height={2500} fill={`url(#${maskId}-g)`} />
        </mask>
      </defs>

      {/* Tonos base por superficie */}
      <CrossHatching seed={`${seed}-ceil`} clip={g.ceiling} tone={0.85} baseAngle={0} draw={[t0, t0 + 40]} />
      <CrossHatching seed={`${seed}-left`} clip={g.left} tone={0.55} baseAngle={90} draw={[t0 + 8, t0 + 50]} />
      <CrossHatching seed={`${seed}-right`} clip={g.right} tone={0.6} baseAngle={90} draw={[t0 + 10, t0 + 52]} />
      <CrossHatching seed={`${seed}-floor`} clip={g.floor} tone={0.5} baseAngle={0} draw={[t0 + 14, t0 + 56]} />
      <CrossHatching seed={`${seed}-back`} clip={`${g.back} ${g.door}`} clipRule="evenodd" tone={0.35} baseAngle={45} draw={[t0 + 20, t0 + 50]} />

      {/* Oscuridad que crece hacia la cámara */}
      <CrossHatching seed={`${seed}-dark`} tone={0.95} baseAngle={20} maskId={maskId} draw={[t0 + 30, t0 + 80]} />
      <AnimatedSketch seed={`${seed}-persp`} opacity={0.9}>
        <g mask={`url(#${maskId})`}>
          <StrokeBundle list={g.persp} width={1.5} tone={0.95} opacity={0.7} draw={[t0 + 20, t0 + 70]} />
        </g>
      </AnimatedSketch>

      {/* Puerta del fondo: luz (papel) */}
      <path d={g.door} fill={GH.palette.paperLight} opacity={doorLight} />
      <EraserMarks
        seed={`${seed}-doorglow`}
        strokes={[
          [P(-0.5, -0.7, Z_BACK), P(0.5, -0.7, Z_BACK)],
          [P(-0.15, FLOOR, 5), P(0, FLOOR, 2.2), P(0.1, FLOOR, 1)],
        ]}
        width={60}
        opacity={0.55 * doorLight}
        draw={[t0 + 40, t0 + 70]}
      />

      {/* Lámparas del techo */}
      {g.lamps.map((d, i) => (
        <path key={i} d={d} fill={GH.palette.paperLight} opacity={i === 1 ? lampFlicker : 0.9} />
      ))}

      <AnimatedSketch seed={`${seed}-lines`}>
        {g.edges.map((e, i) => (
          <PencilStroke key={i} points={e} seed={`${seed}-edge${i}`} width={4} tone={1} draw={[t0 + i * 3, t0 + 24 + i * 3]} />
        ))}
        <PencilStroke points={g.backPts} rough={{ closed: true }} seed={`${seed}-backrect`} width={3} tone={1} draw={[t0 + 12, t0 + 30]} />
        <PencilStroke points={g.doorPts} seed={`${seed}-door`} width={3.2} tone={1} draw={[t0 + 24, t0 + 40]} />
        {g.sideDoors.map((pts, i) => (
          <PencilStroke key={i} points={pts} seed={`${seed}-sd${i}`} width={3} tone={1} draw={[t0 + 26 + i * 4, t0 + 48 + i * 4]} />
        ))}
        {g.molds.map((m, i) => (
          <PencilStroke key={i} points={m} seed={`${seed}-mold${i}`} width={2.2} tone={0.9} draw={[t0 + 30, t0 + 50]} />
        ))}
        <StrokeBundle list={g.tiles} width={2} tone={0.9} draw={[t0 + 30, t0 + 60]} />
      </AnimatedSketch>
      {/* Huecos de las puertas laterales: negro profundo */}
      {g.sideDoors.map((pts, i) => (
        <GraphiteFill key={i} seed={`${seed}-sdf${i}`} d={polyD(pts)} tone={1} opacity={0.92} draw={[t0 + 45 + i * 4, t0 + 70 + i * 4]} />
      ))}
      {children}
    </SketchCanvas>
  );
};
