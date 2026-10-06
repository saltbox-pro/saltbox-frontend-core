import { type TaskTemplateModel, TaskType } from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  createLoader,
  ErrorZone,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
  TemplateSchemaErrorView,
  getLocalizedText,
  subscribe,
  unsubscribe,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Spin, Tabs, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { taskTemplateService } from "saltbox-core/shared/services/task-template.service";
import { buildDefaultTaskTemplate } from "saltbox-core/shared/sls-templates";
import { parseTtlValue } from "saltbox-core/shared/utils/job-modal-utils";
import { getTemplateSchemaError } from "saltbox-core/shared/utils/template-schema-validation";

import { getTaskTargetMode } from "../helpers/get-task-target-mode";
import { taskCreationService } from "../service";
import type {
  PluginRenderData,
  SelectedTaskTemplate,
  TaskConfigurationFormData,
  TaskCreationContext,
  TaskOverviewData,
  TaskTemplateDraft,
} from "../type/types";

import { TaskConfigurationTab } from "./task-configuration-tab";
import { TaskOverviewTab } from "./task-overview-tab";
import { TaskTargetScopeWarning } from "./task-target-scope-warning";

const { Paragraph, Text } = Typography;

export type TaskModalProps = {
  selection: SelectedTaskTemplate;
  context: TaskCreationContext;
  initialDraft?: TaskTemplateDraft;
  onReturnedToPicker: () => void;
  onFlowDismissed: () => void;
  onReturnToTemplatePicker: (draft: TaskTemplateDraft) => void;
  onTaskCreated: (taskId: string) => void;
};

const enum TabKey {
  Configuration = "Configuration",
  Overview = "Overview",
}

type TaskModalCloseReason = "return-to-picker" | "dismiss" | "scheduler-handoff";

export const TaskModal = observer(function TaskModal({
  selection,
  context,
  initialDraft,
  onReturnedToPicker,
  onFlowDismissed,
  onReturnToTemplatePicker,
  onTaskCreated,
}: TaskModalProps) {
  const { t, i18n } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<AppError | null>(null);
  const [template, setTemplate] = useState<TaskTemplateModel | undefined>();
  const [activeTabKey, setActiveTabKey] = useState<string>(TabKey.Configuration);
  const [configuration, setConfiguration] = useState<Partial<TaskConfigurationFormData>>(
    initialDraft?.configuration ?? {
      ...taskCreationService.getDefaultConfiguration(),
    }
  );

  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeReasonRef = useRef<TaskModalCloseReason | null>(null);
  // Лоадер живёт дольше эффекта, а раскладка ответа по состоянию — внутри него: держим её в ref.
  const applyTemplateRef = useRef<(loadedTemplate: TaskTemplateModel) => void>(() => undefined);

  const [templateLoad] = useState(() =>
    createLoader({
      run: (sourceId: string, templateId: string) =>
        taskTemplateService.loadTemplateById(sourceId, templateId),
      onSuccess: (loadedTemplate) => applyTemplateRef.current(loadedTemplate),
    })
  );

  const collectionName = context.collection?.title ?? context.slug;
  const isPolicy = context.taskType === TaskType.Policy;

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
    const applyTemplate = (loadedTemplate: TaskTemplateModel) => {
      setTemplate(loadedTemplate);

      if (initialDraft?.configuration) {
        setConfiguration(initialDraft.configuration);
        return;
      }

      const defaultConfig = taskCreationService.getDefaultConfiguration();
      const templateDefaults = (loadedTemplate as unknown as { defaults?: Record<string, unknown> })
        .defaults;
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
        ttl_jobs: parseTtlValue(templateDefaults?.ttl) ?? undefined,
        data: {},
      });
    };

    applyTemplateRef.current = applyTemplate;

    if (selection.kind === "custom-function") {
      applyTemplate(buildDefaultTaskTemplate(selection.fun, context.taskType));
      return;
    }

    const { sourceId, templateId } = selection;
    if (!templateId || !sourceId) {
      return;
    }

    templateLoad.run(sourceId, templateId).catch(() => undefined);
  }, [selection]);

  const closeModal = (reason?: TaskModalCloseReason) => {
    if (isCreating) {
      return;
    }
    if (reason) {
      closeReasonRef.current = reason;
    }
    setIsModalOpen(false);
  };

  const handleModalDismiss = () => {
    closeModal("dismiss");
  };

  useEffect(() => {
    const handleSchedulerReturn = () => {
      setIsModalOpen(true);
    };

    const handleSchedulerCancel = () => {
      if (isCreating) {
        return;
      }
      setIsModalOpen(false);
      onFlowDismissed();
    };

    subscribe("minions.taskmodal.return", handleSchedulerReturn);
    subscribe("minions.taskmodal.cancel", handleSchedulerCancel);

    return () => {
      unsubscribe("minions.taskmodal.return", handleSchedulerReturn);
      unsubscribe("minions.taskmodal.cancel", handleSchedulerCancel);
    };
  }, [isCreating, onFlowDismissed]);

  const handleReturnToTemplatePicker = (draft: TaskTemplateDraft) => {
    if (isCreating) {
      return;
    }
    onReturnToTemplatePicker(draft);
    closeModal("return-to-picker");
  };

  const schemaError = useMemo(() => {
    if (!template) {
      return null;
    }

    return getTemplateSchemaError(template, i18n.language);
  }, [i18n.language, template]);

  const templateTitle =
    getLocalizedText(template?.title, i18n.language) || template?.name || template?.fun || "";

  const sourceName = selection.kind === "template" ? selection.sourceName : undefined;

  const handleReturnFromSchemaError = () => {
    const defaultConfig = taskCreationService.getDefaultConfiguration();

    handleReturnToTemplatePicker({
      configuration: {
        task_template_id: template?.id ?? "",
        ...defaultConfig,
        save_pillars_as_default: false,
        data: {},
      },
      showAdvanced: initialDraft?.showAdvanced ?? false,
    });
  };

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
    const entityType = t(isPolicy ? "task.type-policy-accusative" : "task.type-classic-accusative");

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
      notify.error(t("task-create.invalid-configuration"));
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
    setCreateError(null);

    const result = await runMutation({
      run: () =>
        taskCreationService.createTask(
          taskCreationService.buildCreateRequest(
            configuration as TaskConfigurationFormData,
            context,
            template
          )
        ),
      successMessage: t(
        isPolicy
          ? "policy-create.policy-created-successfully"
          : "task-create.task-created-successfully"
      ),
      onError: setCreateError,
    });

    setIsCreating(false);
    if (!result.ok) return;

    onTaskCreated(result.data);
  };

  const overviewData = useMemo(() => {
    return {
      template,
      configuration,
      context,
    } as TaskOverviewData;
  }, [configuration, context, template]);

  const pluginData = useMemo<PluginRenderData | undefined>(() => {
    if (!template || schemaError) {
      return undefined;
    }

    return {
      taskCreateRequest: taskCreationService.buildCreateRequest(
        configuration as TaskConfigurationFormData,
        context,
        template
      ),
      templateDescription:
        getLocalizedText(template.description ?? null, i18n.language) ||
        getLocalizedText(template.title, i18n.language) ||
        template.name ||
        "",
      collectionName,
    };
  }, [collectionName, configuration, context, i18n.language, schemaError, template]);

  const handleSchedulerHandoff = () => {
    closeModal("scheduler-handoff");
  };

  const pluginButtons =
    pluginData == null
      ? []
      : (context.renderPluginButtons?.(pluginData, { onHandoff: handleSchedulerHandoff }) ?? []);

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

  const tabs = useMemo(() => {
    if (!template || schemaError) {
      return null;
    }

    return [
      {
        key: TabKey.Configuration,
        label: t("task-create.configuration-tab"),
        children: (
          <TaskConfigurationTab
            template={template}
            initialData={configuration}
            initialShowAdvanced={initialDraft?.showAdvanced}
            initialTtlJobsUnit={initialDraft?.ttlJobsUnit}
            initialTtlTaskUnit={initialDraft?.ttlTaskUnit}
            isPolicy={isPolicy}
            topContent={configurationTopContent}
            onSubmit={handleConfigurationSubmit}
            onReturnToTemplatePicker={handleReturnToTemplatePicker}
          />
        ),
      },
      {
        key: TabKey.Overview,
        label: t("task-create.overview-tab"),
        disabled: activeTabKey !== TabKey.Overview,
        children: configuration && (
          <TaskOverviewTab
            type={context.taskType}
            isLoading={isCreating}
            overviewData={overviewData}
            pluginButtons={pluginButtons}
            onBack={handleBackToConfiguration}
            onConfirm={handleCreateTask}
          />
        ),
      },
    ];
  }, [
    activeTabKey,
    configuration,
    configurationTopContent,
    context.taskType,
    handleBackToConfiguration,
    handleConfigurationSubmit,
    handleCreateTask,
    handleReturnToTemplatePicker,
    initialDraft?.showAdvanced,
    initialDraft?.ttlJobsUnit,
    initialDraft?.ttlTaskUnit,
    isCreating,
    isPolicy,
    overviewData,
    pluginButtons,
    schemaError,
    t,
    template,
  ]);

  let modalContent: ReactNode;

  if (!template) {
    modalContent = templateLoad.error ? null : (
      <Flex align="center" justify="center" style={{ minHeight: 200 }}>
        <Spin />
      </Flex>
    );
  } else if (schemaError) {
    modalContent = (
      <TemplateSchemaErrorView
        templateTitle={templateTitle}
        schemaError={schemaError}
        sourceName={sourceName}
        onReturn={handleReturnFromSchemaError}
      />
    );
  } else {
    modalContent = tabs && (
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
    );
  }

  return (
    <>
      {modalContextHolder}

      <Modal
        title={t(
          isPolicy ? "policy-create.configure-policy-title" : "task-create.configure-task-title"
        )}
        open={isModalOpen}
        onCancel={handleModalDismiss}
        afterClose={() => {
          const reason = closeReasonRef.current;
          closeReasonRef.current = null;
          if (reason === "return-to-picker") {
            onReturnedToPicker();
            return;
          }
          if (reason === "scheduler-handoff") {
            return;
          }
          onFlowDismissed();
        }}
        width="min(80vw, 800px)"
        footer={null}
        maskClosable={false}
        closable={!isCreating}
        style={{ top: 50 }}
      >
        <Flex ref={contentRef} vertical>
          <MutationErrorAlert
            error={createError}
            fallback={t(
              isPolicy ? "policy-create.error-creating-policy" : "task-create.error-creating-task"
            )}
            onClose={() => setCreateError(null)}
          />

          <ErrorZone level="block" loaders={[templateLoad]}>
            {modalContent}
          </ErrorZone>
        </Flex>
      </Modal>
    </>
  );
});
