import { FC, useState } from "react";

import { TaskCreationContext } from "../type/types";

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
      <TemplateListModal
        isOpen={isOpen && !selectedTemplateId}
        onClose={onClose}
        onSelectTemplate={setSelectedTemplateId}
      />
      {selectedTemplateId && (
        <TaskModal
          isOpen={isOpen && !!selectedTemplateId}
          templateId={selectedTemplateId}
          context={context}
          onClose={onClose}
          onTaskCreated={onTaskCreated}
        />
      )}
    </>
  );
};
