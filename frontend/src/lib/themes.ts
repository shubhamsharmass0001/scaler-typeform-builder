/**
 * themes.ts — Universal Theme System for Typeform
 *
 * Implements:
 *   - 5 Presets: classic, midnight, sunset, forest, custom
 *   - 6 Curated Google Fonts: Inter, Roboto, Outfit, Playfair Display, Poppins, Space Grotesk
 *   - 6 Built-in gradient backgrounds with data-URIs
 *   - CSS variable mapping for runner, canvas, and preview
 *   - WCAG AA auto-contrast calculation
 *   - Dynamic single-font Google Font loader
 */

import React from "react";
import { FormTheme, ThemePresetName, FontFamilyName, FontScale, ButtonRadius } from "@/types";
export { BUILTIN_LIGHT_BACKGROUNDS } from "./lightBackgrounds";
export type { LightBackgroundPreset } from "./lightBackgrounds";

export const ALLOWED_PRESETS: ThemePresetName[] = [
  "classic",
  "midnight",
  "sunset",
  "forest",
  "custom",
];

export const ALLOWED_FONTS: { id: FontFamilyName; name: string; desc: string; sample: string }[] = [
  { id: "Inter", name: "Inter", desc: "Clean & modern sans-serif", sample: "Aa Bb Gg" },
  { id: "Roboto", name: "Roboto", desc: "Balanced geometric sans", sample: "Aa Bb Gg" },
  { id: "Outfit", name: "Outfit", desc: "Contemporary humanist sans", sample: "Aa Bb Gg" },
  { id: "Playfair Display", name: "Playfair Display", desc: "Editorial high-contrast serif", sample: "Aa Bb Gg" },
  { id: "Poppins", name: "Poppins", desc: "Friendly geometric curves", sample: "Aa Bb Gg" },
  { id: "Space Grotesk", name: "Space Grotesk", desc: "Tech monospace-inspired sans", sample: "Aa Bb Gg" },
];

export const ALLOWED_FONT_SCALES: { id: FontScale; label: string; desc: string }[] = [
  { id: "small", label: "Small", desc: "Compact" },
  { id: "medium", label: "Medium", desc: "Standard" },
  { id: "large", label: "Large", desc: "Spacious" },
];

export const ALLOWED_BUTTON_RADII: { id: ButtonRadius; label: string; style: string }[] = [
  { id: "square", label: "Square", style: "4px" },
  { id: "rounded", label: "Rounded", style: "12px" },
  { id: "pill", label: "Pill", style: "9999px" },
];

export const THEME_PRESETS: Record<ThemePresetName, FormTheme> = {
  classic: {
    preset: "classic",
    backgroundColor: "#FFFFFF",
    backgroundImageUrl: null,
    backgroundOverlay: 0.0,
    questionColor: "#191919",
    answerColor: "#0445AF",
    buttonColor: "#0445AF",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Inter",
    fontScale: "medium",
    buttonRadius: "rounded",
  },
  midnight: {
    preset: "midnight",
    backgroundColor: "#0F172A",
    backgroundImageUrl: null,
    backgroundOverlay: 0.0,
    questionColor: "#F8FAFC",
    answerColor: "#38BDF8",
    buttonColor: "#38BDF8",
    buttonTextColor: "#0F172A",
    fontFamily: "Space Grotesk",
    fontScale: "medium",
    buttonRadius: "pill",
  },
  sunset: {
    preset: "sunset",
    backgroundColor: "#FFF7ED",
    backgroundImageUrl: null,
    backgroundOverlay: 0.0,
    questionColor: "#7C2D12",
    answerColor: "#EA580C",
    buttonColor: "#EA580C",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Poppins",
    fontScale: "medium",
    buttonRadius: "rounded",
  },
  forest: {
    preset: "forest",
    backgroundColor: "#F0FDF4",
    backgroundImageUrl: null,
    backgroundOverlay: 0.0,
    questionColor: "#14532D",
    answerColor: "#16A34A",
    buttonColor: "#15803D",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Outfit",
    fontScale: "medium",
    buttonRadius: "rounded",
  },
  custom: {
    preset: "custom",
    backgroundColor: "#FFFFFF",
    backgroundImageUrl: null,
    backgroundOverlay: 0.0,
    questionColor: "#191919",
    answerColor: "#0445AF",
    buttonColor: "#0445AF",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Inter",
    fontScale: "medium",
    buttonRadius: "rounded",
  },
};

export const BUILTIN_GRADIENTS = [
  {
    id: "aurora",
    name: "Aurora",
    css: "linear-gradient(135deg, #4338ca 0%, #3b82f6 50%, #10b981 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234338ca'/><stop offset='50%25' stop-color='%233b82f6'/><stop offset='100%25' stop-color='%2310b981'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    css: "linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23f43f5e'/><stop offset='50%25' stop-color='%23fb923c'/><stop offset='100%25' stop-color='%23facc15'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
  {
    id: "cosmic-noir",
    name: "Cosmic Noir",
    css: "linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #311042 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23090d16'/><stop offset='50%25' stop-color='%231e1b4b'/><stop offset='100%25' stop-color='%23311042'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    css: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%2306b6d4'/><stop offset='50%25' stop-color='%233b82f6'/><stop offset='100%25' stop-color='%236366f1'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
  {
    id: "emerald-mist",
    name: "Emerald Mist",
    css: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23064e3b'/><stop offset='50%25' stop-color='%23047857'/><stop offset='100%25' stop-color='%2310b981'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
  {
    id: "soft-lavender",
    name: "Soft Lavender",
    css: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fae8ff 100%)",
    dataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23f5f3ff'/><stop offset='50%25' stop-color='%23ede9fe'/><stop offset='100%25' stop-color='%23fae8ff'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>",
  },
];

/**
 * Normalizes raw/legacy/partial theme objects into a strictly typed FormTheme.
 */
export function normalizeTheme(raw?: Partial<FormTheme> | null): FormTheme {
  const classic = THEME_PRESETS.classic;
  if (!raw || typeof raw !== "object") {
    return { ...classic };
  }

  const rawPreset = (raw.preset as ThemePresetName) || "classic";
  const base = THEME_PRESETS[rawPreset] || classic;

  const fontFam = (raw.fontFamily as FontFamilyName) || base.fontFamily;
  const validFont = ALLOWED_FONTS.some((f) => f.id === fontFam) ? fontFam : "Inter";

  const fontSc = (raw.fontScale as FontScale) || base.fontScale;
  const validScale = ALLOWED_FONT_SCALES.some((s) => s.id === fontSc) ? fontSc : "medium";

  const btnRad = (raw.buttonRadius as ButtonRadius) || base.buttonRadius;
  const validRadius = ALLOWED_BUTTON_RADII.some((r) => r.id === btnRad) ? btnRad : "rounded";

  let overlay = typeof raw.backgroundOverlay === "number" ? raw.backgroundOverlay : base.backgroundOverlay;
  if (isNaN(overlay)) overlay = 0.0;
  overlay = Math.max(0.0, Math.min(0.8, overlay));

  return {
    preset: ALLOWED_PRESETS.includes(rawPreset) ? rawPreset : "custom",
    backgroundColor: raw.backgroundColor || base.backgroundColor,
    backgroundImageUrl: raw.backgroundImageUrl || null,
    backgroundOverlay: overlay,
    questionColor: raw.questionColor || raw.textColor || base.questionColor,
    answerColor: raw.answerColor || raw.buttonColor || base.answerColor,
    buttonColor: raw.buttonColor || base.buttonColor,
    buttonTextColor: raw.buttonTextColor || base.buttonTextColor,
    fontFamily: validFont,
    fontScale: validScale,
    buttonRadius: validRadius,
  };
}

/**
 * Returns CSS variable mappings applied to the root element.
 * Components read exclusively from these CSS variables.
 */
export function formatBackgroundImageUrl(url?: string | null): string {
  if (!url || url === "none") return "none";
  if (url.startsWith("url(") || url.startsWith("linear-gradient(") || url.startsWith("radial-gradient(")) {
    return url;
  }
  return `url("${url}")`;
}

export function getThemeStyles(theme?: Partial<FormTheme> | null): React.CSSProperties {
  const t = normalizeTheme(theme);

  const radiusMap: Record<ButtonRadius, string> = {
    square: "4px",
    rounded: "12px",
    pill: "9999px",
  };

  const scaleMap: Record<FontScale, { scale: string; title: string; desc: string }> = {
    small: { scale: "0.92", title: "1.375rem", desc: "0.875rem" },
    medium: { scale: "1", title: "1.75rem", desc: "1rem" },
    large: { scale: "1.14", title: "2.125rem", desc: "1.125rem" },
  };

  const scaleConf = scaleMap[t.fontScale] || scaleMap.medium;

  return {
    "--theme-bg": t.backgroundColor,
    "--theme-question": t.questionColor,
    "--theme-answer": t.answerColor,
    "--theme-btn-bg": t.buttonColor,
    "--theme-btn-text": t.buttonTextColor,
    "--theme-font": `"${t.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    "--theme-btn-radius": radiusMap[t.buttonRadius] || "12px",
    "--theme-font-scale": scaleConf.scale,
    "--theme-title-size": scaleConf.title,
    "--theme-desc-size": scaleConf.desc,
    "--theme-bg-overlay": `rgba(0, 0, 0, ${t.backgroundOverlay})`,
    "--theme-bg-image": formatBackgroundImageUrl(t.backgroundImageUrl),
  } as React.CSSProperties;
}

/**
 * Returns Google Fonts CSS URL for only the selected font.
 */
export function getGoogleFontUrl(fontFamily: string): string | null {
  const queryMap: Record<string, string> = {
    "Inter": "Inter:wght@400;500;600;700",
    "Roboto": "Roboto:wght@400;500;700",
    "Outfit": "Outfit:wght@400;500;600;700",
    "Playfair Display": "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400",
    "Poppins": "Poppins:wght@400;500;600;700",
    "Space Grotesk": "Space+Grotesk:wght@400;500;600;700",
  };
  const fontParam = queryMap[fontFamily];
  return fontParam ? `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap` : null;
}

/**
 * Component that dynamically requests only the active font from Google Fonts.
 */
export function ThemeFontLoader({ fontFamily }: { fontFamily?: string }) {
  const url = getGoogleFontUrl(fontFamily || "Inter");
  if (!url) return null;
  return React.createElement("link", {
    key: fontFamily || "Inter",
    rel: "stylesheet",
    href: url,
  });
}

// -----------------------------------------------------------------------------
// WCAG AA Contrast Calculation
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 21;
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  passesAa: boolean;
  passesAaLarge: boolean;
}

export function checkWcagContrast(bgHex: string, textHex: string): ContrastResult {
  const ratio = Math.round(getContrastRatio(bgHex, textHex) * 10) / 10;
  return {
    ratio,
    passesAa: ratio >= 4.5,
    passesAaLarge: ratio >= 3.0,
  };
}
