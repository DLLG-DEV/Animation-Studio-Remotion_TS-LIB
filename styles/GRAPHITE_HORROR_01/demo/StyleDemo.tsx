import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { CameraMovement, ParallaxLayer } from "@engine/components/CameraMovement";
import { Scene } from "@engine/components/Scene";
import { AudioController, type AudioTrack } from "@engine/components/AudioController";
import { EASE } from "@engine/lib/timing";
import drone from "@assets/audio/placeholder/ambient-drone.wav";
import pencil from "@assets/audio/placeholder/pencil-scratch.wav";
import boom from "@assets/audio/placeholder/hit-boom.wav";
import eraser from "@assets/audio/placeholder/eraser-swish.wav";
import { GH } from "../tokens";
import { GraphiteFrame, flickerAmount } from "../components/GraphiteTexture";
import { GraphiteSubtitles } from "../components/GraphiteSubtitles";
import { HandDrawnText } from "../components/HandDrawnText";
import { SketchCanvas } from "../components/SketchCanvas";
import { AnimatedSketch, PencilStroke } from "../components/PencilDrawing";
import { CrossHatching } from "../components/CrossHatching";
import { graphiteSmear, eraserWipe, flickerCut } from "../transitions";
import { CitySky, CityFar, CityMid, CityStreet, CityFog } from "../illustrations/City";
import { Corridor, corridorFigureAt } from "../illustrations/Corridor";
import { Figure } from "../illustrations/Figure";
import { Eye } from "../illustrations/Eye";

/**
 * Prueba visual del estilo GRAPHITE_HORROR_01 (no pertenece a ningún video).
 * 1080x1920 · 30 fps · 518 fotogramas.
 */
export const DEMO_SCENE = 165;
export const DEMO_CARD = 75;
export const DEMO_T = { smear: 20, eraser: 20, flicker: 12 };
export const DEMO_DURATION = DEMO_SCENE * 3 + DEMO_CARD - DEMO_T.smear - DEMO_T.eraser - DEMO_T.flicker;

// Inicio de cada escena en el tiempo global (para audio y subtítulos)
const S2 = DEMO_SCENE - DEMO_T.smear; // 145
const S3 = S2 + DEMO_SCENE - DEMO_T.eraser; // 290
const S4 = S3 + DEMO_SCENE - DEMO_T.flicker; // 443
const s = (f: number) => f / 30;

const TRACKS: AudioTrack[] = [
  { name: "Drone ambiental", bus: "music", src: drone, volume: 0.8, fadeIn: 1.5, fadeOut: 1.5 },
  { name: "Lápiz · ciudad", bus: "sfx", src: pencil, start: 0, duration: 3.4, loop: true, volume: 0.5, fadeOut: 0.4 },
  { name: "Goma · transición 1", bus: "sfx", src: eraser, start: s(S2), volume: 0.8 },
  { name: "Lápiz · pasillo", bus: "sfx", src: pencil, start: s(S2 + 8), duration: 2.2, loop: true, volume: 0.4, fadeOut: 0.3 },
  { name: "Golpe · salto 1", bus: "sfx", src: boom, start: s(S2 + 62), volume: 0.8 },
  { name: "Golpe · salto 2", bus: "sfx", src: boom, start: s(S2 + 102), volume: 1 },
  { name: "Goma · transición 2", bus: "sfx", src: eraser, start: s(S3), volume: 0.8 },
  { name: "Lápiz · ojo", bus: "sfx", src: pencil, start: s(S3 + 5), duration: 2.8, loop: true, volume: 0.45, fadeOut: 0.4 },
  { name: "Golpe · ojo", bus: "sfx", src: boom, start: s(S3 + 140), volume: 1 },
  { name: "Lápiz · título", bus: "sfx", src: pencil, start: s(S4 + 6), duration: 1.6, loop: true, volume: 0.5, fadeOut: 0.3 },
  // Slot de voz reservado (opción C): sin archivo todavía
  { name: "Voz (pendiente)", bus: "voice" },
];

const CUES = [
  { start: 0.7, end: 4.7, text: "La ciudad duerme… pero alguien sigue despierto." },
  { start: s(S2) + 0.6, end: s(S2) + 4.9, text: "Al fondo del pasillo, algo espera." },
  { start: s(S3) + 0.6, end: s(S3) + 4.6, text: "Y ahora… te está mirando." },
];

export const StyleDemo: React.FC = () => (
  <GraphiteFrame>
    <TransitionSeries>
      <TransitionSeries.Sequence name="1 · Ciudad oscura" durationInFrames={DEMO_SCENE}>
        <DemoCity />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={graphiteSmear()} timing={linearTiming({ durationInFrames: DEMO_T.smear })} />
      <TransitionSeries.Sequence name="2 · Pasillo" durationInFrames={DEMO_SCENE}>
        <DemoCorridor />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={eraserWipe()} timing={linearTiming({ durationInFrames: DEMO_T.eraser })} />
      <TransitionSeries.Sequence name="3 · Ojo" durationInFrames={DEMO_SCENE}>
        <DemoEye />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={flickerCut()} timing={linearTiming({ durationInFrames: DEMO_T.flicker })} />
      <TransitionSeries.Sequence name="4 · Título del estilo" durationInFrames={DEMO_CARD}>
        <DemoCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <GraphiteSubtitles cues={CUES} />
    <AudioController tracks={TRACKS} buses={GH.sound.buses} />
  </GraphiteFrame>
);

// ------------------------------------------------ Escena 1: plano general
const DemoCity: React.FC = () => (
  <Scene background={GH.palette.paper}>
    <CameraMovement
      keys={[
        { at: 0, zoom: 1.03, x: 30, y: 30 },
        { at: DEMO_SCENE, zoom: 1.17, x: -25, y: -50, ease: EASE.cinematic },
      ]}
      shake={{ amplitude: 3, rotation: 0.12, seed: "city" }}
    >
      <ParallaxLayer depth={0.3}>
        <CitySky t0={0} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.55}>
        <CityFar t0={10} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.8}>
        <CityMid t0={22} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.95}>
        <CityFog t0={70} />
      </ParallaxLayer>
      <ParallaxLayer depth={1.25}>
        <CityStreet t0={40} figureAppear={95} />
      </ParallaxLayer>
    </CameraMovement>
    <AbsoluteFill style={{ alignItems: "flex-start", paddingTop: 210, paddingLeft: 80 }}>
      <HandDrawnText text={"LA CIUDAD\nDUERME"} fontSize={66} color={GH.palette.paperLight} write={[60, 92]} seed="t-city" />
    </AbsoluteFill>
  </Scene>
);

// ------------------------------------------------ Escena 2: plano medio -> susto
const DemoCorridor: React.FC = () => {
  const frame = useCurrentFrame();
  const z = frame < 62 ? 6 : frame < 102 ? 3.1 : 1.22;
  const fig = corridorFigureAt(z);
  const blackout = (frame >= 58 && frame < 64) || (frame >= 98 && frame < 104);
  const lamp = 1 - flickerAmount(frame, "corr-lamp", 4);
  const headY = fig.y - fig.height * 0.93;
  return (
    <Scene background={GH.palette.paper}>
      <CameraMovement
        origin={`50% ${(headY / 1920) * 100}%`}
        keys={[
          { at: 0, zoom: 1.02 },
          { at: 138, zoom: 1.12, ease: EASE.cinematic },
          { at: 147, zoom: 2.3, ease: EASE.snap },
          { at: DEMO_SCENE, zoom: 2.45 },
        ]}
        shake={{ amplitude: frame > 138 ? 10 : 4, rotation: 0.3, frequency: frame > 138 ? 3 : 0.7, seed: "corr" }}
      >
        <Corridor t0={0} doorLight={blackout ? 0 : 1} lampFlicker={lamp}>
          <Figure
            key={z}
            seed={`demo-fig-${z}`}
            x={fig.x}
            y={fig.y}
            height={fig.height}
            eyes={z < 2}
            headTilt={z < 2 ? 22 : 12}
            appear={z === 6 ? 28 : undefined}
            draw={z === 6 ? [28, 52] : undefined}
            shadow
          />
        </Corridor>
      </CameraMovement>
      {blackout ? <AbsoluteFill style={{ background: GH.palette.ink, opacity: frame % 3 === 0 ? 0.85 : 1 }} /> : null}
    </Scene>
  );
};

// ------------------------------------------------ Escena 3: plano detalle
const DemoEye: React.FC = () => {
  const frame = useCurrentFrame();
  const gx = interpolate(frame, [0, 95, 99, 118, 122, 138, 141], [0, 0, -95, -95, 70, 70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gy = interpolate(frame, [0, 95, 99, 118, 122, 138, 141], [0, 0, 8, 8, -14, -14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pupil = interpolate(frame, [0, 126, 136], [62, 62, 128], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.2, 1),
  });
  return (
    <Scene background={GH.palette.paper}>
      <CameraMovement
        origin="50% 47.4%"
        keys={[
          { at: 0, zoom: 1.0, y: 20 },
          { at: 138, zoom: 1.12, y: 0, ease: EASE.cinematic },
          { at: 150, zoom: 3.2, ease: EASE.snap },
          { at: DEMO_SCENE, zoom: 3.4 },
        ]}
        shake={{ amplitude: 3, rotation: 0.1, seed: "eye" }}
      >
        <Eye t0={0} gaze={[gx, gy]} pupil={pupil} />
      </CameraMovement>
    </Scene>
  );
};

// ------------------------------------------------ Escena 4: título del estilo
const DemoCard: React.FC = () => (
  <Scene background={GH.palette.paper}>
    <CameraMovement keys={[{ at: 0, zoom: 1 }, { at: DEMO_CARD, zoom: 1.06 }]} shake={{ amplitude: 2, seed: "card" }}>
      <SketchCanvas seed="card">
        <CrossHatching seed="card-frame" clip="M-200 -200H1280V2120H-200Z M110 640H970V1260H110Z" clipRule="evenodd" tone={0.9} draw={[0, 25]} />
        <AnimatedSketch seed="card-lines">
          <PencilStroke points={[[110, 640], [970, 640], [970, 1260], [110, 1260]]} rough={{ closed: true }} seed="card-box" width={4} tone={1} draw={[4, 22]} />
          <PencilStroke points={[[250, 1000], [540, 990], [830, 1004]]} seed="card-under" width={5} tone={1} draw={[34, 46]} />
        </AnimatedSketch>
      </SketchCanvas>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 10, marginTop: -60 }}>
        <HandDrawnText text="GRAPHITE" fontSize={104} write={[8, 24]} seed="c1" />
        <HandDrawnText text="HORROR" fontSize={104} write={[20, 36]} seed="c2" />
        <div style={{ height: 60 }} />
        <HandDrawnText text="ESTILO Nº 01" font="subtitle" fontSize={50} write={[38, 48]} seed="c4" letterJitter={0.5} />
        <HandDrawnText text="Terror cinematográfico a lápiz" font="subtitle" fontSize={44} write={[44, 60]} seed="c3" letterJitter={0.5} />
      </AbsoluteFill>
    </CameraMovement>
  </Scene>
);
