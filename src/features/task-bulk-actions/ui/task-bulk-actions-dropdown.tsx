import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, type ActionDropdownItem, notify } from "@saltbox/saltbox-frontend-common";
import { Modal } from "antd";
import type { TFunction } from "i18next";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  executeTaskBulkAction,
  getTasksForBulkAction,
  type TaskBulkAction,
  type TaskBulkActionResult,
} from "../model/task-bulk-actions";

type TaskBulkActionView = {
  action: TaskBulkAction;
  labelKey: string;
  confirmTitleKey: string;
  confirmOkKey: string;
  icon: ReactNode;
  danger?: boolean;
};

const TASK_BULK_ACTION_VIEWS: TaskBulkActionView[] = [
  {
    action: "run",
    labelKey: "task.run",
    confirmTitleKey: "tasks-bulk.run-confirm-title",
    confirmOkKey: "task.run",
    icon: <CaretRightOutlined />,
  },
  {
    action: "stop",
    labelKey: "task.stop",
    confirmTitleKey: "tasks-bulk.stop-confirm-title",
    confirmOkKey: "task.stop",
    icon: <StopOutlined />,
    danger: true,
  },
  {
    action: "restartFailed",
    labelKey: "task.restart-failed",
    confirmTitleKey: "tasks-bulk.restart-failed-confirm-title",
    confirmOkKey: "tasks-bulk.restart-failed-ok",
    icon: <IssuesCloseOutlined />,
  },
];

const notifyBulkActionResult = (
  t: TFunction,
  { succeeded, failedTaskIds }: TaskBulkActionResult,
  skipped: number
) => {
  const title = t("tasks-bulk.result", { succeeded, failed: failedTaskIds.length, skipped });

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
};

type TaskBulkActionsDropdownProps = {
  selectedTasks: TaskListResponseSchema[];
  onCompleted: () => void;
};

export const TaskBulkActionsDropdown = ({
  selectedTasks,
  onCompleted,
}: TaskBulkActionsDropdownProps) => {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const handleActionClick = ({
    action,
    confirmTitleKey,
    confirmOkKey,
    danger,
  }: TaskBulkActionView) => {
    const eligibleTasks = getTasksForBulkAction(action, selectedTasks);
    const skippedCount = selectedTasks.length - eligibleTasks.length;

    modalApi.confirm({
      title: t(confirmTitleKey, { count: eligibleTasks.length }),
      content:
        skippedCount > 0 ? t("tasks-bulk.skipped-description", { count: skippedCount }) : null,
      icon: null,
      okText: t(confirmOkKey),
      okButtonProps: { danger },
      cancelText: t("common.cancel"),
      onOk: async () => {
        const result = await executeTaskBulkAction(action, eligibleTasks);
        notifyBulkActionResult(t, result, skippedCount);
        onCompleted();
      },
    });
  };

  const items: ActionDropdownItem[] = TASK_BULK_ACTION_VIEWS.map((view) => ({
    key: view.action,
    label: t(view.labelKey),
    icon: view.icon,
    danger: view.danger,
    disabled: getTasksForBulkAction(view.action, selectedTasks).length === 0,
    onClick: () => handleActionClick(view),
  }));

  return (
    <>
      {modalContextHolder}
      <ActionDropdown
        menu={{ items }}
        disabled={selectedTasks.length === 0}
        disabledTooltip={t("tasks-bulk.select-tasks")}
      />
    </>
  );
};
