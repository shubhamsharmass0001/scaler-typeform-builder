"use client";

/**
 * components/builder/useAutosave.ts — Debounced autosave hook
 *
 * Automatically saves question changes (via PUT /forms/{id}/questions)
 * and form metadata (via PATCH /forms/{id}) with an 800ms debounce.
 * Warns on window beforeunload if there are unsaved modifications.
 */

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useBuilderStore } from "./BuilderContext";
import { bulkSaveQuestions, updateForm } from "@/lib/api";
import { BulkQuestionItem } from "@/types";

export function useAutosave() {
  const { state, dispatch } = useBuilderStore();
  const { form, questions, isDirty, saveStatus, selectedId } = state;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const questionsRef = useRef(questions);
  const formRef = useRef(form);
  const selectedIdRef = useRef(selectedId);

  // Keep refs synchronized to latest state values
  questionsRef.current = questions;
  formRef.current = form;
  selectedIdRef.current = selectedId;

  // Perform the actual backend bulk save and metadata update
  const saveNow = useCallback(async () => {
    const currentForm = formRef.current;
    if (!currentForm || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      dispatch({ type: "SET_SAVE_STATUS", payload: { status: "saving" } });

      const currentQuestions = questionsRef.current;
      const currentSelected = selectedIdRef.current;

      // 1. Prepare questions payload (substitute temporary IDs with null)
      const payload: BulkQuestionItem[] = currentQuestions.map((q) => ({
        id: typeof q.id === "number" ? q.id : null,
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        properties: q.properties,
      }));

      // 2. Parallel save: bulk questions + form metadata update
      const [persistedQuestions] = await Promise.all([
        bulkSaveQuestions(currentForm.id, payload),
        updateForm(currentForm.id, {
          title: currentForm.title,
          description: currentForm.description,
          theme: currentForm.theme,
          welcome_title: currentForm.welcome_title,
          welcome_description: currentForm.welcome_description,
          welcome_button_text: currentForm.welcome_button_text,
          thank_you_title: currentForm.thank_you_title,
          thank_you_message: currentForm.thank_you_message,
        }),
      ]);

      // 3. Match selected question if it had a temporary ID
      let resolvedSelectedId = currentSelected;
      if (typeof currentSelected === "string" && currentSelected.startsWith("tmp_")) {
        const tempIndex = currentQuestions.findIndex((q) => q.id === currentSelected);
        if (tempIndex !== -1 && persistedQuestions[tempIndex]) {
          resolvedSelectedId = persistedQuestions[tempIndex].id;
        }
      }

      dispatch({
        type: "QUESTIONS_PERSISTED",
        payload: {
          questions: persistedQuestions,
          selectedId: resolvedSelectedId,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Autosave failed";
      dispatch({
        type: "SET_SAVE_STATUS",
        payload: { status: "error", errorMessage: message },
      });
      toast.error(`Autosave failed: ${message}`);
    } finally {
      isSavingRef.current = false;
    }
  }, [dispatch]);

  // Debounce autosave triggers on dirty state
  useEffect(() => {
    if (!isDirty || !form) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveNow();
    }, 800);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, questions, form?.title, form?.welcome_title, form?.thank_you_title, form, saveNow]);

  // Warn respondent before leaving if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, saveStatus]);

  return { saveNow };
}
