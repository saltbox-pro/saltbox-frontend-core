import type { TaskData, TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { deepOmitUndefined, JsonForm, type JsonFormRef } from "@saltbox/saltbox-frontend-common";
import { Button, Col, Divider, Flex, Form, InputNumber, Row, Switch, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { taskCreationService } from "../service";
import { TaskConfigurationFormData } from "../type/types";

import styles from "./task-configuration-tab.module.css";
import { TaskCreateFooter } from "./task-create-footer";

export type TaskConfigurationTabProps = {
  template?: TaskTemplateModel;
  initialData?: Partial<TaskConfigurationFormData>;
  onSubmit: (data: TaskConfigurationFormData) => void;
  onCancel: () => void;
};

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

  const jsonFormRef = useRef<JsonFormRef<TaskData>>(null);

  useEffect(() => {
    if (!initialData || !template) {
      return;
    }

    const defaultConfig = taskCreationService.getDefaultConfiguration();

    form.setFieldsValue({
      ...defaultConfig,
      batch_size: initialData.batch_size ?? defaultConfig.batch_size,
      max_retries: initialData.max_retries ?? defaultConfig.max_retries,
      retry_delay: initialData.retry_delay ?? defaultConfig.retry_delay,
      max_jobs_count_at_same_time:
        initialData.max_jobs_count_at_same_time ?? defaultConfig.max_jobs_count_at_same_time,
    });
  }, [initialData, template, form]);

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
        data: deepOmitUndefined(jsonFormRef.current.state.formData ?? {}),
      };

      onSubmit(configData);
    } catch (error) {
      messageApi.error(t("task-create.validation-error"));
    }
  };

  if (!template) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Flex vertical>
        <Flex vertical gap="middle">
          <Flex align="center" justify="flex-end" gap="small">
            <span>{t("task-create.advanced-settings")}</span>
            <Switch checked={showAdvanced} onChange={(checked) => setShowAdvanced(checked)} />
          </Flex>

          <Flex
            vertical
            gap="small"
            style={{ display: showAdvanced ? "flex" : "none" }}
            aria-hidden={!showAdvanced}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={memoize(taskCreationService.getDefaultConfiguration())}
            >
              <Row gutter={16}>
                <Col span={12}>
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
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_jobs_count_at_same_time"
                    label={t("task-create.max-parallel-jobs")}
                    tooltip={t("task-create.max-parallel-jobs-tooltip")}
                    rules={memoize([
                      { required: true, message: t("task-form.max-parallel-jobs-error-required") },
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
                      { required: true, message: t("task-form.max-retries-error-required") },
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
            </Form>

            <Divider className={styles.divider} />
          </Flex>

          {template.json_schema && (
            <JsonForm<TaskData>
              ref={jsonFormRef}
              className={styles.jsonForm}
              schema={template.json_schema}
              uiSchema={template.ui_schema}
              formData={initialData.data}
            >
              <div />
            </JsonForm>
          )}
        </Flex>

        <TaskCreateFooter>
          <Button onClick={onCancel}>{t("common.cancel")}</Button>
          <Button type="primary" onClick={handleFormSubmit}>
            {t("task-create.next-to-overview")}
          </Button>
        </TaskCreateFooter>
      </Flex>
    </>
  );
}
