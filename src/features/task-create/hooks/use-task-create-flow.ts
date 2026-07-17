import { useCallback, useEffect, useRef, useState } from "react";

import { getTemplateCacheKey } from "../helpers/get-template-cache-key";
import type { SelectedTaskTemplate, TaskTemplateDraft } from "../type/types";

type TaskCreatePhase = "picker" | "configuring" | "closing-to-picker";

type UseTaskCreateFlowParams = {
  isOpen: boolean;
  onClose: () => void;
};

export function useTaskCreateFlow({ isOpen, onClose }: UseTaskCreateFlowParams) {
  const [phase, setPhase] = useState<TaskCreatePhase>("picker");
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTaskTemplate | undefined>();
  const [modalSession, setModalSession] = useState(0);
  const [isPickerDismissing, setIsPickerDismissing] = useState(false);

  const phaseRef = useRef<TaskCreatePhase>(phase);
  const isPickerDismissingRef = useRef(false);
  const isInternalClosePropagatingRef = useRef(false);
  const draftByTemplateRef = useRef<Record<string, TaskTemplateDraft>>({});

  const resetFlow = useCallback(() => {
    draftByTemplateRef.current = {};
    phaseRef.current = "picker";
    isPickerDismissingRef.current = false;
    setPhase("picker");
    setSelectedTemplate(undefined);
    setModalSession(0);
    setIsPickerDismissing(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (isPickerDismissingRef.current || isInternalClosePropagatingRef.current) {
      isInternalClosePropagatingRef.current = false;
      return;
    }

    resetFlow();
  }, [isOpen, resetFlow]);

  const handleSelectTemplate = useCallback((template: SelectedTaskTemplate) => {
    phaseRef.current = "configuring";
    setModalSession((value) => value + 1);
    setSelectedTemplate(template);
    setPhase("configuring");
  }, []);

  const handleReturnToTemplatePicker = useCallback(
    (draft: TaskTemplateDraft) => {
      if (selectedTemplate) {
        draftByTemplateRef.current[getTemplateCacheKey(selectedTemplate)] = draft;
      }
      phaseRef.current = "closing-to-picker";
      setPhase("closing-to-picker");
    },
    [selectedTemplate]
  );

  const handleReturnedToPicker = useCallback(() => {
    if (phaseRef.current !== "closing-to-picker") {
      return;
    }
    phaseRef.current = "picker";
    setSelectedTemplate(undefined);
    setPhase("picker");
  }, []);

  const handleFlowDismissed = useCallback(() => {
    resetFlow();
    isInternalClosePropagatingRef.current = true;
    onClose();
  }, [onClose, resetFlow]);

  const handlePickerCloseRequest = useCallback(() => {
    isPickerDismissingRef.current = true;
    setIsPickerDismissing(true);
  }, []);

  const handlePickerAfterClose = useCallback(() => {
    if (!isPickerDismissingRef.current) {
      return;
    }

    isPickerDismissingRef.current = false;
    setIsPickerDismissing(false);
    resetFlow();
    isInternalClosePropagatingRef.current = true;
    onClose();
  }, [onClose, resetFlow]);

  const isPickerVisible = phase === "picker" || phase === "closing-to-picker";
  const isPickerModalOpen = isPickerVisible && !isPickerDismissing;
  const isTaskModalMounted = phase === "configuring" || phase === "closing-to-picker";
  const isPickerMounted = isOpen || isPickerDismissing;

  const initialDraft = selectedTemplate
    ? draftByTemplateRef.current[getTemplateCacheKey(selectedTemplate)]
    : undefined;

  return {
    isPickerMounted,
    isPickerModalOpen,
    isTaskModalMounted,
    selectedTemplate,
    modalSession,
    initialDraft,
    handleSelectTemplate,
    handleReturnToTemplatePicker,
    handleReturnedToPicker,
    handleFlowDismissed,
    handlePickerCloseRequest,
    handlePickerAfterClose,
  };
}
