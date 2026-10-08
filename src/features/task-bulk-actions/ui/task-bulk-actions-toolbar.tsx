import { CaretRightOutlined, IssuesCloseOutlined, StopOutlined } from "@ant-design/icons";
import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import { SelectedItemsCounter } from "@saltbox/saltbox-frontend-common";
import { Button, type ButtonProps, Flex } from "antd";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getTasksForBulkAction, type TaskBulkAction } from "../model/task-bulk-actions-store";

type TaskBulkActionButtonConfig = {
  action: TaskBulkAction;
  titleKey: string;
  icon: ReactNode;
  color: ButtonProps["color"];
};

const BULK_ACTION_BUTTONS: TaskBulkActionButtonConfig[] = [
  { action: "run", titleKey: "task.run", icon: <CaretRightOutlined />, color: "primary" },
  { action: "stop", titleKey: "task.stop", icon: <StopOutlined />, color: "danger" },
  {
    action: "restartFailed",
    titleKey: "task.restart-failed",
    icon: <IssuesCloseOutlined />,
    color: "orange",
  },
];

type TaskBulkActionsToolbarProps = {
  selectedTasks: TaskListResponseSchema[];
  runningAction: TaskBulkAction | null;
  onActionClick: (action: TaskBulkAction) => void;
};

export const TaskBulkActionsToolbar = ({
  selectedTasks,
  runningAction,
  onActionClick,
}: TaskBulkActionsToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Flex align="center" gap={7}>
      {BULK_ACTION_BUTTONS.map(({ action, titleKey, icon, color }) => {
        const hasAvailableTasks = getTasksForBulkAction(action, selectedTasks).length > 0;
        const isBlockedByOtherAction = runningAction !== null && runningAction !== action;

        return (
          <Button
            key={action}
            color={color}
            variant="solid"
            icon={icon}
            title={t(titleKey)}
            disabled={!hasAvailableTasks || isBlockedByOtherAction}
            loading={runningAction === action}
            onClick={() => onActionClick(action)}
          />
        );
      })}
      <SelectedItemsCounter count={selectedTasks.length} align="start" />
    </Flex>
  );
};
