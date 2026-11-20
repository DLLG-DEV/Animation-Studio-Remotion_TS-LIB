// GRAPHITE_HORROR_01 — Terror cinematográfico a lápiz.
// Punto de entrada único del estilo. Ver STYLE.md para las reglas artísticas.
import styleJson from "./style.json";
import { graphiteSmear, eraserWipe, flickerCut } from "./transitions";
import { GraphiteFrame } from "./components/GraphiteTexture";
import { GraphiteSubtitles } from "./components/GraphiteSubtitles";

export { GH, tone } from "./tokens";
export { titleFont, subtitleFont } from "./fonts";
export * from "./lib/geometry";
export * from "./lib/hatch";
export * from "./components/SketchCanvas";
export * from "./components/PencilDrawing";
export * from "./components/CrossHatching";
export * from "./components/GraphiteFill";
export * from "./components/GraphiteTexture";
export * from "./components/HandDrawnText";
export * from "./components/GraphiteSubtitles";
export * from "./transitions";
export * from "./illustrations/Figure";
export * from "./illustrations/City";
export * from "./illustrations/Corridor";
export * from "./illustrations/Eye";

/** Descriptor del estilo para el registro (styles/registry.ts). */
export const GRAPHITE_HORROR_01 = {
  id: "GRAPHITE_HORROR_01" as const,
  spec: styleJson,
  Frame: GraphiteFrame,
  Subtitles: GraphiteSubtitles,
  transitions: { graphiteSmear, eraserWipe, flickerCut },
};
