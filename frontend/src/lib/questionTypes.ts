/**
 * lib/questionTypes.ts — Question Type Registry
 *
 * Defines labels, icons, descriptions, default properties, and accent colors
 * for all 8 supported question types. Reused across the builder, preview,
 * respondent flow, and response analytics.
 */

import {
  Type,
  AlignLeft,
  Mail,
  CheckSquare,
  ChevronDown,
  Star,
  Hash,
  ToggleLeft,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { QuestionType, QuestionProperties } from "@/types";

export interface QuestionTypeDefinition {
  type: QuestionType;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultProperties: QuestionProperties;
  color: string;
  badgeBg: string;
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeDefinition> = {
  short_text: {
    type: "short_text",
    label: "Short text",
    icon: Type,
    description: "Single-line response for names, short answers, or titles.",
    defaultProperties: {
      placeholder: "Type your answer here...",
    },
    color: "var(--badge-short-text-text, #0284c7)",
    badgeBg: "var(--badge-short-text-bg, #d0f0fd)",
  },
  long_text: {
    type: "long_text",
    label: "Long text",
    icon: AlignLeft,
    description: "Multi-line text area for paragraphs, essays, or feedback.",
    defaultProperties: {
      placeholder: "Type your detailed thoughts here...",
    },
    color: "var(--badge-long-text-text, #0284c7)",
    badgeBg: "var(--badge-long-text-bg, #e0f2fe)",
  },
  email: {
    type: "email",
    label: "Email",
    icon: Mail,
    description: "Validates email address format with lowercase normalization.",
    defaultProperties: {
      placeholder: "name@company.com",
    },
    color: "var(--badge-email-text, #db2777)",
    badgeBg: "var(--badge-email-bg, #fce7f3)",
  },
  multiple_choice: {
    type: "multiple_choice",
    label: "Multiple choice",
    icon: CheckSquare,
    description: "Configurable choice options with single or multi-select support.",
    defaultProperties: {
      options: [
        { id: "opt_1", label: "Option 1" },
        { id: "opt_2", label: "Option 2" },
        { id: "opt_3", label: "Option 3" },
      ],
      allowOther: false,
      multiple: false,
    },
    color: "var(--badge-choice-text, #7c3aed)",
    badgeBg: "var(--badge-choice-bg, #ede9fe)",
  },
  dropdown: {
    type: "dropdown",
    label: "Dropdown",
    icon: ChevronDown,
    description: "Compact selector menu suited for lengthy lists of options.",
    defaultProperties: {
      options: [
        { id: "opt_1", label: "Choice 1" },
        { id: "opt_2", label: "Choice 2" },
        { id: "opt_3", label: "Choice 3" },
      ],
    },
    color: "var(--badge-dropdown-text, #4f46e5)",
    badgeBg: "var(--badge-dropdown-bg, #e0e7ff)",
  },
  rating: {
    type: "rating",
    label: "Rating",
    icon: Star,
    description: "Star rating scale for satisfaction and score evaluations.",
    defaultProperties: {
      steps: 5,
      shape: "star",
    },
    color: "var(--badge-rating-text, #d97706)",
    badgeBg: "var(--badge-rating-bg, #fef3c7)",
  },
  number: {
    type: "number",
    label: "Number",
    icon: Hash,
    description: "Accepts numeric input with optional min/max boundaries.",
    defaultProperties: {
      min: 0,
      max: 100,
    },
    color: "var(--badge-number-text, #ea580c)",
    badgeBg: "var(--badge-number-bg, #ffedd5)",
  },
  yes_no: {
    type: "yes_no",
    label: "Yes / No",
    icon: ToggleLeft,
    description: "Binary decision buttons with instant keyboard shortcuts.",
    defaultProperties: {},
    color: "var(--badge-yesno-text, #059669)",
    badgeBg: "var(--badge-yesno-bg, #d1fae5)",
  },
  file_upload: {
    type: "file_upload",
    label: "File Upload",
    icon: Upload,
    description: "Allow respondents to attach files, documents, or images.",
    defaultProperties: {
      maxSizeMB: 5,
      allowedTypes: ["image", "pdf", "doc"],
    },
    color: "var(--badge-upload-text, #0891b2)",
    badgeBg: "var(--badge-upload-bg, #cffafe)",
  },
};

export const QUESTION_TYPE_LIST = Object.values(QUESTION_TYPES);
