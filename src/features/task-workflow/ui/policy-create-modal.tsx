import { type CollectionModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { type FC, useMemo } from "react";
import type { OptionList } from "react-querybuilder";

import { TaskCreate } from "saltbox-core/features/task-create";

export type PolicyCreateModalProps = {
  isOpen: boolean;
  slug: string;
  collection?: CollectionModel;
  query?: object;
  queryFilterSchema?: OptionList;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const PolicyCreateModal: FC<PolicyCreateModalProps> = ({
  isOpen,
  slug,
  collection,
  query,
  queryFilterSchema,
  onClose,
  onTaskCreated,
}) => {
  const context = useMemo(
    () => ({
      taskType: TaskType.Policy,
      slug,
      collection,
      query,
      queryFilterSchema,
    }),
    [slug, collection, query, queryFilterSchema]
  );

  return (
    <TaskCreate isOpen={isOpen} context={context} onClose={onClose} onTaskCreated={onTaskCreated} />
  );
};
