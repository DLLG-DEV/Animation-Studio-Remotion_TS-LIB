import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { StyleDemo, DEMO_DURATION } from "@styles/GRAPHITE_HORROR_01/demo/StyleDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      {/* Pruebas de la biblioteca de estilos (no forman parte del video) */}
      <Folder name="Style-Tests">
        <Composition
          id="GraphiteHorror01-Demo"
          component={StyleDemo}
          durationInFrames={DEMO_DURATION}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
