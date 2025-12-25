import { CollectionModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { FC, useMemo } from "react";

import { TaskCreate } from "saltbox-core/features/task-create";

export type PolicyCreateModalProps = {
  isOpen: boolean;
  slug: string;
  collection?: CollectionModel;
  query?: object;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const PolicyCreateModal: FC<PolicyCreateModalProps> = ({
  isOpen,
  slug,
  collection,
  query,
  onClose,
  onTaskCreated,
}) => {
  const context = useMemo(
    () => ({
      taskType: TaskType.Policy,
      slug,
      collection,
      query,
    }),
    [slug, collection, query]
  );

  return (
    <TaskCreate isOpen={isOpen} context={context} onClose={onClose} onTaskCreated={onTaskCreated} />
  );
};
