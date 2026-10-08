import { TaskListResponseSchema, TaskModel } from "@saltbox/saltbox-core-api-client";
import { notify } from "@saltbox/saltbox-frontend-common";
import { Modal } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getTasksForBulkAction,
  TaskBulkActionsStore,
  type TaskBulkAction,
  type TaskBulkActionResult,
} from "../model/task-bulk-actions-store";

type UseTaskBulkActionsParams = {
  getSelectedTasks: () => TaskListResponseSchema[];
  onTaskUpdated: (task: TaskModel) => void;
  onCompleted: () => void;
};

const CONFIRM_TITLE_KEY: Record<TaskBulkAction, string> = {
  run: "tasks-bulk.run-confirm-title",
  stop: "tasks-bulk.stop-confirm-title",
  restartFailed: "tasks-bulk.restart-failed-confirm-title",
};

const CONFIRM_OK_KEY: Record<TaskBulkAction, string> = {
  run: "tasks-bulk.run-ok",
  stop: "tasks-bulk.stop-ok",
  restartFailed: "tasks-bulk.restart-failed-ok",
};

export const useTaskBulkActions = ({
  getSelectedTasks,
  onTaskUpdated,
  onCompleted,
}: UseTaskBulkActionsParams) => {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [bulkActionsStore] = useState(() => new TaskBulkActionsStore(onTaskUpdated));

  const notifyResult = useCallback(
    ({ succeeded, failedTaskIds, skipped }: TaskBulkActionResult) => {
      const title = t("tasks-bulk.result", {
        succeeded,
        failed: failedTaskIds.length,
        skipped,
      });

      if (failedTaskIds.length === 0) {
        notify.success(title);
        return;
      }

      const toast = {
        title,
        description: t("tasks-bulk.failed-tasks", { ids: failedTaskIds.join(", ") }),
      };
      if (succeeded === 0) {
        notify.error(toast);
        return;
      }
      notify.warning(toast);
    },
    [t]
  );

  const handleBulkActionClick = useCallback(
    (bulkAction: TaskBulkAction) => {
      const selectedTasks = getSelectedTasks();
      const eligibleCount = getTasksForBulkAction(bulkAction, selectedTasks).length;
      const skippedCount = selectedTasks.length - eligibleCount;
      if (eligibleCount === 0) {
        return;
      }

      modalApi.confirm({
        title: t(CONFIRM_TITLE_KEY[bulkAction], { count: eligibleCount }),
        content:
          skippedCount > 0 ? t("tasks-bulk.skipped-description", { count: skippedCount }) : null,
        icon: null,
        okText: t(CONFIRM_OK_KEY[bulkAction]),
        okButtonProps: { danger: bulkAction === "stop" },
        cancelText: t("common.cancel"),
        onOk: async () => {
          const result = await bulkActionsStore.execute(bulkAction, getSelectedTasks());
          notifyResult(result);
          onCompleted();
        },
      });
    },
    [bulkActionsStore, getSelectedTasks, modalApi, notifyResult, onCompleted, t]
  );

  return {
    modalContextHolder,
    runningAction: bulkActionsStore.runningAction,
    isRunning: bulkActionsStore.isRunning,
    handleBulkActionClick,
  };
};
