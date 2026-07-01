import { type TaskTemplateModel, TaskType } from "@saltbox/saltbox-core-api-client";
import { Modal, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Flex, Tabs, message, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateDescriptionText } from "saltbox-core/shared/utils/template-description";

import { getTaskTargetMode } from "../helpers/get-task-target-mode";
import { taskTemplateService, taskCreationService } from "../service";
import type {
  PluginRenderData,
  TaskConfigurationFormData,
  TaskCreationContext,
  TaskOverviewData,
} from "../type/types";

import { TaskConfigurationTab } from "./task-configuration-tab";
import { TaskOverviewTab } from "./task-overview-tab";
import { TaskTargetScopeWarning } from "./task-target-scope-warning";

const { Paragraph, Text } = Typography;

export type TaskModalProps = {
  isOpen: boolean;
  sourceId: string;
  templateId: string;
  context: TaskCreationContext;
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
};

const enum TabKey {
  Configuration = "Configuration",
  Overview = "Overview",
}

export function TaskModal({
  isOpen,
  sourceId,
  templateId,
  context,
  onClose,
  onTaskCreated,
}: TaskModalProps) {
  const { t, i18n } = useTranslation();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const [isCreating, setIsCreating] = useState(false);
  const [template, setTemplate] = useState<TaskTemplateModel | undefined>();
  const [activeTabKey, setActiveTabKey] = useState<string>(TabKey.Configuration);
  const [configuration, setConfiguration] = useState<Partial<TaskConfigurationFormData>>({
    ...taskCreationService.getDefaultConfiguration(),
  });

  const contentRef = useRef<HTMLDivElement | null>(null);

  const collectionName = context.collection?.title ?? context.slug;

  useEffect(() => {
    const scrollToTop = () => {
      const scrollableContainer = contentRef.current?.closest(".ant-modal-wrap");
      if (scrollableContainer) {
        scrollableContainer.scrollTop = 0;
      }
    };

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTop);
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeTabKey]);

  useEffect(() => {
    if (!isOpen || !templateId || !sourceId) {
      return;
    }

    const loadTemplate = async () => {
      try {
        const loadedTemplate = await taskTemplateService.loadTemplateById(sourceId, templateId);
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
        if (!isGlobalServerError(error)) {
          messageApi.error(t("task-create.error-loading-template"));
        }
        onClose();
      }
    };

    loadTemplate();
    // should trigger only when the props are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sourceId, templateId]);

  const handleConfigurationSubmit = (data: TaskConfigurationFormData) => {
    setConfiguration(data);
    setActiveTabKey(TabKey.Overview);
  };

  const handleBackToConfiguration = () => {
    setActiveTabKey(TabKey.Configuration);
  };

  const confirmTaskTargetScope = (
    targetMode: "filtered" | "whole-collection"
  ): Promise<boolean> => {
    const entityType = t(
      context.taskType === TaskType.Policy
        ? "task.type-policy-accusative"
        : "task.type-classic-accusative"
    );

    const descriptionKey =
      targetMode === "filtered"
        ? "task-create.confirm-apply-to-filtered-collection-description"
        : "task-create.confirm-apply-to-whole-collection-description";

    return new Promise((resolve) => {
      modalApi.confirm({
        title: t("common.launch-confirmation-title"),
        content: (
          <>
            <Paragraph>
              {t(descriptionKey, {
                entityType,
                collectionName,
              })}
            </Paragraph>
            <Text>{t("common.confirm-continue-question")}</Text>
          </>
        ),
        icon: null,
        okText: t("common.yes"),
        cancelText: t("common.no"),
        maskClosable: false,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  const handleCreateTask = async () => {
    if (!configuration || !template) {
      messageApi.error(t("task-create.invalid-configuration"));
      return;
    }

    const targetMode = getTaskTargetMode(context);
    if (targetMode === "filtered" || targetMode === "whole-collection") {
      const confirmed = await confirmTaskTargetScope(targetMode);
      if (!confirmed) {
        return;
      }
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
      if (isGlobalServerError(error)) return;
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
        (getTemplateDescriptionText(template?.description ?? null, i18n.language) ||
          template?.title) ??
        "",
      collectionName,
    }),
    [configuration, context, template, i18n.language, collectionName]
  );

  const pluginButtons = useMemo(() => {
    return context.renderPluginButtons?.(pluginData) ?? [];
  }, [context, pluginData]);

  const configurationTopContent = useMemo(() => {
    const targetMode = getTaskTargetMode(context);
    if (targetMode === "selected") return null;

    return (
      <TaskTargetScopeWarning
        mode={targetMode}
        taskType={context.taskType}
        collectionName={collectionName}
        userQuery={context.query}
        userQueryFilterSchema={context.queryFilterSchema}
      />
    );
  }, [collectionName, context]);

  const tabs = [
    {
      key: TabKey.Configuration,
      label: t("task-create.configuration-tab"),
      children: (
        <TaskConfigurationTab
          template={template}
          initialData={configuration}
          topContent={configurationTopContent}
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
      {messageContextHolder}
      {modalContextHolder}

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
        <Flex ref={contentRef} vertical>
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
        </Flex>
      </Modal>
    </>
  );
}
