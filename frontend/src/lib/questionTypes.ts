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
    color: "#2563EB", // Blue
    badgeBg: "#EFF6FF",
  },
  long_text: {
    type: "long_text",
    label: "Long text",
    icon: AlignLeft,
    description: "Multi-line text area for paragraphs, essays, or feedback.",
    defaultProperties: {
      placeholder: "Type your detailed thoughts here...",
    },
    color: "#4F46E5", // Indigo
    badgeBg: "#EEF2FF",
  },
  email: {
    type: "email",
    label: "Email",
    icon: Mail,
    description: "Validates email address format with lowercase normalization.",
    defaultProperties: {
      placeholder: "name@company.com",
    },
    color: "#0891B2", // Cyan
    badgeBg: "#ECFEFF",
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
    color: "#059669", // Emerald
    badgeBg: "#ECFDF5",
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
    color: "#7C3AED", // Violet
    badgeBg: "#F5F3FF",
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
    color: "#D97706", // Amber
    badgeBg: "#FFFBEB",
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
    color: "#DB2777", // Pink
    badgeBg: "#FDF2F8",
  },
  yes_no: {
    type: "yes_no",
    label: "Yes / No",
    icon: ToggleLeft,
    description: "Binary decision buttons with instant keyboard shortcuts.",
    defaultProperties: {},
    color: "#0D9488", // Teal
    badgeBg: "#F0FDFA",
  },
};

export const QUESTION_TYPE_LIST = Object.values(QUESTION_TYPES);
