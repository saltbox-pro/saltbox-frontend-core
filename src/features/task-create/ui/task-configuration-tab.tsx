import { QuestionCircleOutlined } from "@ant-design/icons";
import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { notify } from "@saltbox/saltbox-frontend-common";
import {
  Button,
  Col,
  Divider,
  Flex,
  Form,
  InputNumber,
  Row,
  Switch,
  type FormProps,
  Tooltip,
  Checkbox,
} from "antd";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TtlInput } from "saltbox-core/shared/components/ttl-input";
import { isDefaultTaskTemplate } from "saltbox-core/shared/sls-templates";
import { ttlPartsToTotalSeconds, type TtlUnit } from "saltbox-core/shared/utils/job-modal-utils";
import {
  getJobParamsSchemaLayout,
  type JsonSchemaRecord,
  type UiSchemaRecord,
} from "saltbox-core/shared/utils/job-schema-split";
import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";
import { getTemplateParamsSchema } from "saltbox-core/shared/utils/template-params-schema";

import { buildTaskConfigurationFormData } from "../helpers/build-task-configuration-form-data";
import { taskCreationService } from "../service";
import type { TaskConfigurationFormData, TaskTemplateDraft } from "../type/types";

import styles from "./task-configuration-tab.module.css";
import { TaskCreateFooter } from "./task-create-footer";
import { TaskDataForm, type TaskDataFormHandle, type TaskDataFormProps } from "./task-data-form";

export type TaskConfigurationTabProps = {
  template?: TaskTemplateModel;
  initialData?: Partial<TaskConfigurationFormData>;
  initialShowAdvanced?: boolean;
  initialTtlUnit?: TtlUnit;
  topContent?: ReactNode;
  onSubmit: (data: TaskConfigurationFormData) => void;
  onReturnToTemplatePicker: (draft: TaskTemplateDraft) => void;
};

const memoize = createObjectMemoizer({ deep: true });

const TTL_UNIT_SECONDS: Record<TtlUnit, number> = { seconds: 1, minutes: 60, hours: 3600 };

const totalSecondsToUnit = (
  totalSeconds: number,
  unit: TtlUnit
): { value: number; unit: TtlUnit } => {
  const divisor = TTL_UNIT_SECONDS[unit];
  return totalSeconds % divisor === 0
    ? { value: totalSeconds / divisor, unit }
    : { value: totalSeconds, unit: "seconds" };
};

export function TaskConfigurationTab({
  template,
  initialData,
  initialShowAdvanced,
  initialTtlUnit,
  topContent,
  onSubmit,
  onReturnToTemplatePicker,
}: TaskConfigurationTabProps) {
  const { t, i18n } = useTranslation();

  const [settingsForm] = Form.useForm<Omit<TaskConfigurationFormData, "data">>();

  const [showAdvanced, setShowAdvanced] = useState<boolean>(initialShowAdvanced ?? false);
  const [ttlValue, setTtlValue] = useState<number | null>(null);
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>("seconds");
  const ttlPartsRef = useRef({ value: ttlValue, unit: ttlUnit });
  ttlPartsRef.current = { value: ttlValue, unit: ttlUnit };

  const taskDataFormRef = useRef<TaskDataFormHandle>(null);

  useEffect(() => {
    if (initialShowAdvanced == null && isDefaultTaskTemplate(template)) {
      setShowAdvanced(true);
    }
  }, [initialShowAdvanced, template]);

  const paramsSchema = useMemo(
    () => getTemplateParamsSchema(template, i18n.language),
    [template, i18n.language]
  );

  const paramsSchemaLayout = useMemo(
    () =>
      getJobParamsSchemaLayout(
        paramsSchema.jsonSchema as JsonSchemaRecord | undefined,
        paramsSchema.uiSchema as UiSchemaRecord | undefined,
        showAdvanced
      ),
    [paramsSchema, showAdvanced]
  );

  useEffect(() => {
    if (!initialData || !template) {
      return;
    }

    const defaultConfig = taskCreationService.getDefaultConfiguration();

    settingsForm.setFieldsValue({
      ...defaultConfig,
      batch_size: initialData.batch_size ?? defaultConfig.batch_size,
      max_retries: initialData.max_retries ?? defaultConfig.max_retries,
      retry_delay: initialData.retry_delay ?? defaultConfig.retry_delay,
      max_jobs_count_at_same_time:
        initialData.max_jobs_count_at_same_time ?? defaultConfig.max_jobs_count_at_same_time,
      save_pillars_as_default: initialData.save_pillars_as_default ?? true,
    });

    const initialTtl = initialData.ttl;
    if (initialTtl == null || !Number.isFinite(initialTtl) || initialTtl < 0) {
      setTtlValue(null);
      setTtlUnit("seconds");
      return;
    }

    const currentParts = ttlPartsRef.current;
    if (ttlPartsToTotalSeconds(currentParts.value, currentParts.unit) === initialTtl) {
      return;
    }

    const ttlParts = totalSecondsToUnit(initialTtl, initialTtlUnit ?? "seconds");
    setTtlValue(ttlParts.value);
    setTtlUnit(ttlParts.unit);
  }, [settingsForm, initialData, initialTtlUnit, template]);

  const buildConfigurationFromSettings = (
    settings: Partial<Omit<TaskConfigurationFormData, "data" | "task_template_id">>,
    data?: TaskConfigurationFormData["data"]
  ): TaskConfigurationFormData | undefined => {
    if (!template) {
      return undefined;
    }

    return buildTaskConfigurationFormData({
      templateId: template.id,
      settings: { ...settings, ttl: ttlPartsToTotalSeconds(ttlValue, ttlUnit) },
      data,
      defaults: taskCreationService.getDefaultConfiguration(),
    });
  };

  const handleReturnToTemplatePicker = () => {
    const configuration = buildConfigurationFromSettings(
      settingsForm.getFieldsValue(true),
      taskDataFormRef.current?.getData() ?? initialData?.data ?? {}
    );
    if (!configuration) {
      return;
    }
    onReturnToTemplatePicker({ configuration, showAdvanced, ttlUnit });
  };

  const showValidationError = () => {
    notify.error(t("errors.form-validation"));
  };

  const handleFormFinishFailed: FormProps<
    Omit<TaskConfigurationFormData, "data">
  >["onFinishFailed"] = (errorInfo) => {
    showValidationError();
    setShowAdvanced(true);

    setTimeout(
      () =>
        settingsForm.scrollToField(errorInfo.errorFields[0].name, {
          focus: true,
          block: "center",
          scrollMode: "always",
        }),
      0
    );
  };

  const handleSubmit = (formValue: TaskConfigurationFormData) => {
    const configData = buildConfigurationFromSettings(formValue, formValue.data);
    if (!configData) {
      return;
    }
    onSubmit(configData);
  };

  const handleFormFinish: FormProps<Omit<TaskConfigurationFormData, "data">>["onFinish"] = (
    formValue
  ) => {
    if (!taskDataFormRef.current?.validate()) {
      return;
    }

    const jsonDataFromForm = taskDataFormRef.current?.getData() ?? {};

    handleSubmit({ ...formValue, data: jsonDataFromForm });
  };

  const handleTaskDataFinish: TaskDataFormProps["onSubmit"] = async (jsonDataFromForm) => {
    if (!taskDataFormRef.current?.validate()) {
      return;
    }

    try {
      const settingsFormValue = await settingsForm.validateFields();

      handleSubmit({ ...settingsFormValue, data: jsonDataFromForm });
    } catch (errorInfo) {
      handleFormFinishFailed(errorInfo);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <>
      <Flex vertical>
        <Flex vertical gap="middle">
          {topContent}

          <Form
            className={styles.form}
            form={settingsForm}
            name="task-settings-form"
            id="task-settings-form"
            layout="vertical"
            initialValues={memoize(taskCreationService.getDefaultConfiguration())}
            autoComplete="off"
            onFinish={handleFormFinish}
            onFinishFailed={handleFormFinishFailed}
          >
            <Flex align="center" justify="space-between" gap="small">
              <Flex align="center">
                <Form.Item
                  name="save_pillars_as_default"
                  valuePropName="checked"
                  className={styles.formItem_withoutOffset}
                >
                  <Checkbox>{t("task-create.save-pillars-as-default")}</Checkbox>
                </Form.Item>

                <Tooltip title={t("task-create.save-pillars-as-default-tooltip")}>
                  <QuestionCircleOutlined style={{ color: "#8c8c8c", cursor: "help" }} />
                </Tooltip>
              </Flex>

              <Flex align="center" justify="flex-end" gap="small">
                <span>{t("task-create.advanced-settings")}</span>
                <Switch checked={showAdvanced} onChange={(checked) => setShowAdvanced(checked)} />
              </Flex>
            </Flex>
            <Flex
              vertical
              gap="small"
              style={{ display: showAdvanced ? "flex" : "none" }}
              aria-hidden={!showAdvanced}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="batch_size"
                    label={t("task-create.batch-size")}
                    tooltip={t("task-create.batch-size-tooltip")}
                    rules={memoize([
                      { required: true, message: t("task-create.batch-size-error-required") },
                    ])}
                  >
                    <InputNumber min={0} className={styles.formItem} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_jobs_count_at_same_time"
                    label={t("task-create.max-parallel-jobs")}
                    tooltip={t("task-create.max-parallel-jobs-tooltip")}
                    rules={memoize([
                      {
                        required: true,
                        message: t("task-create.max-parallel-jobs-error-required"),
                      },
                    ])}
                  >
                    <InputNumber min={1} className={styles.formItem} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="max_retries"
                    label={t("task-create.max-retries")}
                    tooltip={t("task-create.max-retries-tooltip")}
                    rules={memoize([
                      { required: true, message: t("task-create.max-retries-error-required") },
                    ])}
                  >
                    <InputNumber min={0} className={styles.formItem} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="retry_delay"
                    label={t("task-create.retry-delay")}
                    tooltip={t("task-create.retry-delay-tooltip")}
                    rules={memoize([
                      { required: true, message: t("task-create.retry-delay-error-required") },
                    ])}
                  >
                    <InputNumber min={0} className={styles.formItem} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={t("task-create.ttl")} tooltip={t("task-create.ttl-tooltip")}>
                    <TtlInput
                      value={ttlValue}
                      unit={ttlUnit}
                      onValueChange={setTtlValue}
                      onUnitChange={setTtlUnit}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider className={styles.divider} />
            </Flex>
          </Form>

          <TaskDataForm
            ref={taskDataFormRef}
            jsonSchema={paramsSchema.jsonSchema}
            uiSchema={paramsSchema.uiSchema}
            displaySchema={paramsSchemaLayout.displaySchema}
            displayUiSchema={paramsSchemaLayout.displayUiSchema}
            isFieldless={paramsSchema.isFieldless}
            isAdvanced={showAdvanced}
            initialData={initialData?.data}
            onSubmit={handleTaskDataFinish}
            onError={showValidationError}
            onRequestAdvanced={() => setShowAdvanced(true)}
          />
        </Flex>

        <TaskCreateFooter>
          <Button onClick={handleReturnToTemplatePicker}>
            {t("task-create.return-to-template-picker")}
          </Button>
          <Button type="primary" form="task-settings-form" key="submit" htmlType="submit">
            {t("task-create.next-to-overview")}
          </Button>
        </TaskCreateFooter>
      </Flex>
    </>
  );
}
