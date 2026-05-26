import { SearchOutlined } from "@ant-design/icons";
import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import { JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
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
  type FormInstance,
  type FormProps,
} from "antd";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";
import {
  buildJobFormVisibilityUiSchema,
  isTimeoutInputKeyAllowed,
  isTimeoutPasteAllowed,
  ttlPartsToTotalSeconds,
} from "saltbox-core/shared/utils/job-modal-utils";

import { TargetTypeSelect } from "./components/target-type-select/target-type-select";
import { JobModalFooter } from "./job-modal-footer";
import type { JobConfigurationData } from "./job-modal-types";
import styles from "./job-modal.module.css";

const { Title } = Typography;

type JobFormData = Pick<JobConfigurationData, "tgt" | "tgt_type" | "salt_master">;

interface MasterOption {
  value: string;
  label: string;
}

export type JobModalSettingsTabProps = {
  fun: string;
  saltFunction?: JobSchemaModel;
  isLoading: boolean;
  isSchemaError: boolean;
  masterList: MasterOption[];
  form: FormInstance<JobFormData>;
  jsonFormValue: Record<string, unknown>;
  onJsonFormValueChange: (value: Record<string, unknown>) => void;
  jsonFormRef: React.RefObject<JsonFormRef | null>;
  ttlValue: number | null;
  ttlUnit: "seconds" | "minutes" | "hours";
  onTtlValueChange: (value: number | null) => void;
  onTtlUnitChange: (unit: "seconds" | "minutes" | "hours") => void;
  onGatherClick: () => void;
  isGatherDisabled: boolean;
  onBack: () => void;
  onNext: (data: JobConfigurationData) => void;
};

export const JobModalSettingsTab = ({
  fun,
  saltFunction,
  isLoading,
  isSchemaError,
  masterList,
  form,
  jsonFormValue,
  onJsonFormValueChange,
  jsonFormRef,
  ttlValue,
  ttlUnit,
  onTtlValueChange,
  onTtlUnitChange,
  onGatherClick,
  isGatherDisabled,
  onBack,
  onNext,
}: JobModalSettingsTabProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const visibilityUiSchema = useMemo(() => {
    if (!saltFunction?.json_schema) {
      return saltFunction?.ui_schema;
    }

    return buildJobFormVisibilityUiSchema(
      saltFunction.json_schema,
      saltFunction.ui_schema,
      showAdvanced
    );
  }, [saltFunction?.json_schema, saltFunction?.ui_schema, showAdvanced]);

  const showValidationError = () => {
    messageApi.error(t("errors.form-validation"));
  };

  const validateJsonForm = () => {
    if (!saltFunction?.json_schema) {
      return true;
    }

    return jsonFormRef.current?.validateForm() === true;
  };

  const handleFormFinishFailed: FormProps<JobFormData>["onFinishFailed"] = (errorInfo) => {
    showValidationError();
    setShowAdvanced(true);

    setTimeout(
      () =>
        form.scrollToField(errorInfo.errorFields[0].name, {
          focus: true,
          block: "center",
          scrollMode: "always",
        }),
      0
    );
  };

  const handleFormFinish: FormProps<JobFormData>["onFinish"] = (formValue) => {
    if (!validateJsonForm()) {
      showValidationError();
      setShowAdvanced(true);
      return;
    }

    onNext({
      ...formValue,
      jsonFormValue,
      ttlSeconds: ttlPartsToTotalSeconds(ttlValue, ttlUnit),
    });
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

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 200 }}>
        <Spin />
      </Flex>
    );
  }

  if (isSchemaError) {
    return <Alert type="error" message={t("job-modal.error-load-data")} showIcon />;
  }

  return (
    <>
      {contextHolder}

      <Flex vertical gap="middle">
        <Flex align="center" justify="flex-end" gap="small">
          <span>{t("job-modal.advanced-settings")}</span>
          <Switch checked={showAdvanced} onChange={setShowAdvanced} />
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
          <Flex
            vertical
            gap="small"
            style={{ display: showAdvanced ? "flex" : "none" }}
            aria-hidden={!showAdvanced}
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

            <Form.Item label={t("job-modal.timeout-label")}>
              <Flex gap={8} align="center" wrap>
                <InputNumber
                  min={0}
                  precision={0}
                  value={ttlValue ?? undefined}
                  onChange={(value) => onTtlValueChange(value ?? null)}
                  placeholder={String(DEFAULT_JOB_TIMEOUT_SECONDS)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={handleTimeoutInputKeyDown}
                  onPaste={handleTimeoutInputPaste}
                />
                <Select
                  value={ttlUnit}
                  onChange={onTtlUnitChange}
                  options={[
                    { label: t("job-modal.timeout-unit-seconds"), value: "seconds" },
                    { label: t("job-modal.timeout-unit-minutes"), value: "minutes" },
                    { label: t("job-modal.timeout-unit-hours"), value: "hours" },
                  ]}
                  style={{ width: 100 }}
                />
              </Flex>
            </Form.Item>
          </Flex>

          <Flex gap={8}>
            <Form.Item<JobFormData>
              label={t("job-modal.target-type")}
              name="tgt_type"
              hidden={!showAdvanced}
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
              className={showAdvanced ? styles.jobFormTgt : styles.jobFormTgtFull}
            >
              <Input />
            </Form.Item>

            {showAdvanced && (
              <Button
                icon={<SearchOutlined />}
                onClick={onGatherClick}
                disabled={isGatherDisabled}
                className={styles.jobFormGather}
              />
            )}
          </Flex>
        </Form>

        <Title level={5} style={{ margin: 0 }}>
          {fun}
        </Title>

        {saltFunction?.json_schema && (
          <JsonForm
            ref={jsonFormRef}
            schema={saltFunction.json_schema}
            uiSchema={visibilityUiSchema}
            id="job-params-form"
            className={styles.jobParamsForm}
            idPrefix="job-params-form"
            idSeparator="-"
            formData={jsonFormValue}
            onChange={(data) =>
              onJsonFormValueChange((data?.formData ?? {}) as Record<string, unknown>)
            }
          >
            <Fragment />
          </JsonForm>
        )}

        <JobModalFooter>
          <Button onClick={onBack}>{t("job-modal.back")}</Button>
          <Button type="primary" form="job-form" htmlType="submit">
            {t("job-modal.next-to-overview")}
          </Button>
        </JobModalFooter>
      </Flex>
    </>
  );
};
