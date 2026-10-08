"use client";

/**
 * components/builder/DesignDrawer.tsx — Theme & Design Customization Drawer
 *
 * Implements:
 *   - Background color picker & curated presets
 *   - Text color picker & curated presets
 *   - Button color picker & curated presets
 *   - Font family selector (Inter, Roboto, Outfit, Playfair Display)
 *   - Real-time persistence to forms.theme via updateFormMeta
 */

import React from "react";
import { X, Palette, Check } from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { FormTheme } from "@/types";

interface DesignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_PRESETS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Off-white", value: "#F9F9FB" },
  { name: "Dark", value: "#191919" },
  { name: "Pastel Indigo", value: "#EEF2FF" },
  { name: "Mint Fresh", value: "#ECFDF5" },
  { name: "Warm Sun", value: "#FFFBEB" },
];

const TEXT_PRESETS = [
  { name: "Near Black", value: "#191919" },
  { name: "Charcoal", value: "#374151" },
  { name: "Navy Blue", value: "#1E3A8A" },
  { name: "Emerald", value: "#065F46" },
  { name: "White", value: "#FFFFFF" },
];

const BUTTON_PRESETS = [
  { name: "Obsidian", value: "#262627" },
  { name: "Typeform Blue", value: "#0445AF" },
  { name: "Teal", value: "#0D9488" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Rose", value: "#E11D48" },
  { name: "Amber", value: "#D97706" },
];

const FONT_OPTIONS = [
  { id: "Inter", name: "Inter", desc: "Clean & modern sans-serif", style: "font-sans" },
  { id: "Roboto", name: "Roboto", desc: "Balanced geometric sans", style: "font-sans" },
  { id: "Outfit", name: "Outfit", desc: "Contemporary humanist sans", style: "font-sans" },
  { id: "Playfair Display", name: "Playfair Display", desc: "Editorial serif typeface", style: "font-serif" },
];

export function DesignDrawer({ isOpen, onClose }: DesignDrawerProps) {
  const { state, updateFormMeta } = useBuilderStore();
  const theme: FormTheme = state.form?.theme || {
    backgroundColor: "#FFFFFF",
    textColor: "#191919",
    buttonColor: "#262627",
    fontFamily: "Inter",
  };

  if (!isOpen) return null;

  const handleUpdateTheme = (patch: Partial<FormTheme>) => {
    updateFormMeta({
      theme: {
        ...theme,
        ...patch,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="h-14 px-5 border-b border-[#ECECEC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-xs text-[#262627]">Design & Theme</h3>
          </div>
          <button
            type="button"
            data-testid="close-design-drawer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#262627] hover:bg-[#F5F5F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. Background Color */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#262627]">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                data-testid="input-bg-color"
                value={theme.backgroundColor || "#FFFFFF"}
                onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-[#E5E5E5] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.backgroundColor || "#FFFFFF"}
                onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value })}
                className="flex-1 text-xs font-mono bg-[#FAFAFA] text-[#262627] px-3 py-1.5 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BG_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  data-testid={`preset-bg-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleUpdateTheme({ backgroundColor: p.value })}
                  style={{ backgroundColor: p.value }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs ${
                    theme.backgroundColor === p.value
                      ? "border-[#262627] ring-1 ring-[#262627]"
                      : "border-[#E5E5E5]"
                  }`}
                  title={p.name}
                >
                  {theme.backgroundColor === p.value && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        p.value === "#191919" ? "text-white" : "text-[#191919]"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Text Color */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#262627]">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                data-testid="input-text-color"
                value={theme.textColor || "#191919"}
                onChange={(e) => handleUpdateTheme({ textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-[#E5E5E5] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.textColor || "#191919"}
                onChange={(e) => handleUpdateTheme({ textColor: e.target.value })}
                className="flex-1 text-xs font-mono bg-[#FAFAFA] text-[#262627] px-3 py-1.5 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TEXT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  data-testid={`preset-text-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleUpdateTheme({ textColor: p.value })}
                  style={{ backgroundColor: p.value }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs ${
                    theme.textColor === p.value
                      ? "border-[#262627] ring-1 ring-[#262627]"
                      : "border-[#E5E5E5]"
                  }`}
                  title={p.name}
                >
                  {theme.textColor === p.value && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        p.value === "#FFFFFF" ? "text-[#191919]" : "text-white"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Button Color */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#262627]">
              Button Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                data-testid="input-button-color"
                value={theme.buttonColor || "#262627"}
                onChange={(e) => handleUpdateTheme({ buttonColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-[#E5E5E5] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.buttonColor || "#262627"}
                onChange={(e) => handleUpdateTheme({ buttonColor: e.target.value })}
                className="flex-1 text-xs font-mono bg-[#FAFAFA] text-[#262627] px-3 py-1.5 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BUTTON_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  data-testid={`preset-btn-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleUpdateTheme({ buttonColor: p.value })}
                  style={{ backgroundColor: p.value }}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs ${
                    theme.buttonColor === p.value
                      ? "border-[#262627] ring-1 ring-[#262627]"
                      : "border-[#E5E5E5]"
                  }`}
                  title={p.name}
                >
                  {theme.buttonColor === p.value && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Font Family (4 Choices) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#262627]">
              Font Family (Typography)
            </label>
            <div className="space-y-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = (theme.fontFamily || "Inter") === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-testid={`font-option-${f.id.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => handleUpdateTheme({ fontFamily: f.id })}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#262627] text-white border-[#262627] shadow-xs"
                        : "bg-white text-[#262627] border-[#E5E5E5] hover:bg-[#F9F9FB] hover:border-[#262627]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{f.name}</div>
                      <div
                        className={`text-[11px] ${
                          isSelected ? "text-white/70" : "text-[#737373]"
                        }`}
                      >
                        {f.desc}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
