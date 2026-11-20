import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Subtítulos sincronizados por tiempo (segundos). Independiente del estilo:
 * el estilo visual se inyecta con `renderCue`.
 *
 * Las palabras se revelan proporcionalmente al tiempo de la frase, salvo que
 * se indiquen `words` con tiempos exactos (p. ej. de una transcripción Whisper).
 */
export type SubtitleWord = { text: string; start: number; end: number };
export type SubtitleCue = {
  start: number;
  end: number;
  text: string;
  words?: SubtitleWord[];
};

export type CueRenderInfo = {
  cue: SubtitleCue;
  /** Palabras con su estado de revelado 0..1 */
  words: { text: string; reveal: number; active: boolean }[];
  /** 0..1 dentro de la frase */
  progress: number;
  /** Fotogramas desde el inicio de la frase */
  localFrame: number;
  /** Fotogramas hasta el final de la frase */
  framesLeft: number;
};

export const splitWords = (cue: SubtitleCue): SubtitleWord[] => {
  if (cue.words) return cue.words;
  const tokens = cue.text.split(/\s+/).filter(Boolean);
  const total = tokens.reduce((s, w) => s + w.length + 2, 0);
  const span = (cue.end - cue.start) * 0.85; // termina un poco antes
  let acc = 0;
  return tokens.map((w) => {
    const s = cue.start + (acc / total) * span;
    acc += w.length + 2;
    return { text: w, start: s, end: cue.start + (acc / total) * span };
  });
};

export const Subtitles: React.FC<{
  cues: SubtitleCue[];
  renderCue: (info: CueRenderInfo) => React.ReactNode;
  /** Duración del revelado de cada palabra, en fotogramas. */
  wordRevealFrames?: number;
}> = ({ cues, renderCue, wordRevealFrames = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const words = splitWords(cue).map((w) => {
    const startF = w.start * fps;
    const reveal = Math.min(1, Math.max(0, (frame - startF) / wordRevealFrames));
    return { text: w.text, reveal, active: t >= w.start && t < w.end };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {renderCue({
        cue,
        words,
        progress: (t - cue.start) / (cue.end - cue.start),
        localFrame: frame - cue.start * fps,
        framesLeft: cue.end * fps - frame,
      })}
    </AbsoluteFill>
  );
};
