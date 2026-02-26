import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Flex, message } from "antd";
import { useTranslation } from "react-i18next";

import { type TaskRunControlInput, useTaskPermissions } from "../hooks/useTaskPermition";

export interface TaskRunControlProps extends TaskRunControlInput {
  onRunTask: () => Promise<void>;
  onStopTask: () => Promise<void>;
  onRestartFailed: () => Promise<void>;
  isRunTaskLoading: boolean;
  isStopTaskLoading: boolean;
  isRestartFailedLoading: boolean;
}

export function TaskRunControl({
  taskStatus,
  failedCount,
  pendingCount,
  onRunTask,
  onStopTask,
  onRestartFailed,
  isRunTaskLoading,
  isStopTaskLoading,
  isRestartFailedLoading,
}: TaskRunControlProps) {
  const { t } = useTranslation();

  const [messageApi, contextHolder] = message.useMessage();

  const handleRunClick = async () => {
    try {
      await onRunTask();
    } catch {
      messageApi.error(t("task.run-error"));
    }
  };

  const handleStopClick = async () => {
    try {
      await onStopTask();
    } catch {
      messageApi.error(t("task.stop-error"));
    }
  };

  const handleRestartFailedClick = async () => {
    try {
      await onRestartFailed();
    } catch {
      messageApi.error(t("task.restart-failed-error"));
    }
  };

  const { canRun, canStop, canRestartFailed } = useTaskPermissions({
    taskStatus,
    failedCount,
    pendingCount,
  });

  return (
    <>
      {contextHolder}

      <Flex gap={7}>
        <Button
          onClick={handleRunClick}
          color="primary"
          variant="solid"
          icon={<CaretRightOutlined />}
          disabled={!canRun}
          loading={isRunTaskLoading}
          title={t("task.run")}
        />

        <Button
          onClick={handleStopClick}
          color="danger"
          variant="solid"
          icon={<StopOutlined />}
          disabled={!canStop}
          loading={isStopTaskLoading}
          title={t("task.stop")}
        />

        <Button
          onClick={handleRestartFailedClick}
          color="orange"
          variant="solid"
          icon={<IssuesCloseOutlined />}
          disabled={!canRestartFailed}
          loading={isRestartFailedLoading}
          title={t("task.restart-failed")}
        />
      </Flex>
    </>
  );
}
