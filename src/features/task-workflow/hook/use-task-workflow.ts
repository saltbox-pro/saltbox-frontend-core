import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

type ModalType = "task" | "policy" | null;

export const useTaskWorkflow = () => {
  const navigate = useNavigate();
  const [openedModal, setOpenedModal] = useState<ModalType>(null);

  const openTaskCreate = useCallback(() => {
    setOpenedModal("task");
  }, []);

  const openPolicyCreate = useCallback(() => {
    setOpenedModal("policy");
  }, []);

  const closeModal = useCallback(() => {
    setOpenedModal(null);
  }, []);

  const goToTaskPage = useCallback(
    (taskId: string) => {
      navigate(`/task/${taskId}`);
    },
    [navigate]
  );

  return {
    isTaskCreateOpen: openedModal === "task",
    isPolicyCreateOpen: openedModal === "policy",
    openTaskCreate,
    openPolicyCreate,
    closeModal,
    goToTaskPage,
  };
};
