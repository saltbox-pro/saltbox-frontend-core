import { SearchOutlined } from "@ant-design/icons";
import type { ErrorSchema } from "@rjsf/utils";
import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
} from "@saltbox/saltbox-core-api-client";
import {
  publish,
  resolvePluginLocalizedLabel,
  subscribe,
  TemplateSchemaErrorView,
  unsubscribe,
  Modal,
  JsonForm,
  type JsonFormRef,
} from "@saltbox/saltbox-frontend-common";
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
  Typography,
  message,
  type FormProps,
} from "antd";
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
import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { resolveBuiltinJobSchema } from "saltbox-core/shared/sls-templates";
import {
  getArgAndKwargForRequest,
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
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
const JSON_FORM_ERROR_INPUT_SELECTOR =
  "#job-params-form .ant-form-item-has-error input, #job-params-form .ant-form-item-has-error textarea, #job-params-form .ant-form-item-has-error select";

export function JobModal({
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
  const [isAdvancedSettingsEnabled, setIsAdvancedSettingsEnabled] = useState(false);
  const [jsonFormExtraErrors, setJsonFormExtraErrors] = useState<ErrorSchema>();

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);
  const closeReasonRef = useRef<JobModalCloseReason | null>(null);
  const shouldFocusJsonFormAfterAdvancedOpenRef = useRef(false);

  const handleLoadFailed = useCallback(() => {
    setIsModalOpen(false);
    onAfterClose?.();
  }, [onAfterClose]);

  const {
    isInitialLoading,
    isFormReady,
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
    defaultMaster,
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

  useLayoutEffect(() => {
    if (!isModalOpen || !isFormReady || schemaError) {
      return;
    }

    if (shouldFocusJsonFormAfterAdvancedOpenRef.current && isAdvancedSettingsEnabled) {
      shouldFocusJsonFormAfterAdvancedOpenRef.current = false;
      refJobParamsForm.current?.validateForm();
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
  ]);

  const getTtlValue = (): number | undefined => ttlPartsToTotalSeconds(ttlValue, ttlUnit);

  const clearJsonFormValidation = useCallback(() => {
    setJsonFormExtraErrors(undefined);
  }, []);

  const handleTimeoutInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isTimeoutInputKeyAllowed(event)) {
      event.preventDefault();
    }
  };

  const handleTimeoutInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text") ?? "";
    if (!isTimeoutPasteAllowed(pasted)) {
      event.preventDefault();
    }
  };

  const resetModalState = useCallback(() => {
    cancelInit();
    form.resetFields();
    refJobParamsForm.current?.reset();
    resetLoadedData();
    clearJsonFormValidation();
    setIsAdvancedSettingsEnabled(false);
    shouldFocusJsonFormAfterAdvancedOpenRef.current = false;
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;
  }, [cancelInit, form, resetLoadedData, clearJsonFormValidation]);

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

  const focusFirstVisibleJsonFormError = () => {
    const firstInvalidField = document.querySelector<HTMLElement>(JSON_FORM_ERROR_INPUT_SELECTOR);
    firstInvalidField?.focus({ preventScroll: true });
  };

  const getRequestArgAndKwarg = () =>
    getArgAndKwargForRequest({
      jsonFormValue,
      arg,
      kwarg: baselineKwarg,
    });

  const validateJsonForm = (): boolean => {
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
      clearJsonFormValidation();
      return true;
    }
    if ("openAdvanced" in result) {
      clearJsonFormValidation();
      shouldFocusJsonFormAfterAdvancedOpenRef.current = true;
      setIsAdvancedSettingsEnabled(true);
      return false;
    }
    if ("useFormRef" in result) {
      clearJsonFormValidation();
      return refJobParamsForm.current?.validateForm() === true;
    }
    if ("errorSchema" in result) {
      setJsonFormExtraErrors(result.errorSchema);
      requestAnimationFrame(() => focusFirstVisibleJsonFormError());
    }
    return false;
  };

  const handleFormFinish: FormProps<JobFormData>["onFinish"] = (formValue) => {
    if (handleFormFinishInProgressRef.current || schemaError) return;

    if (!validateJsonForm()) {
      isSubmittingRef.current = false;
      messageApi.error(t("errors.form-validation"));
      return;
    }

    handleFormFinishInProgressRef.current = true;
    setIsJobCreating(true);

    const { arg: requestArg, kwarg: requestKwarg } = getRequestArgAndKwarg();

    let requestTgt = formValue.tgt;
    if (formValue.tgt_type === "list") {
      requestTgt = (requestTgt as String)?.split(",") ?? requestTgt;
    }

    apiCoreStore.jobsApi
      ?.jobCreate({
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
      })
      .then((response) => {
        resetModalState();
        setIsModalOpen(false);
        onAfterClose?.();
        if (response?.id) {
          navigate(`/core/jobs/${response.id}`);
        }
      })
      .catch((_) => {
        messageApi.error(t("job-modal.error-job-create"));
      })
      .finally(() => {
        setIsJobCreating(false);
        isSubmittingRef.current = false;
        handleFormFinishInProgressRef.current = false;
      });
  };

  const handleFormFinishFailed: FormProps<JobFormData>["onFinishFailed"] = (errorInfo) => {
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;

    messageApi.error(t("errors.form-validation"));

    form.scrollToField(errorInfo.errorFields[0].name, {
      focus: true,
      block: "center",
      scrollMode: "always",
    });
  };

  const handleCreateJobPlugin = (pluginKey: string) => {
    if (schemaError || !validateJsonForm()) {
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
                onChange={(checked) => {
                  clearJsonFormValidation();
                  setIsAdvancedSettingsEnabled(checked);
                }}
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
                  <FieldHint label={t("job-modal.function")} hint={t("job-modal.function-hint")} />
                }
              >
                <Alert type="info" showIcon={false} message={<strong>{fun}</strong>} />
              </Form.Item>

              {isAdvancedSettingsEnabled && (
                <Form.Item label={t("job-modal.timeout-label")}>
                  <Flex gap={8} align="center" wrap>
                    <InputNumber
                      min={0}
                      precision={0}
                      value={ttlValue ?? undefined}
                      onChange={(value) => setTtlValue(value ?? null)}
                      placeholder={String(DEFAULT_JOB_TIMEOUT_SECONDS)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onKeyDown={handleTimeoutInputKeyDown}
                      onPaste={handleTimeoutInputPaste}
                    />
                    <Select
                      value={ttlUnit}
                      onChange={(value) => setTtlUnit(value)}
                      options={[
                        { label: t("job-modal.timeout-unit-seconds"), value: "seconds" },
                        { label: t("job-modal.timeout-unit-minutes"), value: "minutes" },
                        { label: t("job-modal.timeout-unit-hours"), value: "hours" },
                      ]}
                      style={{ width: 100 }}
                    />
                  </Flex>
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
                extraErrors={jsonFormExtraErrors}
                focusOnFirstError
                id="job-params-form"
                className={styles.jobParamsForm}
                idPrefix="job-params-form"
                idSeparator="-"
                formData={jsonFormValue}
                onChange={(d) => {
                  clearJsonFormValidation();
                  setJsonFormValue((d?.formData ?? {}) as Record<string, unknown>);
                }}
              >
                <Fragment />
              </JsonForm>
            )}
          </>
        )}
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
}
