# Prueba visual — GRAPHITE_HORROR_01

Composición: `GraphiteHorror01-Demo` (proyecto `projects/gta6-hype-40s`, carpeta *Style-Tests* de Studio).
Código: `styles/GRAPHITE_HORROR_01/demo/StyleDemo.tsx`.

| Archivo | Descripción |
|---|---|
| `graphite-horror-01-demo.mp4` | Máster H.264 CRF 18 · 1080×1920 · 30 fps · 518 f (17,28 s) · AAC |
| `graphite-horror-01-demo-preview.mp4` | Versión ligera (≈14 Mbps) para revisar/compartir |
| `storyboard/` | Fotogramas clave extraídos del máster |
| `stills/` | Iteraciones de control de calidad (v1 → v4) |

## Contenido

| Tiempo | Escena | Plano / cámara | Elementos del estilo |
|---|---|---|---|
| 0,0–5,5 s | Ciudad oscura | General · push-in + parallax 5 capas | rayado de cielo, luna con halo, nubes difuminadas, edificios con ventanas-papel, farola, niebla de goma, figura, título rotulado |
| 4,8–5,5 s | → | `graphiteSmear` | garabatos de lápiz |
| 4,8–10,3 s | Pasillo | Medio · perspectiva 1 punto → zoom brusco | rayado en perspectiva, máscara de oscuridad, figura que salta en cada apagón, lámpara que falla, ojos blancos |
| 9,7–10,3 s | → | `eraserWipe` | goma en zigzag |
| 9,7–15,2 s | Ojo | Detalle · push-in → hundimiento en la pupila | iris radial, pestañas, ceja, venas, sombra del párpado, pupila que se dilata, mirada que se mueve |
| 14,8–15,2 s | → | `flickerCut` | estroboscópico |
| 14,8–17,3 s | Tarjeta | Plano fijo | título del estilo escrito a mano |

Audio: provisional sintetizado (drone, lápiz, golpes, goma). Slot de voz reservado y vacío.
Nivel medido: pico −2,7 dBFS, RMS −18,3 dBFS, sin saturación.

## Control de calidad realizado

1. `tsc --noEmit` sin errores (proyecto + engine + styles).
2. Stills v1 → v4 revisados. Corregido: franjas del filtro de grafito, falta de negros profundos,
   título sobre la luna, salto de línea en títulos, transición con aspecto de ruido, piel del ojo,
   lámparas detrás de la figura, transparencia de la silueta, fibras de papel con aspecto digital.
3. Duración verificada con ffprobe: 518 fotogramas / 17,28 s.

## Notas técnicas

- Render ≈ 6 min (≈0,7 s/fotograma). El grano animado eleva el bitrate (≈100 Mbps a CRF 18).
  Para redes sociales usar la versión a 14–20 Mbps; las plataformas recomprimen de todos modos.
