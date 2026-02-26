import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { useTranslation } from "react-i18next";

import { type TaskRunControlInput, useTaskPermissions } from "../hooks/useTaskPermition";

export interface TaskRunControlProps extends TaskRunControlInput {
  onRunTask: () => void;
  onStopTask: () => void;
  onRestartFailed: () => void;
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

  const { canRun, canStop, canRestartFailed } = useTaskPermissions({
    taskStatus,
    failedCount,
    pendingCount,
  });

  return (
    <Flex gap={7}>
      <Button
        onClick={onRunTask}
        color="primary"
        variant="solid"
        icon={<CaretRightOutlined />}
        disabled={!canRun}
        loading={isRunTaskLoading}
        title={t("task.run")}
      />

      <Button
        onClick={onStopTask}
        color="danger"
        variant="solid"
        icon={<StopOutlined />}
        disabled={!canStop}
        loading={isStopTaskLoading}
        title={t("task.stop")}
      />

      <Button
        onClick={onRestartFailed}
        color="orange"
        variant="solid"
        icon={<IssuesCloseOutlined />}
        disabled={!canRestartFailed}
        loading={isRestartFailedLoading}
        title={t("task.restart-failed")}
      />
    </Flex>
  );
}
