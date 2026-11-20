import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Subtitles, type SubtitleCue } from "@engine/components/Subtitles";
import { createRng } from "@engine/lib/random";
import { GH } from "../tokens";
import { subtitleFont } from "../fonts";
import { roughPath, type Pt } from "../lib/geometry";
import { GraphiteFilter, boilSeed, useSafeId } from "./SketchCanvas";

/**
 * Subtítulos del estilo: máquina de escribir color papel sobre una mancha de
 * grafito, palabra por palabra. Respeta la zona segura de redes verticales.
 */
export const GraphiteSubtitles: React.FC<{
  cues: SubtitleCue[];
  fontSize?: number;
  /** Distancia desde el borde inferior (px). */
  bottom?: number;
}> = ({ cues, fontSize = 56, bottom = GH.typography.safeArea.bottom }) => (
  <Subtitles
    cues={cues}
    wordRevealFrames={3}
    renderCue={({ cue, words }) => (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom }}>
        <div style={{ position: "relative", maxWidth: 1080 - GH.typography.safeArea.sides * 2, padding: "26px 46px" }}>
          <SmudgeBar seed={cue.text} />
          <div
            style={{
              position: "relative",
              fontFamily: subtitleFont,
              fontSize,
              lineHeight: 1.22,
              color: GH.palette.paperLight,
              textAlign: "center",
              textShadow: `0 0 6px ${GH.palette.ink}`,
            }}
          >
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.32em",
                  opacity: w.reveal,
                  translate: `0 ${(1 - w.reveal) * 10}px`,
                }}
              >
                {w.text}
              </span>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    )}
  />
);

/** Mancha de grafito irregular detrás del subtítulo. */
const SmudgeBar: React.FC<{ seed: string }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const drawing = Math.floor(frame / GH.motion.boilStep);
  const fid = useSafeId("gh-subbar");
  const d = useMemo(() => {
    const rng = createRng(seed);
    // Coordenadas ~px (viewBox 940x180) para que la textura tenga escala real
    const pts: Pt[] = [
      [10, 16],
      [470, 4],
      [930, 12],
      [934, 166],
      [470, 176],
      [6, 168],
    ];
    return roughPath(pts, rng, { jitter: 9, segment: 120, closed: true });
  }, [seed]);
  return (
    <svg
      viewBox="0 0 940 180"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
    >
      <GraphiteFilter
        id={fid}
        kind="graphite"
        region={{ x: 0, y: 0, w: 940, h: 180 }}
        seed={boilSeed(seed, drawing)}
        wobble={2}
      />
      <path d={d} fill={GH.palette.ink} opacity={0.82} filter={`url(#${fid})`} />
    </svg>
  );
};
