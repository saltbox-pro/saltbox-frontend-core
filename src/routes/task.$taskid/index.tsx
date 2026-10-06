import {
  type JobReturnModel,
  type TaskMinionListResponse,
  type TaskModel,
} from "@saltbox/saltbox-core-api-client";
import {
  ErrorZone,
  PageHeader,
  WebSocketMessage,
  WebSocketService,
  getLocalizedText,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { TaskMinions } from "saltbox-core/shared/components/task/task-minions";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { TaskMinionStatusFilter } from "saltbox-core/widgets/task/task-minions-status-filter";
import { TaskRunDetails } from "saltbox-core/widgets/task/task-run-details";
import { TaskStatusProgress } from "saltbox-core/widgets/task/task-status-progress";

type TaskWebSocketMessage = TaskModel | TaskMinionListResponse | JobReturnModel;

const useWebSocket = (
  taskId: string,
  onUpdate: (messages: Array<WebSocketMessage<TaskWebSocketMessage>>) => void
) => {
  const [webSocketService] = useState(() => new WebSocketService<TaskWebSocketMessage>());

  useEffect(() => {
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/tasks/${taskId}`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: onUpdate,
      }
    );
    return () => webSocketService.disconnect();
  }, []);
};

const TaskPage = observer(() => {
  const { t, i18n } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();

  const [taskStore] = useState(new TaskStore());

  useEffect(() => {
    if (taskId) {
      taskStore.reload(taskId);
    }
  }, [taskId]);

  useWebSocket(taskId, (messages) => {
    if (messages?.length > 0) {
      taskStore.updateTasks(
        messages
          .filter((message) => message.message_tag === "task")
          .map((message) => message.payload) as TaskModel[]
      );
      taskStore.updateMinions(
        messages
          .filter((message) => message.message_tag === "task-minion")
          .map((message) => message.payload) as TaskMinionListResponse[]
      );
      taskStore.mergeTaskJobReturnsFromSocket(
        messages
          .filter((message) => message.message_tag === "job-return")
          .map((message) => message.payload as JobReturnModel)
      );
    }
  });

  return (
    <>
      <PageHeader
        title={t("task.page-title", {
          templateName:
            getLocalizedText(taskStore.task?.task_template?.title, i18n.language) ||
            taskStore.task?.task_template?.name ||
            "...",
          taskId: taskId ?? "...",
        })}
        customParentPathGenerator={() =>
          `/core/${taskStore.task?.task_type === "policy" ? "policies" : "tasks"}`
        }
      />

      <ErrorZone
        level="page"
        loaders={[taskStore.taskLoad]}
        onNavigateHome={() =>
          navigate(`/core/${taskStore.task?.task_type === "policy" ? "policies" : "tasks"}`)
        }
      >
        <Flex vertical gap={10} flex={1} style={{ minHeight: 0 }}>
          <TaskRunDetails taskStore={taskStore} />

          <TaskStatusProgress
            counts={taskStore.task?.minions_count}
            taskType={taskStore.task?.task_type}
          />

          <TaskMinionStatusFilter
            counts={taskStore.task?.minions_count}
            taskType={taskStore.task?.task_type}
            selectedCategory={taskStore.minionCategoryFilter}
            onSelectCategory={taskStore.setMinionCategoryFilter}
          />

          <TaskMinions taskStore={taskStore} />
        </Flex>
      </ErrorZone>
    </>
  );
});

export default TaskPage;
