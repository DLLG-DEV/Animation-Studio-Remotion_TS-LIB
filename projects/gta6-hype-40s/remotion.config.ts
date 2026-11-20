/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import path from "path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

/**
 * ESTUDIO DE ANIMACIÓN — rutas compartidas.
 * Los comandos de Remotion se ejecutan desde la carpeta del proyecto,
 * así que la raíz del estudio está dos niveles arriba (animaciones/).
 *
 *   @engine/*  -> animaciones/engine/*   (componentes genéricos de animación)
 *   @styles/*  -> animaciones/styles/*   (biblioteca de estilos visuales)
 *   @assets/*  -> animaciones/assets/*   (recursos compartidos: audio, texturas)
 *
 * resolve.modules garantiza que el código fuera del proyecto use las mismas
 * dependencias (una única copia de React / Remotion).
 */
const PROJECT_ROOT = process.cwd();
const STUDIO_ROOT = path.resolve(PROJECT_ROOT, "..", "..");

Config.overrideBundlerConfig((config) => {
  const prevAlias =
    config.resolve && !Array.isArray(config.resolve.alias)
      ? (config.resolve.alias ?? {})
      : {};
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...prevAlias,
        "@engine": path.join(STUDIO_ROOT, "engine"),
        "@styles": path.join(STUDIO_ROOT, "styles"),
        "@assets": path.join(STUDIO_ROOT, "assets"),
      },
      modules: [path.join(PROJECT_ROOT, "node_modules"), "node_modules"],
    },
  };
});
