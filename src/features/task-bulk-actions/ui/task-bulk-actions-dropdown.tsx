import { StopOutlined } from "@ant-design/icons";
import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import {
  ActionDropdown,
  type ActionDropdownItem,
  Modal,
  notify,
  notifyApiError,
} from "@saltbox/saltbox-frontend-common";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import {
  getStoppableTasks,
  stopTasks,
  type TaskBulkActionResult,
} from "../model/task-bulk-actions";

const notifyBulkActionResult = (
  t: TFunction,
  { succeeded, failedTaskIds, skipped }: TaskBulkActionResult
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

  const stoppableTasks = getStoppableTasks(selectedTasks);
  const skippedCount = selectedTasks.length - stoppableTasks.length;

  const handleStopClick = () => {
    modalApi.confirm({
      title: t("tasks-bulk.stop-confirm-title", { count: stoppableTasks.length }),
      content:
        skippedCount > 0 ? t("tasks-bulk.skipped-description", { count: skippedCount }) : null,
      icon: null,
      okText: t("task.stop"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const result = await stopTasks(stoppableTasks);
          notifyBulkActionResult(t, { ...result, skipped: result.skipped + skippedCount });
        } catch (error) {
          await notifyApiError(error, t("tasks-bulk.stop-error"));
        }
        onCompleted();
      },
    });
  };

  const items: ActionDropdownItem[] = [
    {
      key: "stop",
      label: t("task.stop"),
      icon: <StopOutlined />,
      danger: true,
      disabled: stoppableTasks.length === 0,
      onClick: handleStopClick,
    },
  ];

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
