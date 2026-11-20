import React, { useMemo } from "react";
import { createRng } from "@engine/lib/random";
import { GH } from "../tokens";
import { curlD, ellipsePts, offsetPts, polyD, quadPts, smoothPath, type Pt } from "../lib/geometry";
import { SketchCanvas, useSafeId } from "../components/SketchCanvas";
import { AnimatedSketch, PencilStroke } from "../components/PencilDrawing";
import { CrossHatching, RadialHatching, StrokeBundle } from "../components/CrossHatching";
import { EraserMarks, GraphiteFill } from "../components/GraphiteFill";

/**
 * Primer plano de un ojo a grafito (plano detalle).
 * gaze: desplazamiento del iris en px. pupil: radio de la pupila en px.
 */
export const Eye: React.FC<{
  t0?: number;
  seed?: string;
  center?: Pt;
  gaze?: Pt;
  pupil?: number;
  irisR?: number;
}> = ({ t0 = 0, seed = "eye", center = [540, 900], gaze = [0, 0], pupil = 70, irisR = 205 }) => {
  const almondId = useSafeId("almond");
  const scleraMask = useSafeId("sclera");
  const socketMask = useSafeId("socket");
  const [cx, cy] = center;
  const g = useMemo(() => {
    const rng = createRng(seed);
    const L: Pt = [cx - 420, cy + 20];
    const R: Pt = [cx + 415, cy - 15];
    const upper = quadPts(L, [cx - 20, cy - 390], R, 40);
    const lower = quadPts(R, [cx + 10, cy + 330], L, 40);
    const almond = polyD([...upper, ...lower.slice(1)]);
    const crease = quadPts([L[0] + 40, L[1] - 70], [cx - 10, cy - 520], [R[0] - 30, R[1] - 90], 30);
    const lidRim = polyD([...upper, ...offsetPts([...upper].reverse(), 0, -26)]);
    const lidShadow = polyD([...upper, ...offsetPts([...upper].reverse(), 0, 70)]);
    // Ceja: pelos a lo largo de un arco
    const browArc = quadPts([cx - 470, cy - 300], [cx + 20, cy - 560], [cx + 480, cy - 360], 120);
    const brow: string[] = [];
    browArc.forEach((p, i) => {
      const t = i / browArc.length;
      for (let k = 0; k < 2; k++) {
        const a = -Math.PI * (0.08 + t * 0.12) + rng.jitter(0.25) - (t > 0.6 ? 0.1 : 0);
        brow.push(curlD([p[0] + rng.jitter(10), p[1] + rng.jitter(16)], a, rng.range(40, 85) * (1 - Math.abs(t - 0.4) * 0.6), rng.jitter(8)));
      }
    });
    // Pestañas superiores (hacia arriba/fuera) e inferiores
    const lashes: string[] = [];
    upper.forEach((p, i) => {
      if (i < 3 || i > upper.length - 2) return;
      const t = i / upper.length;
      const out = -Math.PI / 2 + (t - 0.5) * 1.5;
      for (let k = 0; k < 2; k++) {
        lashes.push(curlD([p[0] + rng.jitter(4), p[1] + rng.jitter(3)], out + rng.jitter(0.12), rng.range(55, 115) * (0.5 + t * 0.7), 14 + rng.jitter(6)));
      }
    });
    const lowLashes: string[] = [];
    lower.forEach((p, i) => {
      if (i < 4 || i > lower.length - 6 || i % 2) return;
      const t = i / lower.length;
      const out = Math.PI / 2 + (0.5 - t) * 1.2;
      lowLashes.push(curlD(p, out + rng.jitter(0.15), rng.range(18, 42), -6 + rng.jitter(4)));
    });
    // Venas en la esclerótica
    const veins: string[] = [];
    const vein = (start: Pt, dir: number, n: number) => {
      let p = start;
      let a = dir;
      let d = `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      for (let i = 0; i < n; i++) {
        a += rng.jitter(0.6);
        const len = rng.range(14, 30);
        p = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len];
        d += `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        if (rng.chance(0.25)) {
          const b: Pt = [p[0] + Math.cos(a + 0.9) * 22, p[1] + Math.sin(a + 0.9) * 22];
          veins.push(`M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
        }
      }
      veins.push(d);
    };
    vein([L[0] + 20, L[1] - 5], -0.1, 9);
    vein([L[0] + 30, L[1] + 20], 0.25, 7);
    vein([R[0] - 20, R[1]], Math.PI + 0.1, 9);
    vein([R[0] - 40, R[1] + 30], Math.PI - 0.3, 7);
    // Bolsa inferior y pliegues
    const bag = quadPts([L[0] + 60, L[1] + 90], [cx, cy + 420], [R[0] - 40, R[1] + 120], 30);
    const wrinkles = [0, 1, 2].map((k) =>
      smoothPath(quadPts([L[0] - 20 - k * 10, L[1] + 10 + k * 30], [L[0] - 70, L[1] + 60 + k * 40], [L[0] - 120 - k * 20, L[1] + 50 + k * 60], 8)),
    );
    const tearDuct = ellipsePts(L[0] + 26, L[1] + 2, 20, 13, 14);
    return { upper, lower, almond, crease, lidRim, lidShadow, brow, lashes, lowLashes, veins, bag, wrinkles, tearDuct };
  }, [seed, cx, cy]);

  const ic: Pt = [cx + gaze[0], cy + gaze[1] + 10];
  const skinClip = `M-300 -300H1380V2220H-300Z ${g.almond}`;

  return (
    <SketchCanvas seed={seed}>
      <defs>
        <clipPath id={almondId}>
          <path d={g.almond} />
        </clipPath>
        <radialGradient id={`${scleraMask}-g`} cx={cx} cy={cy} r={460} gradientUnits="userSpaceOnUse">
          <stop offset="0.35" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        {/* Cuenca: sombra elíptica que se desvanece (más densa bajo la ceja) */}
        <radialGradient
          id={`${socketMask}-g`}
          cx={cx}
          cy={cy - 110}
          r={640}
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(${cx} ${cy - 110}) scale(1 0.62) translate(${-cx} ${-(cy - 110)})`}
        >
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={socketMask} maskUnits="userSpaceOnUse" x={-300} y={-300} width={1700} height={2500}>
          <rect x={-300} y={-300} width={1700} height={2500} fill={`url(#${socketMask}-g)`} />
        </mask>
        <mask id={scleraMask} maskUnits="userSpaceOnUse" x={-300} y={-300} width={1700} height={2500}>
          <rect x={-300} y={-300} width={1700} height={2500} fill={`url(#${scleraMask}-g)`} />
        </mask>
      </defs>

      {/* Piel: rayado de contorno, más oscuro bajo la ceja y en la cuenca */}
      <CrossHatching
        seed={`${seed}-skin`}
        clip={skinClip}
        clipRule="evenodd"
        layers={[
          { angle: 22, spacing: 12, strokeLength: 70, bow: 7, width: 1.7, opacity: 0.62, angleJitter: 6 },
          { angle: -55, spacing: 15, strokeLength: 60, bow: 5, width: 1.5, opacity: 0.45, angleJitter: 7 },
        ]}
        underlay={0.12}
        draw={[t0 + 30, t0 + 75]}
      />
      <CrossHatching
        seed={`${seed}-socket`}
        clip={skinClip}
        clipRule="evenodd"
        maskId={socketMask}
        tone={0.86}
        baseAngle={-25}
        draw={[t0 + 45, t0 + 90]}
      />
      <GraphiteFill seed={`${seed}-crease`} kind="smudge" d={polyD([...g.crease, ...offsetPts([...g.crease].reverse(), 0, 60)])} tone={1} opacity={0.8} draw={[t0 + 40, t0 + 70]} />

      {/* Esclerótica: papel con sombra en los bordes */}
      <g clipPath={`url(#${almondId})`}>
        <path d={g.almond} fill={GH.palette.paperLight} />
        <CrossHatching seed={`${seed}-sclera`} clip={g.almond} tone={0.3} baseAngle={-10} maskId={scleraMask} draw={[t0 + 40, t0 + 70]} />
        <AnimatedSketch seed={`${seed}-veins`}>
          <StrokeBundle list={g.veins} width={1.3} tone={0.55} opacity={0.75} draw={[t0 + 70, t0 + 100]} />
        </AnimatedSketch>

        {/* Iris */}
        <AnimatedSketch seed={`${seed}-iris`}>
          <CrossHatching
            seed={`${seed}-irisbase`}
            clip={polyD(ellipsePts(ic[0], ic[1], irisR, irisR, 48))}
            tone={0.5}
            baseAngle={50}
            scale={0.7}
            filtered={false}
            bounds={{ x: ic[0] - irisR, y: ic[1] - irisR, w: irisR * 2, h: irisR * 2 }}
            draw={[t0 + 15, t0 + 40]}
          />
          <RadialHatching seed={`${seed}-fibers`} center={ic} rInner={pupil * 0.95} rOuter={irisR} count={340} width={1.8} tone={1} opacity={0.8} draw={[t0 + 15, t0 + 55]} />
          <RadialHatching seed={`${seed}-outer`} center={ic} rInner={irisR * 0.72} rOuter={irisR} count={220} width={2.4} tone={1} opacity={0.85} lengthVar={0.3} draw={[t0 + 30, t0 + 60]} />
          <RadialHatching seed={`${seed}-collar`} center={ic} rInner={pupil * 0.95} rOuter={pupil + 60} count={160} width={2.2} tone={1} opacity={0.85} lengthVar={0.6} draw={[t0 + 25, t0 + 60]} />
          <PencilStroke points={ellipsePts(ic[0], ic[1], irisR, irisR, 48)} rough={{ closed: true, jitter: 2 }} seed={`${seed}-limbus`} width={14} tone={1} draw={[t0 + 10, t0 + 30]} />
        </AnimatedSketch>
        <GraphiteFill seed={`${seed}-pupil`} d={polyD(ellipsePts(ic[0], ic[1], pupil, pupil, 36))} tone={1} draw={[t0 + 20, t0 + 40]} />
        {/* Brillo: el reflejo de una ventana (papel) */}
        <AnimatedSketch seed={`${seed}-glint`} filter="pencil" tooth={0.3}>
          <path
            d={polyD([
              [ic[0] - 84, ic[1] - 100],
              [ic[0] - 52, ic[1] - 106],
              [ic[0] - 47, ic[1] - 66],
              [ic[0] - 63, ic[1] - 70],
              [ic[0] - 80, ic[1] - 64],
            ])}
            fill={GH.palette.paperLight}
            opacity={0.95}
          />
          <circle cx={ic[0] + 66} cy={ic[1] + 58} r={8} fill={GH.palette.paperLight} opacity={0.85} />
        </AnimatedSketch>
        {/* Sombra del párpado superior sobre el ojo */}
        <GraphiteFill seed={`${seed}-lidshadow`} kind="smudge" d={g.lidShadow} tone={1} opacity={0.85} draw={[t0 + 35, t0 + 60]} />
      </g>

      {/* Párpados, pestañas, ceja */}
      <GraphiteFill seed={`${seed}-rim`} d={g.lidRim} tone={1} draw={[t0 + 8, t0 + 30]} />
      <AnimatedSketch seed={`${seed}-lids`}>
        <PencilStroke points={g.upper} seed={`${seed}-up`} width={8} tone={1} passes={3} draw={[t0, t0 + 22]} />
        <PencilStroke points={g.lower} seed={`${seed}-low`} width={3.5} tone={0.9} passes={2} draw={[t0 + 6, t0 + 28]} />
        <PencilStroke points={g.crease} seed={`${seed}-cr`} width={3} tone={0.9} draw={[t0 + 14, t0 + 36]} />
        <PencilStroke points={g.bag} seed={`${seed}-bag`} width={2.2} tone={0.75} draw={[t0 + 40, t0 + 62]} />
        <PencilStroke points={g.tearDuct} rough={{ closed: true }} seed={`${seed}-tear`} width={2} tone={0.85} draw={[t0 + 20, t0 + 32]} />
        <StrokeBundle list={g.wrinkles} width={1.8} tone={0.8} draw={[t0 + 50, t0 + 70]} />
        <StrokeBundle list={g.lashes} width={3} tone={1} opacity={0.95} draw={[t0 + 50, t0 + 90]} />
        <StrokeBundle list={g.lowLashes} width={2} tone={0.9} draw={[t0 + 60, t0 + 90]} />
        <StrokeBundle list={g.brow} width={2.6} tone={1} opacity={0.85} draw={[t0 + 35, t0 + 95]} />
      </AnimatedSketch>
      {/* Brillo húmedo del párpado inferior */}
      <EraserMarks seed={`${seed}-wet`} strokes={[g.lower.slice(8, 30).map(([x, y]) => [x, y - 10] as Pt)]} width={10} opacity={0.6} draw={[t0 + 60, t0 + 80]} />
    </SketchCanvas>
  );
};
