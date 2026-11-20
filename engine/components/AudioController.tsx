import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, useVideoConfig } from "remotion";

/**
 * Mezclador declarativo. Cada pista es un "slot": si `src` no existe todavía
 * (p. ej. la voz definitiva), el slot queda reservado y no suena nada.
 * Tiempos en segundos.
 */
export type AudioTrack = {
  name: string;
  /** Categoría para mezclar por grupos: voice, music, sfx, ambience. */
  bus: "voice" | "music" | "sfx" | "ambience";
  src?: string;
  start?: number;
  duration?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  trimBefore?: number;
  playbackRate?: number;
};

export type BusLevels = Partial<Record<AudioTrack["bus"], number>>;

export const AudioController: React.FC<{
  tracks: AudioTrack[];
  buses?: BusLevels;
  muted?: boolean;
}> = ({ tracks, buses = {}, muted = false }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (muted) return null;
  return (
    <>
      {tracks
        .filter((t) => Boolean(t.src))
        .map((t) => {
          const from = Math.round((t.start ?? 0) * fps);
          const dur = Math.max(
            1,
            Math.min(durationInFrames - from, t.duration ? Math.round(t.duration * fps) : durationInFrames - from),
          );
          const base = (t.volume ?? 1) * (buses[t.bus] ?? 1);
          const fi = Math.round((t.fadeIn ?? 0) * fps);
          const fo = Math.round((t.fadeOut ?? 0) * fps);
          return (
            <Sequence key={t.name} name={`🔊 ${t.name}`} from={from} durationInFrames={dur} layout="none">
              <Audio
                src={t.src as string}
                loop={t.loop}
                playbackRate={t.playbackRate}
                trimBefore={t.trimBefore ? Math.round(t.trimBefore * fps) : undefined}
                volume={(f) => {
                  const a = fi > 0 ? interpolate(f, [0, fi], [0, 1], { extrapolateRight: "clamp" }) : 1;
                  const b =
                    fo > 0
                      ? interpolate(f, [dur - fo, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
                      : 1;
                  return base * Math.min(a, b);
                }}
              />
            </Sequence>
          );
        })}
    </>
  );
};
