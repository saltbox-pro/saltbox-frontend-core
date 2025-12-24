import { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { Modal, publish } from "@saltbox/saltbox-frontend-common";
import { Tabs, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { taskTemplateService, taskCreationService } from "../service";
import { TaskConfigurationFormData, TaskCreationContext } from "../type/types";

import { TaskConfigurationTab } from "./task-configuration-tab";
import { TaskOverviewTab } from "./task-overview-tab";

export type TaskModalProps = {
  isOpen: boolean;
  templateId: string;
  context: TaskCreationContext;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

const enum TabKey {
  Configuration = "Configuration",
  Overview = "Overview",
}

const memoize = createObjectMemoizer();

export function TaskModal({ isOpen, templateId, context, onClose, onTaskCreated }: TaskModalProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [isCreating, setIsCreating] = useState(false);
  const [template, setTemplate] = useState<TaskTemplateModel | undefined>();
  const [activeTabKey, setActiveTabKey] = useState<string>(TabKey.Configuration);
  const [configuration, setConfiguration] = useState<Partial<TaskConfigurationFormData>>({
    ...taskCreationService.getDefaultConfiguration(),
  });

  useEffect(() => {
    if (!isOpen || !templateId) {
      return;
    }

    const loadTemplate = async () => {
      try {
        const loadedTemplate = await taskTemplateService.loadTemplateById(templateId);
        setTemplate(loadedTemplate);
        setConfiguration((prev) => ({
          ...prev,
          task_template_id: loadedTemplate.id,
          data: {},
        }));
      } catch (error) {
        messageApi.error(t("task-create.error-loading-template"));
        onClose();
      }
    };

    loadTemplate();
    // should trigger only when the props are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, templateId]);

  const handleConfigurationSubmit = (data: TaskConfigurationFormData) => {
    setConfiguration(data);
    setActiveTabKey(TabKey.Overview);
  };

  const handleBackToConfiguration = () => {
    setActiveTabKey(TabKey.Configuration);
  };

  const handleCreateTask = async () => {
    if (!configuration || !template) {
      messageApi.error(t("task-create.invalid-configuration"));
      return;
    }

    setIsCreating(true);
    try {
      const request = taskCreationService.buildCreateRequest(
        configuration as TaskConfigurationFormData,
        context,
        template
      );

      const taskId = await taskCreationService.createTask(request);
      messageApi.success(t("task-create.task-created-successfully"));
      onTaskCreated(taskId);
    } catch (error) {
      messageApi.error(t("task-create.error-creating-task"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTaskPlugin = (pluginKey: string) => {
    publish("minions.taskmodal.create", {
      action: "create",
      pluginKey,
      taskCreateRequest: taskCreationService.buildCreateRequest(
        configuration as TaskConfigurationFormData,
        context,
        template
      ),
      templateDescription: template?.title ?? "",
    });
    onClose();
  };

  const tabs = [
    {
      key: TabKey.Configuration,
      label: t("task-create.configuration-tab"),
      children: (
        <TaskConfigurationTab
          template={template}
          initialData={configuration}
          onSubmit={handleConfigurationSubmit}
          onCancel={onClose}
        />
      ),
    },
    {
      key: TabKey.Overview,
      label: t("task-create.overview-tab"),
      disabled: activeTabKey !== TabKey.Overview,
      children:
        template && configuration ? (
          <TaskOverviewTab
            isLoading={isCreating}
            overviewData={memoize({
              template,
              configuration: configuration as TaskConfigurationFormData,
              context,
            })}
            onBack={handleBackToConfiguration}
            onConfirm={handleCreateTask}
            onCreateTaskPlugin={handleCreateTaskPlugin}
          />
        ) : null,
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title={t("task-create.configure-task-title")}
        open={isOpen}
        onCancel={onClose}
        width="min(80vh, 800px)"
        footer={null}
        maskClosable={false}
        closable={!isCreating}
      >
        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
      </Modal>
    </>
  );
}
