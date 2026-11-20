import style from "./style.json";

/** Tokens tipados del estilo (fuente única: style.json). */
export const GH = {
  id: style.id as "GRAPHITE_HORROR_01",
  name: style.name,
  palette: style.palette,
  motion: style.motion,
  camera: style.camera,
  typography: style.typography,
  sound: style.sound,
} as const;

export type GraphitePalette = typeof style.palette;

/**
 * Tono 0..1 -> color de grafito (0 = papel, 1 = negro casi puro).
 */
export const tone = (t: number): string => {
  const p = GH.palette;
  const stops = [p.paper, p.graphite100, p.graphite300, p.graphite500, p.graphite700, p.graphite900, p.ink];
  const idx = Math.min(stops.length - 1, Math.max(0, Math.round(t * (stops.length - 1))));
  return stops[idx];
};
