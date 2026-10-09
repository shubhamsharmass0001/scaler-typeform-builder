/**
 * components/runner/animationConstants.ts
 *
 * Exposes exact animation timing and displacement constants for Typeform's runner experience:
 * - Question exit: translateY(-40px) + opacity 0, ~250ms
 * - Question enter: from translateY(40px) + opacity 0, ~350ms, easeOut
 * - Going back reverses both directions
 * - Stagger: title first (0ms), description (+50ms), input (+100ms)
 * - Progress bar: 400ms ease
 * - Single-select auto-advance delay: 400ms
 */

export const RUNNER_ANIMATION = {
  // Slide durations (seconds)
  exitDuration: 0.25, // 250ms
  enterDuration: 0.35, // 350ms
  displacementY: 40, // 40px

  // Stagger delays (seconds)
  staggerTitle: 0,
  staggerDescription: 0.05, // +50ms
  staggerInput: 0.1, // +100ms

  // Progress bar duration (seconds)
  progressBarDuration: 0.4, // 400ms

  // Auto-advance delay for single-select choice (milliseconds)
  singleSelectAutoAdvanceDelay: 400, // 400ms

  // Easing curves
  easeOut: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeInOut: [0.42, 0, 0.58, 1],
} as const;
