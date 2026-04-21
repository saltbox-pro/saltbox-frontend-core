import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobSchemaModel,
  JobSchemaShortSchema,
} from "@saltbox/saltbox-core-api-client";
import { publish, Modal, JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import {
  Button,
  Cascader,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  type FormProps,
} from "antd";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";
import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { cleanNullsFromKwargs } from "saltbox-core/shared/utils/job-modal-utils";
import { apiCoreStore, appStore, i18nStore } from "saltbox-core/store";

import { TargetTypeSelect } from "./components/target-type-select/target-type-select";
import styles from "./job-modal.module.css";

interface JobOption {
  value: string;
  label: string;
  children?: JobOption[];
}

interface MasterOption {
  value: string;
  label: string;
}

interface JobModalButtonProps {
  shape?: "default" | "circle" | "round";
  icon?: React.ReactNode;
  text?: string;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  showText?: boolean;
  size?: "small" | "middle" | "large";
  title?: string;
}

interface JobModalProps {
  target?: string;
  targetType?: CreateJobRequestTgtTypeEnum;
  fun?: string;
  arg?: unknown[];
  kwarg?: Record<string, unknown>;
  defaultMaster?: string;
  openOnMount?: boolean;
  onAfterClose?: () => void;
  shouldShowModalByKeyboardEvent?: (event: KeyboardEvent) => boolean;
  buttonProps?: JobModalButtonProps;
  renderButton?: (openModal: () => void) => React.ReactNode;
}

type JobFormData = CreateJobRequest & { fun: string[] | number[] };

const searchFunctionAllowedSymbols = /[^a-zA-Z0-9._]/g;

const getRepeatJsonFormValue = (
  arg: unknown[] | undefined,
  kwarg: Record<string, unknown> | undefined
) => ({
  args: Array.isArray(arg) ? arg : arg != null ? [arg] : [],
  kwargs: cleanNullsFromKwargs(kwarg),
});

export function JobModal({
  target,
  targetType,
  fun,
  arg,
  kwarg,
  defaultMaster,
  openOnMount,
  onAfterClose,
  shouldShowModalByKeyboardEvent,
  buttonProps,
  renderButton,
}: JobModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [saltFunctionList, setSaltFunctionList] = useState<Array<JobOption>>([]);
  const [saltFlatFunctionList, setSaltFlatFunctionList] = useState<Array<string>>([]);
  const [saltFunctionName, setSaltFunctionName] = useState<string>();
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [isSchemaListLoading, setIsSchemaListLoading] = useState(false);
  const [isMasterListLoading, setIsMasterListLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [jsonFormValue, setJsonFormValue] = useState<any>({});
  const [searchFunctionName, setSearchFunctionName] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<"seconds" | "minutes" | "hours">("seconds");

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<JsonFormRef>(null);
  const hasAutoOpenedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const handleFormFinishInProgressRef = useRef(false);

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const isLoading = isSchemaListLoading || isMasterListLoading || isSchemaLoading || isJobCreating;
  const parseTtlValue = (rawValue: unknown): number | null => {
    if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue >= 0) {
      return rawValue;
    }
    if (typeof rawValue === "string" && rawValue.trim() !== "") {
      const parsedValue = Number(rawValue);
      if (Number.isFinite(parsedValue) && parsedValue >= 0) {
        return parsedValue;
      }
    }
    return null;
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
        messageApi.error("Error on load salt masters.");
      })
      .finally(() => setIsMasterListLoading(false));
  }, [messageApi, onAfterClose, t]);

  const fillSaltFunctionList = (jobsSchemes: JobSchemaShortSchema[]) => {
    const list: Array<JobOption> = [];
    const flatList: Array<string> = [];

    const jobList =
      jobsSchemes.reduce<Array<JobOption>>((options, item) => {
        options.push({
          label: item.name,
          value: item.name,
        });
        return options;
      }, []) ?? [];

    jobList.sort((a, b) =>
      a.label.toLowerCase() > b.label.toLowerCase()
        ? 1
        : a.label.toLowerCase() < b.label.toLowerCase()
          ? -1
          : 0
    );

    jobList.forEach((saltFunction) => {
      const [moduleName] = saltFunction.value.split(".");
      const moduleIndex = list.findIndex((item) => item.label === moduleName);

      if (saltFunction.value == "default") {
        return;
      }

      flatList.push(saltFunction.value);

      if (moduleIndex > -1) {
        list[moduleIndex].children?.push({
          label: saltFunction.label,
          value: saltFunction.value,
        });
      } else {
        list.push({
          label: moduleName,
          value: `${moduleName}-module`,
          children: [
            {
              label: saltFunction.label,
              value: saltFunction.value,
            },
          ],
        });
      }
    });

    setSaltFunctionList(list);
    setSaltFlatFunctionList(flatList);
  };

  const keydownHandler = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (!isModalOpen) {
        if (!shouldShowModalByKeyboardEvent?.(event)) return;
        if (isMasterListLoading) return;

        event.preventDefault();
        showModal();
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
    [form, isLoading, isMasterListLoading, isModalOpen, shouldShowModalByKeyboardEvent, showModal]
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

    form.resetFields();
    form.setFieldsValue({
      tgt: target,
      tgt_type: targetType,
      salt_master: defaultMaster || masterList[0]?.value,
      fun: fun ? [fun] : undefined,
    });
    refJobParamsForm.current?.reset();
    setSaltFunctionName(fun ? fun : undefined);
    setSaltFunction(undefined);
    setJsonFormValue({});
    setTtlValue(null);
    setTtlUnit("seconds");
    setIsSchemaListLoading(true);

    apiCoreStore.jsonSchemasApi
      ?.jobsSchemasList({
        JobSchemaListBody: {},
      })
      .then((result) => {
        fillSaltFunctionList(result?.data ?? []);
      })
      .catch(() => {
        messageApi.error("Error on load salt function schemes.");
      })
      .finally(() => setIsSchemaListLoading(false));
  }, [isModalOpen, target, targetType, defaultMaster]);

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
  }, [saltFunction, isModalOpen]);

  useEffect(() => {
    if (!saltFunctionName) {
      setTtlValue(null);
      setTtlUnit("seconds");
      return;
    }
    setTtlValue(null);
    setTtlUnit("seconds");
  }, [saltFunctionName]);

  const getTtlValue = (): number | undefined => {
    if (ttlValue == null || !Number.isFinite(ttlValue) || ttlValue < 0) {
      return undefined;
    }
    if (ttlUnit === "minutes") {
      return Math.round(ttlValue * 60);
    }
    if (ttlUnit === "hours") {
      return Math.round(ttlValue * 3600);
    }
    return Math.round(ttlValue);
  };

  const handleTimeoutInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    const isCtrlOrMetaCombo =
      event.ctrlKey || event.metaKey ? ["a", "c", "v", "x"].includes(key.toLowerCase()) : false;
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];

    if (isCtrlOrMetaCombo || allowedKeys.includes(key)) return;

    if (/^\d$/.test(key)) return;

    event.preventDefault();
  };

  const handleTimeoutInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text") ?? "";
    if (!/^\d+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  const resetModalState = () => {
    form.resetFields();
    refJobParamsForm.current?.reset();
    setSaltFunction(undefined);
    setSaltFunctionName(undefined);
    setSearchFunctionName("");
    setJsonFormValue({});
    isSubmittingRef.current = false;
    handleFormFinishInProgressRef.current = false;
  };

  const handleModalCancel = () => {
    if (!isJobCreating) {
      resetModalState();
      setIsModalOpen(false);
    }
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

    apiCoreStore.jobsApi
      ?.jobCreate({
        CreateJobRequest: {
          tgt: formValue.tgt,
          fun: formValue.fun.at(-1),
          tgt_type: formValue.tgt_type,
          salt_master: formValue.salt_master,
          arg: jsonFormValue?.args ?? jsonFormValue?.arg ?? arg,
          kwarg: jsonFormValue?.kwargs ?? jsonFormValue?.kwarg ?? cleanNullsFromKwargs(kwarg),
          ttl: getTtlValue(),
        },
      })
      .then((response) => {
        resetModalState();
        setIsModalOpen(false);
        if (response?.jid) {
          navigate(`/core/jobs/${response.jid}`);
        }
      })
      .catch((_) => {
        messageApi.error(`Error on job created.`);
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
    const isRepeatSameFunction = isModalOpen && fun && saltFunctionName === fun;
    setSaltFunction(undefined);
    setJsonFormValue({});
    refJobParamsForm.current?.reset();

    if (saltFunctionName === undefined) {
      return;
    }

    if (isCustomSaltFunction(saltFunctionName) && !isValidCustomSaltFunction(saltFunctionName)) {
      return;
    }

    setIsSchemaLoading(true);
    apiCoreStore.jsonSchemasApi
      .jobsSchemasGet({ name: saltFunctionName })
      .then((result) => {
        setSaltFunction(result);
        setJsonFormValue(isRepeatSameFunction ? getRepeatJsonFormValue(arg, kwarg) : {});
        const functionDefaultTtl = parseTtlValue(result?.default_ttl);
        setTtlValue(functionDefaultTtl);
      })
      .catch(() => {
        messageApi.error("Error on load salt function schema.");
      })
      .finally(() => setIsSchemaLoading(false));
  }, [saltFunctionName, isModalOpen, fun, arg, kwarg]);

  const handleFunctionNameSearch = (searchText: string) => {
    const filteredSearchText = searchText
      .toLocaleLowerCase()
      .trim()
      .replaceAll(searchFunctionAllowedSymbols, "");
    if (!isCustomSaltFunction(filteredSearchText) && hasCustomSaltFunction()) {
      setSaltFunctionList(saltFunctionList.slice(1));
    } else if (filteredSearchText === "" && hasCustomSaltFunction()) {
      setSaltFunctionList(saltFunctionList.slice(1));
    } else if (isCustomSaltFunction(filteredSearchText) && !hasCustomSaltFunction()) {
      setSaltFunctionList([
        {
          label: filteredSearchText,
          value: filteredSearchText,
        },
        ...saltFunctionList,
      ]);
    } else if (isCustomSaltFunction(filteredSearchText) && hasCustomSaltFunction()) {
      setSaltFunctionList([
        {
          label: filteredSearchText,
          value: filteredSearchText,
        },
        ...saltFunctionList.slice(1),
      ]);
    }

    setSearchFunctionName(filteredSearchText);
  };

  const handleSaltFunctionChange = (values: string[] | undefined) => {
    const newSaltFunctionName = values?.at(-1);
    const firstSaltFunctionNameInList = saltFunctionList?.at(0)?.value;
    if (
      saltFunctionList?.at(0)?.children === undefined &&
      newSaltFunctionName != firstSaltFunctionNameInList
    ) {
      setSaltFunctionList(saltFunctionList.slice(1));
    }

    setSaltFunctionName(newSaltFunctionName);
  };

  const isValidCustomSaltFunction = (value: string): boolean => {
    return /^[_0-9a-z]+\.[_0-9a-z]+$/i.test(value);
  };

  const hasCustomSaltFunction = (): boolean => {
    const funcName = saltFunctionList?.[0]?.value;
    if ((saltFunctionList?.[0]?.children?.length ?? 0) > 0) {
      return false;
    }
    return isCustomSaltFunction(funcName);
  };

  const isCustomSaltFunction = (funcName?: string | undefined): boolean => {
    return funcName ? !saltFlatFunctionList.includes(funcName) : false;
  };

  const handleCreateJobPlugin = (pluginKey: string) => {
    if (!validateJsonForm()) {
      return;
    }
    publish("jobs.jobmodal.create", {
      pluginKey: pluginKey,
      jobCreateRequest: getJobCreateRequest(),
    });
    handleModalCancel();
  };

  const getJobCreateRequest = (): CreateJobRequest => {
    return {
      tgt: form.getFieldValue("tgt"),
      fun: form.getFieldValue("fun").at(-1),
      tgt_type: form.getFieldValue("tgt_type"),
      salt_master: form.getFieldValue("salt_master"),
      arg: jsonFormValue?.args ?? jsonFormValue?.arg ?? arg,
      kwarg: jsonFormValue?.kwargs ?? jsonFormValue?.kwarg ?? cleanNullsFromKwargs(kwarg),
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

  const defaultButtonProps: JobModalButtonProps = {
    shape: "default",
    icon: <PlusOutlined />,
    text: t("job-modal.create-job"),
    type: "primary",
    showText: true,
    size: "middle",
  };

  const finalButtonProps = { ...defaultButtonProps, ...buttonProps };

  return (
    <>
      {contextHolder}
      {!openOnMount &&
        (renderButton ? (
          renderButton(showModal)
        ) : (
          <Button
            type={finalButtonProps.type}
            shape={finalButtonProps.shape}
            icon={finalButtonProps.icon}
            size={finalButtonProps.size}
            title={finalButtonProps.title}
            onClick={showModal}
            loading={isMasterListLoading}
          >
            {finalButtonProps.showText ? finalButtonProps.text : null}
          </Button>
        ))}

      <Modal
        title={t("job-modal.title")}
        open={isModalOpen}
        onCancel={handleModalCancel}
        afterClose={() => onAfterClose?.()}
        width="min(80vw, 800px)"
        maskClosable={false}
        style={{ top: 50 }}
        footer={
          <>
            <Button type="default" disabled={isLoading} onClick={handleModalCancel}>
              {t("job-modal.cancel")}
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

          <Form.Item<JobFormData>
            label={t("job-modal.function")}
            tooltip={t("job-modal.function-tooltip")}
            name="fun"
            rules={[
              {
                required: true,
                message: t("job-modal.function-error-required"),
              },
              () => ({
                validator(_, value) {
                  if (
                    value?.length === 1 &&
                    isCustomSaltFunction(value?.[0]) &&
                    !isValidCustomSaltFunction(value?.[0])
                  ) {
                    return Promise.reject(new Error("Function must have MODULE.FUNCTION format."));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Cascader
              options={saltFunctionList}
              disabled={isSchemaListLoading}
              showSearch={true}
              onSearch={handleFunctionNameSearch}
              searchValue={searchFunctionName}
              onChange={handleSaltFunctionChange}
              displayRender={(label) => {
                return <span>{label?.at(-1) ?? ""}</span>;
              }}
            />
          </Form.Item>

          {saltFunctionName && (
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
            onChange={(d) => setJsonFormValue(d?.formData)}
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
