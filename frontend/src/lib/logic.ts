/**
 * lib/logic.ts — Frontend utilities and validation for conditional logic jumps
 *
 * Implements:
 *   - Operator mappings and allowed operators per question type (matching backend B5a)
 *   - Forward-only target validation
 *   - Client-side DFS cycle detection
 *   - Human-readable rule summaries
 */

import {
  Question,
  QuestionType,
  QuestionProperties,
  LogicOperator,
  LogicRule,
} from "@/types";

export interface OperatorMeta {
  value: LogicOperator;
  label: string;
  requiresValue: boolean;
}

export const LOGIC_OPERATORS: Record<string, OperatorMeta> = {
  equals: { value: "equals", label: "is equal to", requiresValue: true },
  not_equals: { value: "not_equals", label: "is not equal to", requiresValue: true },
  contains: { value: "contains", label: "contains", requiresValue: true },
  "not contains": { value: "not contains", label: "does not contain", requiresValue: true },
  not_contains: { value: "not_contains", label: "does not contain", requiresValue: true },
  greater_than: { value: "greater_than", label: "is greater than", requiresValue: true },
  less_than: { value: "less_than", label: "is less than", requiresValue: true },
  is_answered: { value: "is_answered", label: "is answered", requiresValue: false },
  is_empty: { value: "is_empty", label: "is not answered", requiresValue: false },
};

/**
 * Returns allowed operators for a question type matching backend logic service.
 */
export function getAllowedOperators(
  questionType: QuestionType,
  properties?: QuestionProperties
): OperatorMeta[] {
  const isMulti = properties?.multiple === true;

  if (questionType === "yes_no" || questionType === "dropdown") {
    return [
      LOGIC_OPERATORS.equals,
      LOGIC_OPERATORS.not_equals,
      LOGIC_OPERATORS.is_answered,
      LOGIC_OPERATORS.is_empty,
    ];
  }

  if (questionType === "multiple_choice") {
    if (isMulti) {
      return [
        LOGIC_OPERATORS.contains,
        LOGIC_OPERATORS["not contains"],
        LOGIC_OPERATORS.is_answered,
        LOGIC_OPERATORS.is_empty,
      ];
    }
    return [
      LOGIC_OPERATORS.equals,
      LOGIC_OPERATORS.not_equals,
      LOGIC_OPERATORS.is_answered,
      LOGIC_OPERATORS.is_empty,
    ];
  }

  if (questionType === "number" || questionType === "rating") {
    return [
      LOGIC_OPERATORS.equals,
      LOGIC_OPERATORS.not_equals,
      LOGIC_OPERATORS.greater_than,
      LOGIC_OPERATORS.less_than,
      LOGIC_OPERATORS.is_answered,
      LOGIC_OPERATORS.is_empty,
    ];
  }

  if (
    questionType === "short_text" ||
    questionType === "long_text" ||
    questionType === "email"
  ) {
    return [
      LOGIC_OPERATORS.equals,
      LOGIC_OPERATORS.not_equals,
      LOGIC_OPERATORS.contains,
      LOGIC_OPERATORS.is_answered,
      LOGIC_OPERATORS.is_empty,
    ];
  }

  return [
    LOGIC_OPERATORS.equals,
    LOGIC_OPERATORS.not_equals,
    LOGIC_OPERATORS.is_answered,
    LOGIC_OPERATORS.is_empty,
  ];
}

/**
 * Returns questions strictly after the current question index (forward jumps).
 */
export function getForwardQuestions(
  currentIndex: number,
  questions: Question[]
): Question[] {
  if (currentIndex < 0 || currentIndex >= questions.length) return [];
  return questions.slice(currentIndex + 1);
}

/**
 * Checks whether a jump target is valid (forward-only or 'end').
 */
export function validateTarget(
  targetId: number | string | null | undefined,
  currentQuestionIndex: number,
  questions: Question[]
): { isValid: boolean; error?: string } {
  if (targetId === null || targetId === undefined) {
    return { isValid: true };
  }

  if (String(targetId).toLowerCase() === "end") {
    return { isValid: true };
  }

  const targetIdx = questions.findIndex((q) => String(q.id) === String(targetId));

  if (targetIdx === -1) {
    return {
      isValid: false,
      error: "Target question does not exist or was deleted",
    };
  }

  if (targetIdx <= currentQuestionIndex) {
    return {
      isValid: false,
      error: `Question ${currentQuestionIndex + 1} cannot jump backward or to itself (Q${targetIdx + 1})`,
    };
  }

  return { isValid: true };
}

/**
 * Checks if a question has any configured logic rules or default target.
 */
export function hasQuestionLogic(question: Question): boolean {
  const rules = question.properties?.logic;
  const defaultTarget = question.properties?.logicDefault;
  return Boolean((rules && rules.length > 0) || (defaultTarget !== null && defaultTarget !== undefined));
}

/**
 * Returns user-friendly label for a question (e.g. 'Q2: How old are you?').
 */
export function formatQuestionTitle(
  question: Question,
  index: number
): string {
  const title = question.title?.trim() || "Untitled question";
  return `Q${index + 1}: ${title}`;
}

/**
 * Formats a single rule into human-readable text.
 */
export function formatRuleDescription(
  rule: LogicRule,
  question: Question,
  questions: Question[]
): string {
  const cond = rule.conditions?.[0];
  const opMeta = cond ? LOGIC_OPERATORS[cond.operator] : null;
  const opLabel = opMeta ? opMeta.label : cond?.operator || "matches";

  let valStr = "";
  if (opMeta?.requiresValue && cond?.value !== undefined && cond?.value !== null) {
    if (question.type === "yes_no") {
      valStr = String(cond.value).toLowerCase() === "true" || cond.value === "yes" ? " 'Yes'" : " 'No'";
    } else if (question.properties?.options && Array.isArray(question.properties.options)) {
      const opt = question.properties.options.find(
        (o) => String(o.id) === String(cond.value) || o.label === cond.value
      );
      valStr = ` '${opt ? opt.label : cond.value}'`;
    } else {
      valStr = ` '${cond.value}'`;
    }
  }

  const targetId = rule.action?.target_question_id;
  let targetLabel = "End of form";
  if (targetId && String(targetId).toLowerCase() !== "end") {
    const tIdx = questions.findIndex((q) => String(q.id) === String(targetId));
    if (tIdx !== -1) {
      targetLabel = `Q${tIdx + 1}`;
    } else {
      targetLabel = "Unknown Q";
    }
  }

  return `If answer ${opLabel}${valStr} → ${targetLabel}`;
}

/**
 * Summarizes jump destinations for a question.
 */
export function getQuestionJumpTargets(
  question: Question,
  questions: Question[]
): Array<{ label: string; isEnd: boolean; isInvalid: boolean }> {
  const results: Array<{ label: string; isEnd: boolean; isInvalid: boolean }> = [];
  const currentIdx = questions.findIndex((q) => String(q.id) === String(question.id));

  const rules = question.properties?.logic || [];
  for (const rule of rules) {
    const targetId = rule.action?.target_question_id;
    if (!targetId) continue;
    if (String(targetId).toLowerCase() === "end") {
      results.push({ label: "End", isEnd: true, isInvalid: false });
    } else {
      const tIdx = questions.findIndex((q) => String(q.id) === String(targetId));
      if (tIdx === -1 || tIdx <= currentIdx) {
        results.push({
          label: tIdx !== -1 ? `Q${tIdx + 1}` : "Missing Q",
          isEnd: false,
          isInvalid: true,
        });
      } else {
        results.push({ label: `Q${tIdx + 1}`, isEnd: false, isInvalid: false });
      }
    }
  }

  const logicDefault = question.properties?.logicDefault;
  if (logicDefault) {
    if (String(logicDefault).toLowerCase() === "end") {
      results.push({ label: "Else: End", isEnd: true, isInvalid: false });
    } else {
      const tIdx = questions.findIndex((q) => String(q.id) === String(logicDefault));
      if (tIdx === -1 || tIdx <= currentIdx) {
        results.push({
          label: tIdx !== -1 ? `Else: Q${tIdx + 1}` : "Else: Missing Q",
          isEnd: false,
          isInvalid: true,
        });
      } else {
        results.push({ label: `Else: Q${tIdx + 1}`, isEnd: false, isInvalid: false });
      }
    }
  }

  return results;
}

/**
 * Client-side DFS cycle detector across all rules + defaults + sequential fallthrough.
 */
export function detectCycles(questions: Question[]): string | null {
  if (!questions || questions.length === 0) return null;

  const nodeKeys = questions.map((q) => String(q.id));
  const graph: Record<string, string[]> = {};
  nodeKeys.forEach((k) => (graph[k] = []));

  questions.forEach((q, idx) => {
    const qKey = String(q.id);
    const rules = q.properties?.logic || [];
    const logicDefault = q.properties?.logicDefault;

    // 1. Rules
    rules.forEach((r) => {
      const target = r.action?.target_question_id;
      if (target && String(target).toLowerCase() !== "end") {
        const targetStr = String(target);
        if (nodeKeys.includes(targetStr) && !graph[qKey].includes(targetStr)) {
          graph[qKey].push(targetStr);
        }
      }
    });

    // 2. Default target
    if (logicDefault) {
      if (String(logicDefault).toLowerCase() !== "end") {
        const defStr = String(logicDefault);
        if (nodeKeys.includes(defStr) && !graph[qKey].includes(defStr)) {
          graph[qKey].push(defStr);
        }
      }
    } else {
      // 3. Fallthrough to next sequential question
      if (idx + 1 < questions.length) {
        const nextKey = String(questions[idx + 1].id);
        if (!graph[qKey].includes(nextKey)) {
          graph[qKey].push(nextKey);
        }
      }
    }
  });

  const visited = new Set<string>();
  const recStackSet = new Set<string>();
  const recStackList: string[] = [];

  function dfs(node: string): string[] | null {
    visited.add(node);
    recStackSet.add(node);
    recStackList.push(node);

    for (const neighbor of graph[node] || []) {
      if (recStackSet.has(neighbor)) {
        const startIdx = recStackList.indexOf(neighbor);
        return [...recStackList.slice(startIdx), neighbor];
      }
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor);
        if (cycle) return cycle;
      }
    }

    recStackList.pop();
    recStackSet.delete(node);
    return null;
  }

  for (const node of nodeKeys) {
    if (!visited.has(node)) {
      const cycle = dfs(node);
      if (cycle) {
        const labels = cycle.map((key) => {
          const qIdx = questions.findIndex((q) => String(q.id) === key);
          return qIdx !== -1 ? `Q${qIdx + 1}` : key;
        });
        return labels.join(" -> ");
      }
    }
  }

  return null;
}

function isEmptyValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "y" || s === "1";
  }
  return Boolean(val);
}

function extractChoiceTokens(val: unknown, options: Array<{ id?: string; label?: string }>): Set<string> {
  const tokens = new Set<string>();
  if (val === null || val === undefined) return tokens;
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    if (obj.id !== undefined && obj.id !== null) tokens.add(String(obj.id).trim().toLowerCase());
    if (obj.label !== undefined && obj.label !== null) tokens.add(String(obj.label).trim().toLowerCase());
  } else {
    const vStr = String(val).trim().toLowerCase();
    tokens.add(vStr);
    for (const opt of options) {
      const optId = String(opt.id ?? "").trim().toLowerCase();
      const optLbl = String(opt.label ?? "").trim().toLowerCase();
      if (vStr === optId || vStr === optLbl) {
        if (optId) tokens.add(optId);
        if (optLbl) tokens.add(optLbl);
      }
    }
  }
  return tokens;
}

/**
 * Evaluates a single rule condition against an answer value.
 */
export function evaluateCondition(
  op: LogicOperator,
  ansVal: unknown,
  expected: unknown,
  qType: QuestionType,
  props?: QuestionProperties
): boolean {
  const cleanOp = (op || "").trim().toLowerCase();

  if (cleanOp === "is_answered") return !isEmptyValue(ansVal);
  if (cleanOp === "is_empty") return isEmptyValue(ansVal);

  if (isEmptyValue(ansVal)) {
    if (cleanOp === "not_equals") return !isEmptyValue(expected);
    if (cleanOp === "not contains" || cleanOp === "not_contains") return true;
    return false;
  }

  if (cleanOp === "equals") {
    if (qType === "yes_no" || typeof ansVal === "boolean" || typeof expected === "boolean") {
      return toBool(ansVal) === toBool(expected);
    }
    if (qType === "number" || qType === "rating") {
      const n1 = Number(ansVal);
      const n2 = Number(expected);
      if (!isNaN(n1) && !isNaN(n2)) return n1 === n2;
    }
    // Options matching by ID or label
    const options = (props?.options || []) as Array<{ id?: string; label?: string }>;
    const actTokens = extractChoiceTokens(ansVal, options);
    const expTokens = extractChoiceTokens(expected, options);
    for (const t of actTokens) {
      if (expTokens.has(t)) return true;
    }
    return String(ansVal).trim().toLowerCase() === String(expected).trim().toLowerCase();
  }

  if (cleanOp === "not_equals") {
    return !evaluateCondition("equals", ansVal, expected, qType, props);
  }

  if (cleanOp === "greater_than") {
    const n1 = Number(ansVal);
    const n2 = Number(expected);
    return !isNaN(n1) && !isNaN(n2) && n1 > n2;
  }

  if (cleanOp === "less_than") {
    const n1 = Number(ansVal);
    const n2 = Number(expected);
    return !isNaN(n1) && !isNaN(n2) && n1 < n2;
  }

  if (cleanOp === "contains") {
    const options = (props?.options || []) as Array<{ id?: string; label?: string }>;
    const expTokens = extractChoiceTokens(expected, options);

    if (Array.isArray(ansVal)) {
      for (const item of ansVal) {
        const itemTokens = extractChoiceTokens(item, options);
        for (const t of itemTokens) {
          if (expTokens.has(t)) return true;
        }
      }
      return false;
    }
    const expStr = String(expected ?? "").trim().toLowerCase();
    return String(ansVal ?? "").toLowerCase().includes(expStr);
  }

  if (cleanOp === "not contains" || cleanOp === "not_contains") {
    return !evaluateCondition("contains", ansVal, expected, qType, props);
  }

  return false;
}

/**
 * Pure evaluator returning the next question id or 'end'.
 */
export function getNextQuestion(
  currentQuestion: Question,
  answers: Record<string | number, unknown>,
  orderedQuestions: Question[]
): number | string | "end" {
  const ansVal = answers[currentQuestion.id] ?? answers[String(currentQuestion.id)];
  const rules = currentQuestion.properties?.logic || [];
  const qType = currentQuestion.type;
  const props = currentQuestion.properties;

  // 1. First matching rule wins
  for (const rule of rules) {
    const conditions = rule.conditions || [];
    const matchType = (rule.match || "all").toLowerCase();

    if (conditions.length === 0) {
      if (rule.action?.target_question_id) {
        return rule.action.target_question_id;
      }
      continue;
    }

    const results = conditions.map((c) =>
      evaluateCondition(c.operator, ansVal, c.value, qType, props)
    );
    const matched = matchType === "any" ? results.some(Boolean) : results.every(Boolean);

    if (matched && rule.action?.target_question_id) {
      return rule.action.target_question_id;
    }
  }

  // 2. logicDefault if specified
  const logicDefault = currentQuestion.properties?.logicDefault;
  if (logicDefault !== null && logicDefault !== undefined && logicDefault !== "") {
    return logicDefault;
  }

  // 3. Fall through to sequential next
  const currIdx = orderedQuestions.findIndex(
    (q) => String(q.id) === String(currentQuestion.id)
  );
  if (currIdx !== -1 && currIdx + 1 < orderedQuestions.length) {
    return orderedQuestions[currIdx + 1].id;
  }

  return "end";
}

/**
 * Computes the visited path walking from question 1 based on submitted answers.
 */
export function computeVisitedPath(
  orderedQuestions: Question[],
  answers: Record<string | number, unknown>
): Question[] {
  if (!orderedQuestions || orderedQuestions.length === 0) return [];

  const path: Question[] = [];
  const visitedKeys = new Set<string>();
  let current: Question | null = orderedQuestions[0];

  while (current !== null) {
    const cId = String(current.id);
    if (visitedKeys.has(cId)) {
      break;
    }
    path.push(current);
    visitedKeys.add(cId);

    const nextId = getNextQuestion(current, answers, orderedQuestions);
    if (nextId === "end" || nextId === null || nextId === undefined) {
      break;
    }

    const nextQ = orderedQuestions.find((q) => String(q.id) === String(nextId)) || null;
    current = nextQ;
  }

  return path;
}

/**
 * Computes projected path forward starting from the current visited stack.
 * If future questions aren't answered yet, falls through sequentially or via defaults.
 */
export function computeProjectedPath(
  orderedQuestions: Question[],
  answers: Record<string | number, unknown>,
  currentPath: string[] = []
): Question[] {
  if (!orderedQuestions || orderedQuestions.length === 0) return [];

  const projected: Question[] = [];
  const visitedKeys = new Set<string>();

  for (const id of currentPath) {
    const q = orderedQuestions.find((item) => String(item.id) === String(id));
    if (q && !visitedKeys.has(String(q.id))) {
      projected.push(q);
      visitedKeys.add(String(q.id));
    }
  }

  let current: Question | null =
    projected.length > 0 ? projected[projected.length - 1] : orderedQuestions[0];

  if (projected.length === 0 && current) {
    projected.push(current);
    visitedKeys.add(String(current.id));
  }

  while (current !== null) {
    const nextId = getNextQuestion(current, answers, orderedQuestions);
    if (nextId === "end" || nextId === null || nextId === undefined) {
      break;
    }

    const nextQ = orderedQuestions.find((q) => String(q.id) === String(nextId));
    if (!nextQ || visitedKeys.has(String(nextQ.id))) {
      break;
    }

    projected.push(nextQ);
    visitedKeys.add(String(nextQ.id));
    current = nextQ;
  }

  return projected;
}

/**
 * When an earlier answer changes, prunes any visited steps and answers
 * for questions that are no longer part of the projected path.
 */
export function pruneAnswersAfterAnswerChange(
  orderedQuestions: Question[],
  currentQuestionId: string | number,
  newAnswers: Record<string | number, unknown>,
  currentPath: string[]
): { prunedPath: string[]; prunedAnswers: Record<string | number, unknown> } {
  const qIdStr = String(currentQuestionId);
  const currIdx = currentPath.findIndex((id) => String(id) === qIdStr);
  const truncatedPath = currIdx !== -1 ? currentPath.slice(0, currIdx + 1) : [qIdStr];

  const projected = computeProjectedPath(orderedQuestions, newAnswers, truncatedPath);
  const allowedQuestionIds = new Set(projected.map((q) => String(q.id)));

  const prunedAnswers: Record<string | number, unknown> = {};
  for (const [k, v] of Object.entries(newAnswers)) {
    if (allowedQuestionIds.has(String(k))) {
      prunedAnswers[k] = v;
    }
  }

  return { prunedPath: truncatedPath, prunedAnswers };
}

/**
 * Computes progress percentage based on projected path length and current step index.
 * Avoids jumping backwards when branches shorten the form.
 */
export function calculateProjectedProgress(
  currentStepIndex: number, // 1-based index in visited path
  projectedLength: number,
  previousMaxPercent: number = 0
): number {
  if (projectedLength <= 0) return 100;
  const rawPercent = Math.min(100, Math.round((currentStepIndex / projectedLength) * 100));
  return Math.max(previousMaxPercent, rawPercent);
}


