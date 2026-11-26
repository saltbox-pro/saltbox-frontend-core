import { StopOutlined } from "@ant-design/icons";
import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import {
  ActionDropdown,
  type ActionDropdownItem,
  Modal,
  notify,
  notifyApiError,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useTranslation } from "react-i18next";

import { stopTasks } from "../api/stop-tasks";
import { TasksApiUnavailableError } from "../api/tasks-api-unavailable-error";
import { getStoppableTasks } from "../model/get-stoppable-tasks";

import { notifyBulkActionResult } from "./notify-bulk-action-result";

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
      title: t("tasks-bulk.stop-confirm-title"),
      content: (
        <Flex vertical gap={8}>
          {skippedCount > 0 && (
            <div>{t("tasks-bulk.skipped-description", { count: skippedCount })}</div>
          )}
          <div>{t("tasks-bulk.stop-confirm-description", { count: stoppableTasks.length })}</div>
        </Flex>
      ),
      icon: null,
      okText: t("task.stop"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const result = await stopTasks(stoppableTasks);
          notifyBulkActionResult(t, { ...result, skipped: result.skipped + skippedCount });
          if (result.succeeded > 0 || result.skipped > 0) {
            onCompleted();
          }
        } catch (error) {
          if (error instanceof TasksApiUnavailableError) {
            notify.error(t("tasks-bulk.api-unavailable"));
            return;
          }
          await notifyApiError(error, t("tasks-bulk.stop-error"));
        }
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
