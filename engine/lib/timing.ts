import { Easing, interpolate } from "remotion";

/** Progreso 0..1 entre dos fotogramas, con easing opcional. */
export const progressBetween = (
  frame: number,
  start: number,
  end: number,
  easing: (t: number) => number = (t) => t,
) =>
  interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const EASE = {
  /** Entrada lenta, cinematográfica. */
  cinematic: Easing.bezier(0.45, 0, 0.15, 1),
  /** Golpe repentino (acercamiento brusco). */
  snap: Easing.bezier(0.7, 0, 0.1, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  linear: (t: number) => t,
} as const;

/** Convierte segundos a fotogramas. */
export const sec = (seconds: number, fps: number) => Math.round(seconds * fps);
