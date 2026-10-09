import { TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import type { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

type TasksById = Record<string, TaskListResponseSchema>;

export const useTaskSelection = (pageTasks: TaskListResponseSchema[]) => {
  const [selectedTasksById, setSelectedTasksById] = useState<TasksById>({});

  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(Object.keys(selectedTasksById).map((taskId) => [taskId, true])),
    [selectedTasksById]
  );

  const selectedTasks = useMemo(() => Object.values(selectedTasksById), [selectedTasksById]);

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const nextSelection = typeof updater === "function" ? updater(rowSelection) : updater;

    setSelectedTasksById((previousTasksById) => {
      const nextTasksById: TasksById = {};
      Object.keys(nextSelection).forEach((taskId) => {
        const task =
          pageTasks.find((pageTask) => pageTask.id === taskId) ?? previousTasksById[taskId];
        if (task) {
          nextTasksById[taskId] = task;
        }
      });
      return nextTasksById;
    });
  };

  const syncSelectedTasks = useCallback((tasks: TaskListResponseSchema[]) => {
    setSelectedTasksById((previousTasksById) => {
      const updatedTasks = tasks.filter((task) => previousTasksById[task.id]);
      if (updatedTasks.length === 0) {
        return previousTasksById;
      }
      return {
        ...previousTasksById,
        ...Object.fromEntries(updatedTasks.map((task) => [task.id, task])),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTasksById({});
  }, []);

  return {
    rowSelection,
    selectedTasks,
    handleRowSelectionChange,
    syncSelectedTasks,
    clearSelection,
  };
};
