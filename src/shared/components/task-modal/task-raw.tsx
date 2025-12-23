import { TaskCreateRequestSchema } from "@saltbox/saltbox-core-api-client";
import { Button, Flex, Form } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { appStore, i18nStore } from "saltbox-core/store";

type TaskRawProps = {
  taskCreateRequest: Partial<TaskCreateRequestSchema>;
  onFinish: (formData: TaskCreateRequestSchema) => void;
  onChange: (formData: TaskCreateRequestSchema) => void;
  onClose: () => void;
  onCreateTaskPlugin: (pluginKey: string) => void;
};

type TaskRawForm = {
  data: string;
};

export function TaskRaw(props: TaskRawProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TaskRawForm>();

  const handleFinish = (formData: TaskRawForm) => {
    props.onFinish(JSON.parse(formData.data) as TaskCreateRequestSchema);
  };

  const handleChange = (formData: any) => {
    try {
      props.onChange(JSON.parse(formData.data) as TaskCreateRequestSchema);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      data: JSON.stringify(props.taskCreateRequest, null, 2),
    });
  }, [props.taskCreateRequest]);

  const handleCreateTaskPlugin = (pluginKey: string) => {
    props?.onCreateTaskPlugin?.(pluginKey);
  };

  let minionsTaskModalCreateButtonsPlugin: React.ReactNode = null;
  appStore.pluginsStore?.plugins?.["minions.taskmodal.create"]?.forEach((plugin) => {
    const minionsTaskModalCreateButtonPlugin = (
      <Button type="default" onClick={() => handleCreateTaskPlugin(plugin.key)}>
        {plugin.label?.[i18nStore.currentLanguage] || plugin.label?.en || plugin.key}
      </Button>
    );
    minionsTaskModalCreateButtonsPlugin = (
      <>
        {minionsTaskModalCreateButtonsPlugin}
        {minionsTaskModalCreateButtonPlugin}
      </>
    );
  });

  return (
    <Form
      form={form}
      name="task-raw-form"
      layout={"vertical"}
      onFinish={handleFinish}
      onValuesChange={handleChange}
      autoComplete="off"
      id="task-raw-form"
    >
      <Form.Item<TaskRawForm>
        label={t("task-modal.task-raw")}
        name="data"
        initialValue={"{}"}
        validateTrigger={["onChange", "onBlur"]}
        rules={[
          {
            required: true,
            message: t("task-form.task-raw-data-error-required"),
          },
          {
            validator: async (_: any, value: string) => {
              if (!value) return;
              try {
                JSON.parse(value);
              } catch (e) {
                throw new Error(t("task-form.task-raw-data-error-invalid-json"));
              }
            },
          },
        ]}
      >
        <TextArea rows={10}></TextArea>
      </Form.Item>

      <Flex justify="end" gap={5}>
        <Button type="default" onClick={() => props.onClose()}>
          {t("task-form.cancel")}
        </Button>

        {minionsTaskModalCreateButtonsPlugin}

        <Button type="primary" htmlType="submit">
          {t("task-form.create-task")}
        </Button>
      </Flex>
    </Form>
  );
}
