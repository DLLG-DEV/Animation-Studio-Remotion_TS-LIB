import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Contenedor base de una escena. Independiente del estilo:
 * fondo opaco (necesario para que las transiciones no mezclen escenas),
 * recorte y fundidos opcionales de entrada / salida a un color.
 */
export const Scene: React.FC<{
  name?: string;
  background?: string;
  /** Fotogramas de fundido desde `fadeColor` al empezar. */
  fadeIn?: number;
  /** Fotogramas de fundido hacia `fadeColor` al terminar. */
  fadeOut?: number;
  fadeColor?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ background = "#000", fadeIn = 0, fadeOut = 0, fadeColor = "#000", style, children }) => {
  return (
    <AbsoluteFill style={{ background, overflow: "hidden", ...style }}>
      {children}
      {fadeIn > 0 || fadeOut > 0 ? (
        <SceneFade fadeIn={fadeIn} fadeOut={fadeOut} color={fadeColor} />
      ) : null}
    </AbsoluteFill>
  );
};

const SceneFade: React.FC<{ fadeIn: number; fadeOut: number; color: string }> = ({
  fadeIn,
  fadeOut,
  color,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inOp =
    fadeIn > 0
      ? interpolate(frame, [0, fadeIn], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 0;
  const outOp =
    fadeOut > 0
      ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  return (
    <AbsoluteFill style={{ background: color, opacity: Math.max(inOp, outOp), pointerEvents: "none" }} />
  );
};
