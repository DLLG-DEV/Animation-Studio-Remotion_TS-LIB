# GRAPHITE_HORROR_01 — Terror cinematográfico a lápiz

> Biblia artística del estilo. Los valores numéricos viven en `style.json` (fuente única);
> este documento explica el **por qué** y las reglas de dirección.

## Descripción artística

Una película animada **dibujada a grafito sobre papel**. Cada fotograma parece una hoja distinta:
los trazos tiemblan ("line boil"), el papel cambia levemente, el polvo aparece y desaparece.
La luz no se pinta: **la luz es el papel que el dibujante dejó sin tocar** o que levantó con la goma.
El miedo nace del contraste extremo, de siluetas que no deberían estar ahí y de la quietud que
precede a un golpe.

No es una foto con filtro: todo se construye con trazos, rayado cruzado y grafito frotado.

## Referencias visuales (conceptuales)

- Ilustración a grafito de libros de terror clásicos: rayado cruzado denso, siluetas.
- Animación tradicional a lápiz: trazos que hierven entre dibujos, animación "en tres".
- Grabado y cómic de horror en blanco y negro: negros absolutos, contraste extremo.
- Expresionismo alemán: perspectivas forzadas, arquitectura opresiva, sombras alargadas.
- Storyboards a lápiz de cine de suspenso.

## Paleta

Monocroma con el tono cálido del papel. **Ningún otro color.**

| Token | Hex | Uso |
|---|---|---|
| `paper` | `#e9e3d5` | Fondo / luz |
| `paperLight` | `#f3eee3` | Brillos, luz directa, textos sobre oscuro |
| `paperShadow` | `#cdc4b1` | Papel en penumbra |
| `graphite100…900` | `#b9b4aa → #151413` | Escala de tonos del lápiz |
| `ink` | `#0b0a09` | Negro absoluto (siluetas, pupilas, huecos) |
| `eraser` | `#efe9dc` | Marcas de goma (niebla, halos) |

Tono → color: `tone(0..1)` en `tokens.ts`.

## Tipo de ilustración

- **Línea**: irregular, doble pasada, los extremos sobrepasan las esquinas (`overshoot`), presión variable.
- **Sombreado**: rayado cruzado procedural; el número de capas lo decide el tono (regla central):

  | Tono | Capas | Aspecto |
  |---|---|---|
  | < 0.25 | 1 diagonal abierta | penumbra suave |
  | 0.25–0.5 | 2 | sombra media |
  | 0.5–0.75 | 3 + grafito frotado | sombra profunda |
  | ≥ 0.75 | 4 densas + grafito frotado | casi negro |

- **Negros**: `GraphiteFill` (grafito frotado con moteado y diente del papel), nunca un relleno plano.
- **Luz**: papel limpio, `Glow` (grafito levantado) y `EraserMarks` (goma).

## Texturas

- Papel: diente fino (ruido fractal 0.72), manchas de baja frecuencia, fibras muy sutiles.
- Grafito: moteado isótropo + poros del papel; nunca franjas regulares.
- Polvo: motas, pelos y rayones verticales ocasionales que cambian en cada dibujo.
- Hojas: la textura del papel rota entre 3 hojas (variación artesanal entre fotogramas).

## Iluminación

- Una sola fuente dura por plano (luna, farola, puerta al fondo, ventana reflejada en el ojo).
- 60–75 % del encuadre en tonos oscuros. Viñeta irregular fuerte (grafito frotado en los bordes).
- Parpadeo de exposición irregular (`Flicker`) con picos ocasionales; lámparas que fallan.

## Diseño de personajes

- Siluetas alargadas, extremidades finas, brazos hasta las rodillas, dedos largos, cabeza ladeada.
- Sin rasgos, salvo **ojos blancos** (papel) cuando el personaje está cerca: es el momento del susto.
- Contorno garabateado sobre el relleno de grafito; sombra difusa en el suelo.
- Movimiento: inmóviles o **saltos de posición entre parpadeos/apagones**. Nunca caminata fluida.

## Diseño de escenarios

- Perspectiva forzada y puntos de fuga visibles; arquitectura rígida y vacía.
- Mínimo 3 planos (fondo / medio / primer término) para parallax.
- Ventanas encendidas = huecos sin rayar. Niebla = goma. Cielos = rayado + nubes difuminadas.

## Movimiento y velocidad

- **Boil**: los filtros cambian de semilla cada `boilStep = 3` fotogramas (10 dibujos/s).
- **Dibujo progresivo**: contorno primero (0.6–1.5 s), rayado después (0.8–2 s), por pasos de 2–3 fotogramas.
- La cámara nunca está quieta: temblor de mano sutil.
- Los sustos son **cortes o zooms bruscos** (×1.4–3 en 6–10 fotogramas), precedidos de 0.5–1 s de quietud.
- Escena mínima: 3 s.

## Transiciones

| Id | Descripción | Duración |
|---|---|---|
| `graphiteSmear` | Garabatos de lápiz cubren el encuadre y se retiran | 16–24 f |
| `eraserWipe` | Una goma abre la escena siguiente en zigzag | 18–26 f |
| `flickerCut` | Corte estroboscópico escena / negro / escena nueva | 8–14 f |

Además: apagones dentro de la escena (negro 4–8 f) para ocultar saltos de los personajes.

## Efectos de cámara

- Por defecto: push-in lento (zoom 1.00 → 1.12–1.17) + temblor.
- Susto: acercamiento repentino hacia el punto de interés (`origin` en la cabeza / pupila).
- Parallax: profundidades 0.3 / 0.55 / 0.8 / 1.25.
- Alternar planos: general → medio → detalle; nunca dos escenas seguidas con el mismo encuadre.

## Sonido recomendado

- Lápiz rascando papel durante el dibujo; goma/papel en transiciones.
- Drone grave continuo; golpe cinematográfico en sustos y cortes; silencio antes del golpe.
- Mezcla por buses (`style.json → sound.buses`): voz 1.0 · música 0.45 · ambiente 0.5 · sfx 0.7.

## Títulos y subtítulos

- **Títulos**: *Rock Salt*, se escriben letra a letra (`HandDrawnText`), cada letra tiembla con el boil.
  Sobre zonas oscuras, color `paperLight`. Nunca sobre el punto de interés.
- **Subtítulos**: *Special Elite* (máquina de escribir) color papel sobre una mancha de grafito,
  palabra por palabra, máximo 2 líneas, dentro de la zona segura (abajo 380 px, lados 70 px).
- Las fuentes solo incluyen el subconjunto `latin` (cubre á é í ó ú ñ ¿ ¡).

## Componentes reutilizables

Ver `README.md` (uso técnico). Resumen: `GraphiteFrame`, `SketchCanvas`, `PencilStroke`,
`PencilDrawing`, `AnimatedSketch`, `CrossHatching`, `RadialHatching`, `StrokeBundle`, `GraphiteFill`,
`EraserMarks`, `Glow`, `GraphiteTexture`, `Vignette`, `Flicker`, `HandDrawnText`, `GraphiteSubtitles`,
transiciones `graphiteSmear` / `eraserWipe` / `flickerCut`, ilustraciones `City*`, `Corridor`, `Figure`, `Eye`.

## Ejemplos de aplicación (demo)

1. **Ciudad oscura** — plano general, push-in con parallax de 5 capas, figura que aparece bajo la farola.
2. **Pasillo** — plano medio en perspectiva de un punto; la figura salta más cerca en cada apagón;
   zoom brusco a su cara.
3. **Ojo** — plano detalle; el iris mira a un lado y al otro, se fija en el espectador, la pupila se
   dilata y la cámara se hunde en ella.

## Prohibido

- Fotografías o imágenes convertidas a escala de grises.
- Degradados lisos sin textura como elemento principal (solo para luz/halos).
- Color. Líneas perfectamente rectas sin temblor. Movimientos suaves en los sustos.

## Versionado

- **v1.0 (19-nov-2026) — versión oficial congelada.** Etiqueta Git: `GRAPHITE_HORROR_01-v1.0`.
- No se hacen cambios grandes sobre esta carpeta. Solo correcciones de errores que no alteren el aspecto.
- Las mejoras visuales se crean como **estilo nuevo** (`styles/GRAPHITE_HORROR_02/`, copiando y
  modificando), registrado aparte en `styles/registry.ts`. Así los videos ya publicados se pueden
  volver a renderizar idénticos.
