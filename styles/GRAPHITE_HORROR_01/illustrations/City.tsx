import React, { useMemo } from "react";
import { createRng } from "@engine/lib/random";
import { GH } from "../tokens";
import { ellipsePts, polyD, rectPts, type Pt } from "../lib/geometry";
import { SketchCanvas, useSafeId } from "../components/SketchCanvas";
import { AnimatedSketch, PencilDrawing, PencilStroke } from "../components/PencilDrawing";
import { CrossHatching, StrokeBundle } from "../components/CrossHatching";
import { EraserMarks, GraphiteFill } from "../components/GraphiteFill";
import { Figure } from "./Figure";

/**
 * Ciudad nocturna dibujada a lápiz, en capas independientes para parallax.
 * Cada capa acepta `t0` (fotograma de inicio del dibujo) y `seed`.
 * Lienzo 1080x1920 (vertical).
 */
type LayerProps = { t0?: number; seed?: string };

const W = 1080;
const H = 1920;
const rectD = (x: number, y: number, w: number, h: number) => polyD(rectPts(x, y, w, h));

// ---------------------------------------------------------------- Cielo ----
export const CitySky: React.FC<LayerProps & { moon?: Pt; moonR?: number }> = ({
  t0 = 0,
  seed = "sky",
  moon = [770, 360],
  moonR = 118,
}) => {
  const skyClip = `${rectD(-200, -200, W + 400, H + 400)} ${polyD(ellipsePts(moon[0], moon[1], moonR, moonR, 40))}`;
  const moonShadow = polyD(ellipsePts(moon[0] - moonR * 0.45, moon[1] - moonR * 0.1, moonR * 0.95, moonR * 1.05, 40));
  const moonD = polyD(ellipsePts(moon[0], moon[1], moonR, moonR, 40));
  return (
    <SketchCanvas seed={seed}>
      <CrossHatching seed={`${seed}-night`} clip={skyClip} clipRule="evenodd" tone={0.92} baseAngle={32} draw={[t0, t0 + 45]} />
      {/* Halo lunar: el grafito se ha levantado con la goma alrededor de la luna */}
      <Glow center={moon} r={moonR * 2.7} opacity={0.62} />
      <AnimatedSketch seed={`${seed}-moon`}>
        <PencilStroke points={ellipsePts(moon[0], moon[1], moonR, moonR, 40)} rough={{ closed: true, jitter: 2 }} seed={`${seed}-mo`} width={2.4} tone={0.8} draw={[t0 + 4, t0 + 26]} />
        <g clipPath={undefined}>
          <MoonShade clip={moonD} shadow={moonShadow} seed={seed} t0={t0} />
        </g>
      </AnimatedSketch>
      {/* Nubes: masas de grafito difuminado y bordes iluminados con goma */}
      <GraphiteFill seed={`${seed}-cloud1`} kind="smudge" tone={1} opacity={0.85} d={polyD(ellipsePts(560, 470, 420, 40, 30))} draw={[t0 + 40, t0 + 70]} />
      <GraphiteFill seed={`${seed}-cloud2`} kind="smudge" tone={1} opacity={0.7} d={polyD(ellipsePts(300, 640, 380, 34, 30))} draw={[t0 + 46, t0 + 76]} />
      <EraserMarks
        seed={`${seed}-cloudlight`}
        strokes={[
          [[380, 425], [600, 418], [860, 432]],
          [[520, 452], [720, 446], [900, 455]],
        ]}
        width={10}
        opacity={0.6}
        draw={[t0 + 55, t0 + 80]}
      />
    </SketchCanvas>
  );
};

/** Resplandor suave color papel (luz que "levanta" el grafito). */
export const Glow: React.FC<{ center: Pt; r: number; opacity?: number }> = ({ center, r, opacity = 0.6 }) => {
  const id = useSafeId("glow");
  return (
    <g>
      <radialGradient id={id} cx={center[0]} cy={center[1]} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={GH.palette.paperLight} stopOpacity={opacity} />
        <stop offset="0.35" stopColor={GH.palette.paperLight} stopOpacity={opacity * 0.45} />
        <stop offset="1" stopColor={GH.palette.paperLight} stopOpacity={0} />
      </radialGradient>
      <circle cx={center[0]} cy={center[1]} r={r} fill={`url(#${id})`} />
    </g>
  );
};

const MoonShade: React.FC<{ clip: string; shadow: string; seed: string; t0: number }> = ({ clip, shadow, seed, t0 }) => {
  const id = useSafeId("moonclip");
  return (
    <g>
      <clipPath id={id}>
        <path d={clip} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <CrossHatching seed={`${seed}-moonsh`} clip={shadow} tone={0.3} baseAngle={60} scale={0.7} filtered={false} draw={[t0 + 18, t0 + 40]} />
        {/* Cráteres */}
        <StrokeBundle
          list={[
            "M740 330q14 -10 26 2q-4 14 -22 10z",
            "M800 395q10 -6 18 4q-6 10 -18 4z",
            "M712 400q8 -4 12 4",
          ]}
          width={2}
          tone={0.5}
          draw={[t0 + 26, t0 + 40]}
        />
      </g>
    </g>
  );
};

// ----------------------------------------------------- Edificios lejanos ----
type Building = { x: number; w: number; top: number };

const makeSkyline = (seed: string, base: number, minH: number, maxH: number, minW: number, maxW: number): Building[] => {
  const rng = createRng(seed);
  const out: Building[] = [];
  let x = -160;
  while (x < W + 160) {
    const w = rng.range(minW, maxW);
    out.push({ x, w, top: base - rng.range(minH, maxH) });
    x += w;
  }
  return out;
};

export const CityFar: React.FC<LayerProps & { base?: number }> = ({ t0 = 10, seed = "far", base = 1280 }) => {
  const g = useMemo(() => {
    const rng = createRng(`${seed}-w`);
    const bs = makeSkyline(seed, base, 180, 560, 70, 150);
    const clip = bs.map((b) => rectD(b.x, b.top, b.w, H - b.top + 200)).join(" ");
    // Ventanas encendidas: agujeros en el rayado (el papel es la luz)
    const lit: string[] = [];
    bs.forEach((b) => {
      for (let wy = b.top + 30; wy < base - 20; wy += 34) {
        for (let wx = b.x + 12; wx < b.x + b.w - 16; wx += 24) {
          if (rng.chance(0.05)) lit.push(rectD(wx, wy, 9, 13));
        }
      }
    });
    const outline: Pt[][] = bs.map((b) => [
      [b.x, b.top + 40],
      [b.x, b.top],
      [b.x + b.w, b.top],
      [b.x + b.w, b.top + 60],
    ]);
    const antennas: string[] = bs
      .filter(() => rng.chance(0.25))
      .map((b) => {
        const ax = b.x + b.w * rng.range(0.3, 0.7);
        return `M${ax} ${b.top}L${ax + rng.jitter(2)} ${b.top - rng.range(40, 120)}`;
      });
    return { bs, clip, lit: lit.join(" "), outline, antennas };
  }, [seed, base]);
  return (
    <SketchCanvas seed={seed}>
      <CrossHatching seed={`${seed}-h`} clip={`${g.clip} ${g.lit}`} clipRule="evenodd" tone={0.62} baseAngle={-50} draw={[t0 + 15, t0 + 60]} />
      <AnimatedSketch seed={`${seed}-o`}>
        <PencilDrawing
          strokes={g.outline.map((pts, i) => ({ points: pts, seed: `${seed}-o${i}`, width: 2, tone: 0.75, passes: 1 }))}
          draw={[t0, t0 + 40]}
          overlap={0.8}
        />
        <StrokeBundle list={g.antennas} width={2} tone={0.8} draw={[t0 + 30, t0 + 45]} />
      </AnimatedSketch>
    </SketchCanvas>
  );
};

// ------------------------------------------------------ Edificios medios ----
export const CityMid: React.FC<LayerProps & { base?: number }> = ({ t0 = 20, seed = "mid", base = 1520 }) => {
  const g = useMemo(() => {
    const rng = createRng(seed);
    const specs = [
      { x: -60, w: 250, top: 760 },
      { x: 190, w: 170, top: 980 },
      { x: 620, w: 200, top: 870 },
      { x: 820, w: 300, top: 640 },
    ];
    const fronts: string[] = [];
    const sides: string[] = [];
    const litWins: string[] = [];
    const darkWins: string[] = [];
    const winOutline: string[] = [];
    const edges: Pt[][] = [];
    specs.forEach((b) => {
      const right = b.x + b.w / 2 < W / 2; // a la izquierda del centro: cara lateral derecha
      const depth = 46;
      fronts.push(rectD(b.x, b.top, b.w, H - b.top + 200));
      const sx = right ? b.x + b.w : b.x;
      const dir = right ? 1 : -1;
      const side: Pt[] = [
        [sx, b.top],
        [sx + dir * depth, b.top + 22],
        [sx + dir * depth, H + 200],
        [sx, H + 200],
      ];
      sides.push(polyD(side));
      edges.push([[b.x - 6, b.top], [b.x + b.w + 6, b.top]]);
      edges.push([[b.x, b.top - 4], [b.x, base + 300]]);
      edges.push([[b.x + b.w, b.top - 4], [b.x + b.w, base + 300]]);
      edges.push([side[0], side[1], side[2]]);
      // Rejilla de ventanas
      for (let wy = b.top + 40; wy < base + 200; wy += 62) {
        for (let wx = b.x + 22; wx < b.x + b.w - 34; wx += 46) {
          const r = rng.next();
          const ww = 22;
          const wh = 34;
          if (r < 0.1) litWins.push(rectD(wx, wy, ww, wh));
          else if (r < 0.55) darkWins.push(rectD(wx + rng.jitter(1), wy + rng.jitter(1), ww, wh));
          if (r < 0.6)
            winOutline.push(
              `M${wx + rng.jitter(1.5)} ${wy}L${wx + ww + rng.jitter(1.5)} ${wy + rng.jitter(1)}M${wx} ${wy + wh}L${wx + ww} ${wy + wh + rng.jitter(1)}`,
            );
        }
      }
    });
    // Depósito de agua en la azotea del edificio derecho
    const tank: Pt[] = [
      [900, 640], [908, 560], [990, 560], [998, 640],
    ];
    const tankLegs = "M912 640L904 600M986 640L994 600M930 560L949 512L968 560";
    return { fronts: fronts.join(" "), sides: sides.join(" "), lit: litWins.join(" "), dark: darkWins.join(" "), winOutline, edges, tank, tankLegs };
  }, [seed, base]);
  return (
    <SketchCanvas seed={seed}>
      {/* Fondo papel opaco para tapar la capa lejana */}
      <path d={g.fronts} fill={GH.palette.paper} />
      <path d={g.sides} fill={GH.palette.paper} />
      <CrossHatching seed={`${seed}-front`} clip={`${g.fronts} ${g.lit}`} clipRule="evenodd" tone={0.7} baseAngle={40} draw={[t0 + 25, t0 + 75]} />
      <CrossHatching seed={`${seed}-side`} clip={g.sides} tone={0.95} baseAngle={80} draw={[t0 + 30, t0 + 80]} />
      <GraphiteFill seed={`${seed}-dw`} d={g.dark} tone={0.95} opacity={0.9} draw={[t0 + 50, t0 + 85]} />
      <AnimatedSketch seed={`${seed}-edges`}>
        <PencilDrawing
          strokes={g.edges.map((pts, i) => ({ points: pts, seed: `${seed}-e${i}`, width: 3, tone: 0.95, passes: 2 }))}
          draw={[t0, t0 + 45]}
          overlap={0.6}
        />
        <StrokeBundle list={g.winOutline} width={1.6} tone={0.9} draw={[t0 + 45, t0 + 80]} />
        <PencilStroke points={g.tank} seed={`${seed}-tank`} width={2.6} tone={1} draw={[t0 + 35, t0 + 55]} />
        <PencilStroke d={g.tankLegs} seed={`${seed}-legs`} width={2.2} tone={1} passes={1} draw={[t0 + 45, t0 + 60]} />
      </AnimatedSketch>
      <GraphiteFill seed={`${seed}-tankfill`} d={polyD(g.tank)} tone={1} opacity={0.9} draw={[t0 + 50, t0 + 65]} />
    </SketchCanvas>
  );
};

// ------------------------------------------------------- Calle / farola ----
export const CityStreet: React.FC<
  LayerProps & { figure?: boolean; figureAppear?: number; lamp?: Pt; figureX?: number }
> = ({ t0 = 40, seed = "street", figure = true, figureAppear, lamp = [250, 1190], figureX = 330 }) => {
  const g = useMemo(() => {
    const [lx, ly] = lamp;
    const cone: Pt[] = [
      [lx + 70, ly + 20],
      [lx + 104, ly + 20],
      [lx + 330, H + 40],
      [lx - 160, H + 40],
    ];
    const ground = rectD(-200, 1560, W + 400, H);
    const pole: Pt[] = [
      [lx, H + 20],
      [lx + 2, ly + 300],
      [lx - 1, ly],
    ];
    const arm: Pt[] = [
      [lx - 1, ly + 6],
      [lx + 40, ly - 28],
      [lx + 88, ly + 6],
    ];
    const head: Pt[] = [
      [lx + 62, ly + 4],
      [lx + 112, ly + 4],
      [lx + 104, ly + 22],
      [lx + 70, ly + 22],
    ];
    // Rayas de la acera en perspectiva
    const curb: Pt[][] = [
      [[-100, 1600], [W + 100, 1580]],
      [[-100, 1700], [W + 100, 1684]],
    ];
    return { cone, ground, pole, arm, head, curb };
  }, [lamp]);
  return (
    <SketchCanvas seed={seed}>
      {/* Suelo oscuro con el cono de luz recortado (papel) */}
      <path d={g.ground} fill={GH.palette.paper} />
      <CrossHatching seed={`${seed}-ground`} clip={`${g.ground} ${polyD(g.cone)}`} clipRule="evenodd" tone={0.9} baseAngle={8} draw={[t0, t0 + 50]} />
      <CrossHatching seed={`${seed}-conefloor`} clip={polyD(g.cone)} tone={0.12} baseAngle={8} scale={1.3} draw={[t0 + 30, t0 + 60]} />
      <Glow center={[lamp[0] + 87, lamp[1] + 26]} r={230} opacity={0.7} />
      <AnimatedSketch seed={`${seed}-lamp`}>
        <PencilStroke points={g.pole} seed={`${seed}-pole`} width={13} tone={1} draw={[t0 + 5, t0 + 30]} />
        <PencilStroke points={g.arm} seed={`${seed}-arm`} width={5} tone={1} draw={[t0 + 25, t0 + 38]} />
        <PencilStroke points={g.head} rough={{ closed: true }} seed={`${seed}-head`} width={3.5} tone={1} draw={[t0 + 32, t0 + 44]} />
        <PencilStroke points={[g.cone[0], g.cone[3]]} seed={`${seed}-c1`} width={1.4} tone={0.6} passes={1} draw={[t0 + 40, t0 + 60]} />
        <PencilStroke points={[g.cone[1], g.cone[2]]} seed={`${seed}-c2`} width={1.4} tone={0.6} passes={1} draw={[t0 + 42, t0 + 62]} />
        {g.curb.map((c, i) => (
          <PencilStroke key={i} points={c} seed={`${seed}-curb${i}`} width={3} tone={1} draw={[t0 + 10 + i * 6, t0 + 40]} />
        ))}
      </AnimatedSketch>
      {figure ? (
        <Figure seed={`${seed}-fig`} x={figureX} y={1830} height={400} draw={[t0 + 55, t0 + 80]} appear={figureAppear} eyes={false} />
      ) : null}
    </SketchCanvas>
  );
};

/** Niebla baja entre capas (goma de borrar). */
export const CityFog: React.FC<LayerProps & { y?: number }> = ({ t0 = 60, seed = "fog", y = 1470 }) => (
  <SketchCanvas seed={seed}>
    <EraserMarks
      seed={seed}
      strokes={[
        [[-100, y], [300, y - 12], [700, y + 8], [1180, y - 6]],
        [[-100, y + 60], [400, y + 48], [800, y + 70], [1180, y + 52]],
        [[100, y + 120], [600, y + 112], [1180, y + 128]],
      ]}
      width={46}
      opacity={0.5}
      draw={[t0, t0 + 50]}
    />
  </SketchCanvas>
);
