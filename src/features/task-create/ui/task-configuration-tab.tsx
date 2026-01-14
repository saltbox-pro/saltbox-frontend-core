import JsonForm from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";
import { TaskData, TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { Button, Divider, Flex, Form, InputNumber, Switch, message } from "antd";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { taskCreationService } from "../service";
import { TaskConfigurationFormData } from "../type/types";

import styles from "./task-configuration-tab.module.css";

export type TaskConfigurationTabProps = {
  template?: TaskTemplateModel;
  initialData?: Partial<TaskConfigurationFormData>;
  onSubmit: (data: TaskConfigurationFormData) => void;
  onCancel: () => void;
};

type JsonFormChangeHandler = ComponentProps<typeof JsonForm>["onChange"];
type JsonFormRef = ComponentProps<typeof JsonForm>["ref"];

const memoize = createObjectMemoizer({ deep: true });

export function TaskConfigurationTab({
  template,
  initialData,
  onSubmit,
  onCancel,
}: TaskConfigurationTabProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [templateFormData, setTemplateFormData] = useState<TaskData>({});
  const jsonFormRef: JsonFormRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(taskCreationService.getDefaultConfiguration());
      setTemplateFormData(initialData.data ?? {});
    }
  }, [initialData, form]);

  const handleFormSubmit = async () => {
    try {
      if (!jsonFormRef.current?.validateForm()) {
        return;
      }

      const systemValues = await form.validateFields();

      if (!template) {
        messageApi.error(t("task-create.template-not-loaded"));
        return;
      }

      const defaultConfig = taskCreationService.getDefaultConfiguration();

      const configData: TaskConfigurationFormData = {
        task_template_id: template.id,
        batch_size: systemValues.batch_size ?? defaultConfig.batch_size,
        max_retries: systemValues.max_retries ?? defaultConfig.max_retries,
        retry_delay: systemValues.retry_delay ?? defaultConfig.retry_delay,
        max_jobs_count_at_same_time:
          systemValues.max_jobs_count_at_same_time ?? defaultConfig.max_jobs_count_at_same_time,
        data: Object.keys(templateFormData).length
          ? templateFormData
          : jsonFormRef.current.state.formData,
      };

      onSubmit(configData);
    } catch (error) {
      messageApi.error(t("task-create.validation-error"));
    }
  };

  const handleTemplateFormChange: JsonFormChangeHandler = (data) => {
    setTemplateFormData(data.formData);
  };

  if (!template) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Flex vertical gap="middle">
        <Flex vertical gap="middle">
          <Flex align="center" justify="flex-end" gap="small">
            <span>{t("task-create.advanced-settings")}</span>
            <Switch checked={showAdvanced} onChange={setShowAdvanced} />
          </Flex>
          {showAdvanced && (
            <Flex vertical gap="small">
              <Form
                form={form}
                layout="vertical"
                initialValues={memoize(taskCreationService.getDefaultConfiguration())}
              >
                <Form.Item
                  name="batch_size"
                  label={t("task-create.batch-size")}
                  tooltip={t("task-create.batch-size-tooltip")}
                  rules={memoize([
                    { required: true, message: t("task-form.batch-size-error-required") },
                  ])}
                >
                  <InputNumber min={0} className={styles.formItem} />
                </Form.Item>

                <Form.Item
                  name="max_jobs_count_at_same_time"
                  label={t("task-create.max-parallel-jobs")}
                  tooltip={t("task-create.max-parallel-jobs-tooltip")}
                  rules={memoize([
                    {
                      required: true,
                      message: t("task-form.max-parallel-jobs-error-required"),
                    },
                  ])}
                >
                  <InputNumber min={1} className={styles.formItem} />
                </Form.Item>

                <Form.Item
                  name="max_retries"
                  label={t("task-create.max-retries")}
                  tooltip={t("task-create.max-retries-tooltip")}
                  rules={memoize([
                    {
                      required: true,
                      message: t("task-form.max-retries-error-required"),
                    },
                  ])}
                >
                  <InputNumber min={0} className={styles.formItem} />
                </Form.Item>

                <Form.Item
                  name="retry_delay"
                  label={t("task-create.retry-delay")}
                  tooltip={t("task-create.retry-delay-tooltip")}
                  rules={memoize([
                    {
                      required: true,
                      message: t("task-create.retry-delay-error-required"),
                    },
                  ])}
                >
                  <InputNumber min={0} className={styles.formItem} />
                </Form.Item>
              </Form>

              <Divider className={styles.divider} />
            </Flex>
          )}

          {template.json_schema && (
            <JsonForm
              ref={jsonFormRef}
              className={styles.jsonForm}
              schema={template.json_schema}
              uiSchema={template.ui_schema}
              validator={validator}
              formData={templateFormData}
              onChange={handleTemplateFormChange}
              showErrorList={false}
            >
              <div />
            </JsonForm>
          )}
        </Flex>

        <Flex justify="flex-end" gap="small">
          <Button onClick={onCancel}>{t("common.cancel")}</Button>
          <Button type="primary" onClick={handleFormSubmit}>
            {t("task-create.next-to-overview")}
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
