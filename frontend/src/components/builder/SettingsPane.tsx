"use client";

/**
 * components/builder/SettingsPane.tsx — Right settings & configuration panel (~300px)
 *
 * Implements:
 *   - Common settings: Question type dropdown (preserving title), Required toggle, Description toggle
 *   - Type-specific settings:
 *       • multiple_choice: multiple selection toggle, randomize toggle, allow "Other" toggle
 *       • dropdown: alphabetical order toggle, bulk-add options textarea
 *       • rating: steps (3-10), shape (star/heart/thumbs)
 *       • number: min, max boundaries
 *       • short_text / long_text: max characters limit, placeholder
 *       • yes_no / email: common settings & format info
 *   - "Logic" section at the bottom with a "Coming Soon" card
 */

import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  GitFork,
  Plus,
  Trash2,
  FileText,
  AlignLeft,
  ChevronDown,
} from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES, QUESTION_TYPE_LIST } from "@/lib/questionTypes";
import { QuestionOption, QuestionType } from "@/types";

export function SettingsPane() {
  const {
    state,
    updateQuestion,
    updateFormMeta,
    selectedQuestion,
  } = useBuilderStore();

  const { form, selectedId } = state;
  const [bulkText, setBulkText] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Toggle switch helper component
  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    testId,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
    description?: string;
    testId?: string;
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
        data-testid={testId}
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

        <div className="p-4 space-y-4 flex-1">
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
              The welcome screen introduces respondents to your form. You can customize the title and description directly in the center canvas.
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

        <div className="p-4 space-y-4 flex-1">
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
  const props = selectedQuestion.properties || {};
  const isDescriptionActive =
    props.showDescription ?? (selectedQuestion.description !== null && selectedQuestion.description !== "");

  // Handler for changing question type (preserves title & description)
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === selectedQuestion.type) return;
    const newTypeDef = QUESTION_TYPES[newType];

    // Preserve compatible properties when possible
    const newProps = {
      ...JSON.parse(JSON.stringify(newTypeDef.defaultProperties)),
      showDescription: props.showDescription,
    };

    if (
      (selectedQuestion.type === "multiple_choice" || selectedQuestion.type === "dropdown") &&
      (newType === "multiple_choice" || newType === "dropdown") &&
      props.options
    ) {
      newProps.options = props.options;
    }

    if (
      (selectedQuestion.type === "short_text" || selectedQuestion.type === "long_text") &&
      (newType === "short_text" || newType === "long_text")
    ) {
      if (props.placeholder) newProps.placeholder = props.placeholder;
      if (props.maxLength) newProps.maxLength = props.maxLength;
    }

    updateQuestion(selectedQuestion.id, {
      type: newType,
      properties: newProps,
    });
  };

  // Option editor handlers
  const handleAddOption = () => {
    const currentOptions = props.options || [];
    const newOptionId = `opt_${Date.now()}`;
    const nextNumber = currentOptions.length + 1;
    const newOptions: QuestionOption[] = [
      ...currentOptions,
      { id: newOptionId, label: `Choice ${nextNumber}` },
    ];
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
    if (currentOptions.length <= 1) return;
    const updated = currentOptions.filter((opt) => opt.id !== optId);
    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: updated },
    });
  };

  // Bulk add options handler for dropdown
  const handleApplyBulkOptions = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newOptions: QuestionOption[] = lines.map((label, idx) => ({
      id: `opt_${Date.now()}_${idx}`,
      label,
    }));

    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: newOptions },
    });
    setBulkText("");
    setIsBulkOpen(false);
  };

  return (
    <aside className="w-72 sm:w-[300px] bg-[#F9F9FB] border-l border-[#ECECEC] flex flex-col h-full shrink-0 overflow-y-auto">
      {/* 1. Header: Question Type Selector */}
      <div className="p-4 border-b border-[#ECECEC] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider">
            Question Type
          </span>
        </div>

        {/* Question Type Dropdown */}
        <div className="relative">
          <select
            value={selectedQuestion.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            data-testid="question-type-select"
            className="w-full appearance-none bg-white text-xs font-semibold text-[#262627] pl-3 pr-8 py-2 rounded-xl border border-[#E5E5E5] hover:border-[#262627] focus:outline-none focus:border-[#262627] cursor-pointer shadow-2xs transition-colors"
          >
            {QUESTION_TYPE_LIST.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#737373] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Scrollable Body of Configuration Settings */}
      <div className="p-4 space-y-5 flex-1">
        {/* Common Settings: Required & Description toggles */}
        <div className="space-y-1">
          <h4 className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1">
            Common Settings
          </h4>

          {/* Required toggle */}
          <ToggleSwitch
            label="Required"
            description="Respondents must answer before proceeding"
            testId="toggle-required"
            checked={!!selectedQuestion.required}
            onChange={(val) =>
              updateQuestion(selectedQuestion.id, { required: val })
            }
          />

          {/* Description toggle */}
          <ToggleSwitch
            label="Description"
            description="Show helper subtitle under question headline"
            testId="toggle-description"
            checked={isDescriptionActive}
            onChange={(val) => {
              updateQuestion(selectedQuestion.id, {
                properties: { ...props, showDescription: val },
                description: val ? selectedQuestion.description || "" : null,
              });
            }}
          />
        </div>

        <div className="border-t border-[#ECECEC]" />

        {/* 3. Type-Specific Settings */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-2">
            {typeDef.label} Properties
          </h4>

          {/* Short Text / Long Text Settings */}
          {(selectedQuestion.type === "short_text" ||
            selectedQuestion.type === "long_text") && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Placeholder text
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

              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Max characters
                </label>
                <input
                  type="number"
                  value={props.maxLength ?? ""}
                  data-testid="input-max-length"
                  onChange={(e) =>
                    updateQuestion(selectedQuestion.id, {
                      properties: {
                        ...props,
                        maxLength:
                          e.target.value !== "" ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="e.g. 255"
                  className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
                />
              </div>
            </div>
          )}

          {/* Number Settings: Min and Max */}
          {selectedQuestion.type === "number" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Min value
                </label>
                <input
                  type="number"
                  value={props.min ?? ""}
                  data-testid="input-number-min"
                  onChange={(e) =>
                    updateQuestion(selectedQuestion.id, {
                      properties: {
                        ...props,
                        min:
                          e.target.value !== "" ? Number(e.target.value) : undefined,
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
                  data-testid="input-number-max"
                  onChange={(e) =>
                    updateQuestion(selectedQuestion.id, {
                      properties: {
                        ...props,
                        max:
                          e.target.value !== "" ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="No max"
                  className="w-full text-xs bg-white text-[#262627] px-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627]"
                />
              </div>
            </div>
          )}

          {/* Rating Settings: Steps (3-10) and Shape (star/heart/thumbs) */}
          {selectedQuestion.type === "rating" && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Steps ({props.steps || 5})
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                    <button
                      key={step}
                      type="button"
                      data-testid={`rating-step-${step}`}
                      onClick={() =>
                        updateQuestion(selectedQuestion.id, {
                          properties: { ...props, steps: step },
                        })
                      }
                      className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
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

              <div>
                <label className="block text-xs font-semibold text-[#262627] mb-1.5">
                  Icon shape
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "star", label: "Stars" },
                    { key: "heart", label: "Hearts" },
                    { key: "thumbs", label: "Thumbs" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      data-testid={`rating-shape-${s.key}`}
                      onClick={() =>
                        updateQuestion(selectedQuestion.id, {
                          properties: { ...props, shape: s.key as "star" | "heart" | "thumbs" },
                        })
                      }
                      className={`py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                        (props.shape || "star") === s.key
                          ? "bg-[#262627] text-white border-[#262627]"
                          : "bg-white text-[#262627] border-[#E5E5E5] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice Settings: Multiple selection, Randomize, Allow Other */}
          {selectedQuestion.type === "multiple_choice" && (
            <div className="space-y-3">
              <ToggleSwitch
                label="Multiple selection"
                description="Allow choosing more than one option"
                testId="toggle-multiple"
                checked={!!props.multiple}
                onChange={(val) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, multiple: val },
                  })
                }
              />

              <ToggleSwitch
                label="Randomize options"
                description="Shuffle choices order for each respondent"
                testId="toggle-randomize"
                checked={!!props.randomize}
                onChange={(val) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, randomize: val },
                  })
                }
              />

              <ToggleSwitch
                label="Allow &quot;Other&quot;"
                description="Include an option with free-form text input"
                testId="toggle-allow-other"
                checked={!!props.allowOther}
                onChange={(val) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, allowOther: val },
                  })
                }
              />

              {/* Quick choices list overview in panel */}
              <div className="pt-2 border-t border-[#ECECEC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#262627]">
                    Choices ({props.options?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    + Add choice
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Settings: Alphabetical toggle & Bulk-add options textarea */}
          {selectedQuestion.type === "dropdown" && (
            <div className="space-y-3">
              <ToggleSwitch
                label="Alphabetical order"
                description="Sort dropdown options alphabetically (A-Z)"
                testId="toggle-alphabetical"
                checked={!!props.alphabetical}
                onChange={(val) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, alphabetical: val },
                  })
                }
              />

              {/* Bulk-add options toggle & textarea */}
              <div className="pt-2 border-t border-[#ECECEC]">
                <button
                  type="button"
                  data-testid="toggle-bulk-options"
                  onClick={() => setIsBulkOpen(!isBulkOpen)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#262627] py-1 cursor-pointer hover:text-black"
                >
                  <span className="flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Bulk-add options</span>
                  </span>
                  <span className="text-[11px] text-blue-600 font-medium">
                    {isBulkOpen ? "Hide" : "Open"}
                  </span>
                </button>

                {isBulkOpen && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] text-[#737373]">
                      Enter one option per line to replace or load all choices:
                    </p>
                    <textarea
                      rows={5}
                      value={bulkText}
                      data-testid="textarea-bulk-options"
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                      className="w-full text-xs font-mono bg-white text-[#262627] p-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#262627] resize-none"
                    />
                    <button
                      type="button"
                      data-testid="btn-apply-bulk"
                      onClick={handleApplyBulkOptions}
                      disabled={!bulkText.trim()}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#262627] hover:bg-black text-white text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Apply bulk options
                    </button>
                  </div>
                )}
              </div>
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
              Inputs are automatically validated against standard email address formats.
            </p>
          )}
        </div>

        <div className="border-t border-[#ECECEC]" />

        {/* 4. Logic Section: Coming Soon Placeholder */}
        <div className="pt-1" data-testid="logic-section">
          <div className="p-3 rounded-xl border border-[#E5E5E5] bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#262627]">
                <GitFork className="w-3.5 h-3.5 text-purple-600" />
                <span>Logic</span>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-[#737373] leading-relaxed">
              Create conditional jumps, calculations, and branch respondent flow based on previous answers.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
