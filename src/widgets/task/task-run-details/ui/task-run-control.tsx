import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import type { TaskStore } from "saltbox-core/store";

import { useTaskPermissions } from "../hooks/useTaskPermition";

interface TaskRunControlProps {
  taskStore: TaskStore;
}

export const TaskRunControl = observer(function TaskRunControl({ taskStore }: TaskRunControlProps) {
  const { t } = useTranslation();

  const taskPermissions = useTaskPermissions(taskStore);

  return (
    <Flex gap={7}>
      <Button
        onClick={taskStore.handleRunTask}
        color="primary"
        variant="solid"
        icon={<CaretRightOutlined />}
        disabled={!taskPermissions.canRun}
        title={t("task.run")}
      />

      <Button
        onClick={taskStore.handleStopTask}
        color="danger"
        variant="solid"
        icon={<StopOutlined />}
        disabled={!taskPermissions.canStop}
        title={t("task.stop")}
      />

      <Button
        onClick={taskStore.handleRestartFailed}
        color="orange"
        variant="solid"
        icon={<IssuesCloseOutlined />}
        disabled={!taskPermissions.canRestartFailed}
        title={t("task.restart-failed")}
      />
    </Flex>
  );
});
