"use client";

/**
 * components/builder/BuilderContext.tsx — Form Builder State Management
 *
 * Implements a centralized store using React's useReducer + Context:
 *   - Why useReducer + Context? Built into React with 0 bundle dependencies,
 *     predictable atomic state transitions, complete TypeScript safety without
 *     proxy overhead, and 100% explainable in code reviews.
 *   - Manages: form metadata, ordered questions, selected question ID, dirty flags,
 *     and autosave statuses.
 */

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Form, Question, QuestionType } from "@/types";
import { QUESTION_TYPES } from "@/lib/questionTypes";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type SelectedId = number | string | "welcome" | "thank_you" | null;

export interface BuilderState {
  form: Form | null;
  questions: Question[];
  selectedId: SelectedId;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
}

export type BuilderAction =
  | { type: "SET_INITIAL_DATA"; payload: Form }
  | { type: "ADD_QUESTION"; payload: { type: QuestionType; afterId?: number | string | null } }
  | { type: "UPDATE_QUESTION"; payload: { id: number | string; patch: Partial<Question> } }
  | { type: "DELETE_QUESTION"; payload: { id: number | string } }
  | { type: "DUPLICATE_QUESTION"; payload: { id: number | string } }
  | { type: "REORDER_QUESTIONS"; payload: { fromIndex: number; toIndex: number } }
  | { type: "SELECT_QUESTION"; payload: SelectedId }
  | { type: "UPDATE_FORM_META"; payload: Partial<Form> }
  | { type: "SET_SAVE_STATUS"; payload: { status: SaveStatus; errorMessage?: string } }
  | { type: "QUESTIONS_PERSISTED"; payload: { questions: Question[]; selectedId?: SelectedId } };

const initialState: BuilderState = {
  form: null,
  questions: [],
  selectedId: null,
  isDirty: false,
  saveStatus: "saved",
  lastSavedAt: null,
  errorMessage: null,
};

function generateTempId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function reindexPositions(questions: Question[]): Question[] {
  return questions.map((q, idx) => ({
    ...q,
    position: idx,
  }));
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_INITIAL_DATA": {
      const form = action.payload;
      const sortedQuestions = reindexPositions([...(form.questions || [])]);
      const initialSelected =
        sortedQuestions.length > 0 ? sortedQuestions[0].id : "welcome";

      return {
        ...state,
        form,
        questions: sortedQuestions,
        selectedId: initialSelected,
        isDirty: false,
        saveStatus: "saved",
        lastSavedAt: new Date(),
        errorMessage: null,
      };
    }

    case "ADD_QUESTION": {
      const { type, afterId } = action.payload;
      const typeDef = QUESTION_TYPES[type];
      const newId = generateTempId();

      const newQuestion: Question = {
        id: newId,
        form_id: state.form?.id,
        type,
        title: typeDef.label,
        description: null,
        required: false,
        position: 0,
        properties: JSON.parse(JSON.stringify(typeDef.defaultProperties)),
      };

      const updated = [...state.questions];
      if (afterId && afterId !== "welcome" && afterId !== "thank_you") {
        const afterIndex = updated.findIndex((q) => q.id === afterId);
        if (afterIndex !== -1) {
          updated.splice(afterIndex + 1, 0, newQuestion);
        } else {
          updated.push(newQuestion);
        }
      } else {
        updated.push(newQuestion);
      }

      const reindexed = reindexPositions(updated);

      return {
        ...state,
        questions: reindexed,
        selectedId: newId,
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "UPDATE_QUESTION": {
      const { id, patch } = action.payload;
      const updated = state.questions.map((q) => {
        if (String(q.id) === String(id)) {
          return {
            ...q,
            ...patch,
            properties: patch.properties
              ? { ...q.properties, ...patch.properties }
              : q.properties,
          };
        }
        return q;
      });

      return {
        ...state,
        questions: updated,
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "DELETE_QUESTION": {
      const { id } = action.payload;
      const indexToDelete = state.questions.findIndex((q) => String(q.id) === String(id));
      if (indexToDelete === -1) return state;

      const updated = state.questions.filter((q) => String(q.id) !== String(id));
      const reindexed = reindexPositions(updated);

      // Select adjacent question or fallback to welcome screen
      let nextSelected: SelectedId = state.selectedId;
      if (String(state.selectedId) === String(id)) {
        if (reindexed.length > 0) {
          const nextIndex = Math.min(indexToDelete, reindexed.length - 1);
          nextSelected = reindexed[nextIndex].id;
        } else {
          nextSelected = "welcome";
        }
      }

      return {
        ...state,
        questions: reindexed,
        selectedId: nextSelected,
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "DUPLICATE_QUESTION": {
      const { id } = action.payload;
      const targetIndex = state.questions.findIndex((q) => String(q.id) === String(id));
      if (targetIndex === -1) return state;

      const target = state.questions[targetIndex];
      const newId = generateTempId();
      const duplicated: Question = {
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        title: `Copy of ${target.title}`,
      };

      const updated = [...state.questions];
      updated.splice(targetIndex + 1, 0, duplicated);
      const reindexed = reindexPositions(updated);

      return {
        ...state,
        questions: reindexed,
        selectedId: newId,
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "REORDER_QUESTIONS": {
      const { fromIndex, toIndex } = action.payload;
      if (fromIndex === toIndex) return state;

      const updated = [...state.questions];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      const reindexed = reindexPositions(updated);

      return {
        ...state,
        questions: reindexed,
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "SELECT_QUESTION": {
      return {
        ...state,
        selectedId: action.payload,
      };
    }

    case "UPDATE_FORM_META": {
      if (!state.form) return state;
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
        isDirty: true,
        saveStatus: "idle",
      };
    }

    case "SET_SAVE_STATUS": {
      return {
        ...state,
        saveStatus: action.payload.status,
        errorMessage: action.payload.errorMessage || null,
        lastSavedAt: action.payload.status === "saved" ? new Date() : state.lastSavedAt,
        isDirty: action.payload.status === "saved" ? false : state.isDirty,
      };
    }

    case "QUESTIONS_PERSISTED": {
      const { questions, selectedId } = action.payload;
      return {
        ...state,
        questions: reindexPositions(questions),
        selectedId: selectedId !== undefined ? selectedId : state.selectedId,
        isDirty: false,
        saveStatus: "saved",
        lastSavedAt: new Date(),
        errorMessage: null,
      };
    }

    default:
      return state;
  }
}

interface BuilderContextValue {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  addQuestion: (type: QuestionType, afterId?: number | string | null) => void;
  updateQuestion: (id: number | string, patch: Partial<Question>) => void;
  deleteQuestion: (id: number | string) => void;
  duplicateQuestion: (id: number | string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  selectQuestion: (id: SelectedId) => void;
  updateFormMeta: (patch: Partial<Form>) => void;
  selectedQuestion: Question | null;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({
  children,
  initialForm,
}: {
  children: React.ReactNode;
  initialForm?: Form;
}) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  useEffect(() => {
    if (initialForm) {
      dispatch({ type: "SET_INITIAL_DATA", payload: initialForm });
    }
  }, [initialForm]);

  const addQuestion = (type: QuestionType, afterId?: number | string | null) => {
    dispatch({ type: "ADD_QUESTION", payload: { type, afterId } });
  };

  const updateQuestion = (id: number | string, patch: Partial<Question>) => {
    dispatch({ type: "UPDATE_QUESTION", payload: { id, patch } });
  };

  const deleteQuestion = (id: number | string) => {
    dispatch({ type: "DELETE_QUESTION", payload: { id } });
  };

  const duplicateQuestion = (id: number | string) => {
    dispatch({ type: "DUPLICATE_QUESTION", payload: { id } });
  };

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    dispatch({ type: "REORDER_QUESTIONS", payload: { fromIndex, toIndex } });
  };

  const selectQuestion = (id: SelectedId) => {
    dispatch({ type: "SELECT_QUESTION", payload: id });
  };

  const updateFormMeta = (patch: Partial<Form>) => {
    dispatch({ type: "UPDATE_FORM_META", payload: patch });
  };

  const selectedQuestion =
    state.selectedId !== null &&
    state.selectedId !== "welcome" &&
    state.selectedId !== "thank_you"
      ? state.questions.find((q) => String(q.id) === String(state.selectedId)) || null
      : null;

  return (
    <BuilderContext.Provider
      value={{
        state,
        dispatch,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        reorderQuestions,
        selectQuestion,
        updateFormMeta,
        selectedQuestion,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilderStore() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilderStore must be used within a BuilderProvider");
  }
  return context;
}
