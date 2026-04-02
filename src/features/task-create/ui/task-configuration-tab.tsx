import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { deepOmitUndefined } from "@saltbox/saltbox-frontend-common";
import {
  Button,
  Col,
  Divider,
  Flex,
  Form,
  InputNumber,
  Row,
  Switch,
  message,
  type FormProps,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createObjectMemoizer } from "saltbox-core/shared/utils/memoize-object";

import { taskCreationService } from "../service";
import { TaskConfigurationFormData } from "../type/types";

import styles from "./task-configuration-tab.module.css";
import { TaskCreateFooter } from "./task-create-footer";
import { TaskDataForm, type TaskDataFormHandle, type TaskDataFormProps } from "./task-data-form";

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
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm<Omit<TaskConfigurationFormData, "data">>();

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const taskDataFormRef = useRef<TaskDataFormHandle>(null);

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
  }, [form, initialData, template]);

  const showValidationError = () => {
    messageApi.error(t("errors.form-validation"));
  };

  const handleFormFinishFailed: FormProps<
    Omit<TaskConfigurationFormData, "data">
  >["onFinishFailed"] = (errorInfo) => {
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

  const handleSubmit = (formValue: TaskConfigurationFormData) => {
    const defaultConfig = taskCreationService.getDefaultConfiguration();

    const configData: TaskConfigurationFormData = {
      task_template_id: template.id,
      batch_size: formValue.batch_size ?? defaultConfig.batch_size,
      max_retries: formValue.max_retries ?? defaultConfig.max_retries,
      retry_delay: formValue.retry_delay ?? defaultConfig.retry_delay,
      max_jobs_count_at_same_time:
        formValue.max_jobs_count_at_same_time ?? defaultConfig.max_jobs_count_at_same_time,
      data: deepOmitUndefined(formValue.data ?? {}),
    };

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
    try {
      const formValue = await form.validateFields();

      handleSubmit({ ...formValue, data: jsonDataFromForm });
    } catch (errorInfo) {
      handleFormFinishFailed(errorInfo);
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
              name="task-settings-form"
              id="task-settings-form"
              layout="vertical"
              initialValues={memoize(taskCreationService.getDefaultConfiguration())}
              autoComplete="off"
              onFinish={handleFormFinish}
              onFinishFailed={handleFormFinishFailed}
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
            </Form>

            <Divider className={styles.divider} />
          </Flex>

          <TaskDataForm
            ref={taskDataFormRef}
            jsonSchema={template?.json_schema}
            uiSchema={template?.ui_schema}
            initialData={initialData?.data}
            onSubmit={handleTaskDataFinish}
            onError={showValidationError}
          />
        </Flex>

        <TaskCreateFooter>
          <Button onClick={onCancel}>{t("common.cancel")}</Button>
          <Button type="primary" form="task-settings-form" key="submit" htmlType="submit">
            {t("task-create.next-to-overview")}
          </Button>
        </TaskCreateFooter>
      </Flex>
    </>
  );
}
