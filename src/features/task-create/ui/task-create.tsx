import { TaskType } from "@saltbox/saltbox-core-api-client";
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
      handleSelectTemplate({
        kind: "template",
        sourceId: template.sourceId,
        templateId: template.templateId,
      });
    },
    [handleSelectTemplate]
  );

  const handleCustomFunctionPicked = useCallback(
    (fun: string) => {
      handleSelectTemplate({ kind: "custom-function", fun });
    },
    [handleSelectTemplate]
  );

  return (
    <>
      {isPickerMounted && (
        <TemplatePickerModal
          mode={context.taskType === TaskType.Policy ? "policy" : "task"}
          isOpen={isOpen && isPickerModalOpen}
          onClose={handlePickerCloseRequest}
          onAfterClose={handlePickerAfterClose}
          onLeaveFlow={handleFlowDismissed}
          onSelectTemplate={handleTemplatePicked}
          onSelectCustomFunction={handleCustomFunctionPicked}
        />
      )}
      {isOpen && isTaskModalMounted && selectedTemplate && (
        <TaskModal
          key={`${getTemplateCacheKey(selectedTemplate)}-${modalSession}`}
          selection={selectedTemplate}
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
