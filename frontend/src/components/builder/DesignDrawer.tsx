"use client";

/**
 * components/builder/DesignDrawer.tsx — Typeform-fidelity Theme & Design Customization Drawer
 *
 * Implements:
 *   - 5 Preset thumbnails row (classic, midnight, sunset, forest, custom)
 *   - "Reset to preset" action button
 *   - Colors section: background, question, answer/accent, button, button text
 *   - Typography section: 6 curated Google fonts + font scale (small/medium/large)
 *   - Buttons section: button radius (square, rounded, pill) + live preview
 *   - Background section: image URL / file upload, 6 built-in gradients, overlay slider (0..0.8)
 *   - Auto-contrast WCAG AA warning badge
 *   - Instant optimistic canvas update + debounced autosave
 */

import React, { useState, useId } from "react";
import {
  X,
  Palette,
  Check,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { FormTheme, ThemePresetName, FontFamilyName, FontScale, ButtonRadius } from "@/types";
import {
  THEME_PRESETS,
  ALLOWED_FONTS,
  ALLOWED_FONT_SCALES,
  ALLOWED_BUTTON_RADII,
  BUILTIN_GRADIENTS,
  normalizeTheme,
  checkWcagContrast,
} from "@/lib/themes";

interface DesignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesignDrawer({ isOpen, onClose }: DesignDrawerProps) {
  const { state, updateFormMeta } = useBuilderStore();
  const theme: FormTheme = normalizeTheme(state.form?.theme);
  const fileInputId = useId();

  const [activeSection, setActiveSection] = useState<"all" | "presets" | "colors" | "fonts" | "buttons" | "background">("all");
  const [customImageUrl, setCustomImageUrl] = useState("");

  if (!isOpen) return null;

  const handleUpdateTheme = (patch: Partial<FormTheme>) => {
    const updated = normalizeTheme({
      ...theme,
      ...patch,
    });
    updateFormMeta({ theme: updated });
  };

  const handleSelectPreset = (presetName: ThemePresetName) => {
    const base = THEME_PRESETS[presetName];
    if (base) {
      updateFormMeta({ theme: { ...base } });
    }
  };

  const handleResetToPreset = () => {
    const base = THEME_PRESETS[theme.preset] || THEME_PRESETS.classic;
    updateFormMeta({ theme: { ...base } });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleUpdateTheme({ backgroundImageUrl: reader.result, preset: "custom" });
      }
    };
    reader.readAsDataURL(file);
  };

  // WCAG Contrast Checks
  const textContrast = checkWcagContrast(theme.backgroundColor, theme.questionColor);
  const btnContrast = checkWcagContrast(theme.buttonColor, theme.buttonTextColor);
  const hasContrastWarning = !textContrast.passesAa || !btnContrast.passesAa;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Design and theme editor"
      className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-drawer border-l border-default text-primary shadow-drawer flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* 1. Drawer Header */}
        <div className="h-14 px-5 border-b border-default flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-primary">Design & Theme</h3>
              <p className="text-nano text-secondary">Live styling across form</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToPreset}
              title="Reset to current preset defaults"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-micro font-semibold text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer border border-default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to preset</span>
            </button>
            <button
              type="button"
              data-testid="close-design-drawer"
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Contrast Warning Banner */}
          {hasContrastWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-micro">
                <div className="font-semibold text-amber-800 dark:text-amber-200">WCAG AA Contrast Warning</div>
                {!textContrast.passesAa && (
                  <p className="leading-snug">
                    Question text ratio ({textContrast.ratio}:1) is below recommended 4.5:1.
                  </p>
                )}
                {!btnContrast.passesAa && (
                  <p className="leading-snug">
                    Button text ratio ({btnContrast.ratio}:1) is below recommended 4.5:1.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contrast Success Badge if passing */}
          {!hasContrastWarning && (
            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-micro text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>WCAG AA Contrast Passed: Text is easily legible ({textContrast.ratio}:1)</span>
            </div>
          )}

          {/* Section: Presets Thumbnails Row */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Theme Presets
              </label>
              <span className="text-nano text-secondary">
                {theme.preset === "custom" ? "Customized" : `Active: ${theme.preset}`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(["classic", "midnight", "sunset", "forest"] as ThemePresetName[]).map((pName) => {
                const presetConf = THEME_PRESETS[pName];
                const isSelected = theme.preset === pName;

                return (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => handleSelectPreset(pName)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-xs bg-surface-hover"
                        : "border-default hover:border-focus bg-surface"
                    }`}
                  >
                    {/* Visual Card Preview */}
                    <div
                      className="w-full h-14 rounded-lg border border-black/10 flex flex-col justify-between p-1.5 shadow-2xs relative overflow-hidden"
                      style={{ backgroundColor: presetConf.backgroundColor }}
                    >
                      {/* Fake question bar */}
                      <div
                        className="w-3/4 h-1.5 rounded-full"
                        style={{ backgroundColor: presetConf.questionColor }}
                      />
                      {/* Fake answer indicator */}
                      <div
                        className="w-1/2 h-1 rounded-full opacity-60"
                        style={{ backgroundColor: presetConf.answerColor }}
                      />
                      {/* Fake button */}
                      <div
                        className="self-end px-1.5 py-0.5 rounded text-nano font-bold"
                        style={{
                          backgroundColor: presetConf.buttonColor,
                          color: presetConf.buttonTextColor,
                        }}
                      >
                        OK
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <span className="mt-1.5 text-micro font-semibold text-primary capitalize">
                      {pName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-default" />

          {/* Section: Colors */}
          <div className="space-y-3.5">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider">
              Colors
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Background Color */}
              <div className="space-y-1.5 p-2.5 rounded-xl border border-default bg-surface">
                <span className="block text-micro font-semibold text-primary">Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value, preset: "custom" })}
                    className="w-7 h-7 rounded-lg border border-default cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value, preset: "custom" })}
                    className="w-full text-xs font-mono bg-input text-primary px-2 py-1 rounded-md border border-default focus:outline-none focus:border-focus"
                  />
                </div>
              </div>

              {/* Question Text Color */}
              <div className="space-y-1.5 p-2.5 rounded-xl border border-default bg-surface">
                <span className="block text-micro font-semibold text-primary">Question text</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.questionColor}
                    onChange={(e) => handleUpdateTheme({ questionColor: e.target.value, preset: "custom" })}
                    className="w-7 h-7 rounded-lg border border-default cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.questionColor}
                    onChange={(e) => handleUpdateTheme({ questionColor: e.target.value, preset: "custom" })}
                    className="w-full text-xs font-mono bg-input text-primary px-2 py-1 rounded-md border border-default focus:outline-none focus:border-focus"
                  />
                </div>
              </div>

              {/* Answer & Accent Color */}
              <div className="space-y-1.5 p-2.5 rounded-xl border border-default bg-surface">
                <span className="block text-micro font-semibold text-primary">Answer / Accent</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.answerColor}
                    onChange={(e) => handleUpdateTheme({ answerColor: e.target.value, preset: "custom" })}
                    className="w-7 h-7 rounded-lg border border-default cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.answerColor}
                    onChange={(e) => handleUpdateTheme({ answerColor: e.target.value, preset: "custom" })}
                    className="w-full text-xs font-mono bg-input text-primary px-2 py-1 rounded-md border border-default focus:outline-none focus:border-focus"
                  />
                </div>
              </div>

              {/* Button Color */}
              <div className="space-y-1.5 p-2.5 rounded-xl border border-default bg-surface">
                <span className="block text-micro font-semibold text-primary">Button background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.buttonColor}
                    onChange={(e) => handleUpdateTheme({ buttonColor: e.target.value, preset: "custom" })}
                    className="w-7 h-7 rounded-lg border border-default cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.buttonColor}
                    onChange={(e) => handleUpdateTheme({ buttonColor: e.target.value, preset: "custom" })}
                    className="w-full text-xs font-mono bg-input text-primary px-2 py-1 rounded-md border border-default focus:outline-none focus:border-focus"
                  />
                </div>
              </div>

              {/* Button Text Color */}
              <div className="space-y-1.5 p-2.5 rounded-xl border border-default bg-surface col-span-1 sm:col-span-2">
                <span className="block text-micro font-semibold text-primary">Button text color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.buttonTextColor}
                    onChange={(e) => handleUpdateTheme({ buttonTextColor: e.target.value, preset: "custom" })}
                    className="w-7 h-7 rounded-lg border border-default cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.buttonTextColor}
                    onChange={(e) => handleUpdateTheme({ buttonTextColor: e.target.value, preset: "custom" })}
                    className="w-full text-xs font-mono bg-input text-primary px-2 py-1 rounded-md border border-default focus:outline-none focus:border-focus"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-default" />

          {/* Section: Typography (6 Curated Google Fonts) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Typography
              </label>
              <span className="text-nano text-secondary">6 Google Fonts</span>
            </div>

            {/* Font Family Cards */}
            <div className="grid grid-cols-2 gap-2">
              {ALLOWED_FONTS.map((font) => {
                const isSelected = theme.fontFamily === font.id;

                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleUpdateTheme({ fontFamily: font.id, preset: "custom" })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-default bg-surface hover:border-focus text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold truncate">{font.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>
                    <span
                      className={`text-sm truncate ${isSelected ? "text-white/80" : "text-secondary"}`}
                      style={{ fontFamily: font.name }}
                    >
                      {font.sample}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Font Scale Segmented Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-micro font-semibold text-primary">Font Scale</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-default">
                {ALLOWED_FONT_SCALES.map((s) => {
                  const isSelected = theme.fontScale === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleUpdateTheme({ fontScale: s.id, preset: "custom" })}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-surface text-primary shadow-2xs"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-default" />

          {/* Section: Buttons */}
          <div className="space-y-3.5">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider">
              Button Style
            </label>

            {/* Button Radius Segmented Buttons */}
            <div className="space-y-1.5">
              <span className="block text-micro font-semibold text-primary">Corner Roundness</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-default">
                {ALLOWED_BUTTON_RADII.map((r) => {
                  const isSelected = theme.buttonRadius === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleUpdateTheme({ buttonRadius: r.id, preset: "custom" })}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-surface text-primary shadow-2xs"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Button Preview Card */}
            <div className="p-3 bg-surface rounded-xl border border-default flex items-center justify-between">
              <span className="text-xs text-secondary font-medium">Button Preview</span>
              <div
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                  borderRadius:
                    theme.buttonRadius === "square"
                      ? "4px"
                      : theme.buttonRadius === "pill"
                      ? "9999px"
                      : "12px",
                  fontFamily: theme.fontFamily,
                }}
                className="px-4 py-2 text-xs font-bold shadow-xs select-none"
              >
                Submit ↵
              </div>
            </div>
          </div>

          <hr className="border-default" />

          {/* Section: Background & Media */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Background Imagery & Gradients
              </label>
              {theme.backgroundImageUrl && (
                <button
                  type="button"
                  onClick={() => handleUpdateTheme({ backgroundImageUrl: null, preset: "custom" })}
                  className="text-micro text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove image</span>
                </button>
              )}
            </div>

            {/* 6 Curated Built-in Gradients */}
            <div className="space-y-1.5">
              <span className="block text-micro font-semibold text-primary">
                6 Curated Gradient Presets
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BUILTIN_GRADIENTS.map((g) => {
                  const isSelected = theme.backgroundImageUrl === g.dataUrl;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleUpdateTheme({ backgroundImageUrl: g.dataUrl, preset: "custom" })}
                      style={{ background: g.css }}
                      className={`h-12 rounded-xl border flex items-end p-1.5 transition-transform hover:scale-102 cursor-pointer shadow-2xs relative ${
                        isSelected
                          ? "ring-2 ring-primary border-white"
                          : "border-black/10"
                      }`}
                    >
                      <span className="text-nano font-bold text-white drop-shadow-sm truncate">
                        {g.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-black/60 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Image URL or Upload */}
            <div className="space-y-2 pt-1">
              <span className="block text-micro font-semibold text-primary">
                Custom Image URL / Upload
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://... or paste image URL"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-default bg-input text-primary placeholder:text-muted focus:outline-none focus:border-focus"
                />
                <button
                  type="button"
                  disabled={!customImageUrl.trim()}
                  onClick={() => {
                    handleUpdateTheme({ backgroundImageUrl: customImageUrl.trim(), preset: "custom" });
                    setCustomImageUrl("");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Local File Picker */}
              <div>
                <input
                  type="file"
                  id={fileInputId}
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-default hover:border-focus rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload image from computer</span>
                </label>
              </div>
            </div>

            {/* Background Overlay Opacity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-micro">
                <span className="font-semibold text-primary">Background Darkness Overlay</span>
                <span className="font-mono text-secondary font-bold">
                  {Math.round(theme.backgroundOverlay * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={theme.backgroundOverlay}
                onChange={(e) =>
                  handleUpdateTheme({ backgroundOverlay: parseFloat(e.target.value), preset: "custom" })
                }
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-nano text-muted">
                Adds a dark overlay to make text pop over vibrant backgrounds (max 80%).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
