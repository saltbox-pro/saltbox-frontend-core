import { TaskType } from "@saltbox/saltbox-core-api-client";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

export const useTaskCreate = () => {
  const navigate = useNavigate();
  const [taskType, setTaskType] = useState<TaskType>(TaskType.Classic);
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false);

  const openTaskCreate = useCallback(() => {
    setTaskType(TaskType.Classic);
    setIsTaskCreateOpen(true);
  }, []);

  const openPolicyCreate = useCallback(() => {
    setTaskType(TaskType.Policy);
    setIsTaskCreateOpen(true);
  }, []);

  const closeTaskCreate = useCallback(() => {
    setIsTaskCreateOpen(false);
  }, []);

  const goToTaskPage = useCallback(
    (taskId: string) => {
      navigate(`/task/${taskId}`);
    },
    [navigate]
  );

  return {
    taskType,
    isTaskCreateOpen,
    openTaskCreate,
    openPolicyCreate,
    closeTaskCreate,
    goToTaskPage,
  };
};
