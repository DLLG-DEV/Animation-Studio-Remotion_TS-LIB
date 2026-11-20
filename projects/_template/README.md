# Plantilla de proyecto

Copia esta carpeta para empezar un video nuevo:

```bash
# desde animaciones/projects/
cp -r _template mi-video
cd mi-video
# editar "name" en package.json
npm i
npx remotion browser ensure
npx tsc --noEmit
npx remotion studio
```

Ya incluye la configuración para usar la biblioteca compartida:

- `remotion.config.ts` → alias `@engine`, `@styles`, `@assets` (rutas `../../`), una sola copia de React.
- `tsconfig.json` → los mismos alias para TypeScript.
- `package.json` → `remotion`, `@remotion/cli`, `@remotion/transitions`, `@remotion/google-fonts`,
  `@remotion/media` en la misma versión. Para paquetes nuevos: `npx remotion add <paquete>`.

`src/StyleCheck.tsx` es una composición de comprobación (estilo elegido por ID con `getStyle`).
Sustitúyela por las escenas del proyecto. Cada proyecto tiene su guion, escenas y configuración
propios; los renders van a `../../outputs/<nombre-del-proyecto>/`.
