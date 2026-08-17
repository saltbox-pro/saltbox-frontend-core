import { type FC, useCallback } from "react";

import { TemplatePickerModal, type PickedTemplate } from "saltbox-core/features/template-picker";

import { getTemplateCacheKey } from "../helpers/get-template-cache-key";
import { useTaskCreateFlow } from "../hooks/use-task-create-flow";
import type { TaskCreationContext } from "../type/types";

import { TaskModal } from "./task-modal";

export type TaskCreateProps = {
  isOpen: boolean;
  context: TaskCreationContext;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const TaskCreate: FC<TaskCreateProps> = ({ isOpen, context, onClose, onTaskCreated }) => {
  const {
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
  } = useTaskCreateFlow({ isOpen, onClose });

  const handleTemplatePicked = useCallback(
    (template: PickedTemplate) => {
      handleSelectTemplate({ sourceId: template.sourceId, templateId: template.templateId });
    },
    [handleSelectTemplate]
  );

  return (
    <>
      {isPickerMounted && (
        <TemplatePickerModal
          mode="task"
          isOpen={isOpen && isPickerModalOpen}
          onClose={handlePickerCloseRequest}
          onAfterClose={handlePickerAfterClose}
          onLeaveFlow={handleFlowDismissed}
          onSelectTemplate={handleTemplatePicked}
        />
      )}
      {isOpen && isTaskModalMounted && selectedTemplate && (
        <TaskModal
          key={`${getTemplateCacheKey(selectedTemplate)}-${modalSession}`}
          sourceId={selectedTemplate.sourceId}
          templateId={selectedTemplate.templateId}
          context={context}
          initialDraft={initialDraft}
          onReturnedToPicker={handleReturnedToPicker}
          onFlowDismissed={handleFlowDismissed}
          onReturnToTemplatePicker={handleReturnToTemplatePicker}
          onTaskCreated={onTaskCreated}
        />
      )}
    </>
  );
};
