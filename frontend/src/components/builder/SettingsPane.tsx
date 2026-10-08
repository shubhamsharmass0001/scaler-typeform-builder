"use client";

/**
 * components/builder/SettingsPane.tsx — Right settings & properties pane (~300px)
 *
 * Provides granular configuration for:
 *   - Questions: Required toggle, placeholders, choices list, min/max limits, rating steps
 *   - Welcome Screen: Button text, greeting text
 *   - Thank You Screen: Ending message
 */

import React from "react";
import {
  Settings,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES } from "@/lib/questionTypes";

export function SettingsPane() {
  const {
    state,
    updateQuestion,
    updateFormMeta,
    selectedQuestion,
  } = useBuilderStore();

  const { form, selectedId } = state;

  // Toggle switch helper component
  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <label className="text-xs font-medium text-[#262627] cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-[#737373] mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[#262627]" : "bg-[#E5E5E5]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // 1. Welcome Screen Settings
  // ---------------------------------------------------------------------------
  if (selectedId === "welcome") {
    return (
      <aside className="w-72 sm:w-[300px] bg-[#F9F9FB] border-l border-[#ECECEC] flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#ECECEC] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#262627]">Welcome Screen</h3>
            <p className="text-[11px] text-[#737373]">Screen properties</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262627] mb-1.5">
              Button text
            </label>
            <input
              type="text"
              value={form?.welcome_button_text || ""}
              onChange={(e) =>
                updateFormMeta({ welcome_button_text: e.target.value })
              }
              placeholder="Start"
              className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
            />
          </div>

          <div className="pt-2 border-t border-[#ECECEC]">
            <p className="text-[11px] text-[#737373] leading-relaxed">
              The welcome screen greets respondents before they begin your form. You can edit the headline and subtext directly in the center canvas.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Thank You Screen Settings
  // ---------------------------------------------------------------------------
  if (selectedId === "thank_you") {
    return (
      <aside className="w-72 sm:w-[300px] bg-[#F9F9FB] border-l border-[#ECECEC] flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#ECECEC] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#262627]">Thank You Screen</h3>
            <p className="text-[11px] text-[#737373]">End screen properties</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262627] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form?.thank_you_title || ""}
              onChange={(e) =>
                updateFormMeta({ thank_you_title: e.target.value })
              }
              placeholder="Thank you for your response!"
              className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#262627] mb-1.5">
              Message
            </label>
            <textarea
              value={form?.thank_you_message || ""}
              onChange={(e) =>
                updateFormMeta({ thank_you_message: e.target.value })
              }
              rows={3}
              placeholder="Your answers have been recorded."
              className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627] resize-none"
            />
          </div>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Question Settings
  // ---------------------------------------------------------------------------
  if (!selectedQuestion) {
    return (
      <aside className="w-72 sm:w-[300px] bg-[#F9F9FB] border-l border-[#ECECEC] flex flex-col items-center justify-center h-full p-6 text-center text-[#737373]">
        <Sliders className="w-8 h-8 text-[#A3A3A3] mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium">Select a question to view settings</p>
      </aside>
    );
  }

  const typeDef = QUESTION_TYPES[selectedQuestion.type];
  const Icon = typeDef?.icon || HelpCircle;
  const props = selectedQuestion.properties || {};

  // Handlers for option list management (multiple_choice, dropdown)
  const handleAddOption = () => {
    const currentOptions = props.options || [];
    const newOptionId = `opt_${Date.now()}`;
    const nextNumber = currentOptions.length + 1;
    const newOptions = [...currentOptions, { id: newOptionId, label: `Option ${nextNumber}` }];
    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: newOptions },
    });
  };

  const handleUpdateOption = (optId: string, newLabel: string) => {
    const currentOptions = props.options || [];
    const updated = currentOptions.map((opt) =>
      opt.id === optId ? { ...opt, label: newLabel } : opt
    );
    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: updated },
    });
  };

  const handleDeleteOption = (optId: string) => {
    const currentOptions = props.options || [];
    if (currentOptions.length <= 1) return; // Keep at least one option
    const updated = currentOptions.filter((opt) => opt.id !== optId);
    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: updated },
    });
  };

  return (
    <aside className="w-72 sm:w-[300px] bg-[#F9F9FB] border-l border-[#ECECEC] flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Top Header */}
      <div className="p-4 border-b border-[#ECECEC] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: typeDef?.badgeBg,
              borderColor: `${typeDef?.color}30`,
              color: typeDef?.color,
            }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-[#262627] truncate">
              {typeDef?.label}
            </h3>
            <p className="text-[11px] text-[#737373] truncate">Question settings</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Basic Validations */}
        <div className="space-y-1">
          <h4 className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-2">
            Validation
          </h4>
          <ToggleSwitch
            label="Required"
            description="Respondents must answer before proceeding"
            checked={!!selectedQuestion.required}
            onChange={(val) =>
              updateQuestion(selectedQuestion.id, { required: val })
            }
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#ECECEC]" />

        {/* Type-Specific Properties */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-2">
            Properties
          </h4>

          {/* Short Text / Long Text Placeholder */}
          {(selectedQuestion.type === "short_text" ||
            selectedQuestion.type === "long_text") && (
            <div>
              <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                Placeholder
              </label>
              <input
                type="text"
                value={props.placeholder || ""}
                onChange={(e) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, placeholder: e.target.value },
                  })
                }
                placeholder="Type your answer here..."
                className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
              />
            </div>
          )}

          {/* Number Min / Max */}
          {selectedQuestion.type === "number" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Min value
                </label>
                <input
                  type="number"
                  value={props.min ?? ""}
                  onChange={(e) =>
                    updateQuestion(selectedQuestion.id, {
                      properties: {
                        ...props,
                        min: e.target.value !== "" ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="No min"
                  className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Max value
                </label>
                <input
                  type="number"
                  value={props.max ?? ""}
                  onChange={(e) =>
                    updateQuestion(selectedQuestion.id, {
                      properties: {
                        ...props,
                        max: e.target.value !== "" ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="No max"
                  className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
                />
              </div>
            </div>
          )}

          {/* Rating: Steps and Shape */}
          {selectedQuestion.type === "rating" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Steps ({props.steps || 5})
                </label>
                <div className="flex gap-1.5">
                  {[3, 5, 7, 10].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() =>
                        updateQuestion(selectedQuestion.id, {
                          properties: { ...props, steps: step },
                        })
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                        (props.steps || 5) === step
                          ? "bg-[#262627] text-white border-[#262627]"
                          : "bg-white text-[#262627] border-[#E5E5E5] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice & Dropdown Options Editor */}
          {(selectedQuestion.type === "multiple_choice" ||
            selectedQuestion.type === "dropdown") && (
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-[#262627]">
                Choices
              </label>
              <div className="space-y-1.5">
                {(props.options || []).map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-1.5">
                    <span className="w-5 text-[11px] font-mono font-semibold text-[#8C8C8C] text-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                      className="flex-1 text-xs bg-white text-[#262627] px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      disabled={(props.options || []).length <= 1}
                      className="p-1.5 text-[#A3A3A3] hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove choice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-[#D4D4D4] hover:border-[#191919] bg-white text-xs font-medium text-[#262627] hover:text-black transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add choice</span>
              </button>

              {/* Extra toggles for multiple choice */}
              {selectedQuestion.type === "multiple_choice" && (
                <div className="pt-2 space-y-1">
                  <ToggleSwitch
                    label="Multiple selection"
                    description="Allow selecting more than one option"
                    checked={!!props.multiple}
                    onChange={(val) =>
                      updateQuestion(selectedQuestion.id, {
                        properties: { ...props, multiple: val },
                      })
                    }
                  />
                  <ToggleSwitch
                    label="Other option"
                    description="Include 'Other' with free text input"
                    checked={!!props.allowOther}
                    onChange={(val) =>
                      updateQuestion(selectedQuestion.id, {
                        properties: { ...props, allowOther: val },
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Yes / No notes */}
          {selectedQuestion.type === "yes_no" && (
            <p className="text-[11px] text-[#737373] leading-relaxed">
              Provides standard binary Yes / No buttons with keyboard shortcuts (Y / N).
            </p>
          )}

          {/* Email notes */}
          {selectedQuestion.type === "email" && (
            <p className="text-[11px] text-[#737373] leading-relaxed">
              Validated automatically against email format standards on submission.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
