"use client";

/**
 * components/builder/SettingsPane.tsx — Right settings & configuration panel (~300px)
 *
 * Pixel-accurate match to Typeform's builder right panel:
 *   - Top dropdown selector (Question Type / Welcome Screen / End Screen)
 *   - Question settings matching Screenshot 2:
 *       • Map to contacts ⓘ
 *       • Required
 *       • Max characters (toggle + number input)
 *       • Answer validation ⓘ
 *       • Custom placeholder text ⓘ (toggle + input)
 *       • Type-specific configuration (choices, rating steps, number limits, file uploads)
 *   - Welcome screen settings matching Screenshot 1:
 *       • Time to complete ⓘ
 *       • Number of submissions ⓘ
 *       • Button text with character counter (e.g. 5/24)
 *       • Image or video [+]
 *   - End screen settings matching Screenshots 3 & 4:
 *       • Button (toggle)
 *       • Segmented control (Page | URL)
 *       • Button text with character counter (e.g. 17/24) + Button link 💎
 *       • Social share icons (toggle)
 *       • Image or video [+]
 *   - Collapsible Logic [+] and Comments 💎 bottom sections
 */

import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  Info,
  Gem,
  X,
  AlignLeft,
  Link2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "./BuilderContext";
import { QUESTION_TYPES, QUESTION_TYPE_LIST } from "@/lib/questionTypes";
import { QuestionOption, QuestionType } from "@/types";
import { LogicSection } from "./LogicSection";

interface SettingsPaneProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// Toggle switch helper component matching Typeform aesthetics
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  info?: string;
  testId?: string;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  info,
  testId,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-primary cursor-pointer select-none">
            {label}
          </label>
          {info && (
            <span
              title={info}
              className="text-muted hover:text-primary transition-colors cursor-help inline-flex"
            >
              <Info className="w-3 h-3" />
            </span>
          )}
        </div>
        {description && (
          <p className="text-micro text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-primary" : "bg-neutral-300 dark:bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-card-foreground shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPane({ isOpenMobile = false, onCloseMobile }: SettingsPaneProps) {
  const {
    state,
    updateQuestion,
    updateFormMeta,
    selectedQuestion,
  } = useBuilderStore();

  const { form, selectedId } = state;
  const [bulkText, setBulkText] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [endScreenTab, setEndScreenTab] = useState<"page" | "url">("url");
  const [isLogicExpanded, setIsLogicExpanded] = useState(false);

  // Helper toggle states for mock properties matching Screenshot 1-4
  const [timeToComplete, setTimeToComplete] = useState(false);
  const [numSubmissions, setNumSubmissions] = useState(false);
  const [mapToContacts, setMapToContacts] = useState(false);
  const [answerValidation, setAnswerValidation] = useState(false);
  const [socialShareIcons, setSocialShareIcons] = useState(false);
  const [buttonLinkPro, setButtonLinkPro] = useState(false);
  const [hasEndButton, setHasEndButton] = useState(true);

  const renderWrapper = (children: React.ReactNode) => (
    <>
      <div className="hidden md:block h-full shrink-0">
        {children}
      </div>
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full max-w-[300px] w-full shadow-2xl animate-in slide-in-from-right duration-200">
            {children}
          </div>
        </div>
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // 1. Welcome Screen Settings (Screenshot 1)
  // ---------------------------------------------------------------------------
  if (selectedId === "welcome") {
    const welcomeBtnText = form?.welcome_button_text || "Start";

    return renderWrapper(
      <aside className="w-72 sm:w-[300px] bg-sidebar border-l border-default flex flex-col h-full shrink-0 overflow-y-auto text-primary">
        {/* Top Dropdown: Welcome Screen */}
        <div className="p-3.5 border-b border-default">
          <div className="relative">
            <div className="w-full bg-input text-xs font-semibold text-primary pl-3 pr-8 py-2 rounded-xl border border-default flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Welcome Screen</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Configuration List matching Screenshot 1 */}
        <div className="p-4 space-y-4 flex-1">
          <ToggleSwitch
            label="Time to complete"
            info="Estimate duration for respondents"
            checked={timeToComplete}
            onChange={setTimeToComplete}
          />

          <ToggleSwitch
            label="Number of submissions"
            info="Display total respondent counter"
            checked={numSubmissions}
            onChange={setNumSubmissions}
          />

          {/* Button Text input with counter */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5">
              Button
            </label>
            <input
              type="text"
              maxLength={24}
              value={welcomeBtnText}
              onChange={(e) =>
                updateFormMeta({ welcome_button_text: e.target.value })
              }
              placeholder="Start"
              className="w-full text-xs bg-input text-primary placeholder:text-muted px-3 py-2 rounded-lg border border-default focus:outline-none focus:border-focus"
            />
            <div className="text-right text-nano text-muted mt-1 font-mono">
              {welcomeBtnText.length}/24
            </div>
          </div>

          {/* Image or Video with [+] button */}
          <div className="flex items-center justify-between py-2 border-t border-default">
            <span className="text-xs font-medium text-primary">Image or video</span>
            <button
              type="button"
              onClick={() => toast.info("Media library available in FormCraft Pro")}
              className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover border border-default cursor-pointer transition-colors"
              title="Add media"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Bottom Sections matching Screenshot 1 */}
        <div className="p-3 border-t border-default space-y-2 bg-sidebar">
          <div
            onClick={() => toast.info("Logic branching is configured on questions")}
            className="p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-primary">Logic</span>
            <Plus className="w-3.5 h-3.5 text-muted" />
          </div>

          <div
            onClick={() => toast.info("Team collaboration available in FormCraft Pro")}
            className="p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-primary">Comments</span>
            <Gem className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. End Screen Settings (Screenshots 3 & 4)
  // ---------------------------------------------------------------------------
  if (selectedId === "thank_you") {
    const endBtnText = "Create a typeform";

    return renderWrapper(
      <aside className="w-72 sm:w-[300px] bg-sidebar border-l border-default flex flex-col h-full shrink-0 overflow-y-auto text-primary">
        {/* Top Dropdown: End Screen */}
        <div className="p-3.5 border-b border-default">
          <div className="relative">
            <div className="w-full bg-input text-xs font-semibold text-primary pl-3 pr-8 py-2 rounded-xl border border-default flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>End Screen</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Configuration List matching Screenshots 3 & 4 */}
        <div className="p-4 space-y-4 flex-1">
          <ToggleSwitch
            label="Button"
            checked={hasEndButton}
            onChange={setHasEndButton}
          />

          {hasEndButton && (
            <div className="space-y-3 pt-1">
              {/* Segmented Control: Page | URL */}
              <div className="grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium border border-default">
                <button
                  type="button"
                  onClick={() => setEndScreenTab("page")}
                  className={`py-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    endScreenTab === "page"
                      ? "bg-surface text-primary shadow-xs font-semibold"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEndScreenTab("url")}
                  className={`py-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    endScreenTab === "url"
                      ? "bg-surface text-primary shadow-xs font-semibold"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>URL</span>
                </button>
              </div>

              {endScreenTab === "page" ? (
                /* Typeform Pages Banner (Screenshot 3) */
                <div className="p-3 rounded-xl border border-dashed border-default bg-surface/60 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-xs font-bold text-primary">Typeform Pages</span>
                    <span className="text-nano font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      New
                    </span>
                  </div>
                  <p className="text-micro text-secondary leading-relaxed">
                    Link your button to a Typeform Page.
                  </p>
                  <a
                    href="#pages"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Typeform Pages guide");
                    }}
                    className="text-micro text-primary hover:underline font-semibold block"
                  >
                    Learn more about Pages
                  </a>
                </div>
              ) : (
                /* URL Button Configuration (Screenshot 4) */
                <div className="space-y-3">
                  <p className="text-micro text-secondary">
                    Connect a button to any website link.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Button text
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      defaultValue={endBtnText}
                      className="w-full text-xs bg-input text-primary px-3 py-2 rounded-lg border border-default focus:outline-none focus:border-focus"
                    />
                    <div className="text-right text-nano text-muted mt-1 font-mono">
                      {endBtnText.length}/24
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      <span>Button link</span>
                      <Gem className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={buttonLinkPro}
                      onClick={() => {
                        setButtonLinkPro(!buttonLinkPro);
                        toast.info("Custom redirect URL enabled with Pro");
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        buttonLinkPro ? "bg-primary" : "bg-neutral-300 dark:bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-card-foreground shadow-xs ring-0 transition duration-200 ease-in-out ${
                          buttonLinkPro ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <ToggleSwitch
            label="Social share icons"
            checked={socialShareIcons}
            onChange={setSocialShareIcons}
          />

          <div className="flex items-center justify-between py-2 border-t border-default">
            <span className="text-xs font-medium text-primary">Image or video</span>
            <button
              type="button"
              onClick={() => toast.info("Media library available in FormCraft Pro")}
              className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-hover border border-default cursor-pointer transition-colors"
              title="Add media"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Bottom Sections matching Screenshot 3 & 4 */}
        <div className="p-3 border-t border-default space-y-2 bg-sidebar">
          <div
            onClick={() => toast.info("Logic branching is configured on questions")}
            className="p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-primary">Logic</span>
            <Plus className="w-3.5 h-3.5 text-muted" />
          </div>

          <div
            onClick={() => toast.info("Team collaboration available in FormCraft Pro")}
            className="p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-primary">Comments</span>
            <Gem className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Question Settings (Screenshot 2)
  // ---------------------------------------------------------------------------
  if (!selectedQuestion) {
    return renderWrapper(
      <aside className="w-72 sm:w-[300px] bg-sidebar border-l border-default flex flex-col items-center justify-center h-full p-6 text-center text-muted">
        <div className="md:hidden w-full flex justify-end mb-4">
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-muted hover:text-primary transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Sliders className="w-8 h-8 text-muted mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium">Select a question to view settings</p>
      </aside>
    );
  }

  const typeDef = QUESTION_TYPES[selectedQuestion.type];
  const props = selectedQuestion.properties || {};
  const hasCustomPlaceholder = !!props.placeholder;
  const hasMaxCharacters = typeof props.maxLength === "number" && props.maxLength > 0;

  // Handler for changing question type (preserves title & description)
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === selectedQuestion.type) return;
    const newTypeDef = QUESTION_TYPES[newType];

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
      .map((l: string) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newOptions: QuestionOption[] = lines.map((label: string, idx: number) => ({
      id: `opt_${Date.now()}_${idx}`,
      label,
    }));

    updateQuestion(selectedQuestion.id, {
      properties: { ...props, options: newOptions },
    });
    setBulkText("");
    setIsBulkOpen(false);
  };

  const content = (
    <aside className="w-72 sm:w-[300px] bg-sidebar border-l border-default flex flex-col h-full shrink-0 overflow-y-auto text-primary">
      {/* 1. Header: Question Type Selector matching Screenshot 2 */}
      <div className="p-3.5 border-b border-default">
        <div className="relative">
          <select
            value={selectedQuestion.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            data-testid="question-type-select"
            className="w-full appearance-none bg-input text-xs font-semibold text-primary pl-3 pr-8 py-2 rounded-xl border border-default hover:border-default-hover focus:outline-none focus:border-focus cursor-pointer shadow-2xs transition-colors"
          >
            {QUESTION_TYPE_LIST.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Scrollable Body: Exact Order from Screenshot 2 */}
      <div className="p-4 space-y-2 flex-1">
        {/* 1. Map to contacts ⓘ */}
        <ToggleSwitch
          label="Map to contacts"
          info="Sync answers directly with CRM contacts"
          checked={mapToContacts}
          onChange={setMapToContacts}
        />

        {/* 2. Required */}
        <ToggleSwitch
          label="Required"
          checked={!!selectedQuestion.required}
          testId="toggle-required"
          onChange={(val) =>
            updateQuestion(selectedQuestion.id, { required: val })
          }
        />

        {/* 3. Max characters (Toggle + inline input) */}
        <div>
          <ToggleSwitch
            label="Max characters"
            checked={hasMaxCharacters}
            onChange={(val) => {
              updateQuestion(selectedQuestion.id, {
                properties: {
                  ...props,
                  maxLength: val ? 255 : undefined,
                },
              });
            }}
          />
          {hasMaxCharacters && (
            <div className="pl-1 pb-2">
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
                placeholder="255"
                className="w-full text-xs bg-input text-primary placeholder:text-muted px-3 py-1.5 rounded-lg border border-default focus:outline-none focus:border-focus font-mono"
              />
            </div>
          )}
        </div>

        {/* 4. Answer validation ⓘ */}
        <ToggleSwitch
          label="Answer validation"
          info="Enforce specific input patterns and formats"
          checked={answerValidation}
          onChange={setAnswerValidation}
        />

        {/* 5. Custom placeholder text ⓘ (Toggle + input) */}
        <div>
          <ToggleSwitch
            label="Custom placeholder text"
            info="Helper placeholder shown when field is empty"
            checked={hasCustomPlaceholder}
            onChange={(val) => {
              updateQuestion(selectedQuestion.id, {
                properties: {
                  ...props,
                  placeholder: val ? "Share your suggestions..." : undefined,
                },
              });
            }}
          />
          {hasCustomPlaceholder && (
            <div className="pl-1 pb-2">
              <input
                type="text"
                value={props.placeholder || ""}
                onChange={(e) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: { ...props, placeholder: e.target.value },
                  })
                }
                placeholder="Share your suggestions..."
                className="w-full text-xs bg-input text-primary placeholder:text-muted px-3 py-2 rounded-lg border border-default focus:outline-none focus:border-focus"
              />
            </div>
          )}
        </div>

        <div className="border-t border-default my-3" />

        {/* 3. Type-Specific Details */}
        {selectedQuestion.type === "multiple_choice" && (
          <div className="space-y-3 pt-1">
            <ToggleSwitch
              label="Multiple selection"
              checked={!!props.multiple}
              testId="toggle-multiple"
              onChange={(val) =>
                updateQuestion(selectedQuestion.id, {
                  properties: { ...props, multiple: val },
                })
              }
            />

            <ToggleSwitch
              label="Randomize options"
              checked={!!props.randomize}
              testId="toggle-randomize"
              onChange={(val) =>
                updateQuestion(selectedQuestion.id, {
                  properties: { ...props, randomize: val },
                })
              }
            />

            <ToggleSwitch
              label="Allow &quot;Other&quot;"
              checked={!!props.allowOther}
              testId="toggle-allow-other"
              onChange={(val) =>
                updateQuestion(selectedQuestion.id, {
                  properties: { ...props, allowOther: val },
                })
              }
            />

            <div className="pt-2 border-t border-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">
                  Choices ({props.options?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Add choice
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(props.options || []).map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-1.5">
                    <span className="w-5 text-micro font-mono font-semibold text-muted text-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                      className="flex-1 text-xs bg-input text-primary px-2.5 py-1.5 rounded-lg border border-default focus:outline-none focus:border-focus"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      disabled={(props.options || []).length <= 1}
                      className="p-1.5 text-muted hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedQuestion.type === "dropdown" && (
          <div className="space-y-3 pt-1">
            <ToggleSwitch
              label="Alphabetical order"
              checked={!!props.alphabetical}
              testId="toggle-alphabetical"
              onChange={(val) =>
                updateQuestion(selectedQuestion.id, {
                  properties: { ...props, alphabetical: val },
                })
              }
            />

            <div className="pt-2 border-t border-default">
              <button
                type="button"
                data-testid="toggle-bulk-options"
                onClick={() => setIsBulkOpen(!isBulkOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold text-primary py-1 cursor-pointer hover:text-primary-hover"
              >
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-muted" />
                  <span>Bulk-add options</span>
                </span>
                <span className="text-micro text-blue-600 dark:text-blue-400 font-medium">
                  {isBulkOpen ? "Hide" : "Open"}
                </span>
              </button>

              {isBulkOpen && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={5}
                    value={bulkText}
                    data-testid="textarea-bulk-options"
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    className="w-full text-xs font-mono bg-input text-primary placeholder:text-muted p-2 rounded-lg border border-default focus:outline-none focus:border-focus resize-none"
                  />
                  <button
                    type="button"
                    data-testid="btn-apply-bulk"
                    onClick={handleApplyBulkOptions}
                    disabled={!bulkText.trim()}
                    className="w-full py-1.5 px-3 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    Apply bulk options
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedQuestion.type === "rating" && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
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
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-input text-primary border-default hover:bg-surface-hover"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
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
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-input text-primary border-default hover:bg-surface-hover"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedQuestion.type === "number" && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
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
                className="w-full text-xs bg-input text-primary placeholder:text-muted px-3 py-2 rounded-lg border border-default focus:outline-none focus:border-focus"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
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
                className="w-full text-xs bg-input text-primary placeholder:text-muted px-3 py-2 rounded-lg border border-default focus:outline-none focus:border-focus"
              />
            </div>
          </div>
        )}

        {selectedQuestion.type === "file_upload" && (
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-primary">
                  Max file size
                </label>
                <span className="text-xs font-mono font-semibold text-secondary">
                  {Number(selectedQuestion.properties.maxSizeMB || 5)} MB
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={Number(selectedQuestion.properties.maxSizeMB || 5)}
                onChange={(e) =>
                  updateQuestion(selectedQuestion.id, {
                    properties: {
                      ...selectedQuestion.properties,
                      maxSizeMB: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary block">
                Allowed file types
              </label>
              {[
                { id: "image", label: "Images (PNG, JPG, WebP)" },
                { id: "pdf", label: "PDF Documents (.pdf)" },
                { id: "doc", label: "Documents (.doc, .docx, .txt)" },
              ].map((cat) => {
                const currentTypes = (selectedQuestion.properties.allowedTypes as string[]) || ["image", "pdf", "doc"];
                const isChecked = currentTypes.includes(cat.id);

                return (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-default bg-surface/50 hover:bg-surface text-xs text-primary cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let nextTypes: string[];
                        if (e.target.checked) {
                          nextTypes = [...currentTypes, cat.id];
                        } else {
                          nextTypes = currentTypes.filter((t) => t !== cat.id);
                          if (nextTypes.length === 0) {
                            toast.error("At least one file type must be enabled");
                            return;
                          }
                        }
                        updateQuestion(selectedQuestion.id, {
                          properties: {
                            ...selectedQuestion.properties,
                            allowedTypes: nextTypes,
                          },
                        });
                      }}
                      className="rounded border-default text-primary focus:ring-0 cursor-pointer"
                    />
                    <span className="font-medium">{cat.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Collapsible Sections: Logic & Comments (Screenshot 2) */}
      <div className="p-3 border-t border-default space-y-2 bg-sidebar">
        <div>
          <button
            type="button"
            onClick={() => setIsLogicExpanded(!isLogicExpanded)}
            className="w-full p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="text-xs font-semibold text-primary">Logic</span>
            <Plus className={`w-3.5 h-3.5 text-muted transition-transform ${isLogicExpanded ? "rotate-45" : ""}`} />
          </button>

          {isLogicExpanded && (
            <div className="mt-2 p-2 bg-surface rounded-xl border border-default">
              <LogicSection
                question={selectedQuestion}
                questions={state.questions}
                onUpdateQuestion={(patch) => updateQuestion(selectedQuestion.id, patch)}
              />
            </div>
          )}
        </div>

        <div
          onClick={() => toast.info("Team collaboration available in FormCraft Pro")}
          className="p-2.5 rounded-lg border border-default bg-card hover:bg-surface-hover flex items-center justify-between cursor-pointer transition-colors"
        >
          <span className="text-xs font-semibold text-primary">Comments</span>
          <Gem className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block h-full shrink-0">
        {content}
      </div>

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full max-w-[300px] w-full shadow-2xl animate-in slide-in-from-right duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
