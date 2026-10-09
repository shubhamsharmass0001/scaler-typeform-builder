import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  getNextQuestion,
  computeVisitedPath,
  computeProjectedPath,
  pruneAnswersAfterAnswerChange,
  calculateProjectedProgress,
} from "./logic";
import { Question } from "@/types";

describe("evaluateCondition", () => {
  it("evaluates equals and not_equals on choice options", () => {
    const props = {
      options: [
        { id: "opt_yes", label: "Yes" },
        { id: "opt_no", label: "No" },
      ],
    };

    // By ID
    expect(evaluateCondition("equals", "opt_yes", "opt_yes", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("equals", "opt_no", "opt_yes", "multiple_choice", props)).toBe(false);

    // By Label to ID
    expect(evaluateCondition("equals", "Yes", "opt_yes", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("equals", "opt_yes", "Yes", "multiple_choice", props)).toBe(true);

    // not_equals
    expect(evaluateCondition("not_equals", "opt_no", "opt_yes", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("not_equals", "opt_yes", "opt_yes", "multiple_choice", props)).toBe(false);
  });

  it("evaluates yes_no booleans", () => {
    expect(evaluateCondition("equals", true, "yes", "yes_no")).toBe(true);
    expect(evaluateCondition("equals", "yes", true, "yes_no")).toBe(true);
    expect(evaluateCondition("equals", false, "no", "yes_no")).toBe(true);
    expect(evaluateCondition("equals", true, "no", "yes_no")).toBe(false);
    expect(evaluateCondition("not_equals", true, "no", "yes_no")).toBe(true);
  });

  it("evaluates number and rating comparisons", () => {
    expect(evaluateCondition("equals", 5, "5", "number")).toBe(true);
    expect(evaluateCondition("equals", 5.0, 5, "number")).toBe(true);
    expect(evaluateCondition("not_equals", 4, 5, "number")).toBe(true);

    expect(evaluateCondition("greater_than", 10, 5, "number")).toBe(true);
    expect(evaluateCondition("greater_than", 5, 10, "number")).toBe(false);
    expect(evaluateCondition("less_than", 3, 5, "rating")).toBe(true);
    expect(evaluateCondition("less_than", 5, 3, "rating")).toBe(false);

    expect(evaluateCondition("greater_than", null, 5, "number")).toBe(false);
    expect(evaluateCondition("less_than", null, 5, "number")).toBe(false);
  });

  it("evaluates multi-select contains and not contains", () => {
    const props = {
      multiple: true,
      options: [
        { id: "opt_a", label: "Option A" },
        { id: "opt_b", label: "Option B" },
        { id: "opt_c", label: "Option C" },
      ],
    };
    const answers = ["opt_a", "opt_b"];

    expect(evaluateCondition("contains", answers, "opt_a", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("contains", answers, "opt_c", "multiple_choice", props)).toBe(false);
    expect(evaluateCondition("not contains", answers, "opt_c", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("not_contains", answers, "opt_c", "multiple_choice", props)).toBe(true);
    expect(evaluateCondition("not contains", answers, "opt_a", "multiple_choice", props)).toBe(false);
  });

  it("evaluates text and email contains and equals", () => {
    expect(evaluateCondition("contains", "Hello world from Scaler", "scaler", "short_text")).toBe(true);
    expect(evaluateCondition("contains", "Hello world", "scaler", "short_text")).toBe(false);

    expect(evaluateCondition("equals", "user@test.com", "USER@TEST.COM", "email")).toBe(true);
    expect(evaluateCondition("contains", "user@company.org", "company", "email")).toBe(true);
  });

  it("evaluates is_answered and is_empty", () => {
    expect(evaluateCondition("is_answered", "filled", null, "short_text")).toBe(true);
    expect(evaluateCondition("is_answered", "", null, "short_text")).toBe(false);
    expect(evaluateCondition("is_answered", null, null, "short_text")).toBe(false);
    expect(evaluateCondition("is_answered", [], null, "multiple_choice")).toBe(false);
    expect(evaluateCondition("is_answered", ["opt_1"], null, "multiple_choice")).toBe(true);

    expect(evaluateCondition("is_empty", null, null, "number")).toBe(true);
    expect(evaluateCondition("is_empty", "", null, "short_text")).toBe(true);
    expect(evaluateCondition("is_empty", [], null, "multiple_choice")).toBe(true);
    expect(evaluateCondition("is_empty", 42, null, "number")).toBe(false);
  });
});

describe("getNextQuestion & Rule Evaluation", () => {
  it("follows multi-rule priority: first match wins", () => {
    const q1: Question = {
      id: 1,
      type: "number",
      title: "Age",
      description: null,
      required: false,
      position: 0,
      properties: {
        logic: [
          {
            id: "rule_minor",
            conditions: [{ operator: "less_than", value: 18 }],
            match: "all",
            action: { type: "jump", target_question_id: 10 },
          },
          {
            id: "rule_adult",
            conditions: [{ operator: "greater_than", value: 0 }],
            match: "all",
            action: { type: "jump", target_question_id: 20 },
          },
        ],
      },
    };
    const q10: Question = { id: 10, type: "short_text", title: "Minor", description: null, required: false, position: 1, properties: {} };
    const q20: Question = { id: 20, type: "short_text", title: "Adult", description: null, required: false, position: 2, properties: {} };
    const ordered = [q1, q10, q20];

    // Age = 15: matches rule_minor first
    expect(getNextQuestion(q1, { 1: 15 }, ordered)).toBe(10);
    // Age = 25: matches rule_adult
    expect(getNextQuestion(q1, { 1: 25 }, ordered)).toBe(20);
  });

  it("uses logicDefault when no rule matches", () => {
    const q1: Question = {
      id: 1,
      type: "multiple_choice",
      title: "Plan",
      description: null,
      required: false,
      position: 0,
      properties: {
        logic: [
          {
            id: "r1",
            conditions: [{ operator: "equals", value: "vip" }],
            match: "all",
            action: { type: "jump", target_question_id: 5 },
          },
        ],
        logicDefault: 3,
      },
    };
    const q2: Question = { id: 2, type: "short_text", title: "Q2", description: null, required: false, position: 1, properties: {} };
    const q3: Question = { id: 3, type: "short_text", title: "Q3", description: null, required: false, position: 2, properties: {} };
    const q5: Question = { id: 5, type: "short_text", title: "Q5", description: null, required: false, position: 3, properties: {} };
    const ordered = [q1, q2, q3, q5];

    expect(getNextQuestion(q1, { 1: "vip" }, ordered)).toBe(5);
    expect(getNextQuestion(q1, { 1: "basic" }, ordered)).toBe(3);
  });

  it("falls through sequentially when logicDefault is null", () => {
    const q1: Question = {
      id: 1,
      type: "multiple_choice",
      title: "Q1",
      description: null,
      required: false,
      position: 0,
      properties: {
        logic: [
          {
            id: "r1",
            conditions: [{ operator: "equals", value: "vip" }],
            match: "all",
            action: { type: "jump", target_question_id: 3 },
          },
        ],
        logicDefault: null,
      },
    };
    const q2: Question = { id: 2, type: "short_text", title: "Q2", description: null, required: false, position: 1, properties: {} };
    const q3: Question = { id: 3, type: "short_text", title: "Q3", description: null, required: false, position: 2, properties: {} };
    const ordered = [q1, q2, q3];

    expect(getNextQuestion(q1, { 1: "basic" }, ordered)).toBe(2);
  });

  it("jumps to end correctly", () => {
    const q1: Question = {
      id: 1,
      type: "yes_no",
      title: "Disqualify?",
      description: null,
      required: false,
      position: 0,
      properties: {
        logic: [
          {
            id: "rule_dq",
            conditions: [{ operator: "equals", value: "No" }],
            match: "all",
            action: { type: "jump", target_question_id: "end" },
          },
        ],
      },
    };
    const q2: Question = { id: 2, type: "short_text", title: "Q2", description: null, required: false, position: 1, properties: {} };
    const ordered = [q1, q2];

    expect(getNextQuestion(q1, { 1: "No" }, ordered)).toBe("end");
    expect(getNextQuestion(q1, { 1: "Yes" }, ordered)).toBe(2);
  });
});

describe("Path & Answer Pruning", () => {
  it("computes visited path from answers", () => {
    const q1: Question = {
      id: 1,
      type: "yes_no",
      title: "Q1",
      description: null,
      required: false,
      position: 0,
      properties: {
        logic: [
          {
            id: "r1",
            conditions: [{ operator: "equals", value: "No" }],
            match: "all",
            action: { type: "jump", target_question_id: "end" },
          },
        ],
      },
    };
    const q2: Question = { id: 2, type: "short_text", title: "Q2", description: null, required: false, position: 1, properties: {} };
    const q3: Question = { id: 3, type: "short_text", title: "Q3", description: null, required: false, position: 2, properties: {} };
    const ordered = [q1, q2, q3];

    // If Q1 = No, jumps to end -> visited path is [Q1]
    const pathNo = computeVisitedPath(ordered, { 1: "No" });
    expect(pathNo.map((q) => q.id)).toEqual([1]);

    // If Q1 = Yes, continues to Q2 -> Q3
    const pathYes = computeVisitedPath(ordered, { 1: "Yes" });
    expect(pathYes.map((q) => q.id)).toEqual([1, 2, 3]);
  });

  it("discards answers for bypassed questions when user changes an earlier answer", () => {
    const q1: Question = { id: 1, type: "short_text", title: "Q1", description: null, required: false, position: 0, properties: {} };
    const q2: Question = {
      id: 2,
      type: "yes_no",
      title: "Q2",
      description: null,
      required: false,
      position: 1,
      properties: {
        logic: [
          {
            id: "r2",
            conditions: [{ operator: "equals", value: "No" }],
            match: "all",
            action: { type: "jump", target_question_id: "end" },
          },
        ],
      },
    };
    const q3: Question = { id: 3, type: "short_text", title: "Q3", description: null, required: false, position: 2, properties: {} };
    const q4: Question = { id: 4, type: "short_text", title: "Q4", description: null, required: false, position: 3, properties: {} };
    const ordered = [q1, q2, q3, q4];

    // Respondent had answered Q1, Q2=Yes, Q3, Q4:
    const initialAnswers = { 1: "Hello", 2: "Yes", 3: "Ans 3", 4: "Ans 4" };
    const currentPath = ["1", "2"]; // User walked back to Q2

    // Now respondent changes Q2 to "No"
    const newAnswers = { ...initialAnswers, 2: "No" };
    const { prunedPath, prunedAnswers } = pruneAnswersAfterAnswerChange(ordered, 2, newAnswers, currentPath);

    expect(prunedPath).toEqual(["1", "2"]);
    // Since Q2=No jumps to end, Q3 and Q4 are bypassed and MUST BE DISCARDED!
    expect(prunedAnswers).toEqual({ 1: "Hello", 2: "No" });
    expect(prunedAnswers[3]).toBeUndefined();
    expect(prunedAnswers[4]).toBeUndefined();
  });

  it("calculates projected progress and avoids jumping backwards", () => {
    // Current step 2 of 4 -> 50%
    const p1 = calculateProjectedProgress(2, 4, 0);
    expect(p1).toBe(50);

    // If branch shortens expected total to 2, step 1 of 2 -> 50% (does not drop below 50%)
    const p2 = calculateProjectedProgress(1, 2, p1);
    expect(p2).toBe(50);

    // Moving forward to step 2 of 2 -> 100%
    const p3 = calculateProjectedProgress(2, 2, p2);
    expect(p3).toBe(100);
  });
});
