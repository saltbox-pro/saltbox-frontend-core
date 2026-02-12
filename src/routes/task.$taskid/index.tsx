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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { apiCoreStore, appStore, TaskStore } from "saltbox-core/store";
import {
  MinionTaskResultsDrawer,
  useMinionTaskResultsDrawer,
} from "saltbox-core/widgets/minion-task-results-drawer";
import { TaskMinionsStats } from "saltbox-core/widgets/task/task-minions-stats";
import { MinionCategory } from "saltbox-core/widgets/task/task-minions-stats/model/minion-category";
import { TaskRunDetails } from "saltbox-core/widgets/task/task-run-details";

import { TaskMinions } from "./-components/task-minions/task-minions";

const useMinions = (taskStore: TaskStore) => {
  const [selectedMinionCategory, setSelectedMinionCategory] = useState(MinionCategory.All);

  const minionsOfCategory = useMemo(() => {
    const getMinionsByStatus = (status: TaskMinionStatus) => {
      return taskStore.minions?.filter((minion) => minion.status === status);
    };
    if (selectedMinionCategory === MinionCategory.All) {
      return taskStore.minions;
    }
    if (selectedMinionCategory === MinionCategory.Pending) {
      return getMinionsByStatus(TaskMinionStatus.Pending);
    }
    if (selectedMinionCategory === MinionCategory.InWork) {
      return getMinionsByStatus(TaskMinionStatus.InWork);
    }
    if (selectedMinionCategory === MinionCategory.Failed) {
      return getMinionsByStatus(TaskMinionStatus.Failed);
    }
    if (selectedMinionCategory === MinionCategory.Success) {
      return getMinionsByStatus(TaskMinionStatus.Success);
    }
    return [];
  }, [taskStore.minions, selectedMinionCategory]);

  const minionCategoryStats = useMemo(() => {
    const getMinionStatusCount = (status: TaskMinionStatus) => {
      return taskStore.minions?.filter((minion) => {
        return minion.status === status;
      }).length;
    };

    const countMinionsAll = taskStore.minions?.length ?? 0;
    const countMinionsPending = getMinionStatusCount(TaskMinionStatus.Pending);
    const countMinionsInWork = getMinionStatusCount(TaskMinionStatus.InWork);
    const countMinionsFailed = getMinionStatusCount(TaskMinionStatus.Failed);
    const countMinionsSuccess = getMinionStatusCount(TaskMinionStatus.Success);
    return (
      <TaskMinionsStats
        counts={{
          all: countMinionsAll,
          pending: countMinionsPending,
          inWork: countMinionsInWork,
          failed: countMinionsFailed,
          success: countMinionsSuccess,
        }}
        selectedCategory={selectedMinionCategory}
        onSelectCategory={setSelectedMinionCategory}
      />
    );
  }, [taskStore.task, taskStore.minions, selectedMinionCategory]);

  return {
    minions: {
      value: minionsOfCategory,
      selectedCategory: selectedMinionCategory,
      updateSelectedCategory: setSelectedMinionCategory,
    },
    minionCategoryStats,
  };
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
  const { minions, minionCategoryStats } = useMinions(taskStore);
  const minionTaskResultsDrawer = useMinionTaskResultsDrawer(taskStore);

  useEffect(() => {
    if (taskId) {
      taskStore.reload(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskStore.error) {
      navigate("/not-found");
    }
  }, [taskStore.error]);

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
      />

      <Flex vertical gap={10} flex={1}>
        <TaskRunDetails taskStore={taskStore} />

        {minionCategoryStats}

        <TaskMinions
          minions={minions.value}
          collectionSlug={taskStore.task?.target_collection?.slug ?? ""}
          isLoading={taskStore.isTaskLoading}
          onMinionClick={minionTaskResultsDrawer.open}
        />
      </Flex>

      <MinionTaskResultsDrawer
        isOpened={minionTaskResultsDrawer.isOpened}
        openedId={minionTaskResultsDrawer.openedId}
        selectedMinion={minionTaskResultsDrawer.selectedMinion}
        selectedMinionJobReturns={minionTaskResultsDrawer.selectedMinionJobReturns}
        slug={minionTaskResultsDrawer.slug}
        onClose={minionTaskResultsDrawer.close}
        clearData={minionTaskResultsDrawer.clearData}
      />
    </>
  );
});

export default TaskPage;
