import { MasterViewSchema, TaskCreateRequestSchemaInput } from "@saltbox/saltbox-core-api-client";
import { Button, Flex, Form, InputNumber, Select } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

export type TaskFormData = TaskCreateRequestSchemaInput;

type TaskFormProps = {
  taskCreateRequest: Partial<TaskCreateRequestSchemaInput>;
  onClose: () => void;
  onFinish?: () => void;
  onChange?: (values: TaskFormData) => void;
  onChooseParams: () => void;
  saltMasters: Array<MasterViewSchema>;
};

export function TaskForm({
  taskCreateRequest,
  onClose,
  onFinish,
  onChange,
  onChooseParams,
  saltMasters,
}: TaskFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TaskFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [taskTemplateOptions, setTaskTemplateOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  useEffect(() => {
    form.resetFields();
    setIsLoading(true);
    apiCoreStore.taskTemplatesApi
      ?.taskTemplatesList()
      .then((result) => {
        const options =
          result?.data?.reduce<Array<{ label: string; value: string }>>((options, item) => {
            options.push({
              label: item.title,
              value: item.id,
            });
            return options;
          }, []) ?? [];
        options.sort((a, b) =>
          a.label.toLowerCase() > b.label.toLowerCase()
            ? 1
            : a.label.toLowerCase() < b.label.toLowerCase()
              ? -1
              : 0
        );
        setTaskTemplateOptions(options);
      })
      .finally(() => setIsLoading(false));
  }, [form]);

  useEffect(() => {
    if (Object.keys(taskCreateRequest).length === 0) {
      form.setFieldsValue({
        task_template_id: taskCreateRequest?.task_template_id ?? "",
        salt_masters: taskCreateRequest?.salt_masters ?? [],
        batch_size: taskCreateRequest?.batch_size ?? 0,
        max_retries: taskCreateRequest?.max_retries ?? 1,
        max_jobs_count_at_same_time: taskCreateRequest?.max_jobs_count_at_same_time ?? 1,
      });
    } else {
      form.setFieldsValue({
        task_template_id: taskCreateRequest?.task_template_id,
        salt_masters: taskCreateRequest?.salt_masters,
        batch_size: taskCreateRequest?.batch_size,
        max_retries: taskCreateRequest?.max_retries,
        max_jobs_count_at_same_time: taskCreateRequest?.max_jobs_count_at_same_time,
      });
    }
  }, [taskCreateRequest]);

  const handleChooseParams = () => {
    form.validateFields().then(() => onChooseParams?.());
  };

  return (
    <Form
      form={form}
      name="task-form"
      layout={"vertical"}
      onFinish={onFinish}
      onValuesChange={(_, values) => onChange?.(values)}
      autoComplete="off"
      id="task-form"
    >
      <Form.Item<TaskFormData>
        label={t("task-form.task-template")}
        name="task_template_id"
        rules={[
          {
            required: true,
            message: t("task-form.task-template-id-error-required"),
          },
        ]}
      >
        <Select
          options={taskTemplateOptions}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          allowClear={true}
          showSearch={true}
          optionLabelProp="label"
        />
      </Form.Item>

      <Form.Item<TaskFormData>
        label={t("task-form.salt-masters")}
        name="salt_masters"
        initialValue={[]}
      >
        <Select
          mode="multiple"
          allowClear
          options={saltMasters}
          fieldNames={{ value: "master_id", label: "title" }}
          placeholder={t("task-form.run-on-all-masters")}
        />
      </Form.Item>

      <Form.Item<TaskFormData>
        label={t("task-form.batch-size")}
        name="batch_size"
        rules={[{ required: true, message: t("task-form.batch-size-error-required") }]}
        initialValue={0}
      >
        <InputNumber style={{ width: "100%" }} controls={false} />
      </Form.Item>

      <Form.Item<TaskFormData>
        label={t("task-form.max-retries")}
        name="max_retries"
        rules={[
          {
            required: true,
            message: t("task-form.max-retries-error-required"),
          },
        ]}
        initialValue={1}
      >
        <InputNumber style={{ width: "100%" }} controls={false} />
      </Form.Item>

      <Form.Item<TaskFormData>
        label={t("task-form.max-jobs-count-at-same-time")}
        name="max_jobs_count_at_same_time"
        rules={[
          {
            required: true,
            message: t("task-form.max-jobs-count-at-same-time-error-required"),
          },
        ]}
        initialValue={1}
      >
        <InputNumber style={{ width: "100%" }} controls={false} />
      </Form.Item>

      <Flex justify="end" gap={5}>
        <Button type="default" onClick={() => onClose()}>
          {t("task-form.cancel")}
        </Button>

        <Button
          type="primary"
          onClick={handleChooseParams}
          disabled={isLoading || form.getFieldValue("task_template_id") === ""}
        >
          {t("task-form.choose-task-params")}
        </Button>
      </Flex>
    </Form>
  );
}
