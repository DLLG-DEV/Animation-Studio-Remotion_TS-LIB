# assets — recursos compartidos

Se importan desde los proyectos con el alias `@assets/...` (el bundler los convierte en URL):

```tsx
import drone from "@assets/audio/placeholder/ambient-drone.wav";
```

| Ruta | Contenido | Origen / licencia |
|---|---|---|
| `audio/placeholder/ambient-drone.wav` | Drone grave 45 s | Sintetizado localmente (`generate_placeholder_audio.py`), libre |
| `audio/placeholder/pencil-scratch.wav` | Lápiz rascando 4 s (loop) | Sintetizado localmente, libre |
| `audio/placeholder/hit-boom.wav` | Golpe cinematográfico 2,6 s | Sintetizado localmente, libre |
| `audio/placeholder/eraser-swish.wav` | Goma / roce 0,9 s | Sintetizado localmente, libre |

Los audios `placeholder/` son **provisionales** para pruebas; sustituir por audio definitivo.
Regenerar: `.venv\Scripts\python.exe assets\audio\placeholder\generate_placeholder_audio.py`
(desde `animaciones/`, solo biblioteca estándar).

Todo recurso nuevo debe indicar su origen y licencia en esta tabla.
