import { SearchOutlined } from "@ant-design/icons";
import type { JobSchemaModel } from "@saltbox/saltbox-core-api-client";
import { JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
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
  type FormInstance,
  type FormProps,
} from "antd";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ttlPartsToTotalSeconds, type TtlUnit } from "saltbox-core/shared/utils/job-modal-utils";

import styles from "../job-modal.module.css";
import {
  JOB_PARAMS_FORM_ID,
  prepareJobParamsForm,
  validateJobParamsForm,
} from "../params-form-schema";
import type { JobConfigurationData, JobMasterOption, JobTargetingFormData } from "../types";
import { JobModalFooter } from "../ui/footer";
import { TargetTypeSelect } from "../ui/target-type-select/target-type-select";
import { JobModalTimeoutFields } from "../ui/timeout-fields";

const { Title } = Typography;

export type JobModalSettingsTabProps = {
  fun: string;
  saltFunction?: JobSchemaModel;
  isLoading: boolean;
  isSchemaError: boolean;
  masterList: JobMasterOption[];
  form: FormInstance<JobTargetingFormData>;
  jsonFormValue: Record<string, unknown>;
  onJsonFormValueChange: (value: Record<string, unknown>) => void;
  jsonFormRef: React.RefObject<JsonFormRef | null>;
  ttlValue: number | null;
  ttlUnit: TtlUnit;
  onTtlValueChange: (value: number | null) => void;
  onTtlUnitChange: (unit: TtlUnit) => void;
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

  const paramsForm = useMemo(
    () => prepareJobParamsForm(saltFunction?.json_schema, saltFunction?.ui_schema, showAdvanced),
    [saltFunction?.json_schema, saltFunction?.ui_schema, showAdvanced]
  );

  const handleValidationError = () => {
    messageApi.error(t("errors.form-validation"));
  };

  const handleFormFinishFailed: FormProps<JobTargetingFormData>["onFinishFailed"] = (errorInfo) => {
    handleValidationError();

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

  const handleFormFinish: FormProps<JobTargetingFormData>["onFinish"] = (formValue) => {
    if (!validateJobParamsForm(jsonFormRef, paramsForm.validationSchema)) {
      handleValidationError();
      return;
    }

    onNext({
      ...formValue,
      jsonFormValue,
      ttlSeconds: ttlPartsToTotalSeconds(ttlValue, ttlUnit),
    });
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
          <Form.Item<JobTargetingFormData>
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
            <Form.Item<JobTargetingFormData>
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

            <Form.Item<JobTargetingFormData>
              label={t("job-modal.target")}
              name="tgt"
              rules={[{ required: true, message: t("job-modal.tgt-error-required") }]}
              className={styles.jobFormTgt}
            >
              <Input />
            </Form.Item>

            <Button
              icon={<SearchOutlined />}
              onClick={onGatherClick}
              disabled={isGatherDisabled}
              className={styles.jobFormGather}
            />
          </Flex>

          <Flex
            vertical
            gap="small"
            style={{ display: showAdvanced ? "flex" : "none" }}
            aria-hidden={!showAdvanced}
          >
            <JobModalTimeoutFields
              ttlValue={ttlValue}
              ttlUnit={ttlUnit}
              onTtlValueChange={onTtlValueChange}
              onTtlUnitChange={onTtlUnitChange}
            />
          </Flex>
        </Form>

        <Title level={5} style={{ margin: 0 }}>
          {fun}
        </Title>

        {paramsForm.validationSchema && (
          <JsonForm
            ref={jsonFormRef}
            schema={paramsForm.validationSchema}
            uiSchema={paramsForm.uiSchema}
            id={JOB_PARAMS_FORM_ID}
            className={styles.jobParamsForm}
            idPrefix={JOB_PARAMS_FORM_ID}
            idSeparator="-"
            formData={jsonFormValue}
            focusOnFirstError
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
