import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { noise1D } from "../lib/random";

/**
 * Cámara virtual 2D por fotogramas clave.
 * - zoom: 1 = encuadre base. x / y en píxeles (desplazamiento del mundo).
 * - ease: curva del tramo que TERMINA en este fotograma clave.
 * - shake: temblor tipo cámara en mano (ruido suave, determinista).
 */
export type CameraKey = {
  at: number;
  zoom?: number;
  x?: number;
  y?: number;
  rotate?: number;
  ease?: (t: number) => number;
};

export type CameraShake = {
  /** Amplitud en píxeles. */
  amplitude?: number;
  /** Rotación máxima en grados. */
  rotation?: number;
  /** Oscilaciones por segundo. */
  frequency?: number;
  seed?: string;
};

export type CameraState = { zoom: number; x: number; y: number; rotate: number };

const CameraContext = createContext<CameraState>({ zoom: 1, x: 0, y: 0, rotate: 0 });
export const useCamera = () => useContext(CameraContext);

export const sampleCamera = (keys: CameraKey[], frame: number): CameraState => {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  // Rellena valores no definidos con el último conocido.
  let last: CameraState = { zoom: 1, x: 0, y: 0, rotate: 0 };
  const full = sorted.map((k) => {
    last = {
      zoom: k.zoom ?? last.zoom,
      x: k.x ?? last.x,
      y: k.y ?? last.y,
      rotate: k.rotate ?? last.rotate,
    };
    return { ...last, at: k.at, ease: k.ease };
  });
  if (full.length === 0) return last;
  if (frame <= full[0].at) return full[0];
  const end = full[full.length - 1];
  if (frame >= end.at) return end;
  const i = full.findIndex((k, idx) => frame >= k.at && frame < full[idx + 1].at);
  const a = full[i];
  const b = full[i + 1];
  const t = interpolate(frame, [a.at, b.at], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: b.ease,
  });
  const lerp = (p: number, q: number) => p + (q - p) * t;
  // Zoom interpolado en escala logarítmica: se percibe uniforme.
  const zoom = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom)));
  return { zoom, x: lerp(a.x, b.x), y: lerp(a.y, b.y), rotate: lerp(a.rotate, b.rotate) };
};

export const CameraMovement: React.FC<{
  keys: CameraKey[];
  shake?: CameraShake;
  /** Punto de origen del zoom, CSS transform-origin. */
  origin?: string;
  children: React.ReactNode;
}> = ({ keys, shake, origin = "50% 50%", children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = sampleCamera(keys, frame);
  const freq = shake?.frequency ?? 0.6;
  const t = (frame / fps) * freq;
  const seed = shake?.seed ?? "cam";
  const sx = shake ? noise1D(`${seed}x`, t) * (shake.amplitude ?? 6) : 0;
  const sy = shake ? noise1D(`${seed}y`, t + 31.7) * (shake.amplitude ?? 6) : 0;
  const sr = shake ? noise1D(`${seed}r`, t + 77.3) * (shake.rotation ?? 0.25) : 0;
  const state: CameraState = {
    zoom: cam.zoom,
    x: cam.x + sx,
    y: cam.y + sy,
    rotate: cam.rotate + sr,
  };
  return (
    <CameraContext.Provider value={state}>
      <AbsoluteFill
        style={{
          transformOrigin: origin,
          scale: String(state.zoom),
          translate: `${state.x}px ${state.y}px`,
          rotate: `${state.rotate}deg`,
        }}
      >
        {children}
      </AbsoluteFill>
    </CameraContext.Provider>
  );
};

/**
 * Capa con parallax dentro de <CameraMovement>.
 * depth = 1 se mueve igual que la cámara; < 1 más lejos (se mueve menos);
 * > 1 más cerca (primer término, se mueve más).
 */
export const ParallaxLayer: React.FC<{
  depth: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ depth, origin = "50% 50%", children }) => {
  const cam = useCamera();
  const layerZoom = 1 + (cam.zoom - 1) * depth;
  const extraScale = layerZoom / cam.zoom;
  const k = depth - 1;
  return (
    <AbsoluteFill
      style={{
        transformOrigin: origin,
        scale: String(extraScale),
        translate: `${(cam.x * k) / cam.zoom}px ${(cam.y * k) / cam.zoom}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
