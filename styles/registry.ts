/**
 * Registro de estilos del estudio. Cada estilo vive en su propia carpeta
 * (styles/<ID>/) y se registra aquí con su identificador único.
 *
 *   import { getStyle } from "@styles/registry";
 *   const style = getStyle("GRAPHITE_HORROR_01");
 *   <style.Frame> ... </style.Frame>
 */
import { GRAPHITE_HORROR_01 } from "./GRAPHITE_HORROR_01";

export const STYLES = {
  GRAPHITE_HORROR_01,
} as const;

export type StyleId = keyof typeof STYLES;

export const getStyle = <T extends StyleId>(id: T): (typeof STYLES)[T] => STYLES[id];

export const listStyles = () => Object.values(STYLES).map((s) => ({ id: s.id, name: s.spec.name }));
