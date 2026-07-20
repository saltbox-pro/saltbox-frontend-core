import { type FC } from "react";

import { getTemplateCacheKey } from "../helpers/get-template-cache-key";
import { useTaskCreateFlow } from "../hooks/use-task-create-flow";
import type { TaskCreationContext } from "../type/types";

import { TaskModal } from "./task-modal";
import { TemplateListModal } from "./template-list-modal/ui/template-list-modal";

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

  return (
    <>
      {isPickerMounted && (
        <TemplateListModal
          type={context.taskType}
          isOpen={isOpen && isPickerModalOpen}
          onClose={handlePickerCloseRequest}
          onAfterClose={handlePickerAfterClose}
          onLeaveFlow={handleFlowDismissed}
          onSelectTemplate={handleSelectTemplate}
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
