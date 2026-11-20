# GRAPHITE_HORROR_01 — Guía técnica

Reglas artísticas: [`STYLE.md`](./STYLE.md) · Valores: [`style.json`](./style.json)

## Estructura

```
GRAPHITE_HORROR_01/
├── style.json            # especificación (fuente única de valores)
├── STYLE.md              # biblia artística
├── tokens.ts             # tokens tipados + tone(0..1)
├── fonts.ts              # Rock Salt (títulos), Special Elite (subtítulos)
├── index.ts              # exporta todo + descriptor GRAPHITE_HORROR_01
├── lib/
│   ├── geometry.ts       # trazos a mano: roughPath, roughPasses, smoothPath, quadPts, curlD…
│   └── hatch.ts          # rayado: hatchSegments, radialSegments, layersForTone
├── components/
│   ├── SketchCanvas.tsx  # lienzo SVG + contexto de boil + filtros (pencil/graphite/smudge/eraser)
│   ├── PencilDrawing.tsx # PencilStroke, PencilDrawing, AnimatedSketch, useDrawProgress
│   ├── CrossHatching.tsx # CrossHatching, RadialHatching, StrokeBundle
│   ├── GraphiteFill.tsx  # GraphiteFill (negros), EraserMarks (goma)
│   ├── GraphiteTexture.tsx # GraphiteTexture, Vignette, Flicker, flickerAmount, GraphiteFrame
│   ├── HandDrawnText.tsx # títulos rotulados a lápiz
│   └── GraphiteSubtitles.tsx
├── transitions/index.tsx # graphiteSmear, eraserWipe, flickerCut
├── illustrations/        # City (Sky/Far/Mid/Street/Fog + Glow), Corridor, Figure, Eye
└── demo/StyleDemo.tsx    # prueba visual (composición "GraphiteHorror01-Demo")
```

## Uso mínimo

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { CameraMovement } from "@engine/components/CameraMovement";
import { Scene } from "@engine/components/Scene";
import {
  GH, GraphiteFrame, GraphiteSubtitles, SketchCanvas, AnimatedSketch,
  PencilStroke, CrossHatching, GraphiteFill, graphiteSmear,
} from "@styles/GRAPHITE_HORROR_01";

export const Video = () => (
  <GraphiteFrame>                                  {/* UNA vez, envuelve todo */}
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={150}>
        <Scene background={GH.palette.paper}>
          <CameraMovement keys={[{ at: 0, zoom: 1 }, { at: 150, zoom: 1.12 }]} shake={{ amplitude: 3 }}>
            <SketchCanvas seed="mi-escena">
              <CrossHatching seed="cielo" tone={0.9} draw={[0, 40]} />
              <AnimatedSketch seed="lineas">
                <PencilStroke points={[[100, 1400], [980, 1380]]} seed="horizonte" width={4} draw={[10, 30]} />
              </AnimatedSketch>
              <GraphiteFill seed="sombra" d="M0 1500H1080V1920H0Z" tone={1} draw={[20, 45]} />
            </SketchCanvas>
          </CameraMovement>
        </Scene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={graphiteSmear()} timing={linearTiming({ durationInFrames: 20 })} />
      {/* … */}
    </TransitionSeries>
    <GraphiteSubtitles cues={[{ start: 0.5, end: 4, text: "Hola" }]} />
  </GraphiteFrame>
);
```

## Conceptos clave

- **Lienzo**: todo dibujo vive en `<SketchCanvas>` (viewBox 1080×1920 por defecto).
- **Ventanas de dibujo** `draw={[inicio, fin]}` en fotogramas locales de la escena: el elemento se
  dibuja progresivamente "a saltos" (`drawStep`/`hatchDrawStep`). Sin `draw` aparece completo.
- **Filtros**: agrupa elementos en `<AnimatedSketch>` (un filtro por grupo; más rápido). `CrossHatching`
  trae su propio filtro; usa `filtered={false}` si ya está dentro de un `AnimatedSketch`.
- **Semillas**: cada elemento necesita `seed` única y estable. Misma semilla = mismo dibujo.
- **Tono**: `tone` 0..1 en `CrossHatching`, `GraphiteFill`, `PencilStroke`. `underlay` controla el
  grafito frotado bajo el rayado (por defecto `(tone-0.5)*1.05`).
- **Recortes**: `clip` acepta cualquier path; `clipRule="evenodd"` para agujeros (ventanas encendidas,
  luna, conos de luz).
- **Profundidad**: usa `ParallaxLayer` (engine) con una ilustración por capa.

## Rendimiento

- Cada filtro calcula ruido a pantalla completa: agrupa en pocos `AnimatedSketch` por capa.
- El rayado se memoiza por valor; no generes geometría dentro del render sin `useMemo`.
- Referencia: ~0,7 s/fotograma a 1080×1920 (demo de 518 f ≈ 6 min).
- **Peso de archivo**: el grano animado eleva mucho el bitrate (CRF 18 ≈ 100 Mbps).
  Para entregar a redes: re-codificar a 14–20 Mbps (ver README de outputs).

## Pendiente / ideas

- Variante `GRAPHITE_HORROR_01` "día" (menos viñeta) para escenas expositivas.
- Más ilustraciones: multitudes, vehículos, pantallas, periódicos (necesarias para el video de GTA VI).
