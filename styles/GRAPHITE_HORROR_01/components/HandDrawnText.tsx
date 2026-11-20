import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { createRng, steppedFrame } from "@engine/lib/random";
import { GH } from "../tokens";
import { subtitleFont, titleFont } from "../fonts";
import { GraphiteFilter, boilSeed, useSafeId } from "./SketchCanvas";

/**
 * Texto rotulado a lápiz: se escribe carácter a carácter, cada letra tiembla
 * con el boil y la textura del grafito la rompe.
 */
export const HandDrawnText: React.FC<{
  text: string;
  font?: "title" | "subtitle";
  fontSize?: number;
  color?: string;
  /** Ventana de escritura [inicio, fin] en fotogramas. */
  write?: readonly [number, number];
  /** Fotograma en que se borra (parpadeo de salida). */
  erase?: number;
  letterJitter?: number;
  style?: React.CSSProperties;
  lineHeight?: number;
  seed?: string;
}> = ({
  text,
  font = "title",
  fontSize = 96,
  color = GH.palette.ink,
  write,
  erase,
  letterJitter = 1,
  style,
  lineHeight = 1.25,
  seed = "text",
}) => {
  const frame = useCurrentFrame();
  const drawing = Math.floor(frame / GH.motion.boilStep);
  const fid = useSafeId("gh-text");
  const chars = Array.from(text);
  const p = write
    ? interpolate(steppedFrame(frame, GH.motion.drawStep), [write[0], Math.max(write[0] + 1, write[1])], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const shown = Math.ceil(chars.length * p);
  let opacity = 1;
  if (erase !== undefined && frame >= erase) opacity = frame - erase < 3 ? 0.45 : 0;
  if (shown === 0 || opacity === 0) return null;
  const rng = createRng(`${seed}-${drawing}`);
  return (
    <div
      style={{
        fontFamily: font === "title" ? titleFont : subtitleFont,
        fontSize,
        color,
        lineHeight,
        whiteSpace: "pre-wrap",
        opacity,
        filter: `url(#${fid})`,
        ...style,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <GraphiteFilter
          id={fid}
          kind="pencil"
          region={{ x: -200, y: -200, w: 2000, h: 2400 }}
          seed={boilSeed(seed, drawing)}
          wobble={GH.motion.boilWobble * 0.8}
          tooth={0.8}
        />
      </svg>
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={i} />;
        const j = letterJitter;
        const r = rng.jitter(2.2 * j);
        const dx = rng.jitter(1.4 * j);
        const dy = rng.jitter(1.8 * j);
        const fresh = i === shown - 1 && p < 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              visibility: i < shown ? "visible" : "hidden",
              rotate: `${r}deg`,
              translate: `${dx}px ${dy}px`,
              opacity: fresh ? 0.55 : 1,
              whiteSpace: ch === " " ? "pre" : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};
