import { SearchOutlined } from "@ant-design/icons";
import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
} from "@saltbox/saltbox-core-api-client";
import { publish, Modal, JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Input, InputNumber, Select, message, type FormProps } from "antd";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";
import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import {
  fetchJobFunctionSchema,
  getArgAndKwargForRequest,
  getRepeatJsonFormValue,
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  parseTtlValue,
  totalSecondsToTtlParts,
  ttlPartsToTotalSeconds,
} from "saltbox-core/shared/utils/job-modal-utils";
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
  fun: string;
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
}

type JobFormData = Pick<CreateJobRequest, "tgt" | "tgt_type" | "salt_master">;

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

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);
  const shouldReturnToFunctionPickerRef = useRef(false);
  const returnToPickerSnapshotRef = useRef<JobReturnToPickerSnapshot | null>(null);

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const isLoading = isMasterListLoading || isSchemaLoading || isJobCreating;

  const applyTotalSecondsToTtlState = (totalSeconds: number) => {
    const parts = totalSecondsToTtlParts(totalSeconds);
    setTtlValue(parts.value);
    setTtlUnit(parts.unit);
  };

  const showModal = useCallback(() => {
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
        setIsModalOpen(true);
      })
      .catch(() => {
        messageApi.error(t("job-modal.error-load-salt-masters"));
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

    shouldReturnToFunctionPickerRef.current = false;

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

    if (initialTtlSeconds != null && Number.isFinite(initialTtlSeconds) && initialTtlSeconds >= 0) {
      applyTotalSecondsToTtlState(initialTtlSeconds);
    }
  }, [isModalOpen, target, targetType, defaultMaster, initialTtlSeconds, form, masterList]);

  useLayoutEffect(() => {
    if (!saltFunction || !isModalOpen) {
      return;
    }

    const focusFirstJsonInput = () => {
      const jsonInputSelector =
        "#job-params-form input, #job-params-form textarea, #job-params-form select";
      const firstInput = document.querySelector<HTMLElement>(jsonInputSelector);
      firstInput?.focus({ preventScroll: true });
    };

    const hasJsonFields = !!Object.keys(saltFunction.json_schema?.properties || {}).length;
    if (hasJsonFields) {
      focusFirstJsonInput();
    } else {
      form.focusField("tgt");
    }
  }, [saltFunction, isModalOpen, form]);

  const getTtlValue = (): number | undefined => ttlPartsToTotalSeconds(ttlValue, ttlUnit);

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
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;
  };

  const closeModalResettingState = () => {
    if (isJobCreating) {
      return;
    }
    resetModalState();
    setIsModalOpen(false);
  };

  const handleModalDismiss = () => {
    if (isJobCreating) {
      return;
    }
    shouldReturnToFunctionPickerRef.current = false;
    returnToPickerSnapshotRef.current = null;
    resetModalState();
    setIsModalOpen(false);
  };

  const handleFooterDismiss = () => {
    if (isJobCreating) {
      return;
    }
    shouldReturnToFunctionPickerRef.current = true;
    returnToPickerSnapshotRef.current = {
      salt_master: form.getFieldValue("salt_master") as string,
      tgt: form.getFieldValue("tgt") as string,
      tgt_type: form.getFieldValue("tgt_type") as CreateJobRequestTgtTypeEnum,
      fun,
      jsonFormData: jsonFormValue,
      ttlSeconds: getTtlValue(),
    };
    resetModalState();
    setIsModalOpen(false);
  };

  const validateJsonForm = () => {
    if (!saltFunction?.json_schema) {
      return true;
    }

    return refJobParamsForm.current?.validateForm() === true;
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
      fun,
      jsonFormValue,
      arg,
      kwarg,
    });

    apiCoreStore.jobsApi
      ?.jobCreate({
        CreateJobRequest: {
          tgt: formValue.tgt,
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

    const hasBaselineArgs =
      (Array.isArray(arg) && arg.length > 0) || (kwarg != null && Object.keys(kwarg).length > 0);

    setSaltFunction(undefined);
    setJsonFormValue({});
    refJobParamsForm.current?.reset();

    let isCancelled = false;

    const applySchemaResult = (result: JobSchemaModel) => {
      if (isCancelled) {
        return;
      }
      setSaltFunction(result);
      setJsonFormValue(hasBaselineArgs ? getRepeatJsonFormValue(arg, kwarg) : {});
      if (
        initialTtlSeconds != null &&
        Number.isFinite(initialTtlSeconds) &&
        initialTtlSeconds >= 0
      ) {
        applyTotalSecondsToTtlState(initialTtlSeconds);
      } else {
        setTtlValue(parseTtlValue(result?.default_ttl));
      }
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
  }, [fun, isModalOpen, arg, kwarg, messageApi, initialTtlSeconds, t]);

  const handleCreateJobPlugin = (pluginKey: string) => {
    if (!validateJsonForm()) {
      return;
    }
    publish("jobs.jobmodal.create", {
      pluginKey: pluginKey,
      jobCreateRequest: getJobCreateRequest(),
    });
    closeModalResettingState();
  };

  const getJobCreateRequest = (): CreateJobRequest => {
    const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
      fun,
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

  let jobsJobModalCreateButtonsPlugins: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach((plugin) => {
    const jobsJobModalCreateButtonPlugin = (
      <Button type="default" onClick={() => handleCreateJobPlugin(plugin.key)}>
        {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
      </Button>
    );
    jobsJobModalCreateButtonsPlugins = (
      <>
        {jobsJobModalCreateButtonsPlugins}
        {jobsJobModalCreateButtonPlugin}
      </>
    );
  });

  return (
    <>
      {contextHolder}

      <Modal
        title={t("job-modal.title")}
        open={isModalOpen}
        onCancel={handleModalDismiss}
        afterClose={() => {
          const returnToPicker = shouldReturnToFunctionPickerRef.current;
          shouldReturnToFunctionPickerRef.current = false;
          const snapshot = returnToPickerSnapshotRef.current;
          returnToPickerSnapshotRef.current = null;
          if (returnToPicker && snapshot) {
            onReturnToFunctionPicker(snapshot);
            return;
          }
          onAfterClose?.();
        }}
        width="min(80vw, 800px)"
        maskClosable={false}
        style={{ top: 50 }}
        footer={
          <>
            <Button type="default" disabled={isLoading} onClick={handleFooterDismiss}>
              {t("job-modal.return-to-function-picker")}
            </Button>

            {jobsJobModalCreateButtonsPlugins}

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
        }
      >
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

          <div className={styles.selectedFunction}>
            {t("jobs.table-function")}: <strong>{fun}</strong>
          </div>

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
        </Form>

        {saltFunction?.json_schema && (
          <JsonForm
            ref={refJobParamsForm}
            schema={saltFunction.json_schema}
            uiSchema={saltFunction?.ui_schema}
            id="job-params-form"
            className={styles.jobParamsForm}
            idPrefix="job-params-form"
            idSeparator="-"
            formData={jsonFormValue}
            onChange={(d) => setJsonFormValue((d?.formData ?? {}) as Record<string, unknown>)}
          >
            <Fragment />
          </JsonForm>
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
