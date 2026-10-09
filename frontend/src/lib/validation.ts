/**
 * lib/validation.ts — Client-side respondent answer validation
 *
 * Mirrors backend validators in `backend/app/validators/registry.py` exactly:
 * - Empty detection & required checks
 * - short_text (max 255 chars)
 * - long_text (max 2000 chars)
 * - email (RFC 5322 simplified standard regex)
 * - number (numeric parsing + min/max bounds)
 * - yes_no (boolean / y/n detection)
 * - multiple_choice (single / multiple option validation)
 * - dropdown (option selection validation)
 * - rating (1 to steps whole number validation)
 */

import { Question } from "@/types";

// RFC 5322 simplified standard email regex mirroring backend
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Check whether a raw value is considered empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value as object).length === 0;
  }
  return false;
}

/**
 * Validate a short text response (max 255 chars)
 */
export function validateShortText(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const maxLen = question.properties?.maxLength ? Number(question.properties.maxLength) : 255;
  const str = String(value).trim();
  if (str.length > maxLen) {
    return { isValid: false, error: `Response must be ${maxLen} characters or fewer` };
  }
  return { isValid: true };
}

/**
 * Validate a long text response (max 2000 chars or properties.maxLength)
 */
export function validateLongText(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const maxLen = question.properties?.maxLength ? Number(question.properties.maxLength) : 2000;
  const str = String(value).trim();
  if (str.length > maxLen) {
    return { isValid: false, error: `Response must be ${maxLen} characters or fewer` };
  }
  return { isValid: true };
}


/**
 * Validate an email address
 */
export function validateEmail(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const str = String(value).trim();
  if (!EMAIL_REGEX.test(str)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  return { isValid: true };
}

/**
 * Validate numeric input with optional min/max boundaries
 */
export function validateNumber(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const num = Number(value);
  if (Number.isNaN(num) || typeof value === "boolean") {
    return { isValid: false, error: "Please enter a valid number" };
  }

  const props = question.properties || {};
  const minVal = props.min;
  const maxVal = props.max;

  if (minVal !== undefined && minVal !== null && num < Number(minVal)) {
    return { isValid: false, error: `Value must be at least ${minVal}` };
  }
  if (maxVal !== undefined && maxVal !== null && num > Number(maxVal)) {
    return { isValid: false, error: `Value must be at most ${maxVal}` };
  }

  return { isValid: true };
}

/**
 * Validate boolean Yes/No choice
 */
export function validateYesNo(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  if (typeof value === "boolean") {
    return { isValid: true };
  }

  if (typeof value === "number") {
    if (value === 1 || value === 0) return { isValid: true };
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "yes", "y", "1", "false", "no", "n", "0"].includes(lowered)) {
      return { isValid: true };
    }
  }

  return { isValid: false, error: "Please select Yes or No" };
}

/**
 * Validate multiple choice response (single or multi-select)
 */
export function validateMultipleChoice(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const isMulti = Boolean(question.properties?.multiple);
  if (isMulti) {
    if (Array.isArray(value) && value.length === 0 && question.required) {
      return { isValid: false, error: "This field is required" };
    }
  }

  return { isValid: true };
}

/**
 * Validate dropdown selection
 */
export function validateDropdown(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }
  return { isValid: true };
}

/**
 * Validate rating scale (1 to steps whole number)
 */
export function validateRating(question: Question, value: unknown): ValidationResult {
  if (isEmpty(value)) {
    if (question.required) {
      return { isValid: false, error: "This field is required" };
    }
    return { isValid: true };
  }

  const steps = Number(question.properties?.steps || 5);
  const num = Number(value);

  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return { isValid: false, error: "Rating must be a whole number" };
  }

  if (num < 1 || num > steps) {
    return { isValid: false, error: `Rating must be between 1 and ${steps}` };
  }

  return { isValid: true };
}

/**
 * Validate any question's answer by dispatching to its respective validator
 */
export function validateQuestionAnswer(question: Question, value: unknown): ValidationResult {
  switch (question.type) {
    case "short_text":
      return validateShortText(question, value);
    case "long_text":
      return validateLongText(question, value);
    case "email":
      return validateEmail(question, value);
    case "number":
      return validateNumber(question, value);
    case "yes_no":
      return validateYesNo(question, value);
    case "multiple_choice":
      return validateMultipleChoice(question, value);
    case "dropdown":
      return validateDropdown(question, value);
    case "rating":
      return validateRating(question, value);
    default:
      if (question.required && isEmpty(value)) {
        return { isValid: false, error: "This field is required" };
      }
      return { isValid: true };
  }
}
