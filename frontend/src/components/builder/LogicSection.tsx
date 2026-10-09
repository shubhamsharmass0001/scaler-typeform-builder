"use client";

/**
 * components/builder/LogicSection.tsx — Right panel conditional logic rules editor
 *
 * Modeled on Typeform's logic rules:
 *   - "If this question's answer [operator dropdown] [value input] then [Jump to ▾ forward questions + End of form]"
 *   - Adapting value input: choices dropdown, Yes/No toggle, number/rating inputs, text inputs
 *   - Operator list filtered by question type via getAllowedOperators
 *   - "Add rule", delete rule, reorder rules with "first match wins" hint
 *   - "Otherwise go to" row for logicDefault
 *   - Forward-only targets in dropdowns
 *   - Live client-side cycle and target validation with warning badges
 */

import React, { useMemo } from "react";
import {
  GitFork,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Info,
  CornerDownRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Question, LogicRule, LogicOperator } from "@/types";
import {
  getAllowedOperators,
  getForwardQuestions,
  validateTarget,
  detectCycles,
  LOGIC_OPERATORS,
} from "@/lib/logic";

interface LogicSectionProps {
  question: Question;
  questions: Question[];
  onUpdateQuestion: (patch: Partial<Question>) => void;
}

export function LogicSection({
  question,
  questions,
  onUpdateQuestion,
}: LogicSectionProps) {
  const currentIndex = questions.findIndex(
    (q) => String(q.id) === String(question.id)
  );

  const forwardQuestions = useMemo(
    () => getForwardQuestions(currentIndex, questions),
    [currentIndex, questions]
  );

  const allowedOperators = useMemo(
    () => getAllowedOperators(question.type, question.properties),
    [question.type, question.properties]
  );

  const rules: LogicRule[] = useMemo(
    () => question.properties?.logic || [],
    [question.properties?.logic]
  );

  const logicDefault = question.properties?.logicDefault ?? null;

  // Client-side cycle detection
  const detectedCycle = useMemo(() => detectCycles(questions), [questions]);

  // Default initial value when creating a rule for this question type
  const getDefaultValue = (): string | number | boolean => {
    if (question.type === "yes_no") return "No";
    if (
      (question.type === "multiple_choice" || question.type === "dropdown") &&
      question.properties?.options &&
      question.properties.options.length > 0
    ) {
      return question.properties.options[0].id || question.properties.options[0].label;
    }
    if (question.type === "number" || question.type === "rating") return 0;
    return "";
  };

  // Add a new rule
  const handleAddRule = () => {
    const initialOp = allowedOperators[0]?.value || "equals";
    const initialTarget = forwardQuestions[0]?.id ?? "end";
    const initialVal = getDefaultValue();

    const newRule: LogicRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conditions: [
        {
          operator: initialOp,
          value: initialVal,
        },
      ],
      match: "all",
      action: {
        type: "jump",
        target_question_id: initialTarget,
      },
    };

    const updatedRules = [...rules, newRule];
    onUpdateQuestion({
      properties: {
        ...question.properties,
        logic: updatedRules,
      },
    });
  };

  // Delete a rule
  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    onUpdateQuestion({
      properties: {
        ...question.properties,
        logic: updatedRules,
      },
    });
  };

  // Move rule up or down
  const handleMoveRule = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= rules.length) return;
    const newRules = [...rules];
    const [moved] = newRules.splice(index, 1);
    newRules.splice(targetIdx, 0, moved);

    onUpdateQuestion({
      properties: {
        ...question.properties,
        logic: newRules,
      },
    });
  };

  // Update rule fields
  const handleUpdateRuleCondition = (
    ruleId: string,
    operator?: LogicOperator,
    value?: string | number | boolean | null
  ) => {
    const updatedRules = rules.map((r) => {
      if (r.id !== ruleId) return r;
      const currentCond = r.conditions[0] || { operator: "equals", value: "" };
      const newOp = operator !== undefined ? operator : currentCond.operator;
      const newVal = value !== undefined ? value : currentCond.value;
      return {
        ...r,
        conditions: [{ operator: newOp, value: newVal }],
      };
    });

    onUpdateQuestion({
      properties: {
        ...question.properties,
        logic: updatedRules,
      },
    });
  };

  // Update rule jump target
  const handleUpdateRuleTarget = (
    ruleId: string,
    targetQuestionId: number | string
  ) => {
    const updatedRules = rules.map((r) => {
      if (r.id !== ruleId) return r;
      return {
        ...r,
        action: {
          ...r.action,
          target_question_id: targetQuestionId,
        },
      };
    });

    onUpdateQuestion({
      properties: {
        ...question.properties,
        logic: updatedRules,
      },
    });
  };

  // Update default path
  const handleUpdateDefaultTarget = (target: string) => {
    const nextDefault = target === "" || target === "null" ? null : target;
    onUpdateQuestion({
      properties: {
        ...question.properties,
        logicDefault: nextDefault,
      },
    });
  };

  // Validation for default path
  const defaultTargetValidation = validateTarget(
    logicDefault,
    currentIndex,
    questions
  );

  return (
    <div className="space-y-3 pt-2" data-testid="logic-section">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-secondary" aria-hidden="true" />
          <span className="text-xs font-semibold text-primary">Logic jumps</span>
          {rules.length > 0 && (
            <span className="px-1.5 py-0.5 text-nano font-bold rounded-full bg-primary/10 text-primary">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddRule}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-surface-hover border border-default transition-colors cursor-pointer"
          data-testid="add-rule-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add rule</span>
        </button>
      </div>

      {/* Cycle Alert Banner */}
      {detectedCycle && (
        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Circular logic detected</p>
            <p className="text-micro leading-tight font-mono">{detectedCycle}</p>
            <p className="text-micro opacity-90">
              Please adjust jump targets so questions do not loop back into themselves.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules.length === 0 && !logicDefault && (
        <div className="p-3.5 rounded-xl border border-dashed border-default bg-card text-center space-y-2">
          <p className="text-xs text-muted">
            No logic jumps yet. Add a rule to route respondents to different questions
            based on their answers.
          </p>
          <button
            type="button"
            onClick={handleAddRule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first rule</span>
          </button>
        </div>
      )}

      {/* Rules List */}
      {rules.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1 text-micro text-muted italic">
            <Info className="w-3 h-3 shrink-0" />
            <span>Rules are evaluated in order; the first match wins.</span>
          </div>

          {rules.map((rule, idx) => {
            const cond = rule.conditions[0] || { operator: "equals", value: "" };
            const opMeta = LOGIC_OPERATORS[cond.operator] || LOGIC_OPERATORS.equals;
            const targetVal = rule.action?.target_question_id;
            const targetValidation = validateTarget(
              targetVal,
              currentIndex,
              questions
            );

            return (
              <div
                key={rule.id}
                data-testid={`logic-rule-${idx}`}
                className="p-3 rounded-xl border border-default bg-card shadow-2xs space-y-2.5 transition-colors"
              >
                {/* Rule Header Bar */}
                <div className="flex items-center justify-between border-b border-default pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-micro font-bold text-secondary uppercase tracking-wider">
                      Rule {idx + 1}
                    </span>
                    {!targetValidation.isValid && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-nano font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        Invalid target
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveRule(idx, -1)}
                      title="Move rule up"
                      className="p-1 rounded text-muted hover:text-primary disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-hover transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === rules.length - 1}
                      onClick={() => handleMoveRule(idx, 1)}
                      title="Move rule down"
                      className="p-1 rounded text-muted hover:text-primary disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-hover transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {/* Delete Rule */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete rule"
                      className="p-1 rounded text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Target Warning Details */}
                {!targetValidation.isValid && (
                  <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-micro text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span>{targetValidation.error}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateRuleTarget(rule.id, "end")}
                      className="underline font-semibold hover:text-amber-900 shrink-0 cursor-pointer"
                    >
                      Set to End
                    </button>
                  </div>
                )}

                {/* "If this question's answer..." */}
                <div className="space-y-1.5">
                  <label className="text-micro font-medium text-muted flex items-center gap-1">
                    <span>If this question&apos;s answer</span>
                  </label>

                  <div className="grid grid-cols-1 gap-1.5">
                    {/* Operator Dropdown */}
                    <select
                      value={cond.operator}
                      onChange={(e) =>
                        handleUpdateRuleCondition(
                          rule.id,
                          e.target.value as LogicOperator
                        )
                      }
                      className="w-full py-1.5 px-2.5 rounded-lg border border-default bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {allowedOperators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value Input (Adapting to question type) */}
                    {opMeta.requiresValue && (
                      <div className="w-full">
                        {/* 1. Yes / No question type */}
                        {question.type === "yes_no" ? (
                          <select
                            value={
                              String(cond.value).toLowerCase() === "true" ||
                              cond.value === "yes" ||
                              cond.value === "Yes"
                                ? "Yes"
                                : "No"
                            }
                            onChange={(e) =>
                              handleUpdateRuleCondition(
                                rule.id,
                                undefined,
                                e.target.value
                              )
                            }
                            className="w-full py-1.5 px-2.5 rounded-lg border border-default bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : /* 2. Choice / Dropdown question types with options */
                        (question.type === "multiple_choice" ||
                            question.type === "dropdown") &&
                          question.properties?.options &&
                          question.properties.options.length > 0 ? (
                          <select
                            value={String(cond.value ?? "")}
                            onChange={(e) =>
                              handleUpdateRuleCondition(
                                rule.id,
                                undefined,
                                e.target.value
                              )
                            }
                            className="w-full py-1.5 px-2.5 rounded-lg border border-default bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="" disabled>
                              Select an option...
                            </option>
                            {question.properties.options.map((opt) => (
                              <option key={opt.id} value={opt.id || opt.label}>
                                {opt.label || `Option ${opt.id}`}
                              </option>
                            ))}
                          </select>
                        ) : /* 3. Number or Rating question types */
                        question.type === "number" || question.type === "rating" ? (
                          <input
                            type="number"
                            value={cond.value !== undefined ? String(cond.value) : ""}
                            onChange={(e) =>
                              handleUpdateRuleCondition(
                                rule.id,
                                undefined,
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            placeholder="Enter number..."
                            className="w-full py-1.5 px-2.5 rounded-lg border border-default bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          /* 4. Text / Email inputs */
                          <input
                            type="text"
                            value={String(cond.value ?? "")}
                            onChange={(e) =>
                              handleUpdateRuleCondition(
                                rule.id,
                                undefined,
                                e.target.value
                              )
                            }
                            placeholder="Enter value to match..."
                            className="w-full py-1.5 px-2.5 rounded-lg border border-default bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* "Then Jump to..." */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-micro font-medium text-muted flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-secondary" />
                    <span>Then jump to</span>
                  </label>

                  <select
                    value={String(targetVal ?? "end")}
                    onChange={(e) =>
                      handleUpdateRuleTarget(rule.id, e.target.value)
                    }
                    className={`w-full py-1.5 px-2.5 rounded-lg border bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary ${
                      !targetValidation.isValid
                        ? "border-amber-500 text-amber-700 dark:text-amber-300"
                        : "border-default"
                    }`}
                  >
                    <optgroup label="Forward questions">
                      {forwardQuestions.map((q) => {
                        const qIdx = questions.findIndex(
                          (orig) => String(orig.id) === String(q.id)
                        );
                        return (
                          <option key={String(q.id)} value={String(q.id)}>
                            Q{qIdx + 1}: {q.title || "Untitled question"}
                          </option>
                        );
                      })}
                      {forwardQuestions.length === 0 && (
                        <option value="" disabled>
                          (No forward questions)
                        </option>
                      )}
                    </optgroup>
                    <optgroup label="Completion">
                      <option value="end">End of form</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Otherwise go to" (logicDefault) */}
      {(rules.length > 0 || logicDefault !== null) && (
        <div className="p-3 rounded-xl border border-default bg-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-micro font-bold text-secondary uppercase tracking-wider">
              Otherwise
            </span>
            {!defaultTargetValidation.isValid && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-nano font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" />
                Invalid target
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-micro text-muted">
              If none of the rules above match, go to:
            </label>
            <select
              value={logicDefault !== null && logicDefault !== undefined ? String(logicDefault) : ""}
              onChange={(e) => handleUpdateDefaultTarget(e.target.value)}
              className={`w-full py-1.5 px-2.5 rounded-lg border bg-surface text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary ${
                !defaultTargetValidation.isValid
                  ? "border-amber-500 text-amber-700 dark:text-amber-300"
                  : "border-default"
              }`}
            >
              <option value="">Next question in order (default)</option>
              <optgroup label="Forward questions">
                {forwardQuestions.map((q) => {
                  const qIdx = questions.findIndex(
                    (orig) => String(orig.id) === String(q.id)
                  );
                  return (
                    <option key={String(q.id)} value={String(q.id)}>
                      Q{qIdx + 1}: {q.title || "Untitled question"}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="Completion">
                <option value="end">End of form</option>
              </optgroup>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
