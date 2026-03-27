import {
  type JobReturnModel,
  type JobsListResponse,
  type TaskMinionModel,
  TaskMinionStatus,
  type TaskModel,
} from "@saltbox/saltbox-core-api-client";
import { PageHeader, WebSocketMessage, WebSocketService } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { TaskMinions } from "saltbox-core/shared/components/task/task-minions";
import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import { TaskMinionsStats } from "saltbox-core/widgets/task/task-minions-stats";
import { MinionCategory } from "saltbox-core/widgets/task/task-minions-stats/model/minion-category";
import { TaskRunDetails } from "saltbox-core/widgets/task/task-run-details";

const categoryToStatus = (category: MinionCategory): TaskMinionStatus | null => {
  switch (category) {
    case MinionCategory.Pending:
      return TaskMinionStatus.Pending;
    case MinionCategory.InWork:
      return TaskMinionStatus.InWork;
    case MinionCategory.Failed:
      return TaskMinionStatus.Failed;
    case MinionCategory.Success:
      return TaskMinionStatus.Success;
    default:
      return null;
  }
};

const statusToCategory = (status: TaskMinionStatus | null): MinionCategory => {
  if (status === TaskMinionStatus.Pending) return MinionCategory.Pending;
  if (status === TaskMinionStatus.InWork) return MinionCategory.InWork;
  if (status === TaskMinionStatus.Failed) return MinionCategory.Failed;
  if (status === TaskMinionStatus.Success) return MinionCategory.Success;
  return MinionCategory.All;
};

type TaskWebSocketMessage = TaskModel | TaskMinionModel | JobReturnModel | JobsListResponse;

const useWebSocket = (
  taskId: string,
  onUpdate: (messages: Array<WebSocketMessage<TaskWebSocketMessage>>) => void
) => {
  const [webSocketService] = useState(new WebSocketService<TaskWebSocketMessage>());

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

  useEffect(() => {
    if (webSocketService && appStore.authStore?.user?.access_token) {
      webSocketService.sendAccessToken(appStore.authStore.user.access_token);
    }
  }, [appStore.authStore?.user]);
};

const TaskPage = observer(() => {
  const { t } = useTranslation();
  const { taskid: taskId } = useParams();
  const navigate = useNavigate();

  const [taskStore] = useState(new TaskStore());

  useEffect(() => {
    if (taskId) {
      taskStore.reload(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskStore.error) {
      navigate("/core/not-found");
    }
  }, [taskStore.error]);

  const selectedMinionCategory = statusToCategory(taskStore.minionCategoryFilter);

  const handleSelectMinionCategory = (category: MinionCategory) => {
    taskStore.setMinionCategoryFilter(categoryToStatus(category));
  };

  useWebSocket(taskId, (messages) => {
    if (messages?.length > 0) {
      taskStore.updateTasks(
        messages
          .filter((message) => message.message_tag === "task")
          .map((message) => message.payload) as TaskModel[]
      );
      taskStore.updateJobs(
        messages
          .filter((message) => message.message_tag === "job")
          .map((message) => message.payload) as JobsListResponse[]
      );
      taskStore.updateMinions(
        messages
          .filter((message) => message.message_tag === "task-minion")
          .map((message) => message.payload) as TaskMinionModel[]
      );
      taskStore.updateJobReturns(
        messages
          .filter((message) => message.message_tag === "job-return")
          .map((message) => message.payload) as JobReturnModel[]
      );
    }
  });

  return (
    <>
      <PageHeader
        title={t("task.page-title", {
          templateName: taskStore.task?.task_template?.title ?? "...",
          taskId: taskId ?? "...",
        })}
        customParentPathGenerator={() =>
          `/core/${taskStore.task.task_type === "policy" ? "policies" : "tasks"}`
        }
      />

      <Flex vertical gap={10} flex={1} style={{ minHeight: 0 }}>
        <TaskRunDetails taskStore={taskStore} />

        <TaskMinionsStats
          taskStore={taskStore}
          selectedCategory={selectedMinionCategory}
          onSelectCategory={handleSelectMinionCategory}
        />

        <TaskMinions taskStore={taskStore} />
      </Flex>
    </>
  );
});

export default TaskPage;
