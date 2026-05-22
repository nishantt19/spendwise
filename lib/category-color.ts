/**
 * Converts a hex color to OKLCh components.
 * Returns null for invalid/short hex strings.
 */
function hexToOklch(hex: string): { l: number; c: number; h: number } | null {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const lms_l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const lms_m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const lms_s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * lms_l + 0.7936177850 * lms_m - 0.0040720468 * lms_s;
  const a = 1.9779984951 * lms_l - 2.4285922050 * lms_m + 0.4505937099 * lms_s;
  const bv = 0.0259040371 * lms_l + 0.7827717662 * lms_m - 0.8086757660 * lms_s;

  const C = Math.sqrt(a * a + bv * bv);
  const H = Math.atan2(bv, a) * (180 / Math.PI);

  return { l: L, c: C, h: H < 0 ? H + 360 : H };
}

/**
 * Returns a theme-appropriate CSS color string for a category hex color.
 *
 * - Light theme: darkened to L≈0.38 so it reads on white backgrounds
 * - Dark theme:  lightened to L≈0.72 so it reads on dark backgrounds
 *
 * Falls back to the original hex if parsing fails.
 */
export function getCategoryColor(hex: string, isDark: boolean): string {
  const oklch = hexToOklch(hex);
  if (!oklch) return hex;

  const l = isDark ? 0.72 : 0.52;
  return `oklch(${l} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`;
}

/**
 * Returns a subtle tinted background for category icons/badges.
 * Uses a low-opacity mix so the tint works in both themes.
 */
export function getCategoryBg(hex: string, isDark: boolean): string {
  const color = getCategoryColor(hex, isDark);
  return `color-mix(in oklch, ${color} 14%, var(--muted))`;
}
