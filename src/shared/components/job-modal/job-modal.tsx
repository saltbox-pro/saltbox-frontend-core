import { SearchOutlined } from "@ant-design/icons";
import type { ErrorSchema } from "@rjsf/utils";
import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
} from "@saltbox/saltbox-core-api-client";
import { publish, Modal, JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
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
import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import {
  fetchJobFunctionSchema,
  getArgAndKwargForRequest,
  getDefaultJsonFormValue,
  getRepeatJsonFormValue,
  hasBaselineJobArgs,
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  parseTtlValue,
  totalSecondsToTtlParts,
  ttlPartsToTotalSeconds,
} from "saltbox-core/shared/utils/job-modal-utils";
import {
  getJobParamsSchemaLayout,
  hasJsonSchemaProperties,
  validateJobJsonFormData,
  type JsonSchemaRecord,
} from "saltbox-core/shared/utils/job-schema-split";
import { apiCoreStore, appStore, i18nStore } from "saltbox-core/store";

import { TargetTypeSelect } from "./components/target-type-select/target-type-select";
import styles from "./job-modal.module.css";

interface MasterOption {
  value: string;
  label: string;
}

export type JobReturnToPickerSnapshot = {
  salt_master: string;
  tgt: string;
  tgt_type: CreateJobRequestTgtTypeEnum;
  jsonFormData: unknown;
  ttlSeconds?: number;
};

interface JobModalProps {
  target?: string;
  targetType?: CreateJobRequestTgtTypeEnum;
  fun: string;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  defaultMaster?: string;
  initialTtlSeconds?: number;
  openOnMount?: boolean;
  onAfterClose?: () => void;
  onReturnToFunctionPicker: (payload: JobReturnToPickerSnapshot) => void;
  onJobModalClosed?: () => void;
}

type JobFormData = Pick<CreateJobRequest, "tgt" | "tgt_type" | "salt_master">;
const JSON_FORM_INPUT_SELECTOR =
  "#job-params-form input, #job-params-form textarea, #job-params-form select";
const JSON_FORM_ERROR_INPUT_SELECTOR =
  "#job-params-form .ant-form-item-has-error input, #job-params-form .ant-form-item-has-error textarea, #job-params-form .ant-form-item-has-error select";

export function JobModal({
  target,
  targetType,
  fun,
  arg,
  kwarg,
  defaultMaster,
  initialTtlSeconds,
  openOnMount,
  onAfterClose,
  onReturnToFunctionPicker,
  onJobModalClosed,
}: JobModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [isMasterListLoading, setIsMasterListLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<"seconds" | "minutes" | "hours">("seconds");
  const [isAdvancedSettingsEnabled, setIsAdvancedSettingsEnabled] = useState(false);
  const [jsonFormExtraErrors, setJsonFormExtraErrors] = useState<ErrorSchema>();

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);
  const closeReasonRef = useRef<"return-to-picker" | "dismiss" | null>(null);
  const shouldFocusJsonFormAfterAdvancedOpenRef = useRef(false);

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const isInitialLoading = isMasterListLoading || isSchemaLoading;
  const isLoading = isInitialLoading || isJobCreating;

  const functionJsonSchema = saltFunction?.json_schema as JsonSchemaRecord | undefined;
  const functionUiSchema = saltFunction?.ui_schema as JsonSchemaRecord | undefined;

  const jobParamsSchemaLayout = useMemo(
    () => getJobParamsSchemaLayout(functionJsonSchema, functionUiSchema, isAdvancedSettingsEnabled),
    [functionJsonSchema, functionUiSchema, isAdvancedSettingsEnabled]
  );

  const applyTotalSecondsToTtlState = useCallback((totalSeconds: number) => {
    const parts = totalSecondsToTtlParts(totalSeconds);
    setTtlValue(parts.value);
    setTtlUnit(parts.unit);
  }, []);

  const applyTtlFromInitialOrDefault = useCallback(
    (totalSeconds: number | null | undefined, defaultTtl: unknown) => {
      if (totalSeconds != null && Number.isFinite(totalSeconds) && totalSeconds >= 0) {
        applyTotalSecondsToTtlState(totalSeconds);
        return;
      }
      setTtlValue(parseTtlValue(defaultTtl));
      setTtlUnit("seconds");
    },
    [applyTotalSecondsToTtlState]
  );

  const showModal = useCallback(() => {
    setIsModalOpen(true);
    setIsMasterListLoading(true);
    apiCoreStore.mastersApi
      ?.mastersList({
        MasterListBody: {
          query: {
            status: "accepted",
          },
        },
      })
      .then((result) => {
        if (result?.data?.length === 0) {
          messageApi.warning(t("job-modal.warning-message"));
          setIsModalOpen(false);
          onAfterClose?.();
          return;
        }
        setMasterList(
          result?.data?.reduce<Array<MasterOption>>((list, master) => {
            list.push({
              label: master.title,
              value: master.master_id,
            });
            return list;
          }, []) ?? []
        );
      })
      .catch(() => {
        messageApi.error(t("job-modal.error-load-salt-masters"));
        setIsModalOpen(false);
        onAfterClose?.();
      })
      .finally(() => setIsMasterListLoading(false));
  }, [messageApi, onAfterClose, t]);

  const keydownHandler = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (!isModalOpen) {
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
    [form, isLoading, isModalOpen]
  );

  useDocumentEvent("keydown", keydownHandler, true);

  useEffect(() => {
    if (openOnMount && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      showModal();
    }
  }, [openOnMount, showModal]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    closeReasonRef.current = null;

    form.resetFields();
    form.setFieldsValue({
      tgt: target,
      tgt_type: targetType,
      salt_master: defaultMaster || masterList[0]?.value,
    });
    refJobParamsForm.current?.reset();
    setSaltFunction(undefined);
    setJsonFormValue({});
    setTtlValue(null);
    setTtlUnit("seconds");
    setIsAdvancedSettingsEnabled(false);

    applyTtlFromInitialOrDefault(initialTtlSeconds, null);
  }, [
    isModalOpen,
    target,
    targetType,
    defaultMaster,
    initialTtlSeconds,
    form,
    masterList,
    applyTtlFromInitialOrDefault,
  ]);

  useLayoutEffect(() => {
    if (!isModalOpen) {
      return;
    }

    if (shouldFocusJsonFormAfterAdvancedOpenRef.current && isAdvancedSettingsEnabled) {
      shouldFocusJsonFormAfterAdvancedOpenRef.current = false;
      refJobParamsForm.current?.validateForm();
      return;
    }

    if (!saltFunction) {
      return;
    }

    if (hasJsonSchemaProperties(jobParamsSchemaLayout.displaySchema)) {
      const firstInput = document.querySelector<HTMLElement>(JSON_FORM_INPUT_SELECTOR);
      firstInput?.focus({ preventScroll: true });
      return;
    }

    form.focusField("tgt");
  }, [
    saltFunction,
    isModalOpen,
    isAdvancedSettingsEnabled,
    jobParamsSchemaLayout.displaySchema,
    form,
  ]);

  const getTtlValue = (): number | undefined => ttlPartsToTotalSeconds(ttlValue, ttlUnit);

  const clearJsonFormValidation = () => {
    setJsonFormExtraErrors(undefined);
  };

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

  const resetModalState = () => {
    form.resetFields();
    refJobParamsForm.current?.reset();
    setSaltFunction(undefined);
    setJsonFormValue({});
    clearJsonFormValidation();
    setIsAdvancedSettingsEnabled(false);
    shouldFocusJsonFormAfterAdvancedOpenRef.current = false;
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;
  };

  const closeModal = (reason?: "return-to-picker" | "dismiss") => {
    if (isJobCreating) {
      return;
    }
    if (reason) {
      closeReasonRef.current = reason;
    }
    resetModalState();
    setIsModalOpen(false);
  };

  const handleModalDismiss = () => {
    closeModal("dismiss");
  };

  const handleFooterDismiss = () => {
    if (isJobCreating) {
      return;
    }
    const snapshot: JobReturnToPickerSnapshot = {
      salt_master: form.getFieldValue("salt_master") as string,
      tgt: form.getFieldValue("tgt") as string,
      tgt_type: form.getFieldValue("tgt_type") as CreateJobRequestTgtTypeEnum,
      jsonFormData: jsonFormValue,
      ttlSeconds: getTtlValue(),
    };
    onReturnToFunctionPicker(snapshot);
    closeModal("return-to-picker");
  };

  const focusFirstVisibleJsonFormError = () => {
    const firstInvalidField = document.querySelector<HTMLElement>(JSON_FORM_ERROR_INPUT_SELECTOR);
    firstInvalidField?.focus({ preventScroll: true });
  };

  const validateJsonForm = (): boolean => {
    const formStateData = refJobParamsForm.current?.state?.formData;
    const formData =
      formStateData && typeof formStateData === "object" && !Array.isArray(formStateData)
        ? (formStateData as Record<string, unknown>)
        : jsonFormValue;

    const result = validateJobJsonFormData(
      formData,
      functionJsonSchema,
      functionUiSchema,
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
    if (handleFormFinishInProgressRef.current) return;

    if (!validateJsonForm()) {
      isSubmittingRef.current = false;
      messageApi.error(t("errors.form-validation"));
      return;
    }

    handleFormFinishInProgressRef.current = true;
    setIsJobCreating(true);

    const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
      jsonFormValue,
      arg,
      kwarg,
    });

    let requestTgt = formValue.tgt;
    if (formValue.tgt_type === "list") {
      requestTgt = (requestTgt as String)?.split(",") ?? requestTgt;
    }

    apiCoreStore.jobsApi
      ?.jobCreate({
        CreateJobRequest: {
          tgt: requestTgt,
          fun,
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
        if (response?.jid) {
          navigate(`/core/jobs/${response.jid}`);
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

  useEffect(() => {
    if (!isModalOpen || !fun) {
      return;
    }

    const hasBaselineArgs = hasBaselineJobArgs(arg, kwarg);

    setSaltFunction(undefined);
    setJsonFormValue({});
    refJobParamsForm.current?.reset();

    let isCancelled = false;

    const applySchemaResult = (result: JobSchemaModel) => {
      if (isCancelled) {
        return;
      }
      setSaltFunction(result);
      setJsonFormValue(
        hasBaselineArgs
          ? getRepeatJsonFormValue(arg, kwarg)
          : getDefaultJsonFormValue(result.json_schema)
      );
      applyTtlFromInitialOrDefault(initialTtlSeconds, result?.default_ttl);
    };

    const loadSchema = async () => {
      setIsSchemaLoading(true);
      try {
        const schema = await fetchJobFunctionSchema(fun, (name) =>
          apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name })
        );
        if (isCancelled) {
          return;
        }
        applySchemaResult(schema);
      } catch {
        if (!isCancelled) {
          messageApi.error(t("job-modal.error-load-function-schema"));
        }
      } finally {
        if (!isCancelled) {
          setIsSchemaLoading(false);
        }
      }
    };

    loadSchema().catch(() => {
      if (!isCancelled) {
        messageApi.error(t("job-modal.error-load-function-schema"));
        setIsSchemaLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    fun,
    isModalOpen,
    arg,
    kwarg,
    messageApi,
    initialTtlSeconds,
    t,
    applyTtlFromInitialOrDefault,
  ]);

  const handleCreateJobPlugin = (pluginKey: string) => {
    if (!validateJsonForm()) {
      return;
    }
    publish("jobs.jobmodal.create", {
      pluginKey: pluginKey,
      jobCreateRequest: getJobCreateRequest(),
    });
    closeModal();
  };

  const getJobCreateRequest = (): CreateJobRequest => {
    const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
      jsonFormValue,
      arg,
      kwarg,
    });
    return {
      tgt: form.getFieldValue("tgt"),
      fun,
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
          onAfterClose?.();
        }}
        zIndex={1000}
        width="min(80vw, 800px)"
        maskClosable={false}
        style={{ top: 50 }}
        footer={
          isInitialLoading ? null : (
            <>
              <Button type="default" disabled={isLoading} onClick={handleFooterDismiss}>
                {t("job-modal.return-to-function-picker")}
              </Button>

              {jobsJobModalCreatePlugins?.map((plugin) => (
                <Button
                  key={plugin.key}
                  type="default"
                  onClick={() => handleCreateJobPlugin(plugin.key)}
                >
                  {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
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
        {isInitialLoading ? (
          <div className={styles.spinnerContainer}>
            <Spin />
          </div>
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
                label={t("job-modal.salt-master")}
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
                  label={t("job-modal.target-type")}
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
                  label={t("job-modal.target")}
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

              <Form.Item label={t("job-modal.function")}>
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

            {jobParamsSchemaLayout.displaySchema && (
              <JsonForm
                key={isAdvancedSettingsEnabled ? "job-params-advanced" : "job-params-basic"}
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
