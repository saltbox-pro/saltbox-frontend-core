import {
  type CollectionModel,
  type TaskTargetMinion,
  TaskType,
} from "@saltbox/saltbox-core-api-client";
import { publish } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { type FC, useCallback, useMemo } from "react";
import type { OptionList } from "react-querybuilder";

import { TaskCreate, PluginRenderData, TaskCreatePlugin } from "saltbox-core/features/task-create";
import { appStore, i18nStore } from "saltbox-core/store";

export type TaskCreateModalProps = {
  isOpen: boolean;
  slug: string;
  collection?: CollectionModel;
  minionList?: TaskTargetMinion[];
  query?: object;
  queryFilterSchema?: OptionList;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

export const TaskCreateModal: FC<TaskCreateModalProps> = ({
  isOpen,
  slug,
  collection,
  minionList,
  query,
  queryFilterSchema,
  onClose,
  onTaskCreated,
}) => {
  const renderPluginButtons = useCallback(
    (data: PluginRenderData) => {
      const handleCreateTaskPlugin = (pluginKey: string) => {
        publish("minions.taskmodal.create", {
          action: "create",
          pluginKey,
          taskCreateRequest: data.taskCreateRequest,
          templateDescription: data.templateDescription,
          collectionName: data.collectionName,
        });
        onClose();
      };

      const plugins = appStore.pluginsStore?.plugins?.["minions.taskmodal.create"] ?? [];

      return plugins.map((plugin: TaskCreatePlugin) => (
        <Button key={plugin.key} type="default" onClick={() => handleCreateTaskPlugin(plugin.key)}>
          {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
        </Button>
      ));
    },
    [onClose]
  );

  const context = useMemo(
    () => ({
      taskType: TaskType.Classic,
      slug,
      collection,
      minionList,
      query,
      queryFilterSchema,
      renderPluginButtons,
    }),
    [slug, collection, minionList, query, queryFilterSchema, renderPluginButtons]
  );

  return (
    <>
      {isOpen && (
        <TaskCreate
          isOpen={true}
          context={context}
          onClose={onClose}
          onTaskCreated={onTaskCreated}
        />
      )}
    </>
  );
};
