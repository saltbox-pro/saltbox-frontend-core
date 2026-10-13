import { SearchOutlined } from "@ant-design/icons";
import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
} from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  ErrorZone,
  publish,
  resolvePluginLocalizedLabel,
  runMutation,
  subscribe,
  MutationErrorAlert,
  TemplateSchemaErrorView,
  unsubscribe,
  Modal,
  JsonForm,
  notify,
  revalidateJsonFormAfterAdvancedOpen,
  type JsonFormRef,
} from "@saltbox/saltbox-frontend-common";
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  Select,
  Spin,
  Switch,
  Typography,
  message,
  type FormProps,
} from "antd";
import { observer } from "mobx-react-lite";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";
import { TemplateParamsPlaceholder } from "saltbox-core/shared/components/template-params-placeholder/template-params-placeholder";
import { TtlInput } from "saltbox-core/shared/components/ttl-input";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { resolveBuiltinJobSchema } from "saltbox-core/shared/sls-templates";
import {
  getArgAndKwargForRequest,
  ttlPartsToTotalSeconds,
} from "saltbox-core/shared/utils/job-modal-utils";
import {
  getJobParamsSchemaLayout,
  hasJsonSchemaProperties,
  validateJobJsonFormData,
  type JsonSchemaRecord,
} from "saltbox-core/shared/utils/job-schema-split";
import { getTemplateParamsSchema } from "saltbox-core/shared/utils/template-params-schema";
import { apiCoreStore, appStore, i18nStore } from "saltbox-core/store";

import { useJobModalInit, type JobModalFormValues } from "../hooks/use-job-modal-init";
import type { JobReturnToPickerSnapshot } from "../type/types";

import { FieldHint } from "./components/field-hint/field-hint";
import { TargetTypeSelect } from "./components/target-type-select/target-type-select";
import styles from "./job-modal.module.css";

interface JobModalProps {
  target?: string;
  targetType?: CreateJobRequestTgtTypeEnum;
  fun: string;
  sourceId?: string;
  sourceName?: string;
  templateId?: string;
  allowBuiltinSchemaFallback?: boolean;
  initialJsonFormValue?: Record<string, unknown>;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  defaultMaster?: string;
  fixedMaster?: string;
  initialTtlSeconds?: number;
  openOnMount?: boolean;
  onAfterClose?: () => void;
  onReturnToFunctionPicker: (payload: JobReturnToPickerSnapshot) => void;
  onJobModalClosed?: () => void;
}

type JobFormData = JobModalFormValues;

type JobModalCloseReason = "return-to-picker" | "dismiss" | "scheduler-handoff";

const JSON_FORM_INPUT_SELECTOR =
  "#job-params-form input, #job-params-form textarea, #job-params-form select";

export const JobModal = observer(function JobModal({
  target,
  targetType,
  fun,
  sourceId,
  sourceName,
  templateId,
  allowBuiltinSchemaFallback,
  initialJsonFormValue,
  arg,
  kwarg,
  defaultMaster,
  fixedMaster,
  initialTtlSeconds,
  openOnMount,
  onAfterClose,
  onReturnToFunctionPicker,
  onJobModalClosed,
}: JobModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [createError, setCreateError] = useState<AppError | null>(null);
  const [isAdvancedSettingsEnabled, setIsAdvancedSettingsEnabled] = useState(false);

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);
  const closeReasonRef = useRef<JobModalCloseReason | null>(null);
  const shouldRevalidateJsonFormAfterAdvancedOpenRef = useRef(false);

  const handleLoadFailed = useCallback(() => {
    setIsModalOpen(false);
    onAfterClose?.();
  }, [onAfterClose]);

  const {
    isInitialLoading,
    isFormReady,
    initLoad,
    masterList,
    paramsSource,
    schemaError,
    templateTitle,
    sourceDisplayName,
    jsonFormValue,
    setJsonFormValue,
    baselineKwarg,
    ttlValue,
    setTtlValue,
    ttlUnit,
    setTtlUnit,
    initializeModal,
    resetLoadedData,
    cancelInit,
  } = useJobModalInit({
    fun,
    sourceId,
    sourceName,
    templateId,
    language: i18n.language,
    allowBuiltinSchemaFallback,
    initialJsonFormValue,
    arg,
    kwarg,
    target,
    targetType,
    defaultMaster: fixedMaster ?? defaultMaster,
    initialTtlSeconds,
    form,
    messageApi,
    t,
    onLoadFailed: handleLoadFailed,
  });

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const isLoading = isInitialLoading || isJobCreating;

  const isTemplateMode = paramsSource?.kind === "template";

  const functionParamsSchema = useMemo(
    () =>
      paramsSource?.kind === "function"
        ? resolveBuiltinJobSchema(paramsSource.schema, i18n.language)
        : undefined,
    [paramsSource, i18n.language]
  );

  const functionJsonSchema = functionParamsSchema?.json_schema as JsonSchemaRecord | undefined;
  const functionUiSchema = functionParamsSchema?.ui_schema as JsonSchemaRecord | undefined;

  const templateParamsSchema = useMemo(
    () =>
      getTemplateParamsSchema(
        paramsSource?.kind === "template" ? paramsSource.template : undefined,
        i18n.language
      ),
    [paramsSource, i18n.language]
  );

  const paramsJsonSchema = isTemplateMode
    ? templateParamsSchema.isFieldless
      ? undefined
      : (templateParamsSchema.jsonSchema as JsonSchemaRecord | undefined)
    : functionJsonSchema;

  const paramsUiSchema = isTemplateMode
    ? (templateParamsSchema.uiSchema as JsonSchemaRecord | undefined)
    : functionUiSchema;

  const jobParamsSchemaLayout = useMemo(
    () => getJobParamsSchemaLayout(paramsJsonSchema, paramsUiSchema, isAdvancedSettingsEnabled),
    [paramsJsonSchema, paramsUiSchema, isAdvancedSettingsEnabled]
  );

  useEffect(() => {
    if (paramsSource?.kind !== "function") {
      return;
    }
    setIsAdvancedSettingsEnabled(paramsSource.schema.name === "default");
  }, [paramsSource]);

  const openModal = useCallback(() => {
    closeReasonRef.current = null;
    setIsAdvancedSettingsEnabled(false);
    setIsModalOpen(true);
    initializeModal();
  }, [initializeModal]);

  const keydownHandler = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (!isModalOpen || schemaError) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (isLoading || isSubmittingRef.current) return;

        event.preventDefault();
        event.stopPropagation();

        isSubmittingRef.current = true;
        form.submit();
      }
    },
    [form, isLoading, isModalOpen, schemaError]
  );

  useDocumentEvent("keydown", keydownHandler, true);

  useEffect(() => {
    if (openOnMount && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      openModal();
    }
  }, [openOnMount, openModal]);

  useEffect(() => {
    return () => {
      cancelInit();
    };
  }, [cancelInit]);

  const notifyJsonFormValidationError = useCallback(() => {
    notify.error(t("errors.form-validation"));
  }, [t]);

  useLayoutEffect(() => {
    if (!isModalOpen || !isFormReady || schemaError) {
      return;
    }

    if (!isAdvancedSettingsEnabled) {
      shouldRevalidateJsonFormAfterAdvancedOpenRef.current = false;
    }

    const shouldRevalidateAfterAdvancedOpen = shouldRevalidateJsonFormAfterAdvancedOpenRef.current;

    revalidateJsonFormAfterAdvancedOpen({
      shouldRevalidateRef: shouldRevalidateJsonFormAfterAdvancedOpenRef,
      isAdvanced: isAdvancedSettingsEnabled,
      formRef: refJobParamsForm,
      onMissingForm: notifyJsonFormValidationError,
    });

    if (shouldRevalidateAfterAdvancedOpen && isAdvancedSettingsEnabled) {
      return;
    }

    if (hasJsonSchemaProperties(jobParamsSchemaLayout.displaySchema)) {
      const firstInput = document.querySelector<HTMLElement>(JSON_FORM_INPUT_SELECTOR);
      firstInput?.focus({ preventScroll: true });
      return;
    }

    form.focusField("tgt");
  }, [
    isFormReady,
    isModalOpen,
    isAdvancedSettingsEnabled,
    jobParamsSchemaLayout.displaySchema,
    form,
    schemaError,
    notifyJsonFormValidationError,
  ]);

  const getTtlValue = (): number | undefined => ttlPartsToTotalSeconds(ttlValue, ttlUnit);

  const resetModalState = useCallback(() => {
    cancelInit();
    form.resetFields();
    refJobParamsForm.current?.reset();
    resetLoadedData();
    setIsAdvancedSettingsEnabled(false);
    shouldRevalidateJsonFormAfterAdvancedOpenRef.current = false;
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;
  }, [cancelInit, form, resetLoadedData]);

  useEffect(() => {
    const handleSchedulerReturn = () => {
      setIsModalOpen(true);
    };

    const handleSchedulerCancel = () => {
      if (isJobCreating) {
        return;
      }
      resetModalState();
      setIsModalOpen(false);
      onAfterClose?.();
    };

    subscribe("jobs.jobmodal.return", handleSchedulerReturn);
    subscribe("jobs.jobmodal.cancel", handleSchedulerCancel);

    return () => {
      unsubscribe("jobs.jobmodal.return", handleSchedulerReturn);
      unsubscribe("jobs.jobmodal.cancel", handleSchedulerCancel);
    };
  }, [onAfterClose, resetModalState, isJobCreating]);

  const closeModal = (reason?: JobModalCloseReason) => {
    if (isJobCreating) {
      return;
    }
    if (reason) {
      closeReasonRef.current = reason;
    }
    if (reason !== "scheduler-handoff") {
      resetModalState();
    }
    setIsModalOpen(false);
  };

  const handleModalDismiss = () => {
    closeModal("dismiss");
  };

  const handleReturnToFunctionPicker = (preserveFormState: boolean) => {
    if (isJobCreating) {
      return;
    }

    onReturnToFunctionPicker({
      salt_master: form.getFieldValue("salt_master") as string,
      tgt: form.getFieldValue("tgt") as string,
      tgt_type: form.getFieldValue("tgt_type") as CreateJobRequestTgtTypeEnum,
      jsonFormData: preserveFormState ? jsonFormValue : {},
      ttlSeconds: preserveFormState ? getTtlValue() : undefined,
    });
    closeModal("return-to-picker");
  };

  const getRequestArgAndKwarg = () =>
    getArgAndKwargForRequest({
      jsonFormValue,
      arg,
      kwarg: baselineKwarg,
    });

  const validateJsonForm = (): "ok" | "open-advanced" | "invalid" => {
    const formStateData = refJobParamsForm.current?.state?.formData;
    const formData =
      formStateData && typeof formStateData === "object" && !Array.isArray(formStateData)
        ? (formStateData as Record<string, unknown>)
        : jsonFormValue;

    const result = validateJobJsonFormData(
      formData,
      paramsJsonSchema,
      paramsUiSchema,
      isAdvancedSettingsEnabled,
      jobParamsSchemaLayout.displaySchema,
      jobParamsSchemaLayout.displayUiSchema
    );

    if (result.ok) {
      return "ok";
    }

    if ("openAdvanced" in result) {
      shouldRevalidateJsonFormAfterAdvancedOpenRef.current = true;
      setIsAdvancedSettingsEnabled(true);
      return "open-advanced";
    }

    if ("useFormRef" in result) {
      const form = refJobParamsForm.current;
      if (!form) {
        return "invalid";
      }
      return form.validateForm() === true ? "ok" : "invalid";
    }

    return "invalid";
  };

  const handleFormFinish: FormProps<JobFormData>["onFinish"] = async (formValue) => {
    if (handleFormFinishInProgressRef.current || schemaError) return;

    const jsonFormOutcome = validateJsonForm();
    if (jsonFormOutcome === "open-advanced") {
      isSubmittingRef.current = false;
      return;
    }
    if (jsonFormOutcome !== "ok") {
      isSubmittingRef.current = false;
      if (!refJobParamsForm.current) {
        notifyJsonFormValidationError();
      }
      return;
    }

    handleFormFinishInProgressRef.current = true;
    setIsJobCreating(true);
    setCreateError(null);

    const { arg: requestArg, kwarg: requestKwarg } = getRequestArgAndKwarg();

    let requestTgt = formValue.tgt;
    if (formValue.tgt_type === "list") {
      requestTgt = (requestTgt as String)?.split(",") ?? requestTgt;
    }

    const result = await runMutation({
      run: () =>
        apiCoreStore.jobsApi?.jobCreate({
          CreateJobRequest: {
            tgt: requestTgt,
            fun,
            template_id: isTemplateMode ? templateId : undefined,
            tgt_type: formValue.tgt_type,
            salt_master: formValue.salt_master,
            arg: requestArg,
            kwarg: requestKwarg,
            ttl: getTtlValue(),
          },
        }) ?? Promise.reject(new Error("Jobs API is not available")),
      onError: setCreateError,
      form,
    });

    setIsJobCreating(false);
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;

    if (!result.ok) return;

    resetModalState();
    setIsModalOpen(false);
    onAfterClose?.();
    if (result.data?.id) {
      navigate(`/core/jobs/${result.data.id}`);
    }
  };

  const handleFormFinishFailed: FormProps<JobFormData>["onFinishFailed"] = (errorInfo) => {
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;

    notify.error(t("errors.form-validation"));

    form.scrollToField(errorInfo.errorFields[0].name, {
      focus: true,
      block: "center",
      scrollMode: "always",
    });
  };

  const handleCreateJobPlugin = (pluginKey: string) => {
    if (schemaError || validateJsonForm() !== "ok") {
      return;
    }
    publish("jobs.jobmodal.create", {
      pluginKey: pluginKey,
      jobCreateRequest: getJobCreateRequest(),
    });
    closeModal("scheduler-handoff");
  };

  const getJobCreateRequest = (): CreateJobRequest => {
    const { arg: requestArg, kwarg: requestKwarg } = getRequestArgAndKwarg();
    return {
      tgt: form.getFieldValue("tgt"),
      fun,
      template_id: isTemplateMode ? templateId : undefined,
      tgt_type: form.getFieldValue("tgt_type"),
      salt_master: form.getFieldValue("salt_master"),
      arg: requestArg,
      kwarg: requestKwarg,
      ttl: getTtlValue(),
    };
  };

  const jobsJobModalCreatePlugins = appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"];

  return (
    <>
      {contextHolder}

      <Modal
        title={t("job-modal.title")}
        open={isModalOpen}
        onCancel={handleModalDismiss}
        afterClose={() => {
          const reason = closeReasonRef.current;
          closeReasonRef.current = null;
          if (reason === "return-to-picker") {
            onJobModalClosed?.();
            return;
          }
          if (reason === "scheduler-handoff") {
            return;
          }
          onAfterClose?.();
        }}
        zIndex={1000}
        width="min(80vw, 800px)"
        maskClosable={false}
        style={{ top: 50 }}
        footer={
          !isFormReady || schemaError ? null : (
            <>
              <Button
                type="default"
                disabled={isLoading}
                onClick={() => handleReturnToFunctionPicker(true)}
              >
                {t("task-create.return-to-template-picker")}
              </Button>

              {jobsJobModalCreatePlugins?.map((plugin) => (
                <Button
                  key={plugin.key}
                  type="default"
                  onClick={() => handleCreateJobPlugin(plugin.key)}
                >
                  {resolvePluginLocalizedLabel(
                    plugin.label ?? plugin.key,
                    i18nStore.currentLanguage,
                    plugin.key
                  )}
                </Button>
              ))}

              <Button
                loading={isLoading}
                type="primary"
                form="job-form"
                key="submit"
                htmlType="submit"
                title="Ctrl+Enter"
              >
                {t("job-modal.create")}
              </Button>
            </>
          )
        }
      >
        <ErrorZone level="block" loaders={[initLoad]}>
          {!isFormReady ? (
            <div className={styles.spinnerContainer}>
              <Spin />
            </div>
          ) : schemaError ? (
            <TemplateSchemaErrorView
              templateTitle={templateTitle}
              schemaError={schemaError}
              sourceName={sourceDisplayName ?? sourceId}
              onReturn={() => handleReturnToFunctionPicker(false)}
            />
          ) : (
            <>
              <Flex justify="flex-end" align="center" gap={8} className={styles.advancedSettings}>
                <Typography.Text>{t("job-modal.advanced-settings")}</Typography.Text>
                <Switch
                  checked={isAdvancedSettingsEnabled}
                  onChange={setIsAdvancedSettingsEnabled}
                  disabled={isLoading}
                />
              </Flex>

              <Form
                form={form}
                name="job-form"
                id="job-form"
                layout="vertical"
                autoComplete="off"
                onFinish={handleFormFinish}
                onFinishFailed={handleFormFinishFailed}
              >
                <MutationErrorAlert
                  error={createError}
                  fallback={t("job-modal.error-job-create")}
                  onClose={() => setCreateError(null)}
                />

                <Form.Item<JobFormData>
                  label={
                    <FieldHint
                      label={t("job-modal.salt-master")}
                      hint={t("job-modal.salt-master-hint")}
                    />
                  }
                  name="salt_master"
                  rules={[
                    {
                      required: true,
                      message: t("job-modal.salt-master-error-required"),
                    },
                  ]}
                  hidden={!!fixedMaster}
                >
                  <Select allowClear options={masterList} />
                </Form.Item>
                <Flex gap={8}>
                  <Form.Item<JobFormData>
                    label={
                      <FieldHint
                        label={t("job-modal.target-type")}
                        hint={t("job-modal.target-type-hint")}
                      />
                    }
                    name="tgt_type"
                    rules={[
                      {
                        required: true,
                        message: t("job-modal.tgt-type-error-required"),
                      },
                    ]}
                    className={styles.jobFormTgtType}
                  >
                    <TargetTypeSelect />
                  </Form.Item>

                  <Form.Item<JobFormData>
                    label={
                      <FieldHint label={t("job-modal.target")} hint={t("job-modal.target-hint")} />
                    }
                    name="tgt"
                    rules={[{ required: true, message: t("job-modal.tgt-error-required") }]}
                    className={styles.jobFormTgt}
                  >
                    <Input />
                  </Form.Item>

                  <Button
                    icon={<SearchOutlined />}
                    onClick={() => setIsGatherModalOpen(true)}
                    disabled={!saltMaster || !tgt || !tgtType}
                    className={styles.jobFormGather}
                  />
                </Flex>

                <Form.Item
                  label={
                    <FieldHint
                      label={t("job-modal.function")}
                      hint={t("job-modal.function-hint")}
                    />
                  }
                >
                  <Alert type="info" showIcon={false} message={<strong>{fun}</strong>} />
                </Form.Item>

                {isAdvancedSettingsEnabled && (
                  <Form.Item label={t("job-modal.timeout-label")}>
                    <TtlInput
                      value={ttlValue}
                      unit={ttlUnit}
                      onValueChange={setTtlValue}
                      onUnitChange={setTtlUnit}
                      disabled={isLoading}
                    />
                  </Form.Item>
                )}
              </Form>

              {isTemplateMode && templateParamsSchema.isFieldless && (
                <TemplateParamsPlaceholder
                  jsonSchema={templateParamsSchema.jsonSchema}
                  uiSchema={templateParamsSchema.uiSchema}
                />
              )}

              {jobParamsSchemaLayout.displaySchema && (
                <JsonForm
                  key={`${templateId ?? fun}-${isAdvancedSettingsEnabled ? "advanced" : "basic"}`}
                  ref={refJobParamsForm}
                  schema={jobParamsSchemaLayout.displaySchema}
                  uiSchema={jobParamsSchemaLayout.displayUiSchema}
                  omitExtraData={false}
                  focusOnFirstError
                  id="job-params-form"
                  className={styles.jobParamsForm}
                  idPrefix="job-params-form"
                  idSeparator="-"
                  formData={jsonFormValue}
                  onChange={(d) => {
                    setJsonFormValue((d?.formData ?? {}) as Record<string, unknown>);
                  }}
                  onError={notifyJsonFormValidationError}
                >
                  <Fragment />
                </JsonForm>
              )}
            </>
          )}
        </ErrorZone>
      </Modal>

      <MinionGatherModal
        isOpen={isGatherModalOpen}
        onClose={() => setIsGatherModalOpen(false)}
        target={tgt as string}
        targetType={tgtType}
        master={saltMaster ?? ""}
      />
    </>
  );
});
