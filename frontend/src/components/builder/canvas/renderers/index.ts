/**
 * components/builder/canvas/renderers/index.ts — Registry of per-type canvas renderers
 *
 * Eliminates giant switch statements by providing a keyed lookup of preview renderers.
 */

import React from "react";
import { Question, QuestionType } from "@/types";
import { ShortTextPreview } from "./ShortTextPreview";
import { LongTextPreview } from "./LongTextPreview";
import { EmailPreview } from "./EmailPreview";
import { NumberPreview } from "./NumberPreview";
import { MultipleChoicePreview } from "./MultipleChoicePreview";
import { DropdownPreview } from "./DropdownPreview";
import { YesNoPreview } from "./YesNoPreview";
import { RatingPreview } from "./RatingPreview";

export interface QuestionRendererProps {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}

export const QUESTION_RENDERERS: Record<
  QuestionType,
  React.ComponentType<QuestionRendererProps>
> = {
  short_text: ShortTextPreview,
  long_text: LongTextPreview,
  email: EmailPreview,
  number: NumberPreview,
  multiple_choice: MultipleChoicePreview,
  dropdown: DropdownPreview,
  yes_no: YesNoPreview,
  rating: RatingPreview,
};
