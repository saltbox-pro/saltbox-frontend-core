import { type FC, useState } from "react";

import type { SelectedTaskTemplate, TaskCreationContext } from "../type/types";

import { TaskModal } from "./task-modal";
import { TemplateListModal } from "./template-list-modal/ui/template-list-modal";

export type TaskCreateProps = {
  isOpen: boolean;
  context: TaskCreationContext;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const TaskCreate: FC<TaskCreateProps> = ({ isOpen, context, onClose, onTaskCreated }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTaskTemplate | undefined>();

  return (
    <>
      {isOpen && (
        <TemplateListModal
          type={context.taskType}
          isOpen={!selectedTemplate}
          onClose={onClose}
          onSelectTemplate={setSelectedTemplate}
        />
      )}
      {isOpen && selectedTemplate && (
        <TaskModal
          isOpen={!!selectedTemplate}
          sourceId={selectedTemplate.sourceId}
          templateId={selectedTemplate.templateId}
          context={context}
          onClose={onClose}
          onTaskCreated={onTaskCreated}
        />
      )}
    </>
  );
};
