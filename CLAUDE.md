# ESTUDIO DE ANIMACIÓN — Instrucciones permanentes

Estudio local de cortos animados con **Remotion + React + TypeScript**, operado con Claude Code.
Objetivo: una biblioteca permanente de estilos, componentes y recursos reutilizables entre videos.
Idioma de trabajo y de los videos: **español** (latinoamericano / mexicano salvo indicación).

## Estructura (separación estricta)

| Carpeta | Contenido | Regla |
|---|---|---|
| `styles/<ID>/` | **Biblioteca artística**: reglas (`STYLE.md`, `style.json`), texturas, filtros, componentes e ilustraciones de UN estilo | Nunca contiene lógica de un video concreto |
| `styles/registry.ts` | Registro de estilos por identificador (`getStyle("GRAPHITE_HORROR_01")`) | Todo estilo nuevo se registra aquí |
| `engine/` | **Componentes de animación** independientes del estilo: cámara, parallax, escena, subtítulos, audio, aleatoriedad determinista | Nunca importa nada de `styles/` |
| `projects/<nombre>/` | **Proyectos individuales**: proyecto Remotion con su guion, escenas, configuración y recursos propios | Solo importa de `@engine`, `@styles`, `@assets` |
| `projects/_template/` | Plantilla para proyectos nuevos (copiar, `npm i`) | Mantenerla al día con la configuración vigente |
| `assets/` | **Recursos compartidos** (audio, fuentes, imágenes) entre proyectos | Indicar licencia / origen de cada recurso |
| `outputs/<nombre>/` | **Videos terminados**, renders de prueba, miniaturas, storyboards | Nunca guardar renders en `node_modules`, `out/` ni temporales |
| `outputs/style-tests/<ID>/` | Pruebas visuales de cada estilo | |
| `references/` | Referencias visuales y documentación | |
| `.venv/` | Python auxiliar (solo biblioteca estándar salvo autorización) | |

`gta-animation/` es un proyecto antiguo e independiente: **no se toca, no se mueve, no se usa, no se
importa nada de él** y está excluido de Git. `_archive/` guarda respaldos locales (excluido de Git).

## Control de versiones

Repositorio Git en la raíz `animaciones/` (rama `main`). Se versiona código, estilos, engine, assets
ligeros, documentación y storyboards. Se excluyen dependencias, cachés, `.venv`, renders pesados
(`outputs/**/*.mp4`, `stills/`, `renders/`), `gta-animation/` y `_archive/`. Ver `.gitignore`.
Estilos estables se etiquetan (`<ID>-vX.Y`); una versión congelada no se modifica: las mejoras van en
un estilo nuevo (`<NOMBRE>_02`). Confirmar con el usuario antes de hacer commit/push.

## Cómo un proyecto usa la biblioteca

Cada proyecto Remotion en `projects/<nombre>/` necesita (ver `projects/gta6-hype-40s/` como plantilla):

- `remotion.config.ts` → `Config.overrideBundlerConfig` con alias `@engine`, `@styles`, `@assets`
  y `resolve.modules` apuntando al `node_modules` del proyecto (una sola copia de React/Remotion).
- `tsconfig.json` → `paths` para los mismos alias, `include` de `../../engine` y `../../styles`,
  `resolveJsonModule: true`.
- Dependencias: `remotion`, `@remotion/cli`, `@remotion/transitions`, `@remotion/google-fonts`,
  `@remotion/media` en **la misma versión** (instalar con `npx remotion add <paquete>`).

```tsx
import { getStyle } from "@styles/registry";
import { CameraMovement, ParallaxLayer } from "@engine/components/CameraMovement";
import { CitySky, CrossHatching, HandDrawnText } from "@styles/GRAPHITE_HORROR_01";
const style = getStyle("GRAPHITE_HORROR_01");
// <style.Frame> envuelve TODO el video una vez; las transiciones están en style.transitions
```

## Reglas de trabajo

1. Inspeccionar antes de modificar. No sobrescribir archivos sin revisarlos. Respetar cambios del usuario.
2. No reinstalar Node, npm, Python ni Claude Code. No duplicar dependencias.
3. Trabajar por etapas, explicar cada etapa y **pedir autorización** para instalaciones,
   servicios externos o de pago, y decisiones artísticas importantes.
4. Verificar resultados antes de avanzar: `npx tsc --noEmit`, stills de fotogramas clave, revisión visual.
5. Renderizar solo cuando se pide o como parte del control de calidad acordado.
6. Datos de los videos: **verificar con fuentes**; no inventar filtraciones, fechas ni características;
   distinguir información oficial de expectativas.

## Reglas técnicas de Remotion

- Animar SOLO con `useCurrentFrame()` + `interpolate()`/`Easing`. Nada de CSS `transition`/`animation`.
- Prohibido `Math.random()`: usar `createRng(seed)` / `rand01(seed)` de `@engine/lib/random`.
- Tiempos en fotogramas derivados de `fps`. Escenas con `TransitionSeries` (restar solapes al total).
- Formato vertical por defecto: 1080×1920, 30 fps. Zona segura: arriba 180 px, abajo 380 px, lados 70 px.
- Audio con `<AudioController>` (slots por pista; un slot sin `src` queda reservado).

## Comandos (desde `projects/<nombre>/`)

```bash
npx remotion studio                       # vista previa
npx tsc --noEmit                          # verificación de tipos (incluye engine/ y styles/)
npx remotion still <ID> <salida.png> --frame=<n>
npx remotion render <ID> ../../outputs/<nombre>/video.mp4 --codec=h264 --crf=18
```

FFmpeg/FFprobe: usar los que trae Remotion en
`node_modules/@remotion/compositor-win32-x64-msvc/` (no hay ffmpeg en el PATH; es una
compilación reducida: sin `volumedetect`, `framestep`, etc.).

## Añadir un estilo nuevo

Ver `styles/README.md`. Resumen: carpeta `styles/<ID>/` con `style.json`, `STYLE.md`, `README.md`,
`index.ts` (exporta el descriptor `{ id, spec, Frame, Subtitles, transitions }`), componentes propios,
demo en `demo/`, registro en `styles/registry.ts` y prueba en `outputs/style-tests/<ID>/`.

## Estilos disponibles

- `GRAPHITE_HORROR_01` — Terror cinematográfico a lápiz (`styles/GRAPHITE_HORROR_01/STYLE.md`).
