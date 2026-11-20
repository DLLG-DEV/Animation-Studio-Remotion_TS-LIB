# engine — componentes de animación independientes del estilo

| Archivo | Exporta | Para qué |
|---|---|---|
| `lib/random.ts` | `createRng`, `rand01`, `noise1D`, `steppedFrame`, `hashString` | Aleatoriedad determinista (nunca `Math.random`) |
| `lib/timing.ts` | `progressBetween`, `EASE`, `sec` | Curvas y conversión de tiempos |
| `components/CameraMovement.tsx` | `CameraMovement`, `ParallaxLayer`, `useCamera`, `sampleCamera` | Cámara por fotogramas clave + temblor + parallax |
| `components/Scene.tsx` | `Scene` | Contenedor opaco de escena con fundidos opcionales |
| `components/Subtitles.tsx` | `Subtitles`, `splitWords` | Temporización de subtítulos; el aspecto lo pone el estilo (`renderCue`) |
| `components/AudioController.tsx` | `AudioController` | Mezcla por pistas y buses; slots vacíos reservados |
| `types/assets.d.ts` | — | Importación de `.wav/.mp3/.png/.jpg` vía bundler |

Regla: `engine/` nunca importa de `styles/` ni de `projects/`.

```tsx
<CameraMovement
  keys={[{ at: 0, zoom: 1 }, { at: 120, zoom: 1.15, x: -30, ease: EASE.cinematic }, { at: 128, zoom: 2, ease: EASE.snap }]}
  shake={{ amplitude: 4, rotation: 0.2, frequency: 0.7 }}
  origin="50% 30%"
>
  <ParallaxLayer depth={0.3}>{/* fondo */}</ParallaxLayer>
  <ParallaxLayer depth={1.2}>{/* primer término */}</ParallaxLayer>
</CameraMovement>
```
