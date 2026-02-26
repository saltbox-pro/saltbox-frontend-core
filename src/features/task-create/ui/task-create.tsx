import { type FC, useState } from "react";

import type { TaskCreationContext } from "../type/types";

import { TaskModal } from "./task-modal";
import { TemplateListModal } from "./template-list-modal";

export type TaskCreateProps = {
  isOpen: boolean;
  context: TaskCreationContext;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const TaskCreate: FC<TaskCreateProps> = ({ isOpen, context, onClose, onTaskCreated }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  return (
    <>
      {isOpen && (
        <TemplateListModal
          type={context.taskType}
          isOpen={!selectedTemplateId}
          onClose={onClose}
          onSelectTemplate={setSelectedTemplateId}
        />
      )}
      {isOpen && selectedTemplateId && (
        <TaskModal
          isOpen={!!selectedTemplateId}
          templateId={selectedTemplateId}
          context={context}
          onClose={onClose}
          onTaskCreated={onTaskCreated}
        />
      )}
    </>
  );
};
