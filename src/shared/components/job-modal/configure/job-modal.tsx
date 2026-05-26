import type { CreateJobRequestTgtTypeEnum, JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import { publish, Modal, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Tabs, message } from "antd";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import {
  fetchJobFunctionSchema,
  getRepeatJsonFormValue,
  parseTtlValue,
  totalSecondsToTtlParts,
  ttlPartsToTotalSeconds,
  type TtlUnit,
} from "saltbox-core/shared/utils/job-modal-utils";
import { apiCoreStore, appStore, i18nStore } from "saltbox-core/store";

import {
  getInitialJobParamsFormData,
  JOB_PARAMS_FORM_ID,
  prepareJobParamsForm,
  validateJobParamsForm,
} from "./params-form-schema";
import { buildJobCreateRequest } from "./request";
import { JobModalOverviewTab } from "./tabs/overview-tab";
import { JobModalSettingsTab } from "./tabs/settings-tab";
import {
  JobModalTabKey as TabKey,
  type JobConfigurationData,
  type JobMasterOption,
  type JobModalTabKey,
  type JobTargetingFormData,
} from "./types";

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
  const [messageApi, contextHolder] = message.useMessage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [masterList, setMasterList] = useState<JobMasterOption[]>([]);
  const [isMasterListLoading, setIsMasterListLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});
  const [configuration, setConfiguration] = useState<JobConfigurationData>();
  const [activeTabKey, setActiveTabKey] = useState<JobModalTabKey>(TabKey.Settings);
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");

  const [form] = Form.useForm<JobTargetingFormData>();
  const jsonFormRef = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isCreatingJobRef = useRef(false);
  const closeReasonRef = useRef<"return-to-picker" | "dismiss" | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const isBusy = isMasterListLoading || isSchemaLoading || isJobCreating;
  const requestBaseline = useMemo(() => ({ arg, kwarg }), [arg, kwarg]);

  const paramsValidationSchema = useMemo(
    () =>
      prepareJobParamsForm(saltFunction?.json_schema, saltFunction?.ui_schema, true)
        .validationSchema,
    [saltFunction?.json_schema, saltFunction?.ui_schema]
  );

  const applyTtlFromSeconds = useCallback((totalSeconds: number) => {
    const parts = totalSecondsToTtlParts(totalSeconds);
    setTtlValue(parts.value);
    setTtlUnit(parts.unit);
  }, []);

  const resetModalState = useCallback(() => {
    form.resetFields();
    jsonFormRef.current?.reset();
    setSaltFunction(undefined);
    setJsonFormValue({});
    setConfiguration(undefined);
    setActiveTabKey(TabKey.Settings);
    setIsSchemaError(false);
    isSubmittingRef.current = false;
    isCreatingJobRef.current = false;
  }, [form]);

  const showModal = useCallback(() => {
    setIsMasterListLoading(true);
    apiCoreStore.mastersApi
      ?.mastersList({
        MasterListBody: {
          query: { status: "accepted" },
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
          result?.data?.map((master) => ({
            label: master.title,
            value: master.master_id,
          })) ?? []
        );
        setIsModalOpen(true);
      })
      .catch(() => {
        messageApi.error(t("job-modal.error-load-salt-masters"));
      })
      .finally(() => setIsMasterListLoading(false));
  }, [messageApi, onAfterClose, t]);

  useEffect(() => {
    if (openOnMount && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      showModal();
    }
  }, [openOnMount, showModal]);

  useEffect(() => {
    const scrollableContainer = contentRef.current?.closest(".ant-modal-wrap");
    if (!scrollableContainer) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      scrollableContainer.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeTabKey]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    closeReasonRef.current = null;
    setActiveTabKey(TabKey.Settings);
    setConfiguration(undefined);
    setIsSchemaError(false);

    form.resetFields();
    form.setFieldsValue({
      tgt: target ?? "*",
      tgt_type: targetType,
      salt_master: defaultMaster || masterList[0]?.value,
    });
    jsonFormRef.current?.reset();
    setSaltFunction(undefined);
    setJsonFormValue({});
    setTtlValue(null);
    setTtlUnit("seconds");

    if (initialTtlSeconds != null && Number.isFinite(initialTtlSeconds) && initialTtlSeconds >= 0) {
      applyTtlFromSeconds(initialTtlSeconds);
    }
  }, [
    isModalOpen,
    target,
    targetType,
    defaultMaster,
    initialTtlSeconds,
    form,
    masterList,
    applyTtlFromSeconds,
  ]);

  useLayoutEffect(() => {
    if (!saltFunction || !isModalOpen || activeTabKey !== TabKey.Settings) {
      return;
    }

    const selector = `#${JOB_PARAMS_FORM_ID} input, #${JOB_PARAMS_FORM_ID} textarea, #${JOB_PARAMS_FORM_ID} select`;
    const firstParamsInput = document.querySelector<HTMLElement>(selector);

    if (firstParamsInput) {
      firstParamsInput.focus({ preventScroll: true });
      return;
    }

    form.focusField("tgt");
  }, [saltFunction, isModalOpen, activeTabKey, form]);

  useEffect(() => {
    if (!isModalOpen || !fun) {
      return;
    }

    const hasBaselineArgs =
      (Array.isArray(arg) && arg.length > 0) || (kwarg != null && Object.keys(kwarg).length > 0);

    setSaltFunction(undefined);
    setJsonFormValue({});
    setIsSchemaError(false);
    jsonFormRef.current?.reset();

    let isCancelled = false;

    const loadSchema = async () => {
      setIsSchemaLoading(true);

      try {
        const schema = await fetchJobFunctionSchema(fun, (name) =>
          apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name })
        );

        if (isCancelled) {
          return;
        }

        setSaltFunction(schema);
        setJsonFormValue(
          hasBaselineArgs
            ? getRepeatJsonFormValue(arg, kwarg)
            : getInitialJobParamsFormData(schema.json_schema)
        );

        if (
          initialTtlSeconds != null &&
          Number.isFinite(initialTtlSeconds) &&
          initialTtlSeconds >= 0
        ) {
          applyTtlFromSeconds(initialTtlSeconds);
        } else {
          setTtlValue(parseTtlValue(schema.default_ttl));
        }
      } catch {
        if (!isCancelled) {
          setIsSchemaError(true);
          messageApi.error(t("job-modal.error-load-function-schema"));
        }
      } finally {
        if (!isCancelled) {
          setIsSchemaLoading(false);
        }
      }
    };

    loadSchema();

    return () => {
      isCancelled = true;
    };
  }, [fun, isModalOpen, arg, kwarg, messageApi, initialTtlSeconds, t, applyTtlFromSeconds]);

  const handleModalDismiss = () => {
    if (isJobCreating) {
      return;
    }

    closeReasonRef.current = "dismiss";
    resetModalState();
    setIsModalOpen(false);
  };

  const handleReturnToFunctionPicker = () => {
    if (isJobCreating) {
      return;
    }

    const snapshot: JobReturnToPickerSnapshot = {
      salt_master: form.getFieldValue("salt_master") as string,
      tgt: form.getFieldValue("tgt") as string,
      tgt_type: form.getFieldValue("tgt_type") as CreateJobRequestTgtTypeEnum,
      jsonFormData: configuration?.jsonFormValue ?? jsonFormValue,
      ttlSeconds: configuration?.ttlSeconds ?? ttlPartsToTotalSeconds(ttlValue, ttlUnit),
    };

    closeReasonRef.current = "return-to-picker";
    resetModalState();
    onReturnToFunctionPicker(snapshot);
    setIsModalOpen(false);
  };

  const handleConfigurationSubmit = (data: JobConfigurationData) => {
    isSubmittingRef.current = false;
    setConfiguration(data);
    setActiveTabKey(TabKey.Overview);
  };

  const handleBackToSettings = () => {
    if (!configuration) {
      return;
    }

    form.setFieldsValue({
      tgt: configuration.tgt,
      tgt_type: configuration.tgt_type,
      salt_master: configuration.salt_master,
    });
    setJsonFormValue(configuration.jsonFormValue);

    if (configuration.ttlSeconds != null) {
      applyTtlFromSeconds(configuration.ttlSeconds);
    }

    setActiveTabKey(TabKey.Settings);
  };

  const runCreateJob = useCallback(
    (config: JobConfigurationData) => {
      if (isCreatingJobRef.current) {
        return;
      }

      if (!validateJobParamsForm(jsonFormRef, paramsValidationSchema)) {
        messageApi.error(t("errors.form-validation"));
        setActiveTabKey(TabKey.Settings);
        return;
      }

      isCreatingJobRef.current = true;
      setIsJobCreating(true);

      apiCoreStore.jobsApi
        ?.jobCreate({
          CreateJobRequest: buildJobCreateRequest(fun, config, requestBaseline),
        })
        .then((response) => {
          resetModalState();
          setIsModalOpen(false);
          onAfterClose?.();

          if (response?.jid) {
            navigate(`/core/jobs/${response.jid}`);
          }
        })
        .catch(() => {
          messageApi.error(t("job-modal.error-job-create"));
        })
        .finally(() => {
          setIsJobCreating(false);
          isCreatingJobRef.current = false;
          isSubmittingRef.current = false;
        });
    },
    [
      fun,
      messageApi,
      navigate,
      onAfterClose,
      paramsValidationSchema,
      requestBaseline,
      resetModalState,
      t,
    ]
  );

  const handleExecuteJob = useCallback(() => {
    if (!configuration) {
      return;
    }

    runCreateJob(configuration);
  }, [configuration, runCreateJob]);

  const handleCreateJobPlugin = useCallback(
    (pluginKey: string) => {
      if (!configuration || !validateJobParamsForm(jsonFormRef, paramsValidationSchema)) {
        return;
      }

      publish("jobs.jobmodal.create", {
        pluginKey,
        jobCreateRequest: buildJobCreateRequest(fun, configuration, requestBaseline),
      });

      if (!isJobCreating) {
        resetModalState();
        setIsModalOpen(false);
      }
    },
    [configuration, fun, isJobCreating, paramsValidationSchema, requestBaseline, resetModalState]
  );

  useDocumentEvent(
    "keydown",
    useCallback(
      (event: KeyboardEvent) => {
        if (event.repeat || !isModalOpen) {
          return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          if (isBusy || isSubmittingRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          if (activeTabKey === TabKey.Overview) {
            handleExecuteJob();
            return;
          }

          isSubmittingRef.current = true;
          form.submit();
        }
      },
      [activeTabKey, form, handleExecuteJob, isBusy, isModalOpen]
    ),
    true
  );

  const handleTabChange = (key: string) => {
    if (key === TabKey.Settings || key === TabKey.Overview) {
      setActiveTabKey(key);
    }
  };

  const pluginButtons = useMemo(() => {
    const plugins = appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"] ?? [];

    return plugins.map((plugin) => (
      <Button key={plugin.key} type="default" onClick={() => handleCreateJobPlugin(plugin.key)}>
        {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
      </Button>
    ));
  }, [handleCreateJobPlugin]);

  const tabs = [
    {
      key: TabKey.Settings,
      label: t("job-modal.settings-tab"),
      children: (
        <JobModalSettingsTab
          fun={fun}
          saltFunction={saltFunction}
          isLoading={isMasterListLoading || isSchemaLoading}
          isSchemaError={isSchemaError}
          masterList={masterList}
          form={form}
          jsonFormValue={jsonFormValue}
          onJsonFormValueChange={setJsonFormValue}
          jsonFormRef={jsonFormRef}
          ttlValue={ttlValue}
          ttlUnit={ttlUnit}
          onTtlValueChange={setTtlValue}
          onTtlUnitChange={setTtlUnit}
          onGatherClick={() => setIsGatherModalOpen(true)}
          isGatherDisabled={!saltMaster || !tgt || !tgtType}
          onBack={handleReturnToFunctionPicker}
          onNext={handleConfigurationSubmit}
        />
      ),
    },
    {
      key: TabKey.Overview,
      label: t("job-modal.overview-tab"),
      disabled: activeTabKey !== TabKey.Overview,
      children: (
        <JobModalOverviewTab
          fun={fun}
          saltFunction={saltFunction}
          configuration={configuration}
          masterList={masterList}
          isLoading={isJobCreating}
          isError={isSchemaError}
          arg={arg}
          kwarg={kwarg}
          pluginButtons={pluginButtons}
          onBack={handleBackToSettings}
          onExecute={handleExecuteJob}
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Modal
        title={t("job-modal.configure-title")}
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
        footer={null}
        closable={!isJobCreating}
      >
        <Flex ref={contentRef} vertical>
          <Tabs activeKey={activeTabKey} onChange={handleTabChange} items={tabs} />
        </Flex>
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
