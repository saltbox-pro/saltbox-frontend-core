import { TaskTemplateModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";
import { Tabs, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getTemplateDescriptionText,
  type TemplateDescriptionValue,
} from "saltbox-core/shared/utils/template-description";

import { taskTemplateService, taskCreationService } from "../service";
import type {
  PluginRenderData,
  TaskConfigurationFormData,
  TaskCreationContext,
  TaskOverviewData,
} from "../type/types";

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

export function TaskModal({ isOpen, templateId, context, onClose, onTaskCreated }: TaskModalProps) {
  const { t, i18n } = useTranslation();
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
        const defaultConfig = taskCreationService.getDefaultConfiguration();
        const templateDefaults = (
          loadedTemplate as unknown as { defaults?: Record<string, unknown> }
        ).defaults;
        setConfiguration({
          task_template_id: loadedTemplate.id,
          batch_size:
            typeof templateDefaults?.batch_size === "number"
              ? templateDefaults.batch_size
              : defaultConfig.batch_size,
          max_retries:
            typeof templateDefaults?.max_retries === "number"
              ? templateDefaults.max_retries
              : defaultConfig.max_retries,
          retry_delay:
            typeof templateDefaults?.retry_delay === "number"
              ? templateDefaults.retry_delay
              : defaultConfig.retry_delay,
          max_jobs_count_at_same_time:
            typeof templateDefaults?.max_jobs_count_at_same_time === "number"
              ? templateDefaults.max_jobs_count_at_same_time
              : defaultConfig.max_jobs_count_at_same_time,
          data: {},
        });
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

  const overviewData = useMemo(() => {
    return {
      template,
      configuration,
      context,
    } as TaskOverviewData;
  }, [configuration, context, template]);

  const pluginData = useMemo<PluginRenderData>(
    () => ({
      taskCreateRequest: taskCreationService.buildCreateRequest(
        configuration as TaskConfigurationFormData,
        context,
        template
      ),
      templateDescription:
        (getTemplateDescriptionText(
          (template?.description ?? null) as TemplateDescriptionValue,
          i18n.language
        ) ||
          template?.title) ??
        "",
    }),
    [configuration, context, template, i18n.language]
  );

  const pluginButtons = useMemo(() => {
    return context.renderPluginButtons?.(pluginData) ?? [];
  }, [context, pluginData]);

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
            type={context.taskType}
            isLoading={isCreating}
            overviewData={overviewData}
            pluginButtons={pluginButtons}
            onBack={handleBackToConfiguration}
            onConfirm={handleCreateTask}
          />
        ) : null,
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title={t(
          context.taskType === TaskType.Policy
            ? "policy-create.configure-policy-title"
            : "task-create.configure-task-title"
        )}
        open={isOpen}
        onCancel={onClose}
        width="min(80vw, 800px)"
        footer={null}
        maskClosable={false}
        closable={!isCreating}
        style={{ top: 50 }}
      >
        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
      </Modal>
    </>
  );
}
