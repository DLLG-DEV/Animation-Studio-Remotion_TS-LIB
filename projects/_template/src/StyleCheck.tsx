import { AbsoluteFill } from "remotion";
import { getStyle } from "@styles/registry";
import { CameraMovement, ParallaxLayer } from "@engine/components/CameraMovement";
import { Scene } from "@engine/components/Scene";
import { CitySky, CityFar, CityStreet, GH, HandDrawnText } from "@styles/GRAPHITE_HORROR_01";

// El estilo se elige por su identificador: cambiar el ID cambia todo el aspecto global.
const style = getStyle("GRAPHITE_HORROR_01");

export const StyleCheck: React.FC = () => (
  <style.Frame>
    <Scene background={GH.palette.paper}>
      <CameraMovement keys={[{ at: 0, zoom: 1.05 }, { at: 90, zoom: 1.12 }]} shake={{ amplitude: 3 }}>
        <ParallaxLayer depth={0.3}>
          <CitySky t0={0} />
        </ParallaxLayer>
        <ParallaxLayer depth={0.6}>
          <CityFar t0={0} />
        </ParallaxLayer>
        <ParallaxLayer depth={1.2}>
          <CityStreet t0={10} />
        </ParallaxLayer>
      </CameraMovement>
      <AbsoluteFill style={{ alignItems: "flex-start", paddingTop: 210, paddingLeft: 80 }}>
        <HandDrawnText text={"PLANTILLA\nOK"} fontSize={66} color={GH.palette.paperLight} write={[20, 50]} />
      </AbsoluteFill>
    </Scene>
    <style.Subtitles cues={[{ start: 1, end: 3, text: "La biblioteca funciona desde otro proyecto." }]} />
  </style.Frame>
);
