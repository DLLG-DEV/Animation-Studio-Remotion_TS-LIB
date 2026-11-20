import { loadFont as loadRockSalt } from "@remotion/google-fonts/RockSalt";
import { loadFont as loadSpecialElite } from "@remotion/google-fonts/SpecialElite";

// Fuentes del estilo (Google Fonts, licencia OFL). Incluyen acentos y ñ.
export const titleFont = loadRockSalt("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const subtitleFont = loadSpecialElite("normal", { weights: ["400"], subsets: ["latin"] })
  .fontFamily;
