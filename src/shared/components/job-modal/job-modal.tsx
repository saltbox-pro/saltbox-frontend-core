import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
} from "@saltbox/saltbox-core-api-client";
import { publish, Modal, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Tabs, message } from "antd";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import {
  fetchJobFunctionSchema,
  getArgAndKwargForRequest,
  getRepeatJsonFormValue,
  parseTtlValue,
  totalSecondsToTtlParts,
  ttlPartsToTotalSeconds,
} from "saltbox-core/shared/utils/job-modal-utils";
import { apiCoreStore, appStore, i18nStore } from "saltbox-core/store";

import { JobModalOverviewTab } from "./job-modal-overview-tab";
import { JobModalSettingsTab } from "./job-modal-settings-tab";
import type { JobConfigurationData } from "./job-modal-types";

export type JobReturnToPickerSnapshot = {
  salt_master: string;
  tgt: string;
  tgt_type: CreateJobRequestTgtTypeEnum;
  jsonFormData: unknown;
  ttlSeconds?: number;
};

interface MasterOption {
  value: string;
  label: string;
}

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

type JobFormData = Pick<JobConfigurationData, "tgt" | "tgt_type" | "salt_master">;

const enum TabKey {
  Settings = "Settings",
  Overview = "Overview",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [isMasterListLoading, setIsMasterListLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [jsonFormValue, setJsonFormValue] = useState<Record<string, unknown>>({});
  const [configuration, setConfiguration] = useState<JobConfigurationData>();
  const [activeTabKey, setActiveTabKey] = useState<string>(TabKey.Settings);
  const [messageApi, contextHolder] = message.useMessage();
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<"seconds" | "minutes" | "hours">("seconds");

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);
  const closeReasonRef = useRef<"return-to-picker" | "dismiss" | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (openOnMount && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      showModal();
    }
  }, [openOnMount, showModal]);

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
    if (!saltFunction || !isModalOpen || activeTabKey !== TabKey.Settings) {
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
  }, [saltFunction, isModalOpen, activeTabKey, form]);

  const getTtlValue = (): number | undefined => ttlPartsToTotalSeconds(ttlValue, ttlUnit);

  const resetModalState = () => {
    form.resetFields();
    refJobParamsForm.current?.reset();
    setSaltFunction(undefined);
    setJsonFormValue({});
    setConfiguration(undefined);
    setActiveTabKey(TabKey.Settings);
    setIsSchemaError(false);
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
      ttlSeconds: configuration?.ttlSeconds ?? getTtlValue(),
    };
    closeReasonRef.current = "return-to-picker";
    resetModalState();
    onReturnToFunctionPicker(snapshot);
    setIsModalOpen(false);
  };

  const validateJsonForm = () => {
    if (!saltFunction?.json_schema) {
      return true;
    }

    return refJobParamsForm.current?.validateForm() === true;
  };

  const createJob = useCallback(
    (config: JobConfigurationData) => {
      if (handleFormFinishInProgressRef.current) return;

      if (!validateJsonForm()) {
        isSubmittingRef.current = false;
        messageApi.error(t("errors.form-validation"));
        setActiveTabKey(TabKey.Settings);
        return;
      }

      handleFormFinishInProgressRef.current = true;
      setIsJobCreating(true);

      const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
        jsonFormValue: config.jsonFormValue,
        arg,
        kwarg,
      });

      apiCoreStore.jobsApi
        ?.jobCreate({
          CreateJobRequest: {
            tgt: config.tgt,
            fun,
            tgt_type: config.tgt_type,
            salt_master: config.salt_master,
            arg: requestArg,
            kwarg: requestKwarg,
            ttl: config.ttlSeconds,
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
        .catch(() => {
          messageApi.error(t("job-modal.error-job-create"));
        })
        .finally(() => {
          setIsJobCreating(false);
          isSubmittingRef.current = false;
          handleFormFinishInProgressRef.current = false;
        });
    },
    [arg, fun, kwarg, messageApi, navigate, onAfterClose, t]
  );

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
      applyTotalSecondsToTtlState(configuration.ttlSeconds);
    }

    setActiveTabKey(TabKey.Settings);
  };

  const handleExecuteJob = useCallback(() => {
    if (!configuration) {
      return;
    }
    createJob(configuration);
  }, [configuration, createJob]);

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

        if (activeTabKey === TabKey.Overview) {
          handleExecuteJob();
          return;
        }

        isSubmittingRef.current = true;
        form.submit();
      }
    },
    [activeTabKey, form, handleExecuteJob, isLoading, isModalOpen]
  );

  useDocumentEvent("keydown", keydownHandler, true);

  useEffect(() => {
    if (!isModalOpen || !fun) {
      return;
    }

    const hasBaselineArgs =
      (Array.isArray(arg) && arg.length > 0) || (kwarg != null && Object.keys(kwarg).length > 0);

    setSaltFunction(undefined);
    setJsonFormValue({});
    setIsSchemaError(false);
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
          setIsSchemaError(true);
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
        setIsSchemaError(true);
        messageApi.error(t("job-modal.error-load-function-schema"));
        setIsSchemaLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [fun, isModalOpen, arg, kwarg, messageApi, initialTtlSeconds, t]);

  const handleCreateJobPlugin = useCallback(
    (pluginKey: string) => {
      if (!configuration || !validateJsonForm()) {
        return;
      }
      publish("jobs.jobmodal.create", {
        pluginKey: pluginKey,
        jobCreateRequest: getJobCreateRequest(configuration),
      });
      closeModalResettingState();
    },
    [configuration, arg, fun, kwarg]
  );

  const getJobCreateRequest = (config: JobConfigurationData): CreateJobRequest => {
    const { arg: requestArg, kwarg: requestKwarg } = getArgAndKwargForRequest({
      jsonFormValue: config.jsonFormValue,
      arg,
      kwarg,
    });
    return {
      tgt: config.tgt,
      fun,
      tgt_type: config.tgt_type,
      salt_master: config.salt_master,
      arg: requestArg,
      kwarg: requestKwarg,
      ttl: config.ttlSeconds,
    };
  };

  const pluginButtons = useMemo(() => {
    const buttons: React.ReactNode[] = [];
    appStore.pluginsStore?.plugins?.["jobs.jobmodal.create"]?.forEach((plugin) => {
      buttons.push(
        <Button key={plugin.key} type="default" onClick={() => handleCreateJobPlugin(plugin.key)}>
          {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
        </Button>
      );
    });
    return buttons;
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
          jsonFormRef={refJobParamsForm}
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
          <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
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
