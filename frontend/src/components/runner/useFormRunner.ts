"use client";

/**
 * components/runner/useFormRunner.ts — Form runner state management hook
 *
 * Encapsulates all respondent state logic separate from visual presentation:
 * - Maintains a `path: string[]` stack of visited question IDs instead of a plain index
 * - Forward = pushes evaluated next ID via logic jumps
 * - Back/ArrowUp = pops from path stack, retracing the exact questions seen
 * - Answer changes recompute projected path and discard answers for questions no longer on the path
 * - Progress bar is computed from projected path and never jumps backwards
 * - Jump to end goes straight to Submit then Thank You screen
 * - Submits only the answers on the visited path
 * - Evaluates preview mode and live mode identically
 * - Restores `path` and answers from sessionStorage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Form, Question, PublicForm } from "@/types";
import { validateQuestionAnswer, isEmpty } from "@/lib/validation";
import {
  startPublicSession,
  submitPublicAnswers,
  recordPublicProgress,
  ApiError,
} from "@/lib/api";
import {
  getNextQuestion,
  computeProjectedPath,
  pruneAnswersAfterAnswerChange,
  calculateProjectedProgress,
} from "@/lib/logic";

export type RunnerStatus = "idle" | "submitting" | "submitted" | "error";

export interface UseFormRunnerOptions {
  mode?: "preview" | "live";
  form: Form | PublicForm | null;
  questions?: Question[];
  onComplete?: (answers: Record<string | number, unknown>) => void;
}

export function useFormRunner({
  mode = "preview",
  form,
  questions = [],
  onComplete,
}: UseFormRunnerOptions) {
  const storageKey = useMemo(() => {
    const slug = form?.slug || (form?.id ? `id_${form.id}` : "default");
    return `formly_session_${slug}`;
  }, [form?.slug, form?.id]);

  const hasWelcome = useMemo(() => {
    return Boolean(form?.welcome_title || form?.welcome_description);
  }, [form]);

  // Initial path: empty if welcome screen exists, otherwise starts with Question 1
  const initialPath = useMemo(() => {
    if (hasWelcome) return [];
    return questions.length > 0 ? [String(questions[0].id)] : [];
  }, [hasWelcome, questions]);

  const [path, setPath] = useState<string[]>(initialPath);
  const [onWelcome, setOnWelcome] = useState<boolean>(hasWelcome);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string | number, unknown>>({});
  const [errors, setErrors] = useState<Record<string | number, string>>({});
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [shakeQuestionId, setShakeQuestionId] = useState<string | number | null>(null);
  const [maxProgressPercent, setMaxProgressPercent] = useState<number>(0);

  // Respondent session ID for live forms
  const [sessionId, setSessionId] = useState<number | null>(null);
  const sessionStartedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isRestoredRef = useRef(false);

  // Sync initial path when questions load if path was empty
  useEffect(() => {
    if (!hasWelcome && path.length === 0 && questions.length > 0 && !isRestoredRef.current) {
      setPath([String(questions[0].id)]);
      setOnWelcome(false);
    }
  }, [hasWelcome, path.length, questions]);

  // Screen resolution
  const isWelcome = onWelcome && hasWelcome && status !== "submitted";
  const isThankYou = status === "submitted";

  const currentQuestionId = useMemo(() => {
    if (isWelcome || isThankYou || path.length === 0) return null;
    return path[path.length - 1];
  }, [isWelcome, isThankYou, path]);

  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null;
    return questions.find((q) => String(q.id) === String(currentQuestionId)) || null;
  }, [currentQuestionId, questions]);

  const questionIndex = useMemo(() => {
    if (!currentQuestion) return -1;
    return questions.findIndex((q) => String(q.id) === String(currentQuestion.id));
  }, [currentQuestion, questions]);

  // Is this logically or sequentially the last question
  const isLastQuestion = useMemo(() => {
    if (questions.length === 0) return true;
    if (!currentQuestion) return false;
    const nextTarget = getNextQuestion(currentQuestion, answers, questions);
    return String(nextTarget).toLowerCase() === "end" || questionIndex === questions.length - 1;
  }, [questions, currentQuestion, answers, questionIndex]);

  // Total steps for UI bounds
  const totalSteps = useMemo(() => {
    return (hasWelcome ? 1 : 0) + questions.length + 1; // +1 for thank-you
  }, [hasWelcome, questions.length]);

  // currentIndex mapping for backwards compatibility with UI components
  const currentIndex = useMemo(() => {
    if (isWelcome) return 0;
    if (isThankYou) return totalSteps - 1;
    return (hasWelcome ? 1 : 0) + Math.max(0, path.length - 1);
  }, [isWelcome, isThankYou, totalSteps, hasWelcome, path.length]);

  // Projected path and forward progress calculation
  const projectedPath = useMemo(() => {
    return computeProjectedPath(questions, answers, path);
  }, [questions, answers, path]);

  const progressPercent = useMemo(() => {
    if (isThankYou) return 100;
    if (isWelcome) return 0;
    const currentStepPos = path.length;
    const expectedLength = Math.max(1, projectedPath.length);
    return calculateProjectedProgress(currentStepPos, expectedLength, maxProgressPercent);
  }, [isThankYou, isWelcome, path.length, projectedPath.length, maxProgressPercent]);

  // Ensure progress never jumps backwards
  useEffect(() => {
    if (progressPercent > maxProgressPercent) {
      setMaxProgressPercent(progressPercent);
    }
  }, [progressPercent, maxProgressPercent]);

  const answeredCount = useMemo(() => {
    return path.filter((id) => !isEmpty(answers[id])).length;
  }, [path, answers]);

  // Restore state from sessionStorage on initial mount (in live mode)
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "live" || isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const savedData = sessionStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (Array.isArray(parsed.path) && parsed.path.length > 0) {
          const validPath = parsed.path.filter((id: string) =>
            questions.some((q) => String(q.id) === String(id))
          );
          if (validPath.length > 0) {
            setPath(validPath);
            setOnWelcome(false);
          }
        }
        if (typeof parsed.onWelcome === "boolean") {
          setOnWelcome(parsed.onWelcome);
        }
        if (typeof parsed.maxProgressPercent === "number") {
          setMaxProgressPercent(parsed.maxProgressPercent);
        }
        if (typeof parsed.sessionId === "number") {
          setSessionId(parsed.sessionId);
          sessionStartedRef.current = true;
        }
      }
    } catch (e) {
      console.warn("Failed to restore session from sessionStorage:", e);
    }
  }, [mode, storageKey, questions]);

  // Sync state to sessionStorage whenever answers or path change (in live mode)
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "live" || status === "submitted") return;

    try {
      if (Object.keys(answers).length > 0 || path.length > 0 || !onWelcome) {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            answers,
            path,
            onWelcome,
            sessionId,
            maxProgressPercent,
          })
        );
      }
    } catch {
      // Ignore quota errors
    }
  }, [mode, storageKey, answers, path, onWelcome, sessionId, maxProgressPercent, status]);

  // Trigger start session when leaving welcome or on first interaction (live mode only)
  const initSessionIfNeeded = useCallback(async (): Promise<number | null> => {
    if (mode === "live" && form?.slug && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      try {
        const result = await startPublicSession(form.slug);
        setSessionId(result.response_id);
        return result.response_id;
      } catch (err) {
        console.warn("Could not start respondent session tracking:", err);
      }
    }
    return sessionId;
  }, [mode, form?.slug, sessionId]);

  // Update answer: recompute path from this point and discard answers for bypassed questions
  const setAnswer = useCallback(
    (questionId: string | number, value: unknown) => {
      const qIdStr = String(questionId);

      setAnswers((prev) => {
        const updated = { ...prev, [qIdStr]: value, [Number(questionId)]: value };
        const { prunedPath, prunedAnswers } = pruneAnswersAfterAnswerChange(
          questions,
          questionId,
          updated,
          path
        );

        if (prunedPath.length !== path.length) {
          setPath(prunedPath);
        }
        return prunedAnswers;
      });

      // Clear validation error on change
      setErrors((prev) => {
        if (prev[qIdStr] || prev[Number(questionId)]) {
          const next = { ...prev };
          delete next[qIdStr];
          delete next[Number(questionId)];
          return next;
        }
        return prev;
      });

      setShakeQuestionId((prev) => (prev === questionId ? null : prev));
    },
    [questions, path]
  );

  // Trigger shake animation for validation feedback
  const triggerShake = useCallback((questionId: string | number) => {
    setShakeQuestionId(questionId);
    setTimeout(() => {
      setShakeQuestionId(null);
    }, 500);
  }, []);

  // Jump to next step with validation & logic jump evaluation
  const goToNext = useCallback(async (): Promise<boolean> => {
    if (isSubmittingRef.current || status === "submitting") {
      return false;
    }

    // Edge case: form has 0 questions
    if (questions.length === 0) {
      setDirection(1);
      setStatus("submitted");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(storageKey);
      }
      return true;
    }

    // 1. Welcome screen
    if (isWelcome) {
      setDirection(1);
      setOnWelcome(false);
      setPath([String(questions[0].id)]);
      initSessionIfNeeded();
      return true;
    }

    // 2. Question step
    if (currentQuestion) {
      const qVal = answers[currentQuestion.id] ?? answers[String(currentQuestion.id)];
      const validation = validateQuestionAnswer(currentQuestion, qVal);

      if (!validation.isValid) {
        setErrors((prev) => ({
          ...prev,
          [currentQuestion.id]: validation.error || "Please answer this question",
        }));
        triggerShake(currentQuestion.id);
        return false;
      }

      // Clear error for this question
      setErrors((prev) => {
        if (prev[currentQuestion.id]) {
          const next = { ...prev };
          delete next[currentQuestion.id];
          return next;
        }
        return prev;
      });

      // Evaluate conditional logic jump
      const nextTarget = getNextQuestion(currentQuestion, answers, questions);
      const isJumpToEnd = String(nextTarget).toLowerCase() === "end";

      // If jumping to end or at last question with end target: Submit immediately
      if (isJumpToEnd || (questionIndex === questions.length - 1 && nextTarget === "end")) {
        if (isSubmittingRef.current) return false;

        // Preview Mode
        if (mode === "preview") {
          setStatus("submitted");
          setDirection(1);
          onComplete?.(answers);
          return true;
        }

        // Live Mode Submission (submit ONLY answers on the visited path)
        if (!form?.slug) {
          setStatus("submitted");
          setDirection(1);
          onComplete?.(answers);
          return true;
        }

        isSubmittingRef.current = true;
        setStatus("submitting");
        setSubmitErrorMessage(null);

        try {
          let activeSessionId = sessionId;
          if (!activeSessionId) {
            activeSessionId = await initSessionIfNeeded();
          }

          // Build answers payload exclusively from questions on the visited path
          const submitPayload = {
            response_id: activeSessionId,
            answers: path.map((qId) => {
              const rawVal = answers[qId] ?? answers[Number(qId)] ?? null;
              const val =
                rawVal && typeof rawVal === "object" && "upload_id" in rawVal
                  ? (rawVal as { upload_id: unknown }).upload_id
                  : rawVal;
              return {
                question_id: Number(qId),
                value: val,
              };
            }),
          };

          await submitPublicAnswers(form.slug, submitPayload);
          setStatus("submitted");
          setDirection(1);

          if (typeof window !== "undefined") {
            sessionStorage.removeItem(storageKey);
          }

          onComplete?.(answers);
          return true;
        } catch (err) {
          isSubmittingRef.current = false;
          setStatus("error");

          if (err instanceof ApiError && err.errors) {
            setErrors(err.errors);
            const firstErrQId = path.find(
              (id) => err.errors && (id in err.errors || String(id) in err.errors)
            );
            if (firstErrQId) {
              const errIdx = path.indexOf(firstErrQId);
              setPath(path.slice(0, errIdx + 1));
              setDirection(-1);
              triggerShake(firstErrQId);
            }
            setSubmitErrorMessage(Object.values(err.errors)[0]);
          } else {
            const errorMsg =
              err instanceof Error ? err.message : "Network error. Please try again.";
            setSubmitErrorMessage(errorMsg);
            toast.error(errorMsg);
          }
          return false;
        }
      }

      // Not jumping to end: resolve next target question
      const targetQ = questions.find((q) => String(q.id) === String(nextTarget));
      const nextQ = targetQ || (questionIndex + 1 < questions.length ? questions[questionIndex + 1] : null);

      if (nextQ) {
        setDirection(1);
        setPath((prev) => [...prev, String(nextQ.id)]);

        // Record drop-off progress in live mode
        const formSlug = form?.slug;
        if (mode === "live" && formSlug) {
          const targetQId = Number(nextQ.id);
          (async () => {
            try {
              let sid = sessionId;
              if (!sid) sid = await initSessionIfNeeded();
              if (sid && formSlug) {
                recordPublicProgress(formSlug, {
                  response_id: sid,
                  last_question_id: targetQId,
                }).catch(() => {});
              }
            } catch {
              // best-effort
            }
          })();
        }

        return true;
      }

      // If no next question exists, submit
      if (mode === "preview") {
        setStatus("submitted");
        setDirection(1);
        onComplete?.(answers);
        return true;
      }
    }

    return false;
  }, [
    isWelcome,
    currentQuestion,
    answers,
    triggerShake,
    mode,
    form?.slug,
    sessionId,
    questions,
    questionIndex,
    path,
    status,
    storageKey,
    onComplete,
    initSessionIfNeeded,
  ]);

  // Jump to previous step: Pop from visited path stack
  const goToPrev = useCallback(() => {
    if (status === "submitting" || status === "submitted") return;

    if (path.length > 1) {
      setDirection(-1);
      setPath((prev) => prev.slice(0, -1));
      return;
    }

    if (path.length === 1) {
      if (hasWelcome) {
        setDirection(-1);
        setOnWelcome(true);
        setPath([]);
      }
    }
  }, [status, path.length, hasWelcome]);

  // Jump to specific index (supporting direct jumps)
  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        if (hasWelcome && index === 0) {
          setDirection(-1);
          setOnWelcome(true);
          setPath([]);
          return;
        }

        const qIdx = hasWelcome ? index - 1 : index;
        if (qIdx >= 0 && qIdx < questions.length) {
          const targetQ = questions[qIdx];
          setDirection(index > currentIndex ? 1 : -1);
          setOnWelcome(false);
          // If question is in path, pop to it; else start/replace with it
          const inPathIdx = path.findIndex((id) => String(id) === String(targetQ.id));
          if (inPathIdx !== -1) {
            setPath(path.slice(0, inPathIdx + 1));
          } else {
            setPath((prev) => [...prev, String(targetQ.id)]);
          }
        }
      }
    },
    [totalSteps, hasWelcome, questions, currentIndex, path]
  );

  // Restart questionnaire
  const restart = useCallback(() => {
    isSubmittingRef.current = false;
    setDirection(-1);
    setOnWelcome(hasWelcome);
    setPath(hasWelcome ? [] : questions.length > 0 ? [String(questions[0].id)] : []);
    setMaxProgressPercent(0);
    setStatus("idle");
    setSubmitErrorMessage(null);
    setErrors({});
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey);
    }
  }, [hasWelcome, questions, storageKey]);

  return {
    currentIndex,
    direction,
    answers,
    errors,
    status,
    submitErrorMessage,
    shakeQuestionId,
    sessionId,
    path,
    // Step calculations
    hasWelcome,
    totalSteps,
    isWelcome,
    isThankYou,
    questionIndex,
    currentQuestion,
    isLastQuestion,
    answeredCount,
    progressPercent,
    // Actions
    setAnswer,
    goToNext,
    goToPrev,
    goToIndex,
    restart,
  };
}
