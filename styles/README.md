# Biblioteca de estilos

Cada estilo es una carpeta independiente identificada por un **ID único en MAYÚSCULAS**
(`NOMBRE_TEMA_NN`). Los estilos no dependen entre sí ni de ningún proyecto.

| ID | Nombre | Estado |
|---|---|---|
| `GRAPHITE_HORROR_01` | Terror cinematográfico a lápiz | ✅ v1.0 |

Ideas futuras: `COMIC_INK_01`, `INK_DRAWING_01`, `WATERCOLOR_01`, `FLAT_2D_01`, `VHS_RETRO_01`,
`PIXEL_ART_01`, `CINEMATIC_3D_01`.

## Contrato de un estilo

```
styles/<ID>/
├── style.json      # obligatorio: id, name, description, references, palette, illustration,
│                   # textures, lighting, characters, environments, motion, speed, camera,
│                   # transitions, sound, typography, components, examples
├── STYLE.md        # biblia artística (por qué y reglas de dirección)
├── README.md       # guía técnica de uso
├── tokens.ts       # tokens tipados leídos de style.json
├── index.ts        # exporta componentes + descriptor { id, spec, Frame, Subtitles, transitions }
├── components/     # componentes propios del estilo
├── transitions/    # presentaciones de @remotion/transitions
├── illustrations/  # dibujos reutilizables (opcional)
└── demo/           # composición de prueba
```

Registrar en `styles/registry.ts`, añadir la composición de demo en un proyecto
(carpeta `Style-Tests` del Root) y guardar la prueba en `outputs/style-tests/<ID>/`.

Los estilos usan `@engine/*` para cámara, escenas, subtítulos, audio y aleatoriedad;
nunca reimplementan esas piezas.
