import { InfoCircleOutlined } from "@ant-design/icons";
import { TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";
import type { TaskStore } from "saltbox-core/store";
import { TaskDetails, type TaskDetailsData } from "saltbox-core/widgets/task/task-details";

import styles from "./task-details-modal.module.css";

type TaskDetailsModalProps = {
  taskStore: TaskStore;
};

export const TaskDetailsModal = observer(function TaskDetailsModal({
  taskStore,
}: TaskDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { task } = taskStore;

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const detailsData = useMemo<TaskDetailsData | null>(() => {
    if (!task) {
      return null;
    }

    const parameters = {};

    if (task?.kwarg) {
      parameters["kwarg"] = task.kwarg;
    }

    if (task?.arg) {
      parameters["arg"] = task.arg;
    }

    return {
      template: {
        title:
          getTemplateTitleText(task?.task_template?.title, i18n.language) ||
          task?.task_template?.name ||
          "",
        saltFunction: task.fun,
      },
      parameters,
      system: {
        taskType: task.task_type,
        batchSize: task?.batch_size,
        maxParallelJobs: task?.max_jobs_count_at_same_time,
        maxRetries: task?.max_retries,
        retryDelay: task?.retry_delay,
      },
      target: {
        collection: task.target_collection?.title ?? task.target_collection?.slug,
        minionIds: taskStore.minions?.map((minion) => minion.minion_id),
        isQueryBased: Boolean(task?.target_query && Object.keys(task.target_query).length > 0),
      },
      pillars: task?.pillars,
    };
  }, [task, taskStore.minions, i18n.language]);

  const isPolicy = task?.task_type === TaskType.Policy;

  return (
    <>
      <Button icon={<InfoCircleOutlined />} onClick={openModal} disabled={!task}>
        {t(isPolicy ? "policy.show-details" : "task.show-details")}
      </Button>

      <Modal
        title={t(isPolicy ? "policy.details-title" : "task.details-title")}
        open={isModalOpen}
        onCancel={closeModal}
        width="min(80vw, 800px)"
        footer={null}
        style={{ top: 50 }}
      >
        <Flex className={styles.taskDetailsModal} vertical>
          {detailsData && <TaskDetails data={detailsData} showTargetMinions={false} />}
        </Flex>
      </Modal>
    </>
  );
});
