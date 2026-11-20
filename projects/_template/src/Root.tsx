import { Composition } from "remotion";
import { StyleCheck } from "./StyleCheck";

/**
 * Plantilla de proyecto. Sustituir StyleCheck por las escenas del video.
 * La composición de comprobación demuestra que la biblioteca compartida
 * (@engine, @styles, @assets) funciona desde este proyecto.
 */
export const RemotionRoot: React.FC = () => (
  <Composition id="StyleCheck" component={StyleCheck} durationInFrames={90} fps={30} width={1080} height={1920} />
);
