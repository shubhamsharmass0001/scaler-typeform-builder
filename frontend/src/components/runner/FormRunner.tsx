"use client";

/**
 * components/runner/FormRunner.tsx — High-fidelity Respondent Flow
 *
 * Implements the respondent experience matching Typeform's design and UX:
 * - Flow states: welcome -> question 1..N -> thank-you
 * - Theme tokens applied via CSS variables & inline styles
 * - Direction-driven slide transitions via framer-motion with exact spec:
 *   - Exit: translateY(-40px) + opacity 0, 250ms
 *   - Enter: from translateY(40px) + opacity 0, 350ms, easeOut
 *   - Back reverses directions (-40px on exit, +40px on enter)
 *   - Stagger: title first (0ms), description (+50ms), input (+100ms)
 *   - Progress bar: 400ms ease
 *   - Transition lock ref to prevent double-advance
 * - Underline inputs with autofocus post-transition
 * - Inline validation errors with slide/fade and input shake animation
 * - Choice / Yes-No auto-advance after 400ms (single-select only)
 * - Long text: Enter inserts regular newline, OK advances
 * - Scroll lock on body to avoid scrollbar flicker
 * - Clean browser back navigation
 * - Live regions announcing validation errors and question changes
 */

import React, { useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  ThumbsUp,
} from "lucide-react";
import { Form, Question, PublicForm } from "@/types";
import { getThemeStyles, ThemeFontLoader } from "@/lib/themes";
import { useFormRunner } from "./useFormRunner";
import { RUNNER_ANIMATION } from "./animationConstants";
import { TextInput } from "./inputs/TextInput";
import { LongTextInput } from "./inputs/LongTextInput";
import { MultipleChoiceInput } from "./inputs/MultipleChoiceInput";
import { YesNoInput } from "./inputs/YesNoInput";
import { RatingInput } from "./inputs/RatingInput";
import { DropdownInput } from "./inputs/DropdownInput";
import { FileUploadInput } from "./inputs/FileUploadInput";

export interface FormRunnerProps {
  mode?: "preview" | "live";
  form: Form | PublicForm | null;
  questions?: Question[];
  onComplete?: (answers: Record<string | number, unknown>) => void;
  isMobilePreview?: boolean;
}

/**
 * Line-art SVG matching Typeform Welcome screen reference (Screenshot 1)
 */
function WelcomeIllustration({ className = "w-36 h-28" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Sun with geometric rays */}
      <circle cx="100" cy="55" r="16" />
      <path d="M100 32v-5M100 83v-5M77 55h-5M128 55h-5M84 39l-4-4M120 71l-4-4M84 71l-4 4M120 39l-4 4" />

      {/* Clouds */}
      <path d="M50 48a12 12 0 0 1 22-4 10 10 0 0 1 14 9h-36z" strokeWidth="1.2" />

      {/* Flying Birds */}
      <path
        d="M142 35c2-2 4-2 6 0 2-2 4-2 6 0M156 42c1.5-1.5 3-1.5 4.5 0 1.5-1.5 3-1.5 4.5 0"
        strokeWidth="1.2"
      />

      {/* Rolling Hills & landscape */}
      <path d="M20 120c30-18 60-15 90-4 30 11 60 12 80 4" />
      <path d="M50 125c35-12 70-8 110 5" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* Evergreen Trees */}
      <path d="M52 112l-5 8h10zM52 106l-4 7h8zM52 120v4" strokeWidth="1.2" />
      <path d="M62 114l-4 7h8zM62 121v3" strokeWidth="1.2" />
    </svg>
  );
}

export function FormRunner({
  mode = "preview",
  form,
  questions: propQuestions,
  onComplete,
  isMobilePreview = false,
}: FormRunnerProps) {
  // Use questions from props or form.questions
  const questions = propQuestions || form?.questions || [];

  const {
    currentIndex,
    direction,
    answers,
    errors,
    status,
    submitErrorMessage,
    shakeQuestionId,
    // Step calculations
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
    restart,
  } = useFormRunner({
    mode,
    form,
    questions,
    onComplete,
  });

  const shouldReduceMotion = useReducedMotion();

  // Ref to prevent double-advance during transitions
  const isTransitioningRef = useRef(false);

  // Scroll lock on body to avoid scrollbar flicker
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Safe navigation wrappers respecting transition lock
  const handleSafeNext = useCallback(async () => {
    if (isTransitioningRef.current || status === "submitting") return;
    isTransitioningRef.current = true;
    (document.activeElement as HTMLElement)?.blur?.();

    // Safety timeout ensures lock is never permanently orphaned if animation frame dropped
    const safetyTimer = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);

    const moved = await goToNext();
    if (!moved) {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
    }
  }, [goToNext, status]);

  const handleSafePrev = useCallback(() => {
    if (isTransitioningRef.current || status === "submitting") return;
    isTransitioningRef.current = true;
    (document.activeElement as HTMLElement)?.blur?.();

    const safetyTimer = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);

    goToPrev();
    setTimeout(() => {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
    }, 400);
  }, [goToPrev, status]);

  // Release transition lock when animation completes
  const handleAnimationComplete = useCallback(() => {
    isTransitioningRef.current = false;
  }, []);

  // Theme configuration via CSS variables
  const themeStyles = getThemeStyles(form?.theme);

  // Global keyboard navigation (ArrowDown/ArrowUp, Enter)
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      // Do not intercept if focus is inside a dropdown trigger or menu
      if (
        target?.closest?.('[data-testid="runner-dropdown-trigger"]') ||
        target?.closest?.('[data-testid^="runner-dropdown-opt"]') ||
        target?.closest?.('[role="listbox"]')
      ) {
        return;
      }

      const isTextInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "Enter" && !isTextInput) {
        e.preventDefault();
        handleSafeNext();
        return;
      }

      if (!isTextInput) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          handleSafeNext();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          handleSafePrev();
        }
      }
    },
    [handleSafeNext, handleSafePrev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Slide animation variants (40px displacement, 350ms enter, 250ms exit)
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      y: shouldReduceMotion
        ? 0
        : dir > 0
        ? RUNNER_ANIMATION.displacementY
        : -RUNNER_ANIMATION.displacementY,
      opacity: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : RUNNER_ANIMATION.enterDuration,
        ease: RUNNER_ANIMATION.easeOut,
      },
    }),
    center: {
      y: 0,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : RUNNER_ANIMATION.enterDuration,
        ease: RUNNER_ANIMATION.easeOut,
      },
    },
    exit: (dir: number) => ({
      y: shouldReduceMotion
        ? 0
        : dir > 0
        ? -RUNNER_ANIMATION.displacementY
        : RUNNER_ANIMATION.displacementY,
      opacity: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : RUNNER_ANIMATION.exitDuration,
        ease: RUNNER_ANIMATION.easeIn,
      },
    }),
  };

  // Staggered child variants
  const titleVariants: Variants = {
    enter: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    center: {
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : RUNNER_ANIMATION.staggerTitle,
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut",
      },
    },
    exit: { opacity: 0 },
  };

  const descVariants: Variants = {
    enter: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    center: {
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : RUNNER_ANIMATION.staggerDescription,
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut",
      },
    },
    exit: { opacity: 0 },
  };

  const inputVariants: Variants = {
    enter: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    center: {
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : RUNNER_ANIMATION.staggerInput,
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut",
      },
    },
    exit: { opacity: 0 },
  };

  // Shake variant for validation failure feedback
  const shakeVariants: Variants = {
    idle: { x: 0 },
    shake: {
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.4 },
    },
  };

  // Render question input component based on type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const currentVal = answers[currentQuestion.id];
    const props = currentQuestion.properties || {};

    switch (currentQuestion.type) {
      case "short_text":
        return (
          <TextInput
            type="text"
            value={currentVal as string}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            placeholder={props.placeholder || "Type your answer here..."}
            accentColor="var(--theme-answer)"
          />
        );

      case "long_text":
        return (
          <LongTextInput
            value={currentVal as string}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            placeholder={props.placeholder || "Type your answer here..."}
            accentColor="var(--theme-answer)"
          />
        );

      case "email":
        return (
          <TextInput
            type="email"
            value={currentVal as string}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            placeholder={props.placeholder || "name@example.com"}
            accentColor="var(--theme-answer)"
          />
        );

      case "number":
        return (
          <TextInput
            type="number"
            value={currentVal as number}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            placeholder={props.placeholder || "0"}
            accentColor="var(--theme-answer)"
          />
        );

      case "multiple_choice":
        return (
          <MultipleChoiceInput
            options={props.options || []}
            isMulti={Boolean(props.multiple)}
            allowOther={Boolean(props.allowOther)}
            value={currentVal}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            accentColor="var(--theme-answer)"
          />
        );

      case "yes_no":
        return (
          <YesNoInput
            value={currentVal}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            accentColor="var(--theme-answer)"
          />
        );

      case "rating":
        return (
          <RatingInput
            steps={props.steps || 5}
            shape={props.shape || "star"}
            value={currentVal}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            accentColor="var(--theme-answer)"
          />
        );

      case "dropdown":
        return (
          <DropdownInput
            options={props.options || []}
            value={currentVal}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            placeholder="Choose from the list..."
            accentColor="var(--theme-answer)"
          />
        );

      case "file_upload":
        return (
          <FileUploadInput
            slug={form?.slug || ""}
            questionId={currentQuestion.id}
            maxSizeMB={Number(props.maxSizeMB || 5)}
            allowedTypes={(props.allowedTypes as string[]) || ["image", "pdf", "doc"]}
            value={currentVal}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
          />
        );

      default:
        return (
          <TextInput
            type="text"
            value={currentVal as string}
            onChange={(val) => setAnswer(currentQuestion.id, val)}
            onSubmit={handleSafeNext}
            accentColor="var(--theme-answer)"
          />
        );
    }
  };

  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    touchStartY.current = null;

    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }

    // Swipe up (diffY > 60) -> Next; Swipe down (diffY < -60) -> Prev
    if (diffY > 60) {
      handleSafeNext();
    } else if (diffY < -60) {
      handleSafePrev();
    }
  };

  const currentError = currentQuestion ? errors[currentQuestion.id] : null;

  // Estimated completion time (calculate from question count: ~25 sec per question)
  const estimatedMinutes = Math.max(1, Math.ceil(questions.length * 0.4));

  return (
    <div
      data-theme-isolated="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full ${
        mode === "live" ? "h-[100dvh] min-h-[100dvh]" : "h-full"
      } flex flex-col justify-between relative overflow-hidden select-none touch-manipulation ${
        isMobilePreview ? "runner-mobile-mode" : ""
      }`}
      style={{
        ...themeStyles,
        backgroundColor: "var(--theme-bg)",
        backgroundImage: "var(--theme-bg-image)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "var(--theme-font)",
        color: "var(--theme-question)",
      }}
    >
      {/* Dynamic font loader for the single selected Google Font */}
      <ThemeFontLoader fontFamily={form?.theme?.fontFamily} />

      {/* Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: "var(--theme-bg-overlay)",
        }}
      />

      {/* Screen Reader Live Announcements */}
      <div aria-live="assertive" role="alert" className="sr-only">
        {currentError || ""}
      </div>
      <div aria-live="polite" role="status" className="sr-only">
        {isWelcome
          ? form?.welcome_title || "Welcome to our form"
          : isThankYou
          ? form?.thank_you_title || "Thank you for completing this form"
          : currentQuestion
          ? `Question ${questionIndex + 1} of ${questions.length}: ${currentQuestion.title}`
          : ""}
      </div>

      {/* Mode Badge (Preview notice) - hidden on mobile preview to not overlap notch */}
      {mode === "preview" && !isMobilePreview && (
        <div className="absolute top-4 left-6 z-30 flex items-center gap-2 runner-preview-badge">
          <span className="px-2.5 py-1 rounded-full text-nano font-bold uppercase tracking-wider bg-black/10 backdrop-blur-xs text-current border border-current/15">
            Preview only, nothing was saved
          </span>
        </div>
      )}

      {/* 2. Main Content Center Stage — Vertically positioned slightly above center */}
      <main className={`flex-1 flex flex-col justify-center items-center ${
        isMobilePreview ? "px-4 py-3 max-w-full" : "px-6 sm:px-12 py-12 max-w-2xl -translate-y-2 sm:-translate-y-5"
      } w-full mx-auto relative z-10`}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {/* Welcome Step — Faithful to Screenshot 1 */}
          {isWelcome && (
            <motion.div
              key="welcome-step"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationComplete={handleAnimationComplete}
              className="w-full flex flex-col items-center text-center space-y-6"
            >
              {/* Illustration Art */}
              <div className="text-current opacity-85 mb-2">
                <WelcomeIllustration className="w-32 h-24 sm:w-40 sm:h-30" />
              </div>

              {/* Title & Description */}
              <div className="space-y-3 max-w-xl">
                <h1
                  style={{
                    fontSize: "var(--theme-title-size)",
                    color: "var(--theme-question)",
                  }}
                  className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight"
                >
                  {form?.welcome_title || "Welcome aboard.\nLet's get you settled in."}
                </h1>
                {form?.welcome_description && (
                  <p
                    style={{ fontSize: "var(--theme-desc-size)" }}
                    className="opacity-85 text-base sm:text-lg font-normal leading-relaxed max-w-md mx-auto"
                  >
                    {form.welcome_description}
                  </p>
                )}
              </div>

              {/* Start Button & Time Estimate */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="runner-start-btn"
                    onClick={handleSafeNext}
                    style={{
                      backgroundColor: "var(--theme-btn-bg)",
                      color: "var(--theme-btn-text)",
                      borderRadius: "var(--theme-btn-radius)",
                    }}
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base sm:text-lg font-semibold shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{form?.welcome_button_text || "Get started"}</span>
                  </button>
                  <span className="text-xs opacity-80 font-medium hidden sm:inline">
                    press <kbd className="font-semibold underline">Enter ↵</kbd>
                  </span>
                </div>

                {/* Estimate */}
                <div className="flex items-center gap-1.5 text-xs opacity-80 font-medium pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Takes {estimatedMinutes} min</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Question Step — Faithful to Screenshot 2 */}
          {!isWelcome && !isThankYou && currentQuestion && (
            <motion.div
              key={`question-${currentQuestion.id}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationComplete={handleAnimationComplete}
              className="w-full text-left space-y-7"
            >
              <motion.div
                variants={shakeVariants}
                animate={shakeQuestionId === currentQuestion.id ? "shake" : "idle"}
                className="space-y-6"
              >
                {/* Question Header: Number + Arrow + Title */}
                <motion.div variants={titleVariants} className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`${isMobilePreview ? "text-sm" : "text-base sm:text-lg"} font-semibold shrink-0 flex items-center gap-1`}
                      style={{ color: "var(--theme-answer)" }}
                    >
                      <span>{questionIndex + 1}</span>
                      <span className="text-base leading-none">&rarr;</span>
                    </span>

                    <h2
                      style={{
                        fontSize: isMobilePreview ? "1.25rem" : "var(--theme-title-size)",
                        color: "var(--theme-question)",
                      }}
                      className={isMobilePreview ? "text-lg sm:text-xl font-medium leading-snug tracking-tight" : "text-2xl sm:text-3xl md:text-4xl font-normal sm:font-medium leading-snug tracking-tight"}
                    >
                      {currentQuestion.title || "Untitled Question"}
                      {currentQuestion.required && (
                        <span className="text-rose-500 font-bold ml-1">*</span>
                      )}
                    </h2>
                  </div>
                </motion.div>

                {/* Question Description */}
                {currentQuestion.description && (
                  <motion.div variants={descVariants}>
                    <p
                      style={{ fontSize: isMobilePreview ? "0.8125rem" : "var(--theme-desc-size)" }}
                      className={`opacity-85 font-normal ${isMobilePreview ? "text-xs pl-0 -mt-1" : "text-sm sm:text-base pl-7 sm:pl-8 -mt-3"} leading-relaxed`}
                    >
                      {currentQuestion.description}
                    </p>
                  </motion.div>
                )}

                {/* Question Input */}
                <motion.div variants={inputVariants} className={`pt-2 ${isMobilePreview ? "pl-0 space-y-3" : "pl-0 sm:pl-8 space-y-4"}`}>
                  {renderQuestionInput()}

                  {/* Validation Error Message */}
                  {currentError && (
                    <motion.div
                      data-testid="runner-validation-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 text-rose-500 text-sm font-medium pt-1"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{currentError}</span>
                    </motion.div>
                  )}

                  {/* Submission Error Banner */}
                  {submitErrorMessage && isLastQuestion && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                      {submitErrorMessage}
                    </div>
                  )}

                  {/* Advance Button: "OK ✓" or "Submit" */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      data-testid="runner-next-btn"
                      onClick={handleSafeNext}
                      disabled={status === "submitting"}
                      style={{
                        backgroundColor: "var(--theme-btn-bg)",
                        color: "var(--theme-btn-text)",
                        borderRadius: "var(--theme-btn-radius)",
                      }}
                      className={`inline-flex items-center gap-2 ${isMobilePreview ? "px-5 py-2 text-sm" : "px-6 py-2.5 text-sm sm:text-base"} font-semibold shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50`}
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>{isLastQuestion ? "Submit" : "OK"}</span>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>

                    <span className={`text-xs opacity-80 font-medium runner-desktop-hint ${isMobilePreview ? "hidden" : "hidden sm:inline"}`}>
                      press <kbd className="font-semibold underline">Enter ↵</kbd>
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Thank You Step — Faithful to Screenshot 3 & Official Guide */}
          {isThankYou && (
            <motion.div
              key="thank-you-step"
              data-testid="runner-thank-you"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationComplete={handleAnimationComplete}
              className="w-full flex flex-col items-center text-center space-y-6"
            >
              {/* Dark thumbs up badge */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#333742] rounded-md flex items-center justify-center text-white shadow-md mx-auto mb-2">
                <ThumbsUp className="w-10 h-10 sm:w-12 sm:h-12 fill-current" />
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3 max-w-xl">
                <h1
                  style={{
                    fontSize: "var(--theme-title-size)",
                    color: "var(--theme-question)",
                  }}
                  className="text-2xl sm:text-3xl md:text-4xl font-normal sm:font-medium tracking-tight"
                >
                  {form?.thank_you_title || "Thanks for completing this typeform"}
                </h1>
                <p
                  style={{ fontSize: "var(--theme-desc-size)" }}
                  className="opacity-80 font-light leading-relaxed text-base sm:text-lg max-w-lg mx-auto"
                >
                  {form?.thank_you_message || (
                    <>
                      Now <strong className="font-semibold opacity-100">create your own</strong> — it&apos;s free, easy, &amp; beautiful
                    </>
                  )}
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#262627] text-white rounded-md text-sm sm:text-base font-semibold shadow-sm hover:bg-black active:scale-[0.98] transition-all cursor-pointer"
                >
                  Create a typeform
                </Link>
                <span className="text-xs opacity-50 font-medium hidden sm:inline">
                  press <kbd className="font-semibold underline">Enter ↵</kbd>
                </span>
              </div>

              {/* Secondary restart link */}
              <div className="pt-4 flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={restart}
                  className="font-medium underline opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                >
                  {mode === "preview" ? "Restart preview" : "Fill out again"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Bottom Bar: Progress bar + Footer controls */}
      <div className="w-full relative z-20">
        {/* Animated Progress Bar */}
        <div className="w-full h-1 bg-current/10 relative">
          <motion.div
            className="h-full"
            style={{ backgroundColor: "var(--theme-btn-bg)" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              duration: shouldReduceMotion ? 0 : RUNNER_ANIMATION.progressBarDuration,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Footer controls */}
        <footer className={`w-full ${isMobilePreview ? "px-4 py-2" : "px-6 py-3.5"} flex items-center justify-between`}>
          {/* Bottom-left: "Powered by Typeform" */}
          <div className="flex items-center gap-1.5 text-xs opacity-50 select-none">
            <span>Powered by</span>
            <span className="font-semibold text-current opacity-90">Typeform</span>
          </div>

          {/* Center: "X of N answered" */}
          {questions.length > 0 && !isWelcome && !isThankYou && (
            <div className="text-xs font-medium opacity-60">
              {answeredCount} of {questions.length} answered
            </div>
          )}

          {/* Bottom-right: Chevron up/down group */}
          <div className="flex items-center gap-1 bg-current/5 p-1 rounded-lg border border-current/15 backdrop-blur-xs">
            <button
              type="button"
              onClick={handleSafePrev}
              disabled={currentIndex === 0 || status === "submitting"}
              aria-label="Previous question"
              title="Previous question (Arrow Up)"
              className="p-1.5 rounded-md hover:bg-current/10 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSafeNext}
              disabled={isThankYou || status === "submitting"}
              aria-label="Next question"
              title="Next question (Arrow Down)"
              className="p-1.5 rounded-md hover:bg-current/10 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
